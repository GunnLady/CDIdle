import { useEffect } from "react";

export function useImmigrationReconciliation(options: {
  isAutomationLeader: boolean;
  hasPendingImmigration: boolean;
  authorityGeneration: number;
  reconcile(authorityGeneration: number): Promise<void> | null;
}): void {
  const {
    isAutomationLeader,
    hasPendingImmigration,
    authorityGeneration,
    reconcile,
  } = options;

  useEffect(() => {
    if (!isAutomationLeader || !hasPendingImmigration) return;
    const operation = reconcile(authorityGeneration);
    if (operation) void operation.catch(() => undefined);
  }, [authorityGeneration, hasPendingImmigration, isAutomationLeader, reconcile]);
}
