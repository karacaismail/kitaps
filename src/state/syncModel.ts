import { MAX_QUEUE_LENGTH, type ReadingProgress, type ReadingState, type StateDocument } from './types.ts';

export interface PublicBookView {
  states: ReadingState[];
  reading: ReadingProgress | null;
}

export function projectPublicState(document: StateDocument, bookIds: Iterable<string>): {records: Record<string, PublicBookView>; queue: string[]} {
  const allowed = new Set(bookIds);
  const records: Record<string, PublicBookView> = {};
  for (const [bookId, record] of Object.entries(document.books)) {
    if (!allowed.has(bookId)) continue;
    const value = record.value;
    records[bookId] = {states: value?.states ? [...value.states] : [], reading: value?.reading ? structuredClone(value.reading) : null};
  }
  const queue = (document.queue?.value ?? []).filter(bookId => allowed.has(bookId)).slice(0, MAX_QUEUE_LENGTH);
  return {records, queue};
}

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value ?? null);
};
const isEmpty = (view: PublicBookView | undefined): boolean => !view || (!view.states.length && !view.reading);
export const sameBookView = (left: PublicBookView, right: PublicBookView): boolean =>
  canonical([...left.states].sort()) === canonical([...right.states].sort()) && canonical(left.reading) === canonical(right.reading);

export interface FirstSyncPlan {
  /** Books only this device knows; they are added to the shared file. */
  localOnly: string[];
  /** Books both sides know with different values; the reader chooses. */
  conflicts: string[];
  queue: 'none' | 'local-only' | 'conflict';
}

/** Compares a device that has never synced with the shared file, so nothing
 * recorded on the device is overwritten without the reader's decision. */
export function planFirstSync(local: Map<string, PublicBookView>, localQueue: readonly string[], remote: {records: Record<string, PublicBookView>; queue: readonly string[]}): FirstSyncPlan {
  const localOnly: string[] = [];
  const conflicts: string[] = [];
  for (const [bookId, view] of local) {
    if (isEmpty(view)) continue;
    const shared = remote.records[bookId];
    if (isEmpty(shared)) localOnly.push(bookId);
    else if (!sameBookView(view, shared!)) conflicts.push(bookId);
  }
  const queue = !localQueue.length || canonical(localQueue) === canonical(remote.queue)
    ? 'none'
    : remote.queue.length ? 'conflict' : 'local-only';
  return {localOnly, conflicts, queue};
}
