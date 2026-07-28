import { vi } from "vitest";

export function createIndexedDbMock(options: { abortWrites?: boolean } = {}) {
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
