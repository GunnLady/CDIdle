import type { CanonicalPendingClassTransition } from "../../../shared/contracts/authoritative";
import type { Hero } from "../../types";
import Panel from "../../ui/components/Panel";
import Button from "../../ui/primitives/Button";

export default function DungeonCheckpointDecision(props: {
  floor: number;
  heroIds: string[];
  knockedOutHeroIds: string[];
  heroes: Hero[];
  pendingClassTransitions: CanonicalPendingClassTransition[];
  canMutate: boolean;
  onDecision: (decision: "continue" | "return_to_town") => void;
}) {
  const heroById = new Map(props.heroes.map((hero) => [hero.id, hero]));
  const knockedOut = new Set(props.knockedOutHeroIds);
  const pendingIds = new Set(props.pendingClassTransitions.map((entry) => entry.heroId));
  const pendingHeroes = props.heroIds.flatMap((id) => pendingIds.has(id) && heroById.get(id)
    ? [heroById.get(id)!]
    : []);
  const finalFloor = props.floor >= 50;
  return <Panel title={`Jalon ${props.floor} atteint`} subtitle="L’expédition attend votre décision" testId="dungeon-checkpoint-decision" variant="strong">
    <div className="space-y-3 text-sm text-ui-text">
      <ul className="grid gap-2 sm:grid-cols-2">
        {props.heroIds.map((id) => {
          const hero = heroById.get(id);
          if (!hero) return null;
          return <li key={id} className="rounded-ui-control border border-ui-border-subtle bg-ui-surface p-2">
            <strong>{hero.name}</strong> — {knockedOut.has(id) ? "KO, conserve sa place" : `${hero.currentHp}/${hero.calculatedStats.maxHp} PV`}
          </li>;
        })}
      </ul>
      {pendingHeroes.length > 0 && <div className="rounded-ui-control border border-amber-600/60 bg-amber-950/30 p-3 text-amber-100">
        <strong>Vocation disponible :</strong> {pendingHeroes.map((hero) => hero.name).join(", ")}. Retournez en ville pour la choisir. Continuer la laissera en attente jusqu’au prochain jalon.
      </div>}
      {finalFloor && <p className="font-bold text-amber-200">L’étage 50 est terminé : le retour en ville est obligatoire avant de sélectionner une zone de farm.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" variant="primary" disabled={!props.canMutate} onClick={() => props.onDecision("return_to_town")}>Retourner en ville et gérer l’équipe</Button>
        {!finalFloor && <Button type="button" variant="secondary" disabled={!props.canMutate} onClick={() => props.onDecision("continue")}>Continuer avec la même équipe</Button>}
      </div>
    </div>
  </Panel>;
}
