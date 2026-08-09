import type { Hero } from "../types";
import { createHeroCandidateSummary, type HeroCandidateSummaryView } from "./heroCandidatePresentation";

export const STARTING_FOUNDER_COUNT = 2;

export type FounderCandidateView = HeroCandidateSummaryView;

export interface StartingFounderChoice {
  id: string;
  name: string;
}

const CITY_NAME_PRESETS = [
  "Val-Ombré", "Sables-Gourmands", "Fort-Dragon", "Haut-Castel",
  "Havre-Lune", "Roche-Brune", "Mont-Vigie", "Orée-Bois",
  "Fendragon", "Grand-Azur", "Château-Tempête", "Garde-Roc",
  "Port-Soleil", "Rive-Gauche", "Sainte-Braise", "Vent-Froid",
] as const;
const CITY_NAME_PREFIXES = ["Val", "Fort", "Mont", "Castel", "Haut", "Roche", "Garde", "Havre", "Port", "Bois", "Pont", "Grand", "Rive", "Fend"] as const;
const CITY_NAME_SUFFIXES = ["Ombré", "Braise", "Dragon", "Vigie", "Sable", "Clair", "Gris", "Noir", "Argent", "Doré", "Brune", "Lune", "Soleil", "Tempête", "Roc", "Azur", "Vent", "Étoile"] as const;

export function createFounderCandidateView(hero: Hero, editedName = hero.name): FounderCandidateView {
  return createHeroCandidateSummary(hero, editedName);
}

export function toggleStartingFounder(current: string[], heroId: string): string[] {
  if (current.includes(heroId)) return current.filter((id) => id !== heroId);
  if (current.length < STARTING_FOUNDER_COUNT) return [...current, heroId];
  return [...current.slice(1), heroId];
}

export function createStartingFounderChoices(
  candidates: Hero[],
  selectedIds: string[],
  editedNames: Record<string, string>,
): StartingFounderChoice[] {
  const selected = new Set(selectedIds);
  return candidates
    .filter((hero) => selected.has(hero.id))
    .map((hero) => ({ id: hero.id, name: (editedNames[hero.id] ?? hero.name).trim() }));
}

export function suggestCityName(random: () => number = Math.random): string {
  if (random() <= 0.4) {
    return CITY_NAME_PRESETS[Math.floor(random() * CITY_NAME_PRESETS.length)] ?? CITY_NAME_PRESETS[0];
  }
  const prefix = CITY_NAME_PREFIXES[Math.floor(random() * CITY_NAME_PREFIXES.length)] ?? CITY_NAME_PREFIXES[0];
  const suffix = CITY_NAME_SUFFIXES[Math.floor(random() * CITY_NAME_SUFFIXES.length)] ?? CITY_NAME_SUFFIXES[0];
  return `${prefix}-${suffix}`;
}
