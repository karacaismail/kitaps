import { STATE_SCHEMA_VERSION, type BookStatePayload, type BookStateRecord, type PendingStateMutation, type ReadingState, type StateDocument } from './types.ts';

const validTimestamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const readingStates = new Set<ReadingState>(['onemli', 'alinacak', 'alindi', 'okunuyor', 'araverildi', 'birakildi', 'okundu']);
const exactKeys = (value: object, allowed: string[]): boolean => Object.keys(value).every(key => allowed.includes(key));

function assertReading(value: unknown, bookId: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !exactKeys(value, ['startedAt', 'finishedAt', 'page', 'totalPages', 'why', 'apply'])) throw new TypeError(`Invalid reading data for ${bookId}.`);
  const reading = value as Record<string, unknown>;
  for (const key of ['startedAt', 'finishedAt', 'why', 'apply']) if (key in reading && typeof reading[key] !== 'string') throw new TypeError(`Invalid ${key} for ${bookId}.`);
  for (const key of ['page', 'totalPages']) if (key in reading && (!Number.isInteger(reading[key]) || (reading[key] as number) < 0)) throw new TypeError(`Invalid ${key} for ${bookId}.`);
}

export function assertBookStatePayload(value: unknown, bookId = '<unknown>'): asserts value is BookStatePayload {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !exactKeys(value, ['states', 'reading', 'queuePosition'])) throw new TypeError(`Invalid value for ${bookId}.`);
  const payload = value as Record<string, unknown>;
  if ('states' in payload && (!Array.isArray(payload.states) || new Set(payload.states).size !== payload.states.length || payload.states.some(state => typeof state !== 'string' || !readingStates.has(state as ReadingState)))) throw new TypeError(`Invalid states for ${bookId}.`);
  if ('queuePosition' in payload && payload.queuePosition !== null && (!Number.isInteger(payload.queuePosition) || (payload.queuePosition as number) < 0 || (payload.queuePosition as number) > 4)) throw new TypeError(`Invalid queue position for ${bookId}.`);
  if ('reading' in payload && payload.reading !== null) assertReading(payload.reading, bookId);
}

export function publicStatePayload(value: BookStatePayload | null): BookStatePayload | null {
  if (value === null) return null;
  const payload: BookStatePayload = {};
  if (value.states) payload.states = [...value.states];
  if (value.reading !== undefined) payload.reading = value.reading === null ? null : structuredClone(value.reading);
  if (value.queuePosition !== undefined) payload.queuePosition = value.queuePosition;
  return payload;
}

export function publicStateDocument(document: StateDocument): StateDocument {
  return {
    ...document,
    books: Object.fromEntries(Object.entries(document.books).map(([bookId, record]) => [bookId, {...record, value: publicStatePayload(record.value)}])),
  };
}

export function emptyStateDocument(updatedAt = new Date(0).toISOString()): StateDocument {
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books: {} };
}

export function assertStateDocument(value: unknown): asserts value is StateDocument {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !exactKeys(value, ['schemaVersion', 'updatedAt', 'books'])) throw new TypeError('State document must be an object with known fields.');
  const document = value as Partial<StateDocument>;
  if (document.schemaVersion !== STATE_SCHEMA_VERSION) throw new TypeError(`Unsupported state schema version: ${String(document.schemaVersion)}.`);
  if (!validTimestamp(document.updatedAt)) throw new TypeError('State document updatedAt must be a valid timestamp.');
  if (!document.books || typeof document.books !== 'object' || Array.isArray(document.books)) throw new TypeError('State document books must be an object.');
  for (const [bookId, record] of Object.entries(document.books)) {
    if (!bookId.trim() || !record || typeof record !== 'object' || Array.isArray(record) || !exactKeys(record, ['updatedAt', 'value'])) throw new TypeError(`Invalid state record for ${bookId || '<empty>'}.`);
    if (!validTimestamp((record as BookStateRecord).updatedAt)) throw new TypeError(`Invalid updatedAt for ${bookId}.`);
    const payload = (record as BookStateRecord).value;
    if (payload !== null) assertBookStatePayload(payload, bookId);
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

/** Applies sparse, locally-created field patches over the latest remote file.
 * Conflict retries always re-read the remote file first, so unrelated fields
 * changed by another device survive regardless of either device's wall clock.
 */
export function applyStateDocumentPatches(base: StateDocument, patches: StateDocument): StateDocument {
  assertStateDocument(base);
  assertStateDocument(patches);
  const books: Record<string, BookStateRecord> = structuredClone(base.books);
  for (const [bookId, patch] of Object.entries(patches.books)) {
    if (patch.value === null) {
      books[bookId] = structuredClone(patch);
      continue;
    }
    const current = books[bookId]?.value ?? {};
    books[bookId] = {
      updatedAt: patch.updatedAt,
      value: {...structuredClone(current), ...structuredClone(patch.value)},
    };
  }
  const updatedAt = Date.parse(base.updatedAt) >= Date.parse(patches.updatedAt) ? base.updatedAt : patches.updatedAt;
  return {schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books};
}

export function pendingMutationsToDocument(mutations: PendingStateMutation[]): StateDocument {
  const books: Record<string, BookStateRecord> = {};
  let updatedAt = new Date(0).toISOString();
  for (const mutation of mutations) {
    if (!mutation || typeof mutation !== 'object' || !exactKeys(mutation, ['id', 'bookId', 'updatedAt', 'value']) || typeof mutation.id !== 'string' || !mutation.id || typeof mutation.bookId !== 'string' || !mutation.bookId.trim() || !validTimestamp(mutation.updatedAt)) throw new TypeError('Invalid pending state mutation.');
    if (mutation.value !== null) assertBookStatePayload(mutation.value, mutation.bookId);
    const previous = books[mutation.bookId];
    books[mutation.bookId] = mutation.value === null
      ? {updatedAt: mutation.updatedAt, value: null}
      : {updatedAt: mutation.updatedAt, value: {...(previous?.value ?? {}), ...structuredClone(mutation.value)}};
    if (Date.parse(mutation.updatedAt) > Date.parse(updatedAt)) updatedAt = mutation.updatedAt;
  }
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books };
}
