import { BOOK_FIELDS, MAX_QUEUE_LENGTH, type BookField, type BookStateRecord, type PendingStateMutation, type ReadingProgress, type ReadingState, type StateBases, type StateDocument } from './types.ts';

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

/** When a field of a shared record was last set; undefined when it never was. A
 * cleared record (null value) counts as setting both fields to empty. Like merge.ts,
 * a record with field stamps answers from them alone: its unstamped field predates
 * stamps, and any edit may overwrite it. */
export const fieldStamp = (record: BookStateRecord, field: BookField): string | undefined =>
  record.stamps ? record.stamps[field] : record.value === null || (record.value && field in record.value) ? record.updatedAt : undefined;

const newer = (stamp: string, base: string | undefined): boolean => !base || Date.parse(stamp) > Date.parse(base);

export interface ConnectPlan {
  /** Books this device changed while it could not send, which another device saved differently meanwhile. */
  conflicts: string[];
  queueConflict: boolean;
}

/** A device being connected may hold edits made while it could not send them,
 * and meanwhile another device may have saved a different value for the same
 * field. Field-level last-writer-wins would silently drop one side, so these
 * books go to the reader instead.
 *
 * A field counts only when the shared file set it after this device last took
 * it over (`bases`), or when this device never saw it, and the values differ.
 * Editing a value this device itself read is not a conflict, and a field the
 * shared file never set cannot be lost. */
export function planConnect(pending: readonly PendingStateMutation[], remote: StateDocument, bases: StateBases = {books: {}}): ConnectPlan {
  const conflicts: string[] = [];
  let queueConflict = false;
  const sortedStates = (states?: readonly string[]) => canonical([...(states ?? [])].sort());
  for (const mutation of pending) {
    if (mutation.kind === 'queue') {
      const shared = remote.queue;
      queueConflict = Boolean(shared) && newer(shared!.updatedAt, bases.queue) && canonical(mutation.value) !== canonical(shared!.value);
      continue;
    }
    const record = remote.books[mutation.bookId];
    if (!record) continue;
    const local = mutation.value;
    const fields = local === null ? BOOK_FIELDS : BOOK_FIELDS.filter(field => field in local);
    const differs = fields.some(field => {
      const stamp = fieldStamp(record, field);
      if (!stamp || !newer(stamp, bases.books[mutation.bookId]?.[field])) return false;
      return field === 'states'
        ? sortedStates(local?.states) !== sortedStates(record.value?.states)
        : canonical(local?.reading ?? null) !== canonical(record.value?.reading ?? null);
    });
    if (differs) conflicts.push(mutation.bookId);
  }
  return {conflicts, queueConflict};
}
