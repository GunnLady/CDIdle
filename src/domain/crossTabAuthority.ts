export const AUTHORITY_CHANNEL_PREFIX = "cdidle:authority";

export interface CrossTabAuthoritySnapshot {
  revision: number;
  state: Record<string, unknown>;
  serverTime: string;
  lastProcessedAt: string;
}

export interface CrossTabAuthorityMessage {
  type: "canonical-state-updated";
  sourceId: string;
  snapshot: CrossTabAuthoritySnapshot;
}

export interface CrossTabAuthorityChannel {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: unknown): void;
  close(): void;
}

export interface CrossTabAuthorityBridge {
  publish(snapshot: CrossTabAuthoritySnapshot): void;
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

export function parseCrossTabAuthorityMessage(value: unknown): CrossTabAuthorityMessage | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CrossTabAuthorityMessage>;
  if (candidate.type !== "canonical-state-updated") return null;
  if (typeof candidate.sourceId !== "string" || !candidate.sourceId) return null;
  const snapshot = candidate.snapshot as Partial<CrossTabAuthoritySnapshot> | undefined;
  if (!snapshot || typeof snapshot !== "object") return null;
  if (!Number.isInteger(snapshot.revision) || Number(snapshot.revision) < 0) return null;
  if (!snapshot.state || typeof snapshot.state !== "object" || Array.isArray(snapshot.state)) return null;
  if (typeof snapshot.serverTime !== "string" || !snapshot.serverTime) return null;
  if (typeof snapshot.lastProcessedAt !== "string" || !snapshot.lastProcessedAt) return null;
  return candidate as CrossTabAuthorityMessage;
}

export function openCrossTabAuthorityBridge(options: {
  userId: string;
  sourceId: string;
  currentRevision: () => number;
  onSnapshot: (snapshot: CrossTabAuthoritySnapshot) => void;
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
    if (message.snapshot.revision <= options.currentRevision()) return;
    options.onSnapshot(message.snapshot);
  };
  return {
    publish(snapshot) {
      if (active) channel.postMessage(createCrossTabAuthorityMessage(options.sourceId, snapshot));
    },
    close() {
      active = false;
      channel.onmessage = null;
      channel.close();
    },
  };
}
