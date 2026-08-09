import { useState } from "react";
import type { ActiveTab } from "../../domain/activeTabPreference";
import type { CityJobId } from "../../domain/cityPresentation";
import { defaultStorageFilters, type StorageFilters } from "../../domain/storagePresentation";
import HeroPortrait from "../../components/HeroPortrait";
import AccountDangerZonePanel from "../../components/account/AccountDangerZonePanel";
import DungeonProgressBanner from "../../components/app-shell/DungeonProgressBanner";
import PrimaryNavigation from "../../components/app-shell/PrimaryNavigation";
import ResourceHeader from "../../components/app-shell/ResourceHeader";
import AssignmentPanel from "../../components/city/AssignmentPanel";
import BuildingListPanel from "../../components/city/BuildingListPanel";
import CurrentEncounterPanel from "../../components/dungeon/CurrentEncounterPanel";
import DungeonPartyWorkspace from "../../components/dungeon/DungeonPartyWorkspace";
import EquipmentChangeSummary from "../../components/heroes/EquipmentChangeSummary";
import EquipmentItemDetails from "../../components/heroes/EquipmentItemDetails";
import RecruitmentOfferDialog from "../../components/heroes/RecruitmentOfferDialog";
import FounderCandidateCard from "../../components/onboarding/FounderCandidateCard";
import StorageToolbar from "../../components/storage/StorageToolbar";
import Alert from "../components/Alert";
import Panel from "../components/Panel";
import Button from "../primitives/Button";
import {
  catalogBlockedCandidate, catalogCityView, catalogCurrentItem, catalogDefeatEncounter, catalogDungeonBanner, catalogEncounter,
  catalogEquipmentCandidate, catalogFounder, catalogHeroEquipment, catalogParty, catalogRates, catalogRecruit,
  catalogPendingEncounter, catalogReserves, catalogResources, catalogSelectedHero, catalogVictoryEncounter,
} from "./catalogProductFixtures";

type RecruitmentExample = "available" | "readonly" | null;

export default function CatalogProductSections() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("city");
  const [autoExplore, setAutoExplore] = useState(catalogDungeonBanner.autoExplore);
  const [selectedBuilding, setSelectedBuilding] = useState("ferme");
  const [cityView, setCityView] = useState(catalogCityView);
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>("catalog-ariane");
  const [founder, setFounder] = useState(catalogFounder);
  const [founderSelected, setFounderSelected] = useState(true);
  const [recruitment, setRecruitment] = useState<RecruitmentExample>(null);
  const [recruitName, setRecruitName] = useState(catalogRecruit.name);
  const [recruitmentPending, setRecruitmentPending] = useState(false);
  const [dangerPending, setDangerPending] = useState(false);
  const [dangerError, setDangerError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StorageFilters>({ ...defaultStorageFilters });

  const allocate = (role: CityJobId, amount: number) => setCityView((current) => {
    const unassignedCitizens = current.unassignedCitizens - amount;
    return {
      ...current,
      unassignedCitizens,
      jobs: current.jobs.map((job) => {
        const count = job.id === role ? job.count + amount : job.count;
        return { ...job, count, canRemove: count > 0, canAdd: job.buildingLevel > 0 && unassignedCitizens > 0 };
      }),
    };
  });

  const simulateRecruitment = async () => {
    setRecruitmentPending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setRecruitmentPending(false);
    setRecruitment(null);
  };

  const simulateDangerAction = async () => {
    setDangerPending(true);
    setDangerError(null);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setDangerPending(false);
    setDangerError("Simulation catalogue : le serveur a refusé l’action.");
  };

  return <>
    <Panel title="Coquille produit" subtitle="En-tête, navigation réelle et progression persistante du Donjon" testId="catalog-product-shell" titleAs="h2" contentClassName="space-y-4 overflow-hidden">
      <div className="overflow-hidden rounded-ui-panel border border-ui-border">
        <ResourceHeader cityName="Valdor" authenticated resources={catalogResources} rates={catalogRates} accountActive={activeTab === "account"} onOpenAccount={() => setActiveTab("account")} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <PrimaryNavigation activeTab={activeTab === "account" ? "city" : activeTab} authenticated onChange={setActiveTab} />
        <PrimaryNavigation activeTab="city" authenticated={false} onChange={() => undefined} />
      </div>
      <div className="grid gap-3">
        <DungeonProgressBanner view={{ ...catalogDungeonBanner, autoExplore }} onNavigate={setActiveTab} onToggleAutoExplore={() => setAutoExplore((active) => !active)} />
        <DungeonProgressBanner view={{ ...catalogDungeonBanner, status: "Aucun groupe", autoExplore: false, canToggleAutoExplore: false, party: [null, null, null, null] }} onNavigate={setActiveTab} onToggleAutoExplore={() => undefined} />
      </div>
    </Panel>

    <Panel title="Héros et équipement" subtitle="Portraits, objet équipé, emplacement vide et comparaison avant/après" testId="catalog-product-hero-equipment" titleAs="h2">
      <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-wrap items-end gap-3" aria-label="Tailles de portraits de héros">
          <HeroPortrait hero={{ ...catalogSelectedHero.portrait, id: "catalog-ariane-xs" }} size="xs" />
          <HeroPortrait hero={{ ...catalogSelectedHero.portrait, id: "catalog-ariane-md" }} size="md" />
          <HeroPortrait hero={{ ...catalogSelectedHero.portrait, id: "catalog-ariane-xl" }} size="xl" />
          <HeroPortrait hero={{ id: "catalog-fallback", name: "Fallback", classType: "Mage" }} size="lg" />
        </div>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="rounded-ui-control border border-ui-border bg-ui-surface p-3"><EquipmentItemDetails item={catalogCurrentItem} showDescription /></div>
          <div className="rounded-ui-control border border-dashed border-ui-border p-3"><span className="text-xs italic text-ui-text-muted">Emplacement vide</span></div>
          <div className="rounded-ui-control border border-ui-border bg-ui-surface p-3 sm:col-span-2"><EquipmentChangeSummary currentItem={catalogCurrentItem} candidate={catalogEquipmentCandidate} /></div>
          <div className="rounded-ui-control border border-ui-locked-border bg-ui-locked-surface p-3 sm:col-span-2"><p className="mb-2 text-xs font-bold text-ui-locked-text">Niveau {catalogBlockedCandidate.requiredLevel} requis</p><EquipmentChangeSummary currentItem={null} candidate={catalogBlockedCandidate} /></div>
        </div>
      </div>
    </Panel>

    <Panel title="Compositions de la Cité" subtitle="Bâtiments et affectations avec états sélectionné, verrouillé et borné" testId="catalog-product-city" titleAs="h2">
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <BuildingListPanel buildings={cityView.buildings} selectedId={selectedBuilding} onSelect={setSelectedBuilding} />
        <div className="grid min-w-0 gap-4">
          <div data-testid="catalog-assignment-available"><AssignmentPanel view={cityView} canMutate onAllocate={allocate} /></div>
          <div data-testid="catalog-assignment-full"><AssignmentPanel view={{ ...cityView, unassignedCitizens: 0, jobs: cityView.jobs.map((job) => ({ ...job, canAdd: false })) }} canMutate onAllocate={() => undefined} /></div>
        </div>
      </div>
    </Panel>

    <Panel title="Compositions du Donjon" subtitle="Rencontre, transcript, victoire, groupe actif et réservistes" testId="catalog-product-dungeon" titleAs="h2">
      <div className="grid min-w-0 gap-4">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          <CurrentEncounterPanel view={catalogEncounter} canMutate activeHeroCount={2} isExploring={false} onExplore={() => undefined} />
          <CurrentEncounterPanel view={catalogPendingEncounter} canMutate={false} activeHeroCount={2} isExploring={false} onExplore={() => undefined} />
          <CurrentEncounterPanel view={catalogVictoryEncounter} canMutate={false} activeHeroCount={2} isExploring={false} onExplore={() => undefined} />
          <CurrentEncounterPanel view={catalogDefeatEncounter} canMutate={false} activeHeroCount={2} isExploring={false} onExplore={() => undefined} />
          <CurrentEncounterPanel view={null} canMutate activeHeroCount={0} isExploring={false} onExplore={() => undefined} />
        </div>
        <DungeonPartyWorkspace party={catalogParty} reserves={catalogReserves} selectedHeroId={selectedHeroId} selectedHero={selectedHeroId === catalogSelectedHero.id ? catalogSelectedHero : null} equipment={selectedHeroId === catalogSelectedHero.id ? catalogHeroEquipment : null} skills={null} canMutate onSelectHero={setSelectedHeroId} onToggleHeroActive={() => undefined} />
      </div>
    </Panel>

    <Panel title="Recrutement, fondateurs et Compte" subtitle="Choix local, renommage, lecture seule et confirmation destructive" testId="catalog-product-onboarding-account" titleAs="h2">
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="grid gap-4">
          <FounderCandidateCard candidate={founder} selected={founderSelected} onToggle={() => setFounderSelected((selected) => !selected)} onRename={(name) => setFounder((current) => ({ ...current, name }))} />
          <div className="flex flex-wrap gap-2"><Button onClick={() => setRecruitment("available")}>Ouvrir l’offre</Button><Button onClick={() => setRecruitment("readonly")}>Offre en lecture seule</Button></div>
        </div>
        <div className="min-w-0">
          {dangerPending && <Alert variant="info" live="polite" className="mb-3">Simulation de l’action en cours…</Alert>}
          {dangerError && <Alert variant="error" live="polite" className="mb-3">{dangerError}</Alert>}
          <AccountDangerZonePanel interactionLocked={dangerPending} blockReason={dangerPending ? "Une action est déjà en cours." : undefined} onHardReset={simulateDangerAction} onDeleteAccount={simulateDangerAction} />
        </div>
      </div>
    </Panel>

    <Panel title="Filtres responsive du Coffre" subtitle="Recherche, divulgation mobile, tri dépendant et réinitialisation" testId="catalog-product-storage" titleAs="h2">
      <StorageToolbar filters={filters} onChange={setFilters} resultCount={filters.searchTerm ? 2 : 18} />
    </Panel>

    {recruitment && <RecruitmentOfferDialog candidate={catalogRecruit} editedName={recruitName} heroCount={3} pending={recruitmentPending} readOnly={recruitment === "readonly"} blockReason={recruitment === "readonly" ? "Catalogue en lecture seule." : undefined} onNameChange={setRecruitName} onConfirm={() => { void simulateRecruitment(); }} onCancel={() => setRecruitment(null)} />}
  </>;
}
