import { applyPendingMutations, assertBookStatePayload, assertPendingMutation, assertQueue, assertStateDocument, emptyStateDocument, publicStateDocument, publicStatePayload, upgradeStateDocument } from './merge.ts';
import {
  GITHUB_STATE_MIGRATION_KEY,
  GITHUB_STATE_PENDING_KEY,
  GITHUB_STATE_TOKEN_KEY,
  LEGACY_GITHUB_STATE_PENDING_KEY,
  type BookStatePayload,
  type GitHubStateRepositoryOptions,
  type PendingStateMutation,
  type PendingStore,
  type StateDocument,
  type StorageLike,
} from './types.ts';

export type GitHubStateErrorCode = 'unauthorized' | 'not-found' | 'conflict' | 'network' | 'invalid-data' | 'storage' | 'rate-limited' | 'token-type';

export class GitHubStateRepositoryError extends Error {
  readonly code: GitHubStateErrorCode;
  readonly status?: number;
  /** For rate limits: when GitHub accepts requests again (epoch milliseconds). */
  readonly retryAt?: number;

  constructor(code: GitHubStateErrorCode, message: string, status?: number, options?: ErrorOptions & { retryAt?: number }) {
    super(message, options);
    this.name = 'GitHubStateRepositoryError';
    this.code = code;
    this.status = status;
    this.retryAt = options?.retryAt;
  }
}

/** Only these request headers are sent. GitHub's CORS preflight rejects any
 * other custom header (Cache-Control included), which would block every
 * browser request; tests pin this list. */
export const GITHUB_REQUEST_HEADERS = ['Accept', 'X-GitHub-Api-Version', 'Authorization', 'If-None-Match'] as const;

/** Fine-grained personal access tokens can be limited to one repository and
 * one permission. Classic and OAuth tokens cannot, so they are refused. */
export const FINE_GRAINED_TOKEN = /^github_pat_[A-Za-z0-9_]{30,}$/;

interface GitHubContentsResponse {
  sha: string;
  content: string;
  encoding: 'base64';
}

interface RemoteFile {
  document: StateDocument;
  sha?: string;
}

const memoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
  };
};

const encodeBase64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const decodeBase64 = (value: string): string => {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const header = (response: Response, name: string): string => response.headers?.get?.(name) ?? '';

export class GitHubStateRepository {
  static readonly TOKEN_KEY = GITHUB_STATE_TOKEN_KEY;
  static readonly PENDING_KEY = GITHUB_STATE_PENDING_KEY;
  static readonly LEGACY_PENDING_KEY = LEGACY_GITHUB_STATE_PENDING_KEY;
  static readonly MIGRATION_KEY = GITHUB_STATE_MIGRATION_KEY;

  private readonly owner: string;
  private readonly repository: string;
  private readonly path: string;
  private readonly branch: string;
  private readonly storage: StorageLike;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly clock: () => Date;
  private readonly maxConflictRetries: number;
  private lastMutationTime = 0;
  private cached?: { etag: string; file: RemoteFile };

  constructor(options: GitHubStateRepositoryOptions = {}) {
    this.owner = options.owner ?? 'karacaismail';
    this.repository = options.repository ?? 'kitaps-state';
    this.path = options.path ?? 'state.json';
    this.branch = options.branch ?? 'main';
    this.storage = options.storage ?? (typeof localStorage === 'undefined' ? memoryStorage() : localStorage);
    if (!options.fetch && typeof globalThis.fetch !== 'function') throw new GitHubStateRepositoryError('network', 'Fetch is unavailable.');
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.clock = options.clock ?? (() => new Date());
    this.maxConflictRetries = Math.max(0, options.maxConflictRetries ?? 1);
  }

  setToken(token: string): void {
    const clean = token.trim();
    GitHubStateRepository.assertFineGrainedToken(clean);
    this.writeStorage(GITHUB_STATE_TOKEN_KEY, clean);
  }

  clearToken(): void {
    this.removeStorage(GITHUB_STATE_TOKEN_KEY);
  }

  hasToken(): boolean {
    return Boolean(this.readStorage(GITHUB_STATE_TOKEN_KEY)?.trim());
  }

  hasCompletedInitialMigration(): boolean {
    return this.readStorage(GITHUB_STATE_MIGRATION_KEY) === '1';
  }

  markInitialMigrationComplete(): void {
    this.writeStorage(GITHUB_STATE_MIGRATION_KEY, '1');
  }

  static assertFineGrainedToken(token: string): void {
    if (!token) throw new GitHubStateRepositoryError('unauthorized', 'A GitHub token is required.', 401);
    if (!FINE_GRAINED_TOKEN.test(token)) throw new GitHubStateRepositoryError('token-type', 'Only fine-grained personal access tokens are accepted.');
  }

  /** Checks the token with GitHub before a caller stores it. A token that
   * reports classic OAuth scopes is refused even if its prefix looks right. */
  async validateToken(token: string): Promise<void> {
    const clean = token.trim();
    GitHubStateRepository.assertFineGrainedToken(clean);
    const response = await this.request(this.contentsUrl(), { headers: this.headers(clean) });
    if (!response.ok) throw this.errorForResponse(response);
    if (header(response, 'X-OAuth-Scopes').trim()) throw new GitHubStateRepositoryError('token-type', 'The token carries classic OAuth scopes.');
    await this.parseContents(response);
  }

  /** The shared file. With a token the API is read directly (fresh, and
   * conditional requests keep the rate limit intact); anonymous devices read
   * the CDN copy, which has no API rate limit and lags by up to five minutes. */
  async load(): Promise<StateDocument> {
    return (this.hasToken() ? await this.readApi(true) : await this.readRaw()).document;
  }

  async loadWithPending(remote?: StateDocument): Promise<StateDocument> {
    const base = remote ?? await this.load();
    return applyPendingMutations(base, this.readPending().mutations);
  }

  queueBookState(bookId: string, value: BookStatePayload | null, suppliedUpdatedAt?: string): PendingStateMutation {
    if (!bookId.trim()) throw new TypeError('bookId is required.');
    if (value !== null) assertBookStatePayload(value, bookId);
    const store = this.readPending();
    const updatedAt = this.nextTimestamp(store, suppliedUpdatedAt);
    const previous = store.mutations.find(item => item.kind === 'book' && item.bookId === bookId);
    const safeValue = publicStatePayload(value);
    const previousValue = previous?.kind === 'book' ? publicStatePayload(previous.value) : null;
    const coalesced = safeValue === null ? null : { ...(previousValue ?? {}), ...safeValue };
    const mutation: PendingStateMutation = { id: this.mutationId(updatedAt), kind: 'book', bookId, updatedAt, value: structuredClone(coalesced) };
    this.writePending({
      since: store.mutations.length ? store.since ?? updatedAt : updatedAt,
      mutations: [...store.mutations.filter(item => !(item.kind === 'book' && item.bookId === bookId)), mutation],
    });
    return mutation;
  }

  queueQueueState(queue: readonly string[], suppliedUpdatedAt?: string): PendingStateMutation {
    const value = [...queue];
    assertQueue(value);
    const store = this.readPending();
    const updatedAt = this.nextTimestamp(store, suppliedUpdatedAt);
    const mutation: PendingStateMutation = { id: this.mutationId(updatedAt), kind: 'queue', updatedAt, value };
    this.writePending({
      since: store.mutations.length ? store.since ?? updatedAt : updatedAt,
      mutations: [...store.mutations.filter(item => item.kind !== 'queue'), mutation],
    });
    return mutation;
  }

  /** Drops unsent edits the reader chose to replace with the shared values. */
  discardPendingFor(bookIds: Iterable<string>, includeQueue: boolean): void {
    const drop = new Set(bookIds);
    const store = this.readPending();
    const mutations = store.mutations.filter(item => item.kind === 'queue' ? !includeQueue : !drop.has(item.bookId));
    if (mutations.length === store.mutations.length) return;
    if (mutations.length) this.writePending({ since: store.since, mutations });
    else this.removeStorage(GITHUB_STATE_PENDING_KEY);
  }

  getPendingCount(): number {
    return this.readPending().mutations.length;
  }

  /** When the oldest unsent change was made, or null when nothing is pending. */
  getPendingSince(): string | null {
    const store = this.readPending();
    return store.mutations.length ? store.since : null;
  }

  async flushPending(): Promise<StateDocument> {
    const snapshot = this.readPending().mutations;
    if (!snapshot.length) return this.load();
    const saved = await this.save(snapshot);
    const completed = new Set(snapshot.map(item => item.id));
    const remaining = this.readPending().mutations.filter(item => !completed.has(item.id));
    if (remaining.length) {
      const oldest = remaining.reduce((result, item) => Date.parse(item.updatedAt) < Date.parse(result) ? item.updatedAt : result, remaining[0].updatedAt);
      this.writePending({ since: oldest, mutations: remaining });
    } else {
      this.removeStorage(GITHUB_STATE_PENDING_KEY);
    }
    return applyPendingMutations(saved, remaining);
  }

  async save(mutations: readonly PendingStateMutation[]): Promise<StateDocument> {
    for (const mutation of mutations) assertPendingMutation(mutation);
    const token = this.readStorage(GITHUB_STATE_TOKEN_KEY)?.trim();
    if (!token) throw new GitHubStateRepositoryError('unauthorized', 'A GitHub token is required to save state.', 401);

    for (let attempt = 0; attempt <= this.maxConflictRetries; attempt += 1) {
      // A write always starts from the current file; an unchanged ETag (304)
      // proves the cached sha is still current without spending rate limit.
      const remote = await this.readApi(true, true);
      const merged = publicStateDocument(applyPendingMutations(remote.document, mutations));
      const response = await this.request(this.contentsUrl(), {
        method: 'PUT',
        headers: this.headers(token),
        body: JSON.stringify({
          message: 'Update Kitaplık state',
          content: encodeBase64(`${JSON.stringify(merged, null, 2)}\n`),
          branch: this.branch,
          ...(remote.sha ? { sha: remote.sha } : {}),
        }),
      });
      if ((response.status === 409 || response.status === 422) && attempt < this.maxConflictRetries) continue;
      if (!response.ok) throw this.errorForResponse(response);
      this.cached = undefined;
      return merged;
    }
    throw new GitHubStateRepositoryError('conflict', 'GitHub state changed during save. Reload and try again.', 409);
  }

  private async readApi(conditional: boolean, allowMissing = false): Promise<RemoteFile> {
    const token = this.readStorage(GITHUB_STATE_TOKEN_KEY)?.trim();
    const etag = conditional ? this.cached?.etag : undefined;
    const response = await this.request(`${this.contentsUrl()}?ref=${encodeURIComponent(this.branch)}`, { headers: this.headers(token, etag) });
    if (response.status === 304 && this.cached) return structuredClone(this.cached.file);
    if (response.status === 404 && allowMissing) return { document: emptyStateDocument() };
    if (!response.ok) throw this.errorForResponse(response);
    const file = await this.parseContents(response);
    const nextEtag = header(response, 'ETag');
    this.cached = nextEtag ? { etag: nextEtag, file: structuredClone(file) } : undefined;
    return file;
  }

  private async readRaw(): Promise<RemoteFile> {
    // A plain GET without custom headers is a simple CORS request.
    const response = await this.request(this.rawUrl(), {});
    if (!response.ok) throw this.errorForResponse(response);
    try {
      return { document: this.parseDocument(await response.json()) };
    } catch (error) {
      throw new GitHubStateRepositoryError('invalid-data', 'GitHub state file is invalid.', undefined, { cause: error });
    }
  }

  private async parseContents(response: Response): Promise<RemoteFile> {
    try {
      const payload = await response.json() as GitHubContentsResponse;
      if (payload.encoding !== 'base64' || !payload.content || !payload.sha) throw new Error('Incomplete Contents API response.');
      return { document: this.parseDocument(JSON.parse(decodeBase64(payload.content))), sha: payload.sha };
    } catch (error) {
      throw new GitHubStateRepositoryError('invalid-data', 'GitHub state file is invalid.', undefined, { cause: error });
    }
  }

  private parseDocument(value: unknown): StateDocument {
    const document = upgradeStateDocument(value);
    assertStateDocument(document);
    return publicStateDocument(document);
  }

  private nextTimestamp(store: PendingStore, supplied?: string): string {
    const pendingTime = store.mutations.reduce((latest, item) => Math.max(latest, Date.parse(item.updatedAt)), 0);
    const generated = Math.max(this.clock().getTime(), this.lastMutationTime + 1, pendingTime + 1);
    const updatedAt = supplied ?? new Date(generated).toISOString();
    if (!Number.isFinite(Date.parse(updatedAt))) throw new TypeError('A valid updatedAt is required.');
    this.lastMutationTime = Math.max(this.lastMutationTime, Date.parse(updatedAt));
    return updatedAt;
  }

  private mutationId(updatedAt: string): string {
    return `${updatedAt}:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
  }

  private readPending(): PendingStore {
    let raw: string | null;
    try {
      raw = this.readStorage(GITHUB_STATE_PENDING_KEY);
    } catch {
      return { since: null, mutations: [] };
    }
    if (!raw) return this.migrateLegacyPending();
    try {
      const value = JSON.parse(raw) as PendingStore;
      if (!value || typeof value !== 'object' || !Array.isArray(value.mutations)) throw new Error('Pending state is not a store.');
      for (const mutation of value.mutations) assertPendingMutation(mutation);
      const since = typeof value.since === 'string' && Number.isFinite(Date.parse(value.since)) ? value.since : value.mutations[0]?.updatedAt ?? null;
      return { since, mutations: value.mutations };
    } catch {
      try { this.removeStorage(GITHUB_STATE_PENDING_KEY); } catch { /* Storage can be unavailable. */ }
      return { since: null, mutations: [] };
    }
  }

  /** Version 1 queued per-book payloads that also carried queue positions.
   * Positions are dropped: the device's current queue is re-queued whole. */
  private migrateLegacyPending(): PendingStore {
    let raw: string | null = null;
    try { raw = this.readStorage(LEGACY_GITHUB_STATE_PENDING_KEY); } catch { return { since: null, mutations: [] }; }
    if (!raw) return { since: null, mutations: [] };
    const mutations: PendingStateMutation[] = [];
    try {
      for (const item of JSON.parse(raw) as Array<Record<string, unknown>>) {
        const value = item?.value && typeof item.value === 'object' ? Object.fromEntries(Object.entries(item.value).filter(([key]) => key !== 'queuePosition')) : null;
        if (!value || !Object.keys(value).length || typeof item.bookId !== 'string' || typeof item.updatedAt !== 'string') continue;
        const mutation: PendingStateMutation = { id: String(item.id), kind: 'book', bookId: item.bookId, updatedAt: item.updatedAt, value: value as BookStatePayload };
        assertPendingMutation(mutation);
        mutations.push(mutation);
      }
    } catch {
      mutations.length = 0;
    }
    const store: PendingStore = { since: mutations[0]?.updatedAt ?? null, mutations };
    try {
      if (mutations.length) this.writePending(store);
      this.removeStorage(LEGACY_GITHUB_STATE_PENDING_KEY);
    } catch { /* Keep the legacy copy when storage is unavailable. */ }
    return store;
  }

  private writePending(store: PendingStore): void {
    this.writeStorage(GITHUB_STATE_PENDING_KEY, JSON.stringify(store));
  }

  private contentsUrl(): string {
    return `https://api.github.com/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/contents/${this.path.split('/').map(encodeURIComponent).join('/')}`;
  }

  private rawUrl(): string {
    return `https://raw.githubusercontent.com/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/${encodeURIComponent(this.branch)}/${this.path.split('/').map(encodeURIComponent).join('/')}`;
  }

  private headers(token?: string, etag?: string): Record<string, string> {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(etag ? { 'If-None-Match': etag } : {}),
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetcher(url, { ...init, cache: 'no-store' });
    } catch (error) {
      throw new GitHubStateRepositoryError('network', 'GitHub state request failed.', undefined, { cause: error });
    }
  }

  private errorForResponse(response: Response): GitHubStateRepositoryError {
    const remaining = header(response, 'X-RateLimit-Remaining');
    if (response.status === 429 || (response.status === 403 && remaining === '0')) {
      const reset = Number(header(response, 'X-RateLimit-Reset'));
      const retryAfter = Number(header(response, 'Retry-After'));
      const retryAt = Number.isFinite(reset) && reset > 0 ? reset * 1000 : Number.isFinite(retryAfter) && retryAfter > 0 ? Date.now() + retryAfter * 1000 : Date.now() + 60_000;
      return new GitHubStateRepositoryError('rate-limited', 'GitHub rate limit reached.', response.status, { retryAt });
    }
    if (response.status === 401 || response.status === 403) return new GitHubStateRepositoryError('unauthorized', 'GitHub rejected the credentials or repository write permission.', response.status);
    if (response.status === 404) return new GitHubStateRepositoryError('not-found', 'GitHub state repository or file was not found.', 404);
    if (response.status === 409 || response.status === 422) return new GitHubStateRepositoryError('conflict', 'GitHub state changed during save. Reload and try again.', response.status);
    return new GitHubStateRepositoryError('network', `GitHub state request failed with status ${response.status}.`, response.status);
  }

  private readStorage(key: string): string | null {
    try { return this.storage.getItem(key); }
    catch (error) { throw new GitHubStateRepositoryError('storage', 'Local sync storage is unavailable.', undefined, {cause: error}); }
  }

  private writeStorage(key: string, value: string): void {
    try { this.storage.setItem(key, value); }
    catch (error) { throw new GitHubStateRepositoryError('storage', 'Local sync storage is full or unavailable.', undefined, {cause: error}); }
  }

  private removeStorage(key: string): void {
    try { this.storage.removeItem(key); }
    catch (error) { throw new GitHubStateRepositoryError('storage', 'Local sync storage is unavailable.', undefined, {cause: error}); }
  }
}
