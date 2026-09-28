import { STATE_SCHEMA_VERSION, type BookStateRecord, type PendingStateMutation, type StateDocument } from './types.ts';

const validTimestamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function emptyStateDocument(updatedAt = new Date(0).toISOString()): StateDocument {
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books: {} };
}

export function assertStateDocument(value: unknown): asserts value is StateDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('State document must be an object.');
  const document = value as Partial<StateDocument>;
  if (document.schemaVersion !== STATE_SCHEMA_VERSION) throw new TypeError(`Unsupported state schema version: ${String(document.schemaVersion)}.`);
  if (!validTimestamp(document.updatedAt)) throw new TypeError('State document updatedAt must be a valid timestamp.');
  if (!document.books || typeof document.books !== 'object' || Array.isArray(document.books)) throw new TypeError('State document books must be an object.');
  for (const [bookId, record] of Object.entries(document.books)) {
    if (!bookId || !record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError(`Invalid state record for ${bookId || '<empty>'}.`);
    if (!validTimestamp((record as BookStateRecord).updatedAt)) throw new TypeError(`Invalid updatedAt for ${bookId}.`);
    const payload = (record as BookStateRecord).value;
    if (payload !== null && (typeof payload !== 'object' || Array.isArray(payload))) throw new TypeError(`Invalid value for ${bookId}.`);
  }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

export function laterRecord(left: BookStateRecord | undefined, right: BookStateRecord | undefined): BookStateRecord | undefined {
  if (!left) return right;
  if (!right) return left;
  const time = Date.parse(left.updatedAt) - Date.parse(right.updatedAt);
  if (time !== 0) return time > 0 ? left : right;
  return canonical(left) >= canonical(right) ? left : right;
}

export function mergeStateDocuments(left: StateDocument, right: StateDocument): StateDocument {
  assertStateDocument(left);
  assertStateDocument(right);
  const books: Record<string, BookStateRecord> = {};
  for (const bookId of new Set([...Object.keys(left.books), ...Object.keys(right.books)])) {
    const winner = laterRecord(left.books[bookId], right.books[bookId]);
    if (winner) books[bookId] = structuredClone(winner);
  }
  const updatedAt = Date.parse(left.updatedAt) >= Date.parse(right.updatedAt) ? left.updatedAt : right.updatedAt;
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books };
}

export function pendingMutationsToDocument(mutations: PendingStateMutation[]): StateDocument {
  const books: Record<string, BookStateRecord> = {};
  let updatedAt = new Date(0).toISOString();
  for (const mutation of mutations) {
    if (!mutation?.id || !mutation.bookId || !validTimestamp(mutation.updatedAt)) throw new TypeError('Invalid pending state mutation.');
    const winner = laterRecord(books[mutation.bookId], mutation);
    if (winner) books[mutation.bookId] = { updatedAt: winner.updatedAt, value: structuredClone(winner.value) };
    if (Date.parse(mutation.updatedAt) > Date.parse(updatedAt)) updatedAt = mutation.updatedAt;
  }
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books };
}
