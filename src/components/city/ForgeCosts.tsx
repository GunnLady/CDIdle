import type { ForgeCostView } from '../../domain/forgePresentation';

export default function ForgeCosts({ costs }: { costs: ForgeCostView[] }) {
  return <ul className="space-y-2" aria-label="Matériaux nécessaires">
    {costs.map((cost) => <li key={cost.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-ui-control border border-ui-border-subtle bg-ui-surface px-3 py-2 text-sm">
      <span className="text-ui-text">{cost.name}</span>
      <span className={`text-right font-mono ${cost.missing > 0 ? 'text-ui-danger' : 'text-ui-success'}`}>
        <span aria-label={`${cost.owned} possédés sur ${cost.required} requis`}>{cost.owned} / {cost.required}</span>
        {cost.missing > 0 && <span className="block font-sans text-xs">Il manque {cost.missing}</span>}
      </span>
    </li>)}
  </ul>;
}
