export type CanonicalOperationKind = "user" | "background";

export type CanonicalOperationMetrics = {
  kind: CanonicalOperationKind;
  queueWaitMs: number;
  networkMs: number;
  operationMs: number;
};

export type CanonicalOperationContext = {
  measureNetwork<T>(operation: () => Promise<T>): Promise<T>;
};

type PendingOperation<T> = {
  kind: CanonicalOperationKind;
  enqueuedAt: number;
  run: (context: CanonicalOperationContext) => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

type CanonicalOperationQueueOptions = {
  now?: () => number;
  schedule?: (callback: () => void) => void;
  onMetrics?: (metrics: CanonicalOperationMetrics) => void;
};

export class CanonicalOperationQueue {
  private readonly userOperations: PendingOperation<unknown>[] = [];
  private readonly backgroundOperations: PendingOperation<unknown>[] = [];
  private readonly idleWaiters = new Set<() => void>();
  private readonly now: () => number;
  private readonly schedule: (callback: () => void) => void;
  private readonly onMetrics?: (metrics: CanonicalOperationMetrics) => void;
  private running = false;
  private drainScheduled = false;

  constructor(options: CanonicalOperationQueueOptions = {}) {
    this.now = options.now ?? (() => globalThis.performance?.now() ?? Date.now());
    this.schedule = options.schedule ?? ((callback) => queueMicrotask(callback));
    this.onMetrics = options.onMetrics;
  }

  get isBusy(): boolean {
    return this.running || this.userOperations.length > 0 || this.backgroundOperations.length > 0;
  }

  enqueueUser<T>(run: (context: CanonicalOperationContext) => Promise<T>): Promise<T> {
    return this.enqueue("user", run);
  }

  enqueueBackground<T>(run: (context: CanonicalOperationContext) => Promise<T>): Promise<T> {
    return this.enqueue("background", run);
  }

  tryEnqueueBackground<T>(run: (context: CanonicalOperationContext) => Promise<T>): Promise<T> | null {
    if (this.isBusy) return null;
    return this.enqueueBackground(run);
  }

  whenIdle(): Promise<void> {
    if (!this.isBusy) return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.add(resolve));
  }

  private enqueue<T>(
    kind: CanonicalOperationKind,
    run: (context: CanonicalOperationContext) => Promise<T>,
  ): Promise<T> {
    const promise = new Promise<T>((resolve, reject) => {
      const operation: PendingOperation<T> = {
        kind,
        enqueuedAt: this.now(),
        run,
        resolve,
        reject,
      };
      const queue = kind === "user" ? this.userOperations : this.backgroundOperations;
      queue.push(operation as PendingOperation<unknown>);
    });
    this.scheduleDrain();
    return promise;
  }

  private scheduleDrain(): void {
    if (this.running || this.drainScheduled) return;
    this.drainScheduled = true;
    this.schedule(() => {
      this.drainScheduled = false;
      void this.drain();
    });
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    const operation = this.userOperations.shift() ?? this.backgroundOperations.shift();
    if (!operation) {
      this.resolveIdleWaiters();
      return;
    }
    this.running = true;
    const startedAt = this.now();
    let networkMs = 0;
    const context: CanonicalOperationContext = {
      measureNetwork: async <T>(networkOperation: () => Promise<T>) => {
        const networkStartedAt = this.now();
        try {
          return await networkOperation();
        } finally {
          networkMs += Math.max(0, this.now() - networkStartedAt);
        }
      },
    };
    try {
      operation.resolve(await operation.run(context));
    } catch (error) {
      operation.reject(error);
    } finally {
      const finishedAt = this.now();
      this.running = false;
      try {
        this.onMetrics?.({
          kind: operation.kind,
          queueWaitMs: Math.max(0, startedAt - operation.enqueuedAt),
          networkMs,
          operationMs: Math.max(0, finishedAt - startedAt),
        });
      } catch {
        // Observability must never block canonical work.
      }
      if (this.isBusy) this.scheduleDrain();
      else this.resolveIdleWaiters();
    }
  }

  private resolveIdleWaiters(): void {
    for (const resolve of this.idleWaiters) resolve();
    this.idleWaiters.clear();
  }
}

export function runInteractiveCanonicalOperation<T>(
  queue: CanonicalOperationQueue,
  run: (context: CanonicalOperationContext) => Promise<T>,
  onPendingChange: (pending: boolean) => void,
): Promise<T> {
  onPendingChange(true);
  return queue.enqueueUser(run).finally(() => onPendingChange(false));
}
