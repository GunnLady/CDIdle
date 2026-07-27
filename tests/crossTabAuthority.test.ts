import { describe, expect, it, vi } from "vitest";
import {
  authorityChannelName,
  createCrossTabAccountDeletedMessage,
  createCrossTabAuthorityMessage,
  openCrossTabAuthorityBridge,
  parseCrossTabAuthorityMessage,
  type CrossTabAuthorityChannel,
  type CrossTabAuthoritySnapshot,
} from "../src/domain/crossTabAuthority";

const snapshot: CrossTabAuthoritySnapshot = {
  revision: 12,
  state: { gold: 42 },
  serverTime: "2026-07-27T18:00:00.000Z",
  lastProcessedAt: "2026-07-27T17:59:59.000Z",
};

function fakeChannel() {
  return {
    onmessage: null,
    postMessage: vi.fn(),
    close: vi.fn(),
  } satisfies CrossTabAuthorityChannel;
}

describe("cross-tab authoritative synchronization", () => {
  it("scopes the channel to the authenticated user", () => {
    expect(authorityChannelName("user-42")).toBe("cdidle:authority:user-42");
  });

  it("creates and parses an authoritative snapshot notification", () => {
    const message = createCrossTabAuthorityMessage("tab-a", snapshot);
    expect(parseCrossTabAuthorityMessage(message)).toEqual(message);
  });

  it("creates and parses a targeted account deletion notification", () => {
    const message = createCrossTabAccountDeletedMessage("tab-a");
    expect(parseCrossTabAuthorityMessage(message)).toEqual(message);
  });

  it.each([
    null,
    {},
    { type: "other", sourceId: "tab-b", snapshot },
    { type: "canonical-state-updated", sourceId: "", snapshot },
    { type: "canonical-state-updated", sourceId: "tab-b", snapshot: { ...snapshot, revision: -1 } },
    { type: "canonical-state-updated", sourceId: "tab-b", snapshot: { ...snapshot, state: null } },
    { type: "canonical-state-updated", sourceId: "tab-b", snapshot: { ...snapshot, serverTime: "" } },
  ])("rejects invalid notifications", (message) => {
    expect(parseCrossTabAuthorityMessage(message)).toBeNull();
  });

  it("publishes the exact authoritative snapshot", () => {
    const channel = fakeChannel();
    const bridge = openCrossTabAuthorityBridge({
      userId: "user-42",
      sourceId: "tab-a",
      currentRevision: () => 11,
      onSnapshot: vi.fn(),
      channelFactory: () => channel,
    });
    bridge.publish(snapshot);
    expect(channel.postMessage).toHaveBeenCalledWith(createCrossTabAuthorityMessage("tab-a", snapshot));
  });

  it("applies a newer snapshot received from another tab", () => {
    const channel = fakeChannel();
    const onSnapshot = vi.fn();
    openCrossTabAuthorityBridge({
      userId: "user-42",
      sourceId: "tab-a",
      currentRevision: () => 11,
      onSnapshot,
      channelFactory: () => channel,
    });
    channel.onmessage?.({ data: createCrossTabAuthorityMessage("tab-b", snapshot) } as MessageEvent);
    expect(onSnapshot).toHaveBeenCalledWith(snapshot);
  });

  it("notifies another tab that the authenticated account was deleted", () => {
    const channel = fakeChannel();
    const onAccountDeleted = vi.fn();
    const bridge = openCrossTabAuthorityBridge({
      userId: "user-42",
      sourceId: "tab-a",
      currentRevision: () => 11,
      onSnapshot: vi.fn(),
      onAccountDeleted,
      channelFactory: () => channel,
    });
    bridge.publishAccountDeleted();
    expect(channel.postMessage).toHaveBeenCalledWith(createCrossTabAccountDeletedMessage("tab-a"));
    channel.onmessage?.({ data: createCrossTabAccountDeletedMessage("tab-b") } as MessageEvent);
    expect(onAccountDeleted).toHaveBeenCalledOnce();
  });

  it("ignores own, stale and post-close notifications", () => {
    const channel = fakeChannel();
    const onSnapshot = vi.fn();
    const bridge = openCrossTabAuthorityBridge({
      userId: "user-42",
      sourceId: "tab-a",
      currentRevision: () => 12,
      onSnapshot,
      channelFactory: () => channel,
    });
    channel.onmessage?.({ data: createCrossTabAuthorityMessage("tab-a", { ...snapshot, revision: 13 }) } as MessageEvent);
    channel.onmessage?.({ data: createCrossTabAuthorityMessage("tab-b", snapshot) } as MessageEvent);
    bridge.close();
    expect(onSnapshot).not.toHaveBeenCalled();
    expect(channel.close).toHaveBeenCalledOnce();
  });
});
