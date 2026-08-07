import { describe, expect, it, vi } from "vitest";
import { sendOptimisticCommandWithConflictRetry } from "../src/lib/optimisticCommandDispatch";

const command = { type: "dungeon.auto_explore", enabled: true } as const;

describe("optimistic authoritative dispatch", () => {
  it("acknowledges an accepted optimistic dispatch once", async () => {
    const acknowledge = vi.fn();
    const dispatch = vi.fn(async (_command, options) => {
      options.beforeApplyAuthoritativeState?.();
      return true;
    });

    await expect(sendOptimisticCommandWithConflictRetry(command, acknowledge, dispatch)).resolves.toBe(true);
    expect(dispatch).toHaveBeenCalledOnce();
    expect(acknowledge).toHaveBeenCalledOnce();
  });

  it("retries exactly once after a resolved revision conflict", async () => {
    const acknowledge = vi.fn();
    const dispatch = vi.fn()
      .mockImplementationOnce(async (_command, options) => {
        options.onConflictResolved?.();
        return false;
      })
      .mockImplementationOnce(async (_command, options) => {
        options.beforeApplyAuthoritativeState?.();
        return true;
      });

    await expect(sendOptimisticCommandWithConflictRetry(command, acknowledge, dispatch)).resolves.toBe(true);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[1][1].onConflictResolved).toBeUndefined();
    expect(acknowledge).toHaveBeenCalledOnce();
  });

  it.each(["business refusal", "command in progress", "network failure", "timeout"])(
    "does not retry after %s when no canonical conflict was resolved",
    async () => {
      const dispatch = vi.fn().mockResolvedValue(false);
      await expect(sendOptimisticCommandWithConflictRetry(command, vi.fn(), dispatch)).resolves.toBe(false);
      expect(dispatch).toHaveBeenCalledOnce();
    },
  );

});
