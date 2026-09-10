export interface BoundedAsyncAssetCache<T> {
  readonly limit: number;
  readonly size: number;
  clear(): void;
  load(key: string, loader: () => Promise<T>): Promise<T>;
}

export function createBoundedAsyncAssetCache<T>(limit: number): BoundedAsyncAssetCache<T> {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("VISUAL_ASSET_CACHE_LIMIT_INVALID");
  const entries = new Map<string, Promise<T>>();

  return {
    limit,
    get size() {
      return entries.size;
    },
    clear() {
      entries.clear();
    },
    load(key, loader) {
      const cached = entries.get(key);
      if (cached) {
        entries.delete(key);
        entries.set(key, cached);
        return cached;
      }

      const loading = Promise.resolve().then(loader);
      entries.set(key, loading);
      while (entries.size > limit) {
        const oldestKey = entries.keys().next().value;
        if (oldestKey === undefined) break;
        entries.delete(oldestKey);
      }
      void loading.catch(() => {
        if (entries.get(key) === loading) entries.delete(key);
      });
      return loading;
    },
  };
}
