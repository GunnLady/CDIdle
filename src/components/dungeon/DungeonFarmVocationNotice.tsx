export default function DungeonFarmVocationNotice({ heroNames }: { heroNames: string[] }) {
  if (heroNames.length === 0) return null;
  return <div data-testid="dungeon-farm-vocation-notice" role="status" className="rounded-ui-control border border-amber-600/60 bg-amber-950/30 p-3 text-sm text-amber-100">
    <strong>Vocation disponible :</strong> {heroNames.join(", ")}. Arrêtez le farm et retournez en ville pour la choisir.
  </div>;
}
