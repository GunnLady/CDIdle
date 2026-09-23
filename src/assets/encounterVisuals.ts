import { CANONICAL_HERO_CLASSES, type CanonicalHeroClass } from "../../shared/domain/hero-classes";
import { HERO_PORTRAIT_VARIANT_COUNT } from "../../shared/domain/hero-portrait-identity";
import {
  getHeroPortraitCacheKey,
  parseHeroPortraitCacheKey,
  parseHeroPortraitPoseVisualKey,
} from "../domain/heroPortrait";
import {
  clearHeroPortraitAssetSession,
  loadHeroPortraitAsset,
} from "./heroPortraitAssets";
import { getCdi148NoviceCombatIdleUrl } from "./noviceCdi148CombatPoses";
import {
  CDI150_ROGUE_COMBAT_IDLE_FRAME_HEIGHT,
  CDI150_ROGUE_COMBAT_IDLE_VISIBLE_BOTTOM,
  CDI150_ROGUE_NEUTRAL_FRAME_HEIGHT,
  getCdi150RogueCombatIdleScale,
  getCdi150RogueCombatIdleUrl,
} from "./rogueCdi150CombatPoses";
import {
  CDI149_WARRIOR_COMBAT_IDLE_FRAME_HEIGHT,
  CDI149_WARRIOR_COMBAT_IDLE_VISIBLE_BOTTOM,
  CDI149_WARRIOR_NEUTRAL_FRAME_HEIGHT,
  getCdi149WarriorCombatIdleUrl,
  getCdi149WarriorCombatIdlePivotX,
} from "./warriorCdi149CombatPoses";
import { createBoundedAsyncAssetCache } from "./visualAssetCache";
import { registerVisualAssetSessionCleaner } from "./visualAssetSession";
import {
  getUndercityEnemyVisualKey,
  UNDERCITY_ZONE_VISUAL_PACKS,
} from "./undercityVisualManifest";
import restCampUrl from "./images/dungeon/encounters/rest-camp-v2.png";
import restChamberBackgroundUrl from "./images/dungeon/encounters/rest-chamber-background-v1.jpg";
import treasureChestOpenUrl from "./images/dungeon/encounters/treasure-chest-open-v3.png";
import treasureVaultBackgroundUrl from "./images/dungeon/encounters/treasure-vault-background-v2.jpg";
import challengeAmbushUrl from "./images/dungeon/encounters/challenge-ambush-v1.png";
import challengeEnigmaUrl from "./images/dungeon/encounters/challenge-enigma-v1.png";
import challengeNegotiationUrl from "./images/dungeon/encounters/challenge-negotiation-v1.png";
import challengeObstacleUrl from "./images/dungeon/encounters/challenge-obstacle-v1.png";
import challengeRitualUrl from "./images/dungeon/encounters/challenge-ritual-v1.png";
import challengeTrapUrl from "./images/dungeon/encounters/challenge-trap-v1.png";

export const ENCOUNTER_VISUAL_CATALOG_VERSION = 1;
export const ENCOUNTER_VISUAL_CACHE_LIMIT = 16;

const validatedHeroSpriteMetadata: Partial<Record<CanonicalHeroClass, readonly [string, string]>> = {
  Novice: ["136", "Novice"],
  Guerrier: ["137", "Warrior"],
  Voleur: ["138", "Rogue"],
  Archer: ["139", "Archer"],
  Mage: ["140", "Mage"],
  Acolyte: ["141", "Acolyte"],
  "A\u00e8de": ["142", "Aede"],
  Druide: ["143", "Druid"],
  Artificier: ["144", "Artificer"],
  Pugiliste: ["145", "Pugilist"],
};

function undercityAssetUrl(directory: string, file: string): string {
  return `/assets/images/dungeon/undercity/${directory}/${file}`;
}

export const ENCOUNTER_VISUAL_KEYS = {
  sewers: {
    background: "undercity:sewers:background",
    ratPack: {
      a: "undercity:rat-pack:a",
      b: "undercity:rat-pack:b",
      c: "undercity:rat-pack:c",
    },
  },
  smugglers: {
    background: "undercity:smugglers:background",
  },
  effects: {
    physicalImpact: "effect:physical-impact",
    projectile: "effect:projectile",
    magic: "effect:magic",
    healing: "effect:healing",
    support: "effect:support",
  },
  encounters: {
    trap: {
      background: "undercity:challenge-chamber:background",
      prop: "encounter:challenge:trap",
    },
    enigma: {
      background: "undercity:challenge-chamber:background",
      prop: "encounter:challenge:enigma",
    },
    ambush: {
      background: "undercity:challenge-chamber:background",
      prop: "encounter:challenge:ambush",
    },
    ritual: {
      background: "undercity:challenge-chamber:background",
      prop: "encounter:challenge:ritual",
    },
    obstacle: {
      background: "undercity:challenge-chamber:background",
      prop: "encounter:challenge:obstacle",
    },
    negotiation: {
      background: "undercity:challenge-chamber:background",
      prop: "encounter:challenge:negotiation",
    },
    rest: {
      background: "undercity:rest-chamber:background",
      prop: "encounter:rest-camp",
    },
    treasure: {
      background: "undercity:treasure-vault:background",
      prop: "encounter:treasure",
    },
  },
  fallback: {
    actor: "fallback:actor",
    background: "fallback:background",
  },
} as const;

export type EncounterVisualKind = "background" | "enemy" | "hero" | "effect" | "prop";

export interface EncounterVisualDescriptor {
  key: string;
  kind: EncounterVisualKind;
  version: number;
  provenance: string;
  anchor: { x: number; y: number };
  pivotX?: number;
  scale: number;
  fit?: "contain" | "height";
  fallbackGlyph: string;
  fallback: boolean;
  load?: () => Promise<string>;
}

const loadedUrl = (url: string) => () => Promise.resolve(url);

type StaticVisual = readonly [
  key: string,
  kind: EncounterVisualKind,
  provenance: string,
  anchor: { x: number; y: number },
  scale: number,
  fallbackGlyph: string,
  url?: string,
];

const undercityVisuals: StaticVisual[] = UNDERCITY_ZONE_VISUAL_PACKS.flatMap((pack) => [
  [
    pack.background.key,
    "background",
    pack.background.provenance,
    pack.background.anchor,
    pack.background.scale,
    pack.background.fallbackGlyph,
    undercityAssetUrl(pack.directory, pack.background.file),
  ] satisfies StaticVisual,
  ...pack.enemies.map((visual): StaticVisual => [
    getUndercityEnemyVisualKey(visual.blueprintId, visual.memberKey),
    "enemy",
    visual.provenance,
    visual.anchor,
    visual.scale,
    visual.fallbackGlyph,
    undercityAssetUrl(pack.directory, visual.file),
  ]),
  ...pack.variants.map((visual): StaticVisual => [
    getUndercityEnemyVisualKey(visual.blueprintId, visual.memberKey, visual.variantKey),
    "enemy",
    visual.provenance,
    visual.anchor,
    visual.scale,
    visual.fallbackGlyph,
    undercityAssetUrl(pack.directory, visual.file),
  ]),
]);

const staticCatalog: Readonly<Record<string, EncounterVisualDescriptor>> = Object.fromEntries(([
  ...undercityVisuals,
  [ENCOUNTER_VISUAL_KEYS.effects.physicalImpact, "effect", "CDI-097 CSS impact profile", { x: 0.5, y: 0.2 }, 1, "✦"],
  [ENCOUNTER_VISUAL_KEYS.effects.projectile, "effect", "CDI-113 CSS/SVG projectile profile", { x: 0, y: 0.5 }, 1, "➶"],
  [ENCOUNTER_VISUAL_KEYS.effects.magic, "effect", "CDI-113 CSS/SVG magic profile", { x: 0, y: 0.5 }, 1, "✦"],
  [ENCOUNTER_VISUAL_KEYS.effects.healing, "effect", "CDI-113 CSS/SVG allied healing profile", { x: 0, y: 0.5 }, 1, "+"],
  [ENCOUNTER_VISUAL_KEYS.effects.support, "effect", "CDI-113 CSS/SVG enemy support profile", { x: 0, y: 0.5 }, 1, "+"],
  [ENCOUNTER_VISUAL_KEYS.encounters.trap.background, "background", "CDIdle ImageGen rest chamber v1 reused for CDI-115 challenges", { x: 0.5, y: 1 }, 1, "", restChamberBackgroundUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.trap.prop, "prop", "CDIdle ImageGen challenge trap v1", { x: 0.5, y: 0.94 }, 1, "△", challengeTrapUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.enigma.prop, "prop", "CDIdle ImageGen challenge enigma v1", { x: 0.5, y: 0.94 }, 1, "◇", challengeEnigmaUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.ambush.prop, "prop", "CDIdle ImageGen challenge ambush v1", { x: 0.5, y: 0.94 }, 1, "!", challengeAmbushUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.ritual.prop, "prop", "CDIdle ImageGen challenge ritual v1", { x: 0.5, y: 0.94 }, 1, "✦", challengeRitualUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.obstacle.prop, "prop", "CDIdle ImageGen challenge obstacle v1", { x: 0.5, y: 0.94 }, 1, "▰", challengeObstacleUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.negotiation.prop, "prop", "CDIdle ImageGen challenge negotiation v1", { x: 0.5, y: 0.94 }, 1, "§", challengeNegotiationUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.treasure.background, "background", "CDIdle ImageGen salle de trésor v1", { x: 0.5, y: 1 }, 1, "", treasureVaultBackgroundUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.treasure.prop, "prop", "CDIdle ImageGen coffre v3", { x: 0.5, y: 0.94 }, 1, "◇", treasureChestOpenUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.rest.background, "background", "CDIdle ImageGen salle de repos v1", { x: 0.5, y: 1 }, 1, "", restChamberBackgroundUrl],
  [ENCOUNTER_VISUAL_KEYS.encounters.rest.prop, "prop", "CDIdle ImageGen repos v2", { x: 0.5, y: 0.93 }, 1, "✦", restCampUrl],
] satisfies StaticVisual[]).map(([key, kind, provenance, anchor, scale, fallbackGlyph, url]) => [key, {
  key,
  kind,
  version: 1,
  provenance,
  anchor,
  scale,
  fallbackGlyph,
  fallback: false,
  load: url ? loadedUrl(url) : undefined,
}]));

const visualAssetCache = createBoundedAsyncAssetCache<string>(ENCOUNTER_VISUAL_CACHE_LIMIT);

function fallbackDescriptor(key: string): EncounterVisualDescriptor {
  const background = key.includes("background");
  const hero = parseHeroPortraitCacheKey(key) !== null || parseHeroPortraitPoseVisualKey(key) !== null;
  const effect = key.startsWith("effect:");
  return {
    key,
    kind: background ? "background" : hero ? "hero" : effect ? "effect" : "enemy",
    version: ENCOUNTER_VISUAL_CATALOG_VERSION,
    provenance: "CDIdle neutral fallback",
    anchor: { x: 0.5, y: 0.9 },
    scale: 1,
    fallbackGlyph: background ? "" : hero ? "◆" : effect ? "✦" : "?",
    fallback: true,
  };
}

export function getEncounterHeroVisualKeys(): string[] {
  return CANONICAL_HERO_CLASSES.flatMap((classType) => (
    (["Male", "Female"] as const).flatMap((gender) => (
      Array.from({ length: HERO_PORTRAIT_VARIANT_COUNT }, (_, variant) => (
        getHeroPortraitCacheKey(classType, gender, variant)
      ))
    ))
  ));
}

export function resolveEncounterVisualDescriptor(key: string): EncounterVisualDescriptor {
  const staticDescriptor = staticCatalog[key];
  if (staticDescriptor) return staticDescriptor;
  const heroPoseIdentity = parseHeroPortraitPoseVisualKey(key);
  if (heroPoseIdentity) {
    const noviceCombatIdleUrl = heroPoseIdentity.classType === "Novice"
      ? getCdi148NoviceCombatIdleUrl(heroPoseIdentity.gender, heroPoseIdentity.variant)
      : null;
    const warriorCombatIdleUrl = heroPoseIdentity.classType === "Guerrier"
      ? getCdi149WarriorCombatIdleUrl(heroPoseIdentity.gender, heroPoseIdentity.variant)
      : null;
    const rogueCombatIdleUrl = heroPoseIdentity.classType === "Voleur"
      ? getCdi150RogueCombatIdleUrl(heroPoseIdentity.gender, heroPoseIdentity.variant)
      : null;
    const combatIdleUrl = noviceCombatIdleUrl ?? warriorCombatIdleUrl ?? rogueCombatIdleUrl;
    const warriorCombatIdle = warriorCombatIdleUrl !== null;
    const rogueCombatIdle = rogueCombatIdleUrl !== null;
    return {
      key,
      kind: "hero",
      version: ENCOUNTER_VISUAL_CATALOG_VERSION,
      provenance: noviceCombatIdleUrl
        ? "CDI-148 validated Novice combat-idle alpha sprites"
        : warriorCombatIdleUrl
          ? "CDI-149 validated Warrior combat-idle alpha sprites"
          : rogueCombatIdleUrl
            ? "CDI-150 validated Rogue combat-idle alpha sprites"
        : "CDIdle explicit neutral hero-pose fallback",
      anchor: warriorCombatIdle
        ? { x: 0.5, y: CDI149_WARRIOR_COMBAT_IDLE_VISIBLE_BOTTOM / CDI149_WARRIOR_COMBAT_IDLE_FRAME_HEIGHT }
        : rogueCombatIdle
          ? { x: 0.5, y: CDI150_ROGUE_COMBAT_IDLE_VISIBLE_BOTTOM / CDI150_ROGUE_COMBAT_IDLE_FRAME_HEIGHT }
        : { x: 0.5, y: 0.93 },
      pivotX: warriorCombatIdle
        ? getCdi149WarriorCombatIdlePivotX(heroPoseIdentity.gender, heroPoseIdentity.variant)
        : rogueCombatIdle
          ? 0.5
        : undefined,
      scale: warriorCombatIdle
        ? CDI149_WARRIOR_COMBAT_IDLE_FRAME_HEIGHT / CDI149_WARRIOR_NEUTRAL_FRAME_HEIGHT
        : rogueCombatIdle
          ? CDI150_ROGUE_COMBAT_IDLE_FRAME_HEIGHT / CDI150_ROGUE_NEUTRAL_FRAME_HEIGHT
            * getCdi150RogueCombatIdleScale(heroPoseIdentity.gender, heroPoseIdentity.variant)
        : 1,
      fit: warriorCombatIdle || rogueCombatIdle ? "height" : "contain",
      fallbackGlyph: "◆",
      fallback: false,
      load: combatIdleUrl
        ? loadedUrl(combatIdleUrl)
        : () => loadHeroPortraitAsset({
            classType: heroPoseIdentity.classType,
            gender: heroPoseIdentity.gender,
            variant: heroPoseIdentity.variant,
          }).then((asset) => asset.url),
    };
  }
  const heroIdentity = parseHeroPortraitCacheKey(key);
  if (!heroIdentity) return fallbackDescriptor(key);
  const validatedMetadata = validatedHeroSpriteMetadata[heroIdentity.classType as CanonicalHeroClass];
  return {
    key,
    kind: "hero",
    version: ENCOUNTER_VISUAL_CATALOG_VERSION,
    provenance: validatedMetadata
      ? `CDI-${validatedMetadata[0]} validated ${validatedMetadata[1]} alpha sprites`
      : "CDIdle canonical hero spritesheets",
    anchor: { x: 0.5, y: 0.93 },
    scale: 1,
    fallbackGlyph: "◆",
    fallback: false,
    load: () => loadHeroPortraitAsset({
      classType: heroIdentity.classType as CanonicalHeroClass,
      gender: heroIdentity.gender,
      variant: heroIdentity.variant,
    }).then((asset) => asset.url),
  };
}

export interface LoadedEncounterVisual {
  descriptor: EncounterVisualDescriptor;
  url: string | null;
  status: "ready" | "fallback";
}

export async function loadEncounterVisualAsset(key: string): Promise<LoadedEncounterVisual> {
  const descriptor = resolveEncounterVisualDescriptor(key);
  if (!descriptor.load) {
    return { descriptor, url: null, status: descriptor.fallback ? "fallback" : "ready" };
  }
  try {
    const url = await visualAssetCache.load(descriptor.key, descriptor.load);
    return { descriptor, url, status: "ready" };
  } catch {
    return { descriptor: fallbackDescriptor(key), url: null, status: "fallback" };
  }
}

export function clearEncounterVisualAssetSession(): void {
  visualAssetCache.clear();
  clearHeroPortraitAssetSession();
}

export function getEncounterVisualAssetCacheStats() {
  return { size: visualAssetCache.size, limit: visualAssetCache.limit };
}

export function getStaticEncounterVisualManifest(): readonly EncounterVisualDescriptor[] {
  return Object.values(staticCatalog);
}

registerVisualAssetSessionCleaner(() => visualAssetCache.clear());
