import type { Resources } from "../types";

export const resourceLabels = {
  gold: "Or",
  food: "Nourriture",
  wood: "Bois",
  stone: "Pierre",
  ore: "Minerai",
} satisfies Record<keyof Resources, string>;

export function getResourceLabel(resourceId: string): string {
  return resourceLabels[resourceId as keyof Resources] ?? resourceId;
}
