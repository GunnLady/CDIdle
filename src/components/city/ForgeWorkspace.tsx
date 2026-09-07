import { useMemo, useState } from 'react';
import { Hammer, Lock } from 'lucide-react';
import type { ItemBlueprint, Rarity, StoredForgeMaterialStack } from '../../types';
import { createForgeWorkspaceView } from '../../domain/forgePresentation';
import type { CityBuildingView } from '../../domain/cityPresentation';
import Panel from '../../ui/components/Panel';
import Badge from '../../ui/components/Badge';
import Alert from '../../ui/components/Alert';
import Button from '../../ui/primitives/Button';
import Select from '../../ui/primitives/Select';
import { buildingDetailImages } from './buildingCardImages';
import ForgeCatalog, { ForgeRecipeIcon } from './ForgeCatalog';
import ForgeCosts from './ForgeCosts';
import ForgeResult from './ForgeResult';

interface ForgeWorkspaceProps {
  canMutate: boolean; materials: StoredForgeMaterialStack[]; blueprints: ItemBlueprint[];
  forgeLevel: number; building: CityBuildingView;
  pending?: { previewId: string; itemId: string; itemLevel?: number; offeredRarity: Rarity } | null;
  onUpgrade: (id: string) => void;
  onStart: (recipeId: string, levelBandMin?: number) => void;
  onFinalize: (previewId: string, acceptUpgrade: boolean, chosenModifierStat?: string) => void;
  onCancel: (previewId: string) => void;
}

export default function ForgeWorkspace(props: ForgeWorkspaceProps) {
  const [selectedId, setSelectedId] = useState('progression_sword');
  const [selectedLevelBandMin, setSelectedLevelBandMin] = useState(1);
  const view = useMemo(() => createForgeWorkspaceView({
    materials: props.materials, blueprints: props.blueprints, selectedRecipeId: selectedId,
    selectedLevelBandMin, forgeLevel: props.forgeLevel, pending: props.pending,
  }), [props.materials, props.blueprints, props.pending, props.forgeLevel, selectedId, selectedLevelBandMin]);
  const recipe = view.selectedRecipe;
  const craftAvailable = props.canMutate && view.baseAffordable && recipe?.unlocked && recipe.availableLevelBands.length > 0;

  return <Panel title="La Forge" subtitle="Choisissez un plan. Donnez forme à votre prochain équipement." testId="selected-building-panel" className="order-1" contentClassName="space-y-5">
    <div className="relative isolate overflow-hidden rounded-ui-panel border border-ui-border bg-ui-surface">
      <img src={buildingDetailImages.forge} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ui-canvas/95 via-ui-canvas/85 to-ui-canvas/40" />
      <div className="flex min-h-36 flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-ui-accent">Enclume &amp; fourneaux</p>
          <h4 className="font-serif text-2xl font-bold text-ui-text">Forge {props.building.level}/{props.building.maxLevel}</h4>
          <p className="mt-2 text-sm text-ui-text">Tranche ouverte : niveaux {view.progression.openedRangeLabel}</p>
          {view.progression.nextRangeLabel && <p className="mt-1 text-xs text-ui-text">Prochaine : niveaux {view.progression.nextRangeLabel} · étage {view.progression.nextRequiredFloor}</p>}
        </div>
        {props.building.atMaxLevel && <Badge tone="accent">Maîtrise maximale</Badge>}
      </div>
    </div>
    {!props.building.atMaxLevel && <div className="flex flex-wrap items-center justify-between gap-3 rounded-ui-control border border-ui-border-subtle bg-ui-surface p-3">
      <div className="min-w-0 flex-1 text-xs text-ui-text-muted">
        <p className="mb-1 font-semibold text-ui-text">Agrandir l’atelier</p>
        <p>Coût : {props.building.costLabel}</p>
        {!props.building.upgradeUnlocked && <p className="mt-1 flex items-start gap-1 text-ui-warning"><Lock aria-hidden="true" className="h-3 w-3 shrink-0" />Requis : {props.building.prerequisite}</p>}
        {props.building.upgradeUnlocked && !props.building.affordable && <p className="mt-1 text-ui-warning">Ressources insuffisantes pour améliorer le bâtiment.</p>}
      </div>
      <Button variant="secondary" disabled={!props.canMutate || !props.building.upgradeUnlocked || !props.building.affordable} onClick={() => props.onUpgrade(props.building.id)}>Améliorer</Button>
    </div>}
    <dl aria-label="Réserve de forge" className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:grid-cols-5">
      {view.materials.map((material) => <div key={material.id} className="rounded-ui-control border border-ui-border-subtle bg-ui-surface px-3 py-2">
        <dt className="text-xs text-ui-text-muted">{material.name}</dt>
        <dd className="mt-1 font-mono text-lg text-ui-text">{material.count}</dd>
      </div>)}
    </dl>
    {view.bossComponents.length > 0 && <section aria-labelledby="forge-boss-components-title" className="space-y-3 border-t border-ui-border-subtle pt-4">
      <h4 id="forge-boss-components-title" className="text-xs font-semibold uppercase tracking-wider text-ui-accent">Composants de boss</h4>
      {view.bossComponents.map((group) => <div key={group.bossId} className="rounded-ui-control border border-ui-accent/30 bg-ui-panel p-3">
        <p className="mb-2 text-xs text-ui-text-muted">{group.bossName}</p>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">{group.materials.map((material) => <div key={material.id} className="rounded-ui-control border border-ui-border-subtle bg-ui-surface px-3 py-2"><dt className="text-xs text-ui-text-muted">{material.name}</dt><dd className="mt-1 font-mono text-lg text-ui-text">{material.count}</dd></div>)}</dl>
      </div>)}
    </section>}
    {!props.canMutate && <Alert variant="observer">Lecture seule : vous pouvez consulter les plans, mais pas fabriquer ni améliorer.</Alert>}
    {view.pending ? <div key={view.pending.previewId}><ForgeResult pending={view.pending} canMutate={props.canMutate} onFinalize={props.onFinalize} onCancel={props.onCancel} /></div> : <div className="grid min-w-0 grid-cols-1 items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <ForgeCatalog recipes={view.recipes} selectedId={recipe?.id} onSelect={setSelectedId} />
      <section aria-label="Fiche de fabrication" className="min-w-0 space-y-4 rounded-ui-panel border border-ui-border bg-ui-surface p-4">
        {recipe ? <>
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-ui-panel border border-ui-accent/40 bg-ui-panel text-ui-accent"><ForgeRecipeIcon category={recipe.category} className="h-7 w-7" /></span>
            <div className="min-w-0"><p className="mb-1 text-xs uppercase tracking-wider text-ui-text-muted">Sur l’enclume</p><h4 className="break-words font-serif text-lg font-bold text-ui-text">{recipe.name}</h4></div>
          </div>
          <div className="flex flex-wrap gap-2"><Badge>{recipe.categoryLabel}</Badge><Badge tone="accent">Qualité de départ : {recipe.rarityLabel}</Badge></div>
          <p className="text-sm leading-relaxed text-ui-text-muted">{recipe.description}</p>
          {!recipe.unlocked && <Alert variant="locked">{recipe.discoveryLabel}. Ce plan est consultable, mais pas encore utilisable.</Alert>}
          {recipe.powerModelId === 'level-bands-v1' && <Select label="Tranche de niveau" value={String(view.selectedLevelBandMin)} disabled={recipe.availableLevelBands.length === 0} onChange={(event) => setSelectedLevelBandMin(Number(event.target.value))}>
            {recipe.availableLevelBands.map((start) => <option key={start} value={start}>Niveaux {start}–{start + 4}</option>)}
          </Select>}
          {recipe.availableLevelBands.length === 0 && <Alert variant="locked">Améliorez la forge pour ouvrir une tranche compatible.</Alert>}
          <div className="space-y-2 border-y border-ui-border-subtle py-3 text-sm text-ui-text">
            {recipe.weaponDetails.map((detail) => <p key={detail}>{detail}</p>)}
            {recipe.modifierLines.map((line) => <p key={line} className="text-ui-accent">{line}</p>)}
            <p className="text-xs leading-relaxed text-ui-text-muted">Caractéristiques de base selon le niveau, à la qualité de départ. Niveau exact et qualité proposés après fabrication ; les bonus supplémentaires dépendent du résultat final.</p>
          </div>
          <div className="space-y-2"><h5 className="text-sm font-semibold text-ui-text">Coût de fabrication</h5><ForgeCosts costs={view.baseCosts} /></div>
          <Button block variant="primary" disabled={!craftAvailable} onClick={() => craftAvailable && props.onStart(recipe.id, recipe.powerModelId === 'level-bands-v1' ? view.selectedLevelBandMin : undefined)}><Hammer aria-hidden="true" className="h-4 w-4" />Forger</Button>
          <p className="text-center text-xs text-ui-text-muted">Les matériaux sont consommés dès la fabrication.</p>
        </> : <Alert variant="locked">Aucune recette disponible.</Alert>}
      </section>
    </div>}
  </Panel>;
}
