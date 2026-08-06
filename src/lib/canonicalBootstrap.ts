import type { AuthoritativeGameEnvelope } from "../domain/commands";
import type { CanonicalBootstrapReason } from "../domain/bootstrapPolicy";
import { callGameApi } from "./supabase";

export async function requestCanonicalBootstrap(
  reason: CanonicalBootstrapReason,
): Promise<AuthoritativeGameEnvelope> {
  const envelope = await callGameApi<AuthoritativeGameEnvelope>("/bootstrap", { method: "POST" });
  if ((import.meta.env.DEV || import.meta.env.MODE === "alpha") && envelope.bootstrapTiming) {
    console.info("Canonical bootstrap server timing", { reason, ...envelope.bootstrapTiming });
  }
  return envelope;
}

export const canonicalBootstrapOperationKey = (userId: string, epoch: number) =>
  `canonical-bootstrap:${userId}:${epoch}`;
