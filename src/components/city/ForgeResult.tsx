import { useState } from 'react';
import { Hammer, Sparkles } from 'lucide-react';
import type { ForgePendingView } from '../../domain/forgePresentation';
import Alert from '../../ui/components/Alert';
import Badge from '../../ui/components/Badge';
import Button from '../../ui/primitives/Button';
import Checkbox from '../../ui/primitives/Checkbox';
import Select from '../../ui/primitives/Select';
import ForgeCosts from './ForgeCosts';

export default function ForgeResult({ pending, canMutate, onFinalize, onCancel }: {
  pending: ForgePendingView; canMutate: boolean;
  onFinalize: (previewId: string, acceptUpgrade: boolean, modifier?: string) => void;
  onCancel: (previewId: string) => void;
}) {
  const [acceptUpgrade, setAcceptUpgrade] = useState(false);
  const [modifier, setModifier] = useState(pending.modifierOptions[0]?.stat ?? '');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const accepted = acceptUpgrade && pending.upgradeAvailable;
  const validModifier = pending.modifierOptions.some((entry) => entry.stat === modifier);
  return <section aria-label="Résultat de fabrication" className="space-y-4">
    <div className="rounded-ui-panel border border-ui-accent/50 bg-gradient-to-br from-ui-panel via-ui-surface to-ui-panel p-6 text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-ui-accent/50 bg-ui-panel text-ui-accent"><Hammer aria-hidden="true" className="h-8 w-8" /></span>
      <p className="mb-2 text-xs uppercase tracking-widest text-ui-text-muted">Sortie de l’enclume</p>
      <h4 className="break-words font-serif text-xl font-bold text-ui-text">{pending.itemName}</h4>
      <div className="mt-3 flex flex-wrap justify-center gap-2"><Badge>Niveau {pending.itemLevel}</Badge><Badge tone="accent">Qualité finale : {accepted ? pending.rarityLabel : pending.baseRarityLabel}</Badge></div>
      <p className="mt-3 text-sm text-ui-text-muted">La fabrication est payée. Finalisez pour récupérer votre objet et découvrir son nom définitif.</p>
    </div>
    {pending.upgradeAvailable && <div className="space-y-3 rounded-ui-panel border border-ui-accent/40 bg-ui-panel p-4">
      <h5 className="flex items-center gap-2 font-serif font-bold text-ui-accent"><Sparkles aria-hidden="true" className="h-5 w-5" />Une qualité supérieure !</h5>
      <p className="text-sm text-ui-text">Qualité proposée : <strong>{pending.rarityLabel}</strong></p>
      <p className="text-sm text-ui-text-muted">Acceptez ce résultat pour améliorer la rareté et choisir une infusion. Sans supplément, vous conservez la qualité {pending.baseRarityLabel.toLocaleLowerCase('fr')}.</p>
      <ForgeCosts costs={pending.upgradeCosts} />
      <Checkbox label="Accepter l’amélioration" checked={accepted} disabled={!canMutate || (!accepted && !pending.upgradeAffordable)} onChange={(event) => setAcceptUpgrade(event.target.checked)} />
      {!pending.upgradeAffordable && <p className="text-sm text-ui-warning">Matériaux insuffisants pour l’amélioration. La version de base reste récupérable.</p>}
      {accepted && <Select label="Modificateur d’infusion" description="La puissance du bonus dépend du niveau et de la qualité de l’objet ; les objets historiques conservent leur bonus fixe." value={modifier} disabled={!canMutate} onChange={(event) => setModifier(event.target.value)}>
        {pending.modifierOptions.map((entry) => <option key={entry.stat} value={entry.stat}>{entry.label}</option>)}
      </Select>}
    </div>}
    <Button block variant="primary" disabled={!canMutate || (accepted && (!pending.upgradeAffordable || !validModifier))} onClick={() => onFinalize(pending.previewId, accepted, accepted ? modifier : undefined)}>Finaliser · {accepted ? pending.rarityLabel : pending.baseRarityLabel}</Button>
    {confirmCancel ? <Alert variant="warning" title="Abandonner cette fabrication ?">
      <p>L’objet sera perdu et les matériaux déjà dépensés ne seront pas remboursés.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setConfirmCancel(false)}>Garder l’objet</Button>
        <Button variant="danger" disabled={!canMutate} onClick={() => onCancel(pending.previewId)}>Confirmer l’abandon</Button>
      </div>
    </Alert> : <Button block variant="ghost" disabled={!canMutate} onClick={() => setConfirmCancel(true)}>Abandonner la fabrication</Button>}
  </section>;
}
