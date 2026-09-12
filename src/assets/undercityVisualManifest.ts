import {
  UNDERCITY_SEWERS_BACKGROUND_VISUAL,
  UNDERCITY_SEWERS_ENEMY_VISUALS,
} from "./undercitySewerVisualManifest.ts";
import {
  UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL,
  UNDERCITY_SMUGGLERS_ENEMY_VISUALS,
} from "./undercitySmugglersVisualManifest.ts";
import {
  UNDERCITY_CISTERNS_BACKGROUND_VISUAL,
  UNDERCITY_CISTERNS_ENEMY_VISUALS,
} from "./undercityCisternsVisualManifest.ts";
import {
  UNDERCITY_BASTION_BACKGROUND_VISUAL,
  UNDERCITY_BASTION_ENEMY_VISUALS,
} from "./undercityBastionVisualManifest.ts";
import {
  UNDERCITY_COURT_BACKGROUND_VISUAL,
  UNDERCITY_COURT_ENEMY_VISUALS,
  UNDERCITY_COURT_ENEMY_VARIANT_VISUALS,
} from "./undercityCourtVisualManifest.ts";

export {
  UNDERCITY_SEWERS_BACKGROUND_VISUAL,
  UNDERCITY_SEWERS_ENEMY_VISUALS,
  UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL,
  UNDERCITY_SMUGGLERS_ENEMY_VISUALS,
  UNDERCITY_CISTERNS_BACKGROUND_VISUAL,
  UNDERCITY_CISTERNS_ENEMY_VISUALS,
  UNDERCITY_BASTION_BACKGROUND_VISUAL,
  UNDERCITY_BASTION_ENEMY_VISUALS,
  UNDERCITY_COURT_BACKGROUND_VISUAL,
  UNDERCITY_COURT_ENEMY_VISUALS,
  UNDERCITY_COURT_ENEMY_VARIANT_VISUALS,
};

export const UNDERCITY_ZONE_VISUAL_PACKS = [
  {
    zoneId: "sewers",
    directory: "sewers",
    background: UNDERCITY_SEWERS_BACKGROUND_VISUAL,
    enemies: UNDERCITY_SEWERS_ENEMY_VISUALS,
    variants: [],
  },
  {
    zoneId: "smugglers",
    directory: "smugglers",
    background: UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL,
    enemies: UNDERCITY_SMUGGLERS_ENEMY_VISUALS,
    variants: [],
  },
  {
    zoneId: "cisterns",
    directory: "cisterns",
    background: UNDERCITY_CISTERNS_BACKGROUND_VISUAL,
    enemies: UNDERCITY_CISTERNS_ENEMY_VISUALS,
    variants: [],
  },
  {
    zoneId: "bastion",
    directory: "bastion",
    background: UNDERCITY_BASTION_BACKGROUND_VISUAL,
    enemies: UNDERCITY_BASTION_ENEMY_VISUALS,
    variants: [],
  },
  {
    zoneId: "court",
    directory: "court",
    background: UNDERCITY_COURT_BACKGROUND_VISUAL,
    enemies: UNDERCITY_COURT_ENEMY_VISUALS,
    variants: UNDERCITY_COURT_ENEMY_VARIANT_VISUALS,
  },
] as const;

export function getUndercityBackgroundVisualKey(zoneId: string): string {
  return `undercity:${zoneId}:background`;
}

export function getUndercityEnemyVisualKey(blueprintId: string, memberKey: string, variantKey?: string | null): string {
  return `undercity:${blueprintId}:${memberKey}${variantKey ? `:${variantKey}` : ""}`;
}
