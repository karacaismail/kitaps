export const STATE_SCHEMA_VERSION = 1 as const;
export const GITHUB_STATE_TOKEN_KEY = 'kitapatlasi:github-state:token:v1';
export const GITHUB_STATE_PENDING_KEY = 'kitapatlasi:github-state:pending:v1';
export const GITHUB_STATE_MIGRATION_KEY = 'kitapatlasi:github-state:migrated:v1';

export type ReadingState = 'onemli' | 'alinacak' | 'alindi' | 'okunuyor' | 'araverildi' | 'birakildi' | 'okundu';

export interface ReadingProgress {
  startedAt?: string;
  finishedAt?: string;
  page?: number;
  totalPages?: number;
  why?: string;
  apply?: string;
}

export interface BookStatePayload {
  states?: ReadingState[];
  reading?: ReadingProgress | null;
  queuePosition?: number | null;
}

export interface BookStateRecord {
  updatedAt: string;
  value: BookStatePayload | null;
}

export interface StateDocument {
  schemaVersion: typeof STATE_SCHEMA_VERSION;
  updatedAt: string;
  books: Record<string, BookStateRecord>;
}

export interface PendingStateMutation extends BookStateRecord {
  id: string;
  bookId: string;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface GitHubStateRepositoryOptions {
  owner?: string;
  repository?: string;
  path?: string;
  branch?: string;
  storage?: StorageLike;
  fetch?: typeof globalThis.fetch;
  clock?: () => Date;
  maxConflictRetries?: number;
}
