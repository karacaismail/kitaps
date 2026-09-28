import {
  BOOK_FIELDS,
  LEGACY_STATE_SCHEMA_VERSION,
  MAX_QUEUE_LENGTH,
  STATE_SCHEMA_VERSION,
  type BookField,
  type BookStatePayload,
  type BookStateRecord,
  type PendingStateMutation,
  type QueueRecord,
  type ReadingState,
  type StateDocument,
} from './types.ts';

const validTimestamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const readingStates = new Set<ReadingState>(['onemli', 'alinacak', 'alindi', 'okunuyor', 'araverildi', 'birakildi', 'okundu']);
const exactKeys = (value: object, allowed: string[]): boolean => Object.keys(value).every(key => allowed.includes(key));
const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const later = (left: string | undefined, right: string | undefined): string | undefined =>
  !left ? right : !right ? left : Date.parse(left) >= Date.parse(right) ? left : right;

function assertReading(value: unknown, bookId: string): void {
  if (!isObject(value) || !exactKeys(value, ['startedAt', 'finishedAt', 'page', 'totalPages', 'why', 'apply'])) throw new TypeError(`Invalid reading data for ${bookId}.`);
  for (const key of ['startedAt', 'finishedAt', 'why', 'apply']) if (key in value && typeof value[key] !== 'string') throw new TypeError(`Invalid ${key} for ${bookId}.`);
  for (const key of ['page', 'totalPages']) if (key in value && (!Number.isInteger(value[key]) || (value[key] as number) < 0)) throw new TypeError(`Invalid ${key} for ${bookId}.`);
}

export function assertBookStatePayload(value: unknown, bookId = '<unknown>'): asserts value is BookStatePayload {
  if (!isObject(value) || !exactKeys(value, ['states', 'reading'])) throw new TypeError(`Invalid value for ${bookId}.`);
  if ('states' in value && (!Array.isArray(value.states) || new Set(value.states).size !== value.states.length || value.states.some(state => typeof state !== 'string' || !readingStates.has(state as ReadingState)))) throw new TypeError(`Invalid states for ${bookId}.`);
  if ('reading' in value && value.reading !== null) assertReading(value.reading, bookId);
}

export function assertQueue(value: unknown, context = 'queue'): asserts value is string[] {
  if (!Array.isArray(value) || value.length > MAX_QUEUE_LENGTH || value.some(id => typeof id !== 'string' || !id.trim()) || new Set(value).size !== value.length) {
    throw new TypeError(`Invalid ${context}.`);
  }
}

function assertStamps(value: unknown, bookId: string): void {
  if (!isObject(value) || !exactKeys(value, [...BOOK_FIELDS])) throw new TypeError(`Invalid stamps for ${bookId}.`);
  for (const stamp of Object.values(value)) if (!validTimestamp(stamp)) throw new TypeError(`Invalid stamp for ${bookId}.`);
}

export function publicStatePayload(value: BookStatePayload | null): BookStatePayload | null {
  if (value === null) return null;
  const payload: BookStatePayload = {};
  if (value.states) payload.states = [...value.states];
  if (value.reading !== undefined) payload.reading = value.reading === null ? null : structuredClone(value.reading);
  return payload;
}

/** Copies only known public fields, so nothing unexpected is ever written. */
export function publicStateDocument(document: StateDocument): StateDocument {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: document.updatedAt,
    books: Object.fromEntries(Object.entries(document.books).map(([bookId, record]) => [bookId, {
      updatedAt: record.updatedAt,
      value: publicStatePayload(record.value),
      ...(record.stamps ? { stamps: { ...record.stamps } } : {}),
    }])),
    queue: document.queue ? { updatedAt: document.queue.updatedAt, value: [...document.queue.value] } : null,
  };
}

export function emptyStateDocument(updatedAt = new Date(0).toISOString()): StateDocument {
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books: {}, queue: null };
}

export function assertStateDocument(value: unknown): asserts value is StateDocument {
  if (!isObject(value) || !exactKeys(value, ['schemaVersion', 'updatedAt', 'books', 'queue'])) throw new TypeError('State document must be an object with known fields.');
  if (value.schemaVersion !== STATE_SCHEMA_VERSION) throw new TypeError(`Unsupported state schema version: ${String(value.schemaVersion)}.`);
  if (!validTimestamp(value.updatedAt)) throw new TypeError('State document updatedAt must be a valid timestamp.');
  if (!isObject(value.books)) throw new TypeError('State document books must be an object.');
  for (const [bookId, record] of Object.entries(value.books)) {
    if (!bookId.trim() || !isObject(record) || !exactKeys(record, ['updatedAt', 'value', 'stamps'])) throw new TypeError(`Invalid state record for ${bookId || '<empty>'}.`);
    if (!validTimestamp(record.updatedAt)) throw new TypeError(`Invalid updatedAt for ${bookId}.`);
    if (record.value !== null) assertBookStatePayload(record.value, bookId);
    if ('stamps' in record) assertStamps(record.stamps, bookId);
  }
  if (value.queue !== null) {
    if (!isObject(value.queue) || !exactKeys(value.queue, ['updatedAt', 'value']) || !validTimestamp(value.queue.updatedAt)) throw new TypeError('Invalid queue record.');
    assertQueue(value.queue.value);
  }
}

/** Reads a version 1 file (per-book queue positions) as a version 2 document. */
export function upgradeStateDocument(value: unknown): unknown {
  if (!isObject(value) || value.schemaVersion !== LEGACY_STATE_SCHEMA_VERSION || !isObject(value.books)) return value;
  const positions: Array<[number, string, string]> = [];
  const books: Record<string, BookStateRecord> = {};
  for (const [bookId, record] of Object.entries(value.books)) {
    if (!isObject(record)) throw new TypeError(`Invalid state record for ${bookId}.`);
    const legacy = isObject(record.value) ? record.value : null;
    if (legacy && Number.isInteger(legacy.queuePosition)) positions.push([legacy.queuePosition as number, bookId, String(record.updatedAt)]);
    const payload = legacy ? Object.fromEntries(Object.entries(legacy).filter(([key]) => key !== 'queuePosition')) as BookStatePayload : null;
    books[bookId] = { updatedAt: String(record.updatedAt), value: payload };
  }
  positions.sort((left, right) => left[0] - right[0] || left[1].localeCompare(right[1]));
  const queue: QueueRecord | null = positions.length
    ? { updatedAt: positions.map(item => item[2]).reduce((newest, stamp) => later(newest, stamp) ?? stamp), value: positions.slice(0, MAX_QUEUE_LENGTH).map(item => item[1]) }
    : null;
  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt: value.updatedAt, books, queue };
}

export function assertPendingMutation(value: unknown): asserts value is PendingStateMutation {
  if (!isObject(value) || typeof value.id !== 'string' || !value.id || !validTimestamp(value.updatedAt)) throw new TypeError('Invalid pending state mutation.');
  if (value.kind === 'book') {
    if (!exactKeys(value, ['id', 'kind', 'bookId', 'updatedAt', 'value']) || typeof value.bookId !== 'string' || !value.bookId.trim()) throw new TypeError('Invalid pending book mutation.');
    if (value.value !== null) assertBookStatePayload(value.value, value.bookId);
  } else if (value.kind === 'queue') {
    if (!exactKeys(value, ['id', 'kind', 'updatedAt', 'value'])) throw new TypeError('Invalid pending queue mutation.');
    assertQueue(value.value, 'pending queue');
  } else {
    throw new TypeError('Invalid pending state mutation kind.');
  }
}

/** Applies this device's unsent edits to the newest remote file with
 * last-writer-wins per field: a field another device changed after the local
 * edit keeps the other device's value; untouched fields are never disturbed. */
export function applyPendingMutations(base: StateDocument, mutations: readonly PendingStateMutation[]): StateDocument {
  assertStateDocument(base);
  const books: Record<string, BookStateRecord> = structuredClone(base.books);
  let queue: QueueRecord | null = base.queue ? structuredClone(base.queue) : null;
  let updatedAt = base.updatedAt;

  for (const mutation of mutations) {
    assertPendingMutation(mutation);
    if (mutation.kind === 'queue') {
      if (queue && Date.parse(queue.updatedAt) > Date.parse(mutation.updatedAt)) continue;
      queue = { updatedAt: mutation.updatedAt, value: [...mutation.value] };
      updatedAt = later(updatedAt, mutation.updatedAt)!;
      continue;
    }

    const current = books[mutation.bookId];
    if (mutation.value === null) {
      if (current && Date.parse(current.updatedAt) > Date.parse(mutation.updatedAt)) continue;
      books[mutation.bookId] = { updatedAt: mutation.updatedAt, value: null };
      updatedAt = later(updatedAt, mutation.updatedAt)!;
      continue;
    }

    const value: BookStatePayload = { ...structuredClone(current?.value ?? {}) };
    const stamps: Partial<Record<BookField, string>> = { ...(current?.stamps ?? {}) };
    let applied = false;
    for (const field of BOOK_FIELDS) {
      if (!(field in mutation.value)) continue;
      // Records written before field stamps existed fall back to their record time.
      const remoteStamp = stamps[field] ?? (current && !current.stamps ? current.updatedAt : undefined);
      if (remoteStamp && Date.parse(remoteStamp) > Date.parse(mutation.updatedAt)) continue;
      if (field === 'states') value.states = [...(mutation.value.states ?? [])];
      else value.reading = mutation.value.reading === null || mutation.value.reading === undefined ? null : structuredClone(mutation.value.reading);
      stamps[field] = mutation.updatedAt;
      applied = true;
    }
    if (!applied) continue;
    const newest = Object.values(stamps).reduce<string | undefined>((result, stamp) => later(result, stamp), current?.updatedAt);
    books[mutation.bookId] = { updatedAt: newest ?? mutation.updatedAt, value, stamps };
    updatedAt = later(updatedAt, mutation.updatedAt)!;
  }

  return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt, books, queue };
}
