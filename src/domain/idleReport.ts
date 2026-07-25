export type CanonicalIdleReport = {
  elapsedSeconds: number;
  appliedSeconds: number;
  discardedSeconds: number;
  resourcesProduced: { food: number; wood: number; stone: number; ore: number };
  foodConsumed: number;
  citizensAdded: number;
  heroesRecovered: number;
  heroesFullyRecovered?: number;
};

const amount = (value: number) => Number(value.toFixed(2)).toLocaleString("fr-FR");

export function formatCanonicalIdleReport(report: CanonicalIdleReport | null | undefined): string | null {
  if (!report) return null;
  const significant = report.appliedSeconds >= 60
    || report.discardedSeconds > 0
    || report.citizensAdded > 0
    || (report.heroesFullyRecovered ?? 0) > 0;
  if (!significant) return null;

  const details: string[] = [];
  for (const [resource, produced] of Object.entries(report.resourcesProduced)) {
    if (produced > 0) details.push(`+${amount(produced)} ${resource}`);
  }
  if (report.foodConsumed > 0) details.push(`-${amount(report.foodConsumed)} food`);
  if (report.citizensAdded > 0) details.push(`+${report.citizensAdded} citoyen(s)`);
  if (report.heroesRecovered > 0) details.push(`${report.heroesRecovered} héros soigné(s)`);
  if ((report.heroesFullyRecovered ?? 0) > 0) details.push(`${report.heroesFullyRecovered} héros entièrement rétabli(s)`);
  if (report.discardedSeconds > 0) details.push(`${report.discardedSeconds}s hors plafond ignorées`);
  return `Retour après ${report.elapsedSeconds}s : ${details.length > 0 ? details.join(", ") : "aucun changement"}.`;
}
