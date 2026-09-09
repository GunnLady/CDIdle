import type { CanonicalGameState } from "../contracts/authoritative.ts";

export const DUNGEON_PARTY_LOCK_CODE = "EXPEDITION_PARTY_LOCKED" as const;

export type DungeonHeroMutation =
  | "join_party"
  | "leave_party"
  | "equip"
  | "unequip"
  | "dismiss"
  | "choose_vocation";

export type DungeonHeroMutationDecision =
  | { allowed: true }
  | { allowed: false; code: typeof DUNGEON_PARTY_LOCK_CODE };

export function isDungeonSegmentMember(
  state: Pick<CanonicalGameState, "dungeonProgress">,
  heroId: string,
): boolean {
  const expedition = state.dungeonProgress.expedition;
  return expedition.phase !== "preparing" && expedition.segmentHeroIds.includes(heroId);
}

export function hasActiveDungeonSegment(
  state: Pick<CanonicalGameState, "dungeonProgress">,
): boolean {
  return state.dungeonProgress.expedition.phase !== "preparing";
}

export function isDungeonSegmentKnockedOut(
  state: Pick<CanonicalGameState, "dungeonProgress">,
  heroId: string,
): boolean {
  return isDungeonSegmentMember(state, heroId)
    && state.dungeonProgress.expedition.knockedOutHeroIds.includes(heroId);
}

export function decideDungeonHeroMutation(
  state: Pick<CanonicalGameState, "dungeonProgress">,
  heroId: string,
  mutation: DungeonHeroMutation,
): DungeonHeroMutationDecision {
  if (isDungeonSegmentMember(state, heroId)) {
    return { allowed: false, code: DUNGEON_PARTY_LOCK_CODE };
  }
  if (mutation === "join_party" && hasActiveDungeonSegment(state)) {
    return { allowed: false, code: DUNGEON_PARTY_LOCK_CODE };
  }
  return { allowed: true };
}
