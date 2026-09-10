import type { Hero } from "../types";

export const DUNGEON_SCENE_PROTOTYPE_DURATION_MS = 2_300;

export const DUNGEON_SCENE_PROTOTYPE_KINDS = [
  "waiting",
  "battle",
  "boss",
  "rest",
  "challenge",
] as const;

export type DungeonScenePrototypeKind = typeof DUNGEON_SCENE_PROTOTYPE_KINDS[number];
export type DungeonScenePrototypeLayout = "standard" | "zoomed";
export type DungeonScenePrototypePhase = "idle" | "anticipation" | "approach" | "impact" | "return" | "result";

export type DungeonScenePrototypeHero = Pick<Hero, "id" | "name" | "classType" | "gender" | "spriteIndex">;

export interface DungeonScenePrototypeActor {
  id: string;
  name: string;
  role: string;
  team: "heroes" | "enemies";
  slot: number;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  state: "ready" | "wounded" | "ko" | "guarding" | "chosen";
  hero?: DungeonScenePrototypeHero;
  glyph?: "rat" | "guard" | "king";
}

export interface DungeonScenePrototypeFixture {
  kind: DungeonScenePrototypeKind;
  label: string;
  title: string;
  location: string;
  status: string;
  summary: string;
  journal: readonly string[];
  actors: readonly DungeonScenePrototypeActor[];
  focusActorId?: string;
  impactTargetId?: string;
  impactLabel?: string;
  object?: { label: string; glyph: string };
}

export interface DungeonScenePrototypePlacement {
  actorId: string;
  xPercent: number;
  yPercent: number;
  scale: number;
  layer: number;
}

export interface DungeonScenePrototypeMotion {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface DungeonScenePrototypeFrame {
  elapsedMs: number;
  phase: DungeonScenePrototypePhase;
  phaseLabel: string;
  impactVisible: boolean;
  motions: Readonly<Record<string, DungeonScenePrototypeMotion>>;
}

const hero = (
  id: string,
  name: string,
  classType: DungeonScenePrototypeHero["classType"],
  gender: DungeonScenePrototypeHero["gender"],
  spriteIndex: number,
  slot: number,
  hp: number,
  mana: number,
  state: DungeonScenePrototypeActor["state"] = "ready",
): DungeonScenePrototypeActor => ({
  id,
  name,
  role: classType,
  team: "heroes",
  slot,
  hp,
  maxHp: 40,
  mana,
  maxMana: 20,
  state,
  hero: { id, name, classType, gender, spriteIndex },
});

const enemy = (
  id: string,
  name: string,
  role: string,
  glyph: NonNullable<DungeonScenePrototypeActor["glyph"]>,
  slot: number,
  hp: number,
  maxHp: number,
  state: DungeonScenePrototypeActor["state"] = "ready",
): DungeonScenePrototypeActor => ({ id, name, role, glyph, team: "enemies", slot, hp, maxHp, state });

const baseHeroes = () => [
  hero("prototype-ariane", "Ariane", "Guerrier", "Female", 1, 0, 34, 8),
  hero("prototype-borin", "Borin", "Archer", "Male", 4, 1, 27, 11),
  hero("prototype-celia", "Célia", "Acolyte", "Female", 7, 2, 31, 18),
  hero("prototype-dorian", "Dorian", "Mage", "Male", 12, 3, 22, 14, "wounded"),
] satisfies DungeonScenePrototypeActor[];

const battleEnemies = () => [
  enemy("prototype-rat-channel", "Rat des canaux", "Ordinaire", "rat", 0, 15, 24),
  enemy("prototype-rat-mangy", "Rat galeux", "Ordinaire", "rat", 1, 9, 20, "wounded"),
  enemy("prototype-rat-plague", "Rat pestiféré", "Soutien", "rat", 2, 18, 22),
] satisfies DungeonScenePrototypeActor[];

const fixtures: Record<DungeonScenePrototypeKind, () => DungeonScenePrototypeFixture> = {
  waiting: () => ({
    kind: "waiting",
    label: "Attente",
    title: "Escouade en attente",
    location: "Égouts infestés · Étage 3 · Salle 4",
    status: "Prête",
    summary: "Les quatre héros gardent leur place. Aucune action de jeu n'est déclenchée par cette scène.",
    journal: ["L'escouade attend un ordre d'exploration."],
    actors: baseHeroes(),
    object: { label: "Passage vers la salle suivante", glyph: "✦" },
  }),
  battle: () => ({
    kind: "battle",
    label: "Combat",
    title: "Meute de rats",
    location: "Égouts infestés · Étage 3 · Salle 4",
    status: "Lecture",
    summary: "Ariane avance, anticipe sa frappe, touche le Rat galeux puis revient à sa place.",
    journal: [
      "Ariane prépare une attaque physique.",
      "Ariane inflige 11 dégâts au Rat galeux.",
      "Le Rat galeux conserve 9/20 PV.",
    ],
    actors: [...baseHeroes(), ...battleEnemies()],
    focusActorId: "prototype-ariane",
    impactTargetId: "prototype-rat-mangy",
    impactLabel: "−11",
  }),
  boss: () => ({
    kind: "boss",
    label: "Boss",
    title: "Le Roi des Rats",
    location: "Cour du Roi · Étage 50 · Salle du trône",
    status: "Boss",
    summary: "Les deux gardes encadrent le Roi. Borin décoche un projectile vers la cible centrale.",
    journal: [
      "Les Lames du Roi prennent position.",
      "Borin décoche une flèche vers le Roi des Rats.",
      "Le Roi des Rats subit 8 dégâts derrière sa garde.",
    ],
    actors: [
      ...baseHeroes(),
      enemy("prototype-left-guard", "Lame senestre", "Garde", "guard", 0, 36, 36, "guarding"),
      enemy("prototype-rat-king", "Roi des Rats", "Roi", "king", 1, 92, 100),
      enemy("prototype-right-guard", "Lame dextre", "Garde", "guard", 2, 36, 36, "guarding"),
    ],
    focusActorId: "prototype-borin",
    impactTargetId: "prototype-rat-king",
    impactLabel: "−8",
  }),
  rest: () => {
    const heroes = baseHeroes().map((actor) => actor.id === "prototype-dorian"
      ? { ...actor, hp: 0, mana: 3, state: "ko" as const }
      : actor.id === "prototype-celia"
        ? { ...actor, state: "chosen" as const }
        : actor);
    return {
      kind: "rest",
      label: "Repos / KO",
      title: "Halte dans une alcôve",
      location: "Citernes oubliées · Étage 25 · Salle 5",
      status: "Récupération",
      summary: "Célia canalise le repos. Dorian reste visible à son emplacement avant sa réanimation.",
      journal: [
        "Le groupe installe un campement bref.",
        "Dorian récupère 12 PV et rejoint de nouveau le segment.",
        "Le groupe récupère ses ressources reçues de la trace.",
      ],
      actors: heroes,
      focusActorId: "prototype-celia",
      impactTargetId: "prototype-dorian",
      impactLabel: "+12",
      object: { label: "Feu de repos", glyph: "♨" },
    };
  },
  challenge: () => ({
    kind: "challenge",
    label: "Épreuve",
    title: "Piège des vannes",
    location: "Citernes oubliées · Étage 28 · Salle 2",
    status: "Épreuve",
    summary: "Borin, héros sélectionné par la fixture, s'avance vers le mécanisme sans déclencher de commande de jeu.",
    journal: [
      "Borin est désigné pour examiner le mécanisme.",
      "Le piège est désarmé avec succès.",
      "Aucune conséquence supplémentaire n'est inventée par la présentation.",
    ],
    actors: baseHeroes().map((actor) => actor.id === "prototype-borin" ? { ...actor, state: "chosen" as const } : actor),
    focusActorId: "prototype-borin",
    impactTargetId: "prototype-borin",
    impactLabel: "Réussite",
    object: { label: "Mécanisme de vannes", glyph: "⚙" },
  }),
};

const standardSlots = {
  heroes: [
    { xPercent: 18, yPercent: 64, scale: 1.06, layer: 4 },
    { xPercent: 29, yPercent: 42, scale: 0.94, layer: 2 },
    { xPercent: 10, yPercent: 35, scale: 0.9, layer: 1 },
    { xPercent: 34, yPercent: 76, scale: 1, layer: 5 },
  ],
  enemies: [
    { xPercent: 69, yPercent: 62, scale: 1.04, layer: 4 },
    { xPercent: 82, yPercent: 40, scale: 0.96, layer: 2 },
    { xPercent: 89, yPercent: 72, scale: 1, layer: 5 },
  ],
} as const;

const zoomedSlots = {
  heroes: [
    { xPercent: 14, yPercent: 67, scale: 0.92, layer: 4 },
    { xPercent: 38, yPercent: 76, scale: 0.86, layer: 5 },
    { xPercent: 62, yPercent: 67, scale: 0.9, layer: 4 },
    { xPercent: 86, yPercent: 76, scale: 0.86, layer: 5 },
  ],
  enemies: [
    { xPercent: 22, yPercent: 27, scale: 0.9, layer: 2 },
    { xPercent: 50, yPercent: 20, scale: 0.96, layer: 1 },
    { xPercent: 78, yPercent: 27, scale: 0.9, layer: 2 },
  ],
} as const;

const phaseLabels: Record<DungeonScenePrototypePhase, string> = {
  idle: "Position",
  anticipation: "Anticipation",
  approach: "Déplacement",
  impact: "Impact",
  return: "Retour",
  result: "Résultat",
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const progress = (value: number, start: number, end: number) => clamp((value - start) / (end - start), 0, 1);
const easeOut = (value: number) => 1 - ((1 - value) ** 3);

export function createDungeonScenePrototypeFixture(kind: DungeonScenePrototypeKind): DungeonScenePrototypeFixture {
  return fixtures[kind]();
}

export function getDungeonScenePrototypePlacements(
  fixture: DungeonScenePrototypeFixture,
  layout: DungeonScenePrototypeLayout,
): readonly DungeonScenePrototypePlacement[] {
  const slots = layout === "standard" ? standardSlots : zoomedSlots;
  return fixture.actors.map((actor) => ({ actorId: actor.id, ...slots[actor.team][actor.slot] }));
}

export function getDungeonScenePrototypeFrame(
  fixture: DungeonScenePrototypeFixture,
  elapsedMs: number,
  layout: DungeonScenePrototypeLayout,
): DungeonScenePrototypeFrame {
  const time = clamp(Number.isFinite(elapsedMs) ? elapsedMs : 0, 0, DUNGEON_SCENE_PROTOTYPE_DURATION_MS);
  let phase: DungeonScenePrototypePhase = "idle";
  if (fixture.focusActorId) {
    if (time >= 1_750) phase = "result";
    else if (time >= 1_150) phase = "return";
    else if (time >= 950) phase = "impact";
    else if (time >= 550) phase = "approach";
    else if (time >= 300) phase = "anticipation";
  }

  const motions: Record<string, DungeonScenePrototypeMotion> = {};
  for (const actor of fixture.actors) {
    const stationary = { x: 0, y: 0, scale: 1, rotate: 0 };
    if (actor.id !== fixture.focusActorId) {
      motions[actor.id] = stationary;
      continue;
    }

    const direction = actor.team === "heroes" ? 1 : -1;
    const travel = layout === "standard" ? 138 : 72;
    const verticalTravel = layout === "standard" ? -6 : actor.team === "heroes" ? -92 : 92;
    if (phase === "anticipation") {
      const value = progress(time, 300, 550);
      motions[actor.id] = { x: direction * -12 * value, y: 4 * value, scale: 1 - (0.05 * value), rotate: direction * -3 * value };
    } else if (phase === "approach") {
      const value = easeOut(progress(time, 550, 950));
      motions[actor.id] = { x: direction * travel * value, y: verticalTravel * value - (Math.sin(value * Math.PI) * 12), scale: 0.95 + (0.08 * value), rotate: direction * 4 * value };
    } else if (phase === "impact") {
      const pulse = Math.sin(progress(time, 950, 1_150) * Math.PI);
      motions[actor.id] = { x: direction * travel, y: verticalTravel, scale: 1.03 + (0.09 * pulse), rotate: direction * (4 - (8 * pulse)) };
    } else if (phase === "return") {
      const value = 1 - easeOut(progress(time, 1_150, 1_750));
      motions[actor.id] = { x: direction * travel * value, y: verticalTravel * value, scale: 1 + (0.03 * value), rotate: direction * 4 * value };
    } else {
      motions[actor.id] = stationary;
    }
  }

  return {
    elapsedMs: time,
    phase,
    phaseLabel: phaseLabels[phase],
    impactVisible: phase === "impact" && Boolean(fixture.impactTargetId && fixture.impactLabel),
    motions,
  };
}
