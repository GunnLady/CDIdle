import type { OptimisticGameCommand } from "../domain/optimisticStateProjection";
import type { AuthoritativeDispatchOptions } from "./authoritativeCommandDispatch";

export type OptimisticDispatch = (
  command: OptimisticGameCommand,
  options: AuthoritativeDispatchOptions,
) => Promise<boolean>;

export async function sendOptimisticCommandWithConflictRetry(
  command: OptimisticGameCommand,
  acknowledge: () => void,
  dispatch: OptimisticDispatch,
): Promise<boolean> {
  let conflictResolved = false;
  const options: AuthoritativeDispatchOptions = {
    interactive: false,
    silentConflict: true,
    silentSuccess: true,
    beforeApplyAuthoritativeState: acknowledge,
    onConflictResolved: () => { conflictResolved = true; },
  };
  const firstAttempt = await dispatch(command, options);
  if (firstAttempt || !conflictResolved) return firstAttempt;
  return dispatch(command, { ...options, onConflictResolved: undefined });
}
