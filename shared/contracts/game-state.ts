/**
 * Point d'import partagé pour les runtimes Vite, Vitest et Supabase.
 * La définition canonique reste celle livrée par CDI-007 dans src/types.ts.
 */
export type { GameState } from "../../src/types";
export type { CanonicalGameState } from "./authoritative";
export { validateCanonicalGameState } from "./authoritative";

export const GAME_STATE_SCHEMA_VERSION = 1 as const;
