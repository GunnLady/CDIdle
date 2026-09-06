import { useState } from 'react';
import { BookOpen, Gem, Lock, Search, Shield, Shirt, Swords } from 'lucide-react';
import { filterForgeRecipes, FORGE_CATEGORIES, type ForgeCategory, type ForgeRecipeView } from '../../domain/forgePresentation';
import SelectableCard from '../../ui/components/SelectableCard';
import Button from '../../ui/primitives/Button';
import Checkbox from '../../ui/primitives/Checkbox';
import TextField from '../../ui/primitives/TextField';

export function ForgeRecipeIcon({ category, className = 'h-5 w-5' }: { category: ForgeRecipeView['category']; className?: string }) {
  const Icon = { weapon: Swords, offhand: Shield, armor: Shirt, accessory: Gem }[category];
  return <Icon aria-hidden="true" className={className} />;
}

export default function ForgeCatalog({ recipes, selectedId, onSelect }: {
  recipes: ForgeRecipeView[]; selectedId?: string; onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ForgeCategory>('all');
  const [knownOnly, setKnownOnly] = useState(true);
  const visible = filterForgeRecipes(recipes, query, category, knownOnly);
  return <section aria-label="Catalogue des plans" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="flex items-center gap-2 font-serif text-sm font-bold text-ui-accent"><BookOpen aria-hidden="true" className="h-4 w-4" />Livre des plans</h4>
      <span className="text-xs text-ui-text-muted">{recipes.filter((recipe) => recipe.unlocked).length} / {recipes.length} découverts</span>
    </div>
    <TextField label="Rechercher un plan" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Épée, bouclier…" leading={<Search className="h-4 w-4" />} />
    <div className="flex flex-wrap gap-1" role="group" aria-label="Familles de plans">
      {FORGE_CATEGORIES.map((entry) => <Button key={entry.id} size="sm" variant={category === entry.id ? 'secondary' : 'ghost'} aria-pressed={category === entry.id} onClick={() => setCategory(entry.id)}>{entry.label}</Button>)}
    </div>
    <Checkbox label="Plans connus uniquement" checked={knownOnly} onChange={(event) => setKnownOnly(event.target.checked)} />
    <p role="status" className="text-xs text-ui-text-muted">{visible.length} plan{visible.length > 1 ? 's' : ''} affiché{visible.length > 1 ? 's' : ''}</p>
    <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto p-1 sm:grid-cols-2 2xl:grid-cols-1">
      {visible.map((recipe) => <SelectableCard key={recipe.id} selected={recipe.id === selectedId} onClick={() => onSelect(recipe.id)} aria-label={`${recipe.name} · ${recipe.unlocked ? 'plan connu' : 'plan verrouillé'}`}>
        <span className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ui-control border border-ui-border-subtle bg-ui-panel text-ui-accent"><ForgeRecipeIcon category={recipe.category} /></span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-semibold leading-snug">{recipe.name}</span>
            <span className="mt-1 block text-xs text-ui-text-muted">{recipe.categoryLabel}</span>
            {!recipe.unlocked && <span className="mt-1 flex items-center gap-1 text-xs"><Lock aria-hidden="true" className="h-3 w-3" />À découvrir</span>}
          </span>
        </span>
      </SelectableCard>)}
    </div>
    {visible.length === 0 && <div className="rounded-ui-panel border border-dashed border-ui-border p-5 text-center">
      <p className="text-sm text-ui-text-muted">Aucun plan ne correspond à ces filtres.</p>
      <Button className="mt-3" variant="ghost" onClick={() => { setQuery(''); setCategory('all'); setKnownOnly(false); }}>Voir tous les plans</Button>
    </div>}
  </section>;
}
