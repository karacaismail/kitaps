import { BOOK_FIELDS, MAX_QUEUE_LENGTH, type PendingStateMutation, type ReadingProgress, type ReadingState, type StateDocument } from './types.ts';

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

export interface ConnectPlan {
  /** Books this device changed while it could not send, which the shared file now holds differently. */
  conflicts: string[];
  queueConflict: boolean;
}

/** A device being connected may hold edits made while it could not send them,
 * and meanwhile another device may have saved a different value for the same
 * field. Field-level last-writer-wins would silently drop one side, so these
 * books go to the reader instead. Only the device's own unsent edits count:
 * values it merely read from the shared file earlier are not its claims, and a
 * field the shared file never set cannot be lost. */
export function planConnect(pending: readonly PendingStateMutation[], remote: StateDocument): ConnectPlan {
  const conflicts: string[] = [];
  let queueConflict = false;
  const sortedStates = (states?: readonly string[]) => canonical([...(states ?? [])].sort());
  for (const mutation of pending) {
    if (mutation.kind === 'queue') {
      queueConflict = Boolean(remote.queue?.value.length) && canonical(mutation.value) !== canonical(remote.queue!.value);
      continue;
    }
    const record = remote.books[mutation.bookId];
    if (!record) continue;
    // A null value means another device cleared the book: an empty value, not a missing one.
    const shared = record.value;
    const local = mutation.value;
    const fields = local === null ? BOOK_FIELDS : BOOK_FIELDS.filter(field => field in local);
    const differs = fields.some(field => {
      if (shared !== null && !(field in shared)) return false;
      return field === 'states'
        ? sortedStates(local?.states) !== sortedStates(shared?.states)
        : canonical(local?.reading ?? null) !== canonical(shared?.reading ?? null);
    });
    if (differs) conflicts.push(mutation.bookId);
  }
  return {conflicts, queueConflict};
}
