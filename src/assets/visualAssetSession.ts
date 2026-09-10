const sessionCleaners = new Set<() => void>();

export function registerVisualAssetSessionCleaner(cleaner: () => void): () => void {
  sessionCleaners.add(cleaner);
  return () => sessionCleaners.delete(cleaner);
}

export function clearVisualAssetSession(): void {
  for (const cleaner of sessionCleaners) cleaner();
}
