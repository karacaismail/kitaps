import { GitHubStateRepository } from './GitHubStateRepository.ts';
import type { BookStatePayload, PendingStateMutation } from './types.ts';

export const MIN_GITHUB_SYNC_DELAY_MS = 120_000;

export interface GitHubStateBatcherOptions {
  delayMs?: number;
  setTimeout?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeout?: (timer: ReturnType<typeof setTimeout>) => void;
}

/**
 * Persists every mutation immediately, then coalesces remote writes into one flush.
 * Disposing only cancels the timer: the repository's local pending queue remains
 * intact so navigation or unload cannot discard unsent changes.
 */
export class GitHubStateBatcher {
  readonly delayMs: number;

  private timer?: ReturnType<typeof setTimeout>;
  private readonly repository: GitHubStateRepository;
  private readonly flush: () => Promise<unknown>;
  private readonly scheduleTimer: GitHubStateBatcherOptions['setTimeout'];
  private readonly cancelTimer: GitHubStateBatcherOptions['clearTimeout'];

  constructor(
    repository: GitHubStateRepository,
    flush: () => Promise<unknown>,
    options: GitHubStateBatcherOptions = {},
  ) {
    this.repository = repository;
    this.flush = flush;
    this.delayMs = Math.max(MIN_GITHUB_SYNC_DELAY_MS, options.delayMs ?? MIN_GITHUB_SYNC_DELAY_MS);
    this.scheduleTimer = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
    this.cancelTimer = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
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

  schedule(): void {
    if (!this.repository.getPendingCount()) return;
    this.cancel();
    this.timer = this.scheduleTimer!(() => {
      this.timer = undefined;
      // The UI-facing flush callback reports failures while the durable queue
      // remains available for the next retry. Avoid an unhandled rejection in
      // the timer task.
      void this.flush().catch(() => undefined);
    }, this.delayMs);
  }

  cancel(): void {
    if (this.timer === undefined) return;
    this.cancelTimer!(this.timer);
    this.timer = undefined;
  }

  dispose(): void {
    this.cancel();
  }
}
