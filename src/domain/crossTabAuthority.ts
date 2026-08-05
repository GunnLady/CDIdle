import { isCanonicalGameState, type CanonicalGameState } from "../../shared/contracts/authoritative";

export const AUTHORITY_CHANNEL_PREFIX = "cdidle:authority";

export interface CrossTabAuthoritySnapshot {
  revision: number;
  state: CanonicalGameState;
  serverTime: string;
  lastProcessedAt: string;
}

export interface CrossTabAuthoritySnapshotMessage {
  type: "canonical-state-updated";
  sourceId: string;
  snapshot: CrossTabAuthoritySnapshot;
}

export interface CrossTabAccountDeletedMessage {
  type: "account-deleted";
  sourceId: string;
}

export type CrossTabAuthorityMessage = CrossTabAuthoritySnapshotMessage | CrossTabAccountDeletedMessage;

export interface CrossTabAuthorityChannel {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: unknown): void;
  close(): void;
}

export interface CrossTabAuthorityBridge {
  publish(snapshot: CrossTabAuthoritySnapshot): void;
  publishAccountDeleted(): void;
  close(): void;
}

export function authorityChannelName(userId: string): string {
  return `${AUTHORITY_CHANNEL_PREFIX}:${userId}`;
}

export function createCrossTabAuthorityMessage(
  sourceId: string,
  snapshot: CrossTabAuthoritySnapshot,
): CrossTabAuthorityMessage {
  return { type: "canonical-state-updated", sourceId, snapshot };
}

export function createCrossTabAccountDeletedMessage(sourceId: string): CrossTabAccountDeletedMessage {
  return { type: "account-deleted", sourceId };
}

export function parseCrossTabAuthorityMessage(value: unknown): CrossTabAuthorityMessage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CrossTabAuthorityMessage>;
  if (typeof candidate.sourceId !== "string" || !candidate.sourceId) return null;
  if (candidate.type === "account-deleted") return candidate as CrossTabAccountDeletedMessage;
  if (candidate.type !== "canonical-state-updated") return null;
  const snapshotCandidate = candidate as Partial<CrossTabAuthoritySnapshotMessage>;
  const snapshot = snapshotCandidate.snapshot as Partial<CrossTabAuthoritySnapshot> | undefined;
  if (!snapshot || typeof snapshot !== "object") return null;
  if (!Number.isInteger(snapshot.revision) || Number(snapshot.revision) < 0) return null;
  if (!isCanonicalGameState(snapshot.state)) return null;
  if (typeof snapshot.serverTime !== "string" || !snapshot.serverTime) return null;
  if (typeof snapshot.lastProcessedAt !== "string" || !snapshot.lastProcessedAt) return null;
  return snapshotCandidate as CrossTabAuthoritySnapshotMessage;
}

export function openCrossTabAuthorityBridge(options: {
  userId: string;
  sourceId: string;
  currentRevision: () => number;
  onSnapshot: (snapshot: CrossTabAuthoritySnapshot) => void;
  onAccountDeleted?: () => void;
  channelFactory?: (name: string) => CrossTabAuthorityChannel;
}): CrossTabAuthorityBridge {
  const channel = (options.channelFactory ?? ((name) => new BroadcastChannel(name)))(
    authorityChannelName(options.userId),
  );
  let active = true;
  channel.onmessage = (event) => {
    if (!active) return;
    const message = parseCrossTabAuthorityMessage(event.data);
    if (!message || message.sourceId === options.sourceId) return;
    if (message.type === "account-deleted") {
      options.onAccountDeleted?.();
      return;
    }
    if (message.snapshot.revision <= options.currentRevision()) return;
    options.onSnapshot(message.snapshot);
  };
  return {
    publish(snapshot) {
      if (active) channel.postMessage(createCrossTabAuthorityMessage(options.sourceId, snapshot));
    },
    publishAccountDeleted() {
      if (active) channel.postMessage(createCrossTabAccountDeletedMessage(options.sourceId));
    },
    close() {
      active = false;
      channel.onmessage = null;
      channel.close();
    },
  };
}
