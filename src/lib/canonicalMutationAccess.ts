export function canMutateCanonicalState(options: {
  online: boolean;
  authoritativeReady: boolean;
  automationLeader: boolean;
}): boolean {
  return options.online && options.authoritativeReady && options.automationLeader;
}

export function canUseAccountDangerActions(options: {
  browserOnline: boolean;
  transportOnline: boolean;
  authoritativeReady: boolean;
  automationLeader: boolean;
  canonicalStateFailed: boolean;
}): boolean {
  if (!options.browserOnline || !options.authoritativeReady) return false;
  if (options.canonicalStateFailed) return true;
  return options.transportOnline && options.automationLeader;
}
