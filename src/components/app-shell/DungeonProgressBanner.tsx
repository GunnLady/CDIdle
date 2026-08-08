import { Activity, Pause, Play, Shield, Swords } from "lucide-react";
import { getDungeonRoomCount } from "../../../shared/domain/dungeon-progression";
import type { CanonicalActiveDungeonEncounter } from "../../../shared/contracts/authoritative";
import type { Hero } from "../../types";
import type { ActiveTab } from "../../domain/activeTabPreference";

interface DungeonProgressBannerProps {
  heroes: Hero[];
  floor: number;
  room: number;
  autoExplore: boolean;
  encounter: CanonicalActiveDungeonEncounter | null;
  isExploring: boolean;
  canMutate: boolean;
  onNavigate: (tab: ActiveTab) => void;
  onToggleAutoExplore: () => void;
}

export const shouldShowDungeonProgressBanner = (authenticated: boolean, activeTab: ActiveTab) =>
  authenticated && activeTab !== "dungeon";

function getExpeditionStatus(input: {
  heroCount: number;
  encounter: CanonicalActiveDungeonEncounter | null;
  isExploring: boolean;
  autoExplore: boolean;
}) {
  if (input.heroCount === 0) return "Aucun groupe";
  if (input.encounter && input.isExploring) return "Combat en cours";
  if (input.encounter) return "Rencontre en attente";
  if (input.isExploring) return "Exploration";
  if (!input.autoExplore) return "En pause";
  return "Prêt";
}

function PartySlots({ heroes }: { heroes: Hero[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => {
        const hero = heroes[index];
        if (!hero) return <div key={index} className="rounded border border-dashed border-[#5c402b]/50 px-2 py-1.5 text-[10px] text-[#776657]">Place libre</div>;
        const maxHp = Math.max(1, hero.calculatedStats.maxHp);
        const maxMana = Math.max(0, hero.calculatedStats.maxMana);
        const currentHp = Math.max(0, Math.min(maxHp, Math.floor(hero.currentHp)));
        const currentMana = Math.max(0, Math.min(maxMana, Math.floor(hero.currentMana)));
        const health = Math.max(0, Math.min(100, Math.round((hero.currentHp / maxHp) * 100)));
        const mana = maxMana > 0 ? Math.max(0, Math.min(100, Math.round((hero.currentMana / maxMana) * 100))) : 0;
        return (
          <div key={hero.id} className="min-w-0 rounded border border-[#49301e] bg-[#120b07] px-2 py-1.5">
            <strong className="block truncate text-[10px] text-[#dfdbc7]">{hero.name}</strong>
            <div className="mt-0.5 flex justify-between gap-1 text-[8px] font-mono">
              <span className={currentHp > 0 ? "text-emerald-400" : "text-red-400"}>PV {currentHp}/{maxHp}</span>
              <span className="text-sky-400">PM {currentMana}/{maxMana}</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1" aria-hidden="true">
              <div className="h-1 overflow-hidden rounded bg-[#3a2118]"><div className="h-full bg-emerald-600" style={{ width: `${health}%` }} /></div>
              <div className="h-1 overflow-hidden rounded bg-[#17243d]"><div className="h-full bg-sky-500" style={{ width: `${mana}%` }} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DungeonProgressBanner(props: DungeonProgressBannerProps) {
  const activeHeroes = props.heroes.filter((hero) => hero.isActive).slice(0, 4);
  const roomCount = getDungeonRoomCount(props.floor);
  const status = getExpeditionStatus({
    heroCount: activeHeroes.length,
    encounter: props.encounter,
    isExploring: props.isExploring,
    autoExplore: props.autoExplore,
  });
  const canToggle = props.canMutate && activeHeroes.length > 0 && !props.encounter;

  return (
    <aside aria-label="Progression du groupe dans le donjon" className="h-full rounded-xl border border-[#5c402b] bg-[#18100a] p-3 shadow-lg xl:rounded-none xl:border-0 xl:bg-transparent xl:py-0 xl:pr-0 xl:shadow-none">
      <div className="flex flex-wrap items-center gap-3">
        <Swords className="h-5 w-5 text-[#caa050]" aria-hidden="true" />
        <div className="min-w-[9rem]">
          <strong className="block text-xs font-serif text-[#dfdbc7]">Étage {props.floor} · Salle {Math.min(props.room, roomCount)}/{roomCount}</strong>
          <span className="flex items-center gap-1 text-[10px] text-[#a89078]"><Activity className="h-3 w-3" aria-hidden="true" />{status} · Auto {props.autoExplore ? "actif" : "arrêté"}</span>
        </div>
        <div className="hidden min-w-0 flex-1 md:block"><PartySlots heroes={activeHeroes} /></div>
        <div className="ml-auto flex gap-2">
          {activeHeroes.length === 0 ? (
            <button type="button" onClick={() => props.onNavigate("heroes")} className="min-h-11 rounded-lg border border-[#6e4b2b] px-3 py-2 text-xs font-bold text-[#caa050] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">Préparer le groupe</button>
          ) : canToggle ? (
            <button type="button" onClick={props.onToggleAutoExplore} className="min-h-11 rounded-lg border border-[#6e4b2b] px-3 py-2 text-xs text-[#dfdbc7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
              {props.autoExplore ? <><Pause className="mr-1 inline h-3 w-3" />Pause</> : <><Play className="mr-1 inline h-3 w-3" />Reprendre</>}
            </button>
          ) : null}
          <button type="button" onClick={() => props.onNavigate("dungeon")} className="min-h-11 rounded-lg bg-[#8c5a2b] px-3 py-2 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]"><Shield className="mr-1 inline h-3 w-3" />Voir le Donjon</button>
        </div>
      </div>
      <details className="mt-2 md:hidden"><summary className="flex min-h-11 cursor-pointer items-center rounded text-[10px] text-[#a89078] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">Voir le groupe</summary><div className="mt-2"><PartySlots heroes={activeHeroes} /></div></details>
    </aside>
  );
}
