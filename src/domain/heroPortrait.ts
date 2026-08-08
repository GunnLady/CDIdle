import type { Hero } from "../types";

export type HeroPortraitView = Pick<Hero, "id" | "name" | "classType" | "gender" | "spriteIndex">;
