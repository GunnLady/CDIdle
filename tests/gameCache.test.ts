import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteGameCache,
  gameCacheConstants,
  purgeLegacyGameCache,
  readGameCache,
  writeGameCache,
} from "../src/lib/gameCache";

function createIndexedDbMock(options: { abortWrites?: boolean } = {}) {
  const records = new Map<IDBValidKey, unknown>();
  const close = vi.fn();
  const request = (operation: () => unknown, afterSuccess?: () => void) => {
    const result = {} as IDBRequest;
    queueMicrotask(() => {
      try {
        Object.defineProperty(result, "result", { configurable: true, value: operation() });
        result.onsuccess?.(new Event("success") as Event & { target: IDBRequest });
        queueMicrotask(() => afterSuccess?.());
      } catch (error) {
        Object.defineProperty(result, "error", { configurable: true, value: error });
        result.onerror?.(new Event("error") as Event & { target: IDBRequest });
      }
    });
    return result;
  };
  const database = {
    close,
    transaction: (_storeName: string, mode: IDBTransactionMode) => {
      const transaction = {} as IDBTransaction;
      let writeScheduled = false;
      const finishWrite = () => {
        if (options.abortWrites) {
          Object.defineProperty(transaction, "error", {
            configurable: true,
            value: new DOMException("transaction aborted", "AbortError"),
          });
          transaction.onabort?.(new Event("abort") as Event & { target: IDBTransaction });
        } else {
          transaction.oncomplete?.(new Event("complete") as Event & { target: IDBTransaction });
        }
      };
      const store = {
        get: (key: IDBValidKey) => request(
          () => records.get(key),
          () => { if (mode === "readwrite" && !writeScheduled) finishWrite(); },
        ),
        put: (value: unknown, key: IDBValidKey) => {
          writeScheduled = true;
          return request(
            () => options.abortWrites ? key : records.set(key, value),
            finishWrite,
          );
        },
        delete: (key: IDBValidKey) => {
          writeScheduled = true;
          return request(
            () => options.abortWrites ? undefined : records.delete(key),
            finishWrite,
          );
        },
      } as unknown as IDBObjectStore;
      Object.defineProperty(transaction, "mode", { configurable: true, value: mode });
      Object.defineProperty(transaction, "objectStore", {
        configurable: true,
        value: () => store,
      });
      return transaction;
    },
  } as unknown as IDBDatabase;
  const indexedDb = {
    open: () => {
      const result = {} as IDBOpenDBRequest;
      queueMicrotask(() => {
        Object.defineProperty(result, "result", { configurable: true, value: database });
        result.onsuccess?.(new Event("success") as Event & { target: IDBOpenDBRequest });
      });
      return result;
    },
  } as unknown as IDBFactory;
  return { indexedDb, close, records };
}

describe("game cache contract", () => {
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mock = createIndexedDbMock();
    close = mock.close;
    vi.stubGlobal("indexedDB", mock.indexedDb);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("uses a per-user IndexedDB store and purges the legacy localStorage key", async () => {
    localStorage.setItem(gameCacheConstants.LEGACY_STORAGE_KEY, "legacy");
    await purgeLegacyGameCache();
    expect(localStorage.getItem(gameCacheConstants.LEGACY_STORAGE_KEY)).toBeNull();
    expect(gameCacheConstants.STORE_NAME).toBe("game-snapshots");
  });

  it("isolates snapshots by user and replaces only with a newer canonical revision", async () => {
    await writeGameCache("user-a", { cityName: "A", revision: 1 });
    await writeGameCache("user-b", { cityName: "B", revision: 2 });
    await writeGameCache("user-a", { cityName: "Reset", revision: 3 });
    await writeGameCache("user-a", { cityName: "Stale", revision: 2 });

    await expect(readGameCache("user-a")).resolves.toEqual({ cityName: "Reset", revision: 3 });
    await expect(readGameCache("user-b")).resolves.toEqual({ cityName: "B", revision: 2 });
  });

  it("deletes only the targeted user snapshot without allowing resurrection", async () => {
    await writeGameCache("deleted-user", { cityName: "Old kingdom", revision: 42 });
    await writeGameCache("other-user", { cityName: "Other kingdom", revision: 7 });

    await deleteGameCache("deleted-user");

    await expect(readGameCache("deleted-user")).resolves.toBeNull();
    await expect(readGameCache("other-user")).resolves.toEqual({ cityName: "Other kingdom", revision: 7 });
    expect(close).toHaveBeenCalled();
  });

  it("rejects a write whose transaction aborts after the request succeeds", async () => {
    const mock = createIndexedDbMock({ abortWrites: true });
    vi.stubGlobal("indexedDB", mock.indexedDb);

    await expect(writeGameCache("user-a", { revision: 3 })).rejects.toMatchObject({ name: "AbortError" });
    expect(mock.records.has("user-a")).toBe(false);
    expect(mock.close).toHaveBeenCalled();
  });
});
