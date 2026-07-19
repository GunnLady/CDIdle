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
    request.onsuccess = () => resolve((request.result as CachedGameState | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("CACHE_READ_FAILED"));
    database.close();
  });
}

export async function writeGameCache(userId: string, state: CachedGameState): Promise<void> {
  if (typeof indexedDB === "undefined" || !userId) return;
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(state, userId);
    request.onsuccess = () => { database.close(); resolve(); };
    request.onerror = () => { database.close(); reject(request.error ?? new Error("CACHE_WRITE_FAILED")); };
  });
}

export async function purgeLegacyGameCache(): Promise<void> {
  if (typeof localStorage !== "undefined") localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const gameCacheConstants = { DATABASE_NAME, STORE_NAME, LEGACY_STORAGE_KEY } as const;
