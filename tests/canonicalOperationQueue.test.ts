import { describe, expect, it, vi } from "vitest";
import {
  CanonicalOperationQueue,
  runInteractiveCanonicalOperation,
} from "../src/lib/canonicalOperationQueue";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("CanonicalOperationQueue", () => {
  it("serializes operations and prioritizes a user command over pending background work", async () => {
    const scheduled: Array<() => void> = [];
    const order: string[] = [];
    const queue = new CanonicalOperationQueue({ schedule: (callback) => scheduled.push(callback) });

    const background = queue.enqueueBackground(async () => { order.push("background"); });
    const user = queue.enqueueUser(async () => { order.push("user"); });
    scheduled.shift()?.();
    await user;
    expect(order).toEqual(["user"]);
    scheduled.shift()?.();
    await background;

    expect(order).toEqual(["user", "background"]);
  });

  it("never interrupts an operation that already started", async () => {
    const release = deferred<void>();
    const order: string[] = [];
    const queue = new CanonicalOperationQueue();
    const background = queue.enqueueBackground(async () => {
      order.push("background:start");
      await release.promise;
      order.push("background:end");
    });
    await Promise.resolve();
    const user = queue.enqueueUser(async () => { order.push("user"); });
    release.resolve();
    await Promise.all([background, user]);

    expect(order).toEqual(["background:start", "background:end", "user"]);
  });

  it("refuses a periodic refresh while any canonical work is queued or running", async () => {
    const release = deferred<void>();
    const queue = new CanonicalOperationQueue();
    const user = queue.enqueueUser(() => release.promise);

    expect(queue.tryEnqueueBackground(async () => undefined)).toBeNull();
    release.resolve();
    await user;
    await queue.whenIdle();
    expect(queue.tryEnqueueBackground(async () => "accepted")).not.toBeNull();
  });

  it("coalesces immigration and recovery refreshes sharing the same authority key", async () => {
    const release = deferred<void>();
    const run = vi.fn(() => release.promise);
    const queue = new CanonicalOperationQueue();

    const immediate = queue.enqueueCoalescedBackground("town-authority", run, "bootstrap:immigration");
    const periodic = queue.tryEnqueueCoalescedBackground("town-authority", run, "bootstrap:recovery");

    expect(periodic).toBe(immediate);
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);
    release.resolve();
    await immediate;
  });

  it("lets an interactive bootstrap reuse a background bootstrap for the same user", async () => {
    const release = deferred<void>();
    const run = vi.fn(() => release.promise);
    const queue = new CanonicalOperationQueue();
    const reconnect = queue.enqueueCoalescedBackground(
      "canonical-bootstrap:user-1",
      run,
      "bootstrap:reconnect",
    );
    const manual = queue.enqueueCoalescedUser(
      "canonical-bootstrap:user-1",
      run,
      "bootstrap:manual",
    );

    expect(manual).toBe(reconnect);
    await Promise.resolve();
    expect(run).toHaveBeenCalledTimes(1);
    release.resolve();
    await manual;
  });

  it("reports queue wait and network time separately after failures", async () => {
    let now = 0;
    const onMetrics = vi.fn();
    const queue = new CanonicalOperationQueue({ now: () => now, onMetrics });
    const operation = queue.enqueueUser(async ({ measureNetwork, measureApplication }) => {
      now = 5;
      await measureNetwork(async () => {
        now = 17;
      });
      await measureApplication(async () => {
        now = 19;
        throw new Error("application failed");
      });
    }, "bootstrap:initial");
    now = 3;
    await expect(operation).rejects.toThrow("application failed");

    expect(onMetrics).toHaveBeenCalledWith({
      kind: "user",
      label: "bootstrap:initial",
      queueWaitMs: 3,
      networkMs: 12,
      applicationMs: 2,
      operationMs: 16,
    });
    await expect(queue.whenIdle()).resolves.toBeUndefined();
  });

  it("continues after an operation and its metrics callback fail", async () => {
    const queue = new CanonicalOperationQueue({ onMetrics: () => { throw new Error("metrics failed"); } });
    const failed = queue.enqueueUser(async () => { throw new Error("operation failed"); });
    const next = queue.enqueueUser(async () => "continued");

    await expect(failed).rejects.toThrow("operation failed");
    await expect(next).resolves.toBe("continued");
  });

  it("sets interactive feedback immediately and releases it after an error", async () => {
    const pendingStates: boolean[] = [];
    const queue = new CanonicalOperationQueue();
    const operation = runInteractiveCanonicalOperation(
      queue,
      async () => { throw new Error("failed"); },
      (pending) => pendingStates.push(pending),
    );

    expect(pendingStates).toEqual([true]);
    await expect(operation).rejects.toThrow("failed");
    expect(pendingStates).toEqual([true, false]);
  });
});
