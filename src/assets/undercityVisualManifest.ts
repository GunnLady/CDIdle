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

export {
  UNDERCITY_SEWERS_BACKGROUND_VISUAL,
  UNDERCITY_SEWERS_ENEMY_VISUALS,
  UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL,
  UNDERCITY_SMUGGLERS_ENEMY_VISUALS,
  UNDERCITY_CISTERNS_BACKGROUND_VISUAL,
  UNDERCITY_CISTERNS_ENEMY_VISUALS,
  UNDERCITY_BASTION_BACKGROUND_VISUAL,
  UNDERCITY_BASTION_ENEMY_VISUALS,
};

export const UNDERCITY_ZONE_VISUAL_PACKS = [
  {
    zoneId: "sewers",
    directory: "sewers",
    background: UNDERCITY_SEWERS_BACKGROUND_VISUAL,
    enemies: UNDERCITY_SEWERS_ENEMY_VISUALS,
  },
  {
    zoneId: "smugglers",
    directory: "smugglers",
    background: UNDERCITY_SMUGGLERS_BACKGROUND_VISUAL,
    enemies: UNDERCITY_SMUGGLERS_ENEMY_VISUALS,
  },
  {
    zoneId: "cisterns",
    directory: "cisterns",
    background: UNDERCITY_CISTERNS_BACKGROUND_VISUAL,
    enemies: UNDERCITY_CISTERNS_ENEMY_VISUALS,
  },
  {
    zoneId: "bastion",
    directory: "bastion",
    background: UNDERCITY_BASTION_BACKGROUND_VISUAL,
    enemies: UNDERCITY_BASTION_ENEMY_VISUALS,
  },
] as const;

export function getUndercityBackgroundVisualKey(zoneId: string): string {
  return `undercity:${zoneId}:background`;
}

export function getUndercityEnemyVisualKey(blueprintId: string, memberKey: string): string {
  return `undercity:${blueprintId}:${memberKey}`;
}
