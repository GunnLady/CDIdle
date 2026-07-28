export type CachedGameState = Record<string, unknown>;

const DATABASE_NAME = "cdidle-cache";
const STORE_NAME = "game-snapshots";
const DATABASE_VERSION = 1;
const CACHE_OPERATION_TIMEOUT_MS = 2_000;
const LEGACY_STORAGE_KEY = "colonie_donjon_idle_save_v3";

function timeoutError(code: string): DOMException {
  return new DOMException(code, "TimeoutError");
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    const timeout = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(timeoutError("CACHE_OPEN_TIMEOUT"));
    }, CACHE_OPERATION_TIMEOUT_MS);
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      reject(error);
    };
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      globalThis.clearTimeout(timeout);
      resolve(request.result);
    };
    request.onerror = () => fail(request.error ?? new Error("CACHE_OPEN_FAILED"));
    request.onblocked = () => fail(new Error("CACHE_OPEN_BLOCKED"));
  });
}

function waitForTransaction<T>(
  database: IDBDatabase,
  transaction: IDBTransaction,
  result: () => T,
  timeoutCode: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (operation: () => void) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      database.close();
      operation();
    };
    const timeout = globalThis.setTimeout(() => {
      if (settled) return;
      try {
        transaction.abort();
      } catch {
        // A completed or browser-owned transaction cannot always be aborted.
      }
      finish(() => reject(timeoutError(timeoutCode)));
    }, CACHE_OPERATION_TIMEOUT_MS);
    transaction.oncomplete = () => finish(() => resolve(result()));
    transaction.onabort = () => finish(() => reject(transaction.error ?? new Error("CACHE_TRANSACTION_ABORTED")));
    transaction.onerror = () => finish(() => reject(transaction.error ?? new Error("CACHE_TRANSACTION_FAILED")));
  });
}

export async function readGameCache(userId: string): Promise<CachedGameState | null> {
  if (typeof indexedDB === "undefined" || !userId) return null;
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).get(userId);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (operation: () => void) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      database.close();
      operation();
    };
    const timeout = globalThis.setTimeout(() => {
      try {
        transaction.abort();
      } catch {
        // A completed or browser-owned transaction cannot always be aborted.
      }
      finish(() => reject(timeoutError("CACHE_READ_TIMEOUT")));
    }, CACHE_OPERATION_TIMEOUT_MS);
    request.onsuccess = () => finish(() => resolve((request.result as CachedGameState | undefined) ?? null));
    request.onerror = () => finish(() => reject(request.error ?? new Error("CACHE_READ_FAILED")));
  });
}

export async function writeGameCache(userId: string, state: CachedGameState): Promise<void> {
  if (typeof indexedDB === "undefined" || !userId) return;
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const existingRequest = store.get(userId);
  existingRequest.onsuccess = () => {
    const existing = existingRequest.result as CachedGameState | undefined;
    const existingRevision = Number(existing?.revision);
    const incomingRevision = Number(state.revision);
    const existingIsCanonical = Number.isInteger(existingRevision) && existingRevision >= 0;
    const incomingIsCanonical = Number.isInteger(incomingRevision) && incomingRevision >= 0;
    if (existingIsCanonical && (!incomingIsCanonical || incomingRevision < existingRevision)) return;
    store.put(state, userId);
  };
  return waitForTransaction(database, transaction, () => undefined, "CACHE_WRITE_TIMEOUT");
}

export async function deleteGameCache(userId: string): Promise<void> {
  if (typeof indexedDB === "undefined" || !userId) return;
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(userId);
  return waitForTransaction(database, transaction, () => undefined, "CACHE_DELETE_TIMEOUT");
}

export async function purgeLegacyGameCache(): Promise<void> {
  if (typeof localStorage !== "undefined") localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const gameCacheConstants = {
  DATABASE_NAME,
  STORE_NAME,
  CACHE_OPERATION_TIMEOUT_MS,
  LEGACY_STORAGE_KEY,
} as const;
