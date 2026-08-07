import type { AuthoritativeCommandSuccess } from "../domain/commands";

export interface AuthoritativeDispatchOptions {
  interactive?: boolean;
  silentConflict?: boolean;
  silentSuccess?: boolean;
  beforeApplyAuthoritativeState?: () => void;
  onConflictResolved?: () => void;
}

export type AuthoritativeSuccessOutcome = "committed" | "replayed";

export async function applyAuthoritativeCommandSuccess(
  result: Pick<AuthoritativeCommandSuccess, "replayed">,
  beforeApply: (() => void) | undefined,
  apply: () => Promise<void>,
): Promise<AuthoritativeSuccessOutcome> {
  beforeApply?.();
  await apply();
  return result.replayed ? "replayed" : "committed";
}

export interface AuthoritativeFailurePresentationInput {
  isBusinessRefusal: boolean;
  message?: string;
}

export function getAuthoritativeFailurePresentation(
  failure: AuthoritativeFailurePresentationInput,
): {
  logMessage: string;
  notice: string;
} {
  const message = failure.message ?? "Mutation autoritaire indisponible";
  return {
    logMessage: `❌ ${message}.`,
    notice: failure.isBusinessRefusal
      ? `Action refusée : ${message}. L’état précédent a été restauré.`
      : "Service indisponible : l’action a été annulée et le dernier état confirmé a été restauré.",
  };
}
