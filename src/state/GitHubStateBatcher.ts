import { GitHubStateRepository } from './GitHubStateRepository.ts';
import type { BookStatePayload, PendingStateMutation } from './types.ts';

export const MIN_GITHUB_SYNC_DELAY_MS = 120_000;

export interface GitHubStateBatcherOptions {
  delayMs?: number;
  retryDelaysMs?: number[];
  now?: () => number;
  setTimeout?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeout?: (timer: ReturnType<typeof setTimeout>) => void;
}

/**
 * Persists every mutation immediately, then coalesces remote writes into one
 * flush at least 120 seconds after the first unsent change. The window is
 * measured from that stored change time, not from the page load, so a change
 * made in a short visit is sent on the next visit once the window has passed.
 * Disposing only cancels the timer; the local queue survives navigation.
 */
export class GitHubStateBatcher {
  readonly delayMs: number;

  private timer?: ReturnType<typeof setTimeout>;
  private readonly repository: GitHubStateRepository;
  private readonly flush: () => Promise<unknown>;
  private readonly now: () => number;
  private readonly scheduleTimer: NonNullable<GitHubStateBatcherOptions['setTimeout']>;
  private readonly cancelTimer: NonNullable<GitHubStateBatcherOptions['clearTimeout']>;
  private readonly retryDelaysMs: number[];
  private retryAttempt = 0;

  constructor(
    repository: GitHubStateRepository,
    flush: () => Promise<unknown>,
    options: GitHubStateBatcherOptions = {},
  ) {
    this.repository = repository;
    this.flush = flush;
    this.delayMs = Math.max(MIN_GITHUB_SYNC_DELAY_MS, options.delayMs ?? MIN_GITHUB_SYNC_DELAY_MS);
    this.now = options.now ?? Date.now;
    this.scheduleTimer = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
    this.cancelTimer = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
    this.retryDelaysMs = options.retryDelaysMs ?? [15_000, 30_000, 60_000];
  }

  queueBookState(
    bookId: string,
    value: BookStatePayload | null,
    updatedAt?: string,
    schedule = true,
  ): PendingStateMutation {
    const mutation = this.repository.queueBookState(bookId, value, updatedAt);
    if (schedule) this.schedule();
    return mutation;
  }

  queueQueueState(queue: readonly string[], updatedAt?: string, schedule = true): PendingStateMutation {
    const mutation = this.repository.queueQueueState(queue, updatedAt);
    if (schedule) this.schedule();
    return mutation;
  }

  /** Milliseconds until the oldest pending change is 120 seconds old. */
  remainingDelay(): number {
    const since = Date.parse(this.repository.getPendingSince() ?? '');
    if (!Number.isFinite(since)) return this.delayMs;
    return Math.max(0, since + this.delayMs - this.now());
  }

  schedule(): void {
    if (!this.repository.getPendingCount()) return;
    if (this.timer !== undefined) return;
    this.retryAttempt = 0;
    this.setFlushTimer(this.remainingDelay());
  }

  private setFlushTimer(delayMs: number): void {
    this.timer = this.scheduleTimer(() => {
      this.timer = undefined;
      void this.flush().then(() => { this.retryAttempt = 0; }).catch(() => {
        if (!this.repository.getPendingCount() || this.retryAttempt >= this.retryDelaysMs.length) return;
        const retryDelay = Math.max(0, this.retryDelaysMs[this.retryAttempt]);
        this.retryAttempt += 1;
        this.setFlushTimer(retryDelay);
      });
    }, delayMs);
  }

  cancel(): void {
    if (this.timer === undefined) return;
    this.cancelTimer(this.timer);
    this.timer = undefined;
  }

  dispose(): void {
    this.cancel();
  }
}
