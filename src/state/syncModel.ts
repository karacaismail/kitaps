import type {BookStatePayload, ReadingProgress, ReadingState, StateDocument} from './types.ts';

export interface PublicBookView {
  states: ReadingState[];
  reading: ReadingProgress | null;
  queuePosition: number | null;
}

export function projectPublicState(document: StateDocument, bookIds: Iterable<string>): {records: Record<string, PublicBookView>; queue: string[]} {
  const allowed = new Set(bookIds);
  const records: Record<string, PublicBookView> = {};
  const queue: Array<[number, string]> = [];
  for (const [bookId, record] of Object.entries(document.books)) {
    if (!allowed.has(bookId)) continue;
    const value = record.value;
    const projected = {states: value?.states ? [...value.states] : [], reading: value?.reading ? structuredClone(value.reading) : null, queuePosition: Number.isInteger(value?.queuePosition) ? value!.queuePosition! : null};
    records[bookId] = projected;
    if (projected.queuePosition !== null) queue.push([projected.queuePosition, bookId]);
  }
  queue.sort((left, right) => left[0] - right[0] || left[1].localeCompare(right[1]));
  return {records, queue: queue.slice(0, 5).map(([, bookId]) => bookId)};
}

export interface SharedRankingContext {
  states: Record<string, ReadingState[]>;
  reading: Record<string, ReadingProgress>;
  queue: string[];
  recordCount: number;
  updatedAt: string;
}

/** The ranking engine must only consume this shared, remote projection.
 * Browser-local and pending mutations intentionally stay out until GitHub
 * accepts them, so the same repository revision produces the same order on
 * every device.
 */
export function sharedRankingContext(document: StateDocument, bookIds: Iterable<string>): SharedRankingContext {
  const projected = projectPublicState(document, bookIds);
  const states: Record<string, ReadingState[]> = {};
  const reading: Record<string, ReadingProgress> = {};
  for (const [bookId, value] of Object.entries(projected.records)) {
    if (value.states.length) states[bookId] = [...value.states];
    if (value.reading) reading[bookId] = structuredClone(value.reading);
  }
  return {states, reading, queue: projected.queue, recordCount: Object.keys(projected.records).length, updatedAt: document.updatedAt};
}

export function buildInitialMigrationPatches(local: Map<string, PublicBookView>, localQueue: string[], remote: {records: Record<string, PublicBookView>; queue: string[]}): Map<string, BookStatePayload> {
  const patches = new Map<string, BookStatePayload>();
  const write = (bookId: string, patch: BookStatePayload): void => { patches.set(bookId, {...patches.get(bookId), ...patch}); };
  for (const [bookId, value] of local) {
    const current = remote.records[bookId] ?? {states: [], reading: null, queuePosition: null};
    if (value.states.length && JSON.stringify(value.states) !== JSON.stringify(current.states)) write(bookId, {states: [...value.states]});
    if (value.reading && JSON.stringify(value.reading) !== JSON.stringify(current.reading)) write(bookId, {reading: structuredClone(value.reading)});
    if (value.queuePosition !== null && value.queuePosition !== current.queuePosition) write(bookId, {queuePosition: value.queuePosition});
  }
  if (localQueue.length) for (const bookId of remote.queue) if (!localQueue.includes(bookId)) write(bookId, {queuePosition: null});
  return patches;
}
