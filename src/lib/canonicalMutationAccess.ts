export function canMutateCanonicalState(options: {
  online: boolean;
  authoritativeReady: boolean;
  automationLeader: boolean;
}): boolean {
  return options.online && options.authoritativeReady && options.automationLeader;
}
