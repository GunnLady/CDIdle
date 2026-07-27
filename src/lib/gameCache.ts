export type CachedGameState = Record<string, unknown>;

const DATABASE_NAME = "cdidle-cache";
const STORE_NAME = "game-snapshots";
const DATABASE_VERSION = 1;
const LEGACY_STORAGE_KEY = "colonie_donjon_idle_save_v3";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("CACHE_OPEN_FAILED"));
  });
}

export async function readGameCache(userId: string): Promise<CachedGameState | null> {
  if (typeof indexedDB === "undefined" || !userId) return null;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(userId);
    request.onsuccess = () => {
      database.close();
      resolve((request.result as CachedGameState | undefined) ?? null);
    };
    request.onerror = () => {
      database.close();
      reject(request.error ?? new Error("CACHE_READ_FAILED"));
    };
  });
}

export async function writeGameCache(userId: string, state: CachedGameState): Promise<void> {
  if (typeof indexedDB === "undefined" || !userId) return;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
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
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("CACHE_WRITE_FAILED"));
    };
  });
}

export async function deleteGameCache(userId: string): Promise<void> {
  if (typeof indexedDB === "undefined" || !userId) return;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(userId);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("CACHE_DELETE_FAILED"));
    };
  });
}

export async function purgeLegacyGameCache(): Promise<void> {
  if (typeof localStorage !== "undefined") localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const gameCacheConstants = { DATABASE_NAME, STORE_NAME, LEGACY_STORAGE_KEY } as const;
