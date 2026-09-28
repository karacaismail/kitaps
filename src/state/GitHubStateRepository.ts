import { assertStateDocument, emptyStateDocument, mergeStateDocuments, pendingMutationsToDocument } from './merge.ts';
import {
  GITHUB_STATE_PENDING_KEY,
  GITHUB_STATE_TOKEN_KEY,
  type BookStatePayload,
  type GitHubStateRepositoryOptions,
  type PendingStateMutation,
  type StateDocument,
  type StorageLike,
} from './types.ts';

export type GitHubStateErrorCode = 'unauthorized' | 'not-found' | 'conflict' | 'network' | 'invalid-data';

export class GitHubStateRepositoryError extends Error {
  readonly code: GitHubStateErrorCode;
  readonly status?: number;

  constructor(code: GitHubStateErrorCode, message: string, status?: number, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GitHubStateRepositoryError';
    this.code = code;
    this.status = status;
  }
}

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

export class GitHubStateRepository {
  static readonly TOKEN_KEY = GITHUB_STATE_TOKEN_KEY;
  static readonly PENDING_KEY = GITHUB_STATE_PENDING_KEY;

  private readonly owner: string;
  private readonly repository: string;
  private readonly path: string;
  private readonly branch: string;
  private readonly storage: StorageLike;
  private readonly fetcher: typeof globalThis.fetch;
  private readonly clock: () => Date;
  private readonly maxConflictRetries: number;

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
    if (!clean) throw new GitHubStateRepositoryError('unauthorized', 'A GitHub token is required.', 401);
    this.storage.setItem(GITHUB_STATE_TOKEN_KEY, clean);
  }

  clearToken(): void {
    this.storage.removeItem(GITHUB_STATE_TOKEN_KEY);
  }

  async load(): Promise<StateDocument> {
    return (await this.readRemote(false, false)).document;
  }

  async loadWithPending(): Promise<StateDocument> {
    const remote = await this.load();
    return mergeStateDocuments(remote, pendingMutationsToDocument(this.readPending()));
  }

  queueBookState(bookId: string, value: BookStatePayload | null, updatedAt = this.clock().toISOString()): PendingStateMutation {
    if (!bookId.trim() || !Number.isFinite(Date.parse(updatedAt))) throw new TypeError('bookId and a valid updatedAt are required.');
    const mutation: PendingStateMutation = { id: `${updatedAt}:${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`, bookId, updatedAt, value: structuredClone(value) };
    this.storage.setItem(GITHUB_STATE_PENDING_KEY, JSON.stringify([...this.readPending(), mutation]));
    return mutation;
  }

  getPendingCount(): number {
    return this.readPending().length;
  }

  async flushPending(): Promise<StateDocument> {
    const snapshot = this.readPending();
    if (!snapshot.length) return this.load();
    const saved = await this.save(pendingMutationsToDocument(snapshot));
    const completed = new Set(snapshot.map(item => item.id));
    const remaining = this.readPending().filter(item => !completed.has(item.id));
    if (remaining.length) this.storage.setItem(GITHUB_STATE_PENDING_KEY, JSON.stringify(remaining));
    else this.storage.removeItem(GITHUB_STATE_PENDING_KEY);
    return saved;
  }

  async save(local: StateDocument): Promise<StateDocument> {
    assertStateDocument(local);
    const token = this.storage.getItem(GITHUB_STATE_TOKEN_KEY)?.trim();
    if (!token) throw new GitHubStateRepositoryError('unauthorized', 'A GitHub token is required to save state.', 401);

    for (let attempt = 0; attempt <= this.maxConflictRetries; attempt += 1) {
      const remote = await this.readRemote(true, true, token);
      const merged = mergeStateDocuments(remote.document, local);
      const response = await this.request(this.contentsUrl(), {
        method: 'PUT',
        headers: this.headers(token),
        body: JSON.stringify({
          message: 'Update Kitap Atlası state',
          content: encodeBase64(`${JSON.stringify(merged, null, 2)}\n`),
          branch: this.branch,
          ...(remote.sha ? { sha: remote.sha } : {}),
        }),
      });
      if (response.status === 409 && attempt < this.maxConflictRetries) continue;
      if (!response.ok) throw this.errorForResponse(response);
      return merged;
    }
    throw new GitHubStateRepositoryError('conflict', 'GitHub state changed during save. Reload and try again.', 409);
  }

  private async readRemote(authenticated: boolean, allowMissing: boolean, suppliedToken?: string): Promise<RemoteFile> {
    const token = authenticated ? suppliedToken ?? this.storage.getItem(GITHUB_STATE_TOKEN_KEY)?.trim() : undefined;
    const response = await this.request(`${this.contentsUrl()}?ref=${encodeURIComponent(this.branch)}`, { headers: this.headers(token) });
    if (response.status === 404 && allowMissing) return { document: emptyStateDocument() };
    if (!response.ok) throw this.errorForResponse(response);
    let payload: GitHubContentsResponse;
    try {
      payload = await response.json() as GitHubContentsResponse;
      if (payload.encoding !== 'base64' || !payload.content || !payload.sha) throw new Error('Incomplete Contents API response.');
      const document = JSON.parse(decodeBase64(payload.content)) as unknown;
      assertStateDocument(document);
      return { document, sha: payload.sha };
    } catch (error) {
      throw new GitHubStateRepositoryError('invalid-data', 'GitHub state file is invalid.', undefined, { cause: error });
    }
  }

  private readPending(): PendingStateMutation[] {
    const raw = this.storage.getItem(GITHUB_STATE_PENDING_KEY);
    if (!raw) return [];
    try {
      const value = JSON.parse(raw) as unknown;
      if (!Array.isArray(value)) throw new Error('Pending state is not an array.');
      return value as PendingStateMutation[];
    } catch (error) {
      throw new GitHubStateRepositoryError('invalid-data', 'Local pending state is invalid.', undefined, { cause: error });
    }
  }

  private contentsUrl(): string {
    return `https://api.github.com/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repository)}/contents/${this.path.split('/').map(encodeURIComponent).join('/')}`;
  }

  private headers(token?: string): HeadersInit {
    return {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetcher(url, init);
    } catch (error) {
      throw new GitHubStateRepositoryError('network', 'GitHub state request failed.', undefined, { cause: error });
    }
  }

  private errorForResponse(response: Response): GitHubStateRepositoryError {
    if (response.status === 401) return new GitHubStateRepositoryError('unauthorized', 'GitHub rejected the credentials.', 401);
    if (response.status === 404) return new GitHubStateRepositoryError('not-found', 'GitHub state repository or file was not found.', 404);
    if (response.status === 409) return new GitHubStateRepositoryError('conflict', 'GitHub state changed during save. Reload and try again.', 409);
    return new GitHubStateRepositoryError('network', `GitHub state request failed with status ${response.status}.`, response.status);
  }
}
