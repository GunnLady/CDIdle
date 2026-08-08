import { KeyRound } from "lucide-react";

interface DeveloperCheatPanelProps {
  value: string;
  canMutate: boolean;
  onChange: (value: string) => void;
  onApply: () => void;
}

export default function DeveloperCheatPanel(props: DeveloperCheatPanelProps) {
  return <details className="group fixed bottom-4 right-4 z-50 w-[min(32rem,calc(100vw-2rem))] select-none">
    <summary className="ml-auto flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-xl border border-[#76502e] bg-[#1e130b] px-4 py-2 text-xs font-bold text-[#caa050] shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050]">
      <KeyRound className="h-4 w-4" aria-hidden="true" />
      Grimoire développeur
    </summary>
    <div className="mt-2 space-y-3 rounded-xl border border-[#523520] bg-[#1e130b]/[0.98] p-4 shadow-2xl">
      <div>
        <h2 className="text-sm font-serif font-bold text-[#caa050] tracking-wide">Grimoire de Triche</h2>
        <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-[#a39080]">
          <span><code className="font-mono font-bold text-[#fbbf24]">G X</code> Or</span>
          <span><code className="font-mono font-bold text-[#59ba59]">N X</code> Nourriture</span>
          <span><code className="font-mono font-bold text-[#d26d36]">B X</code> Bois</span>
          <span><code className="font-mono font-bold text-[#cdcdcd]">P X</code> Pierre</span>
          <span><code className="font-mono font-bold text-[#9653ec]">M X</code> Minerai</span>
          <span><code className="font-mono font-bold text-[#ffd043]">A X</code> Tout</span>
          <span><code className="font-mono font-bold text-[#cba374]">D X</code> Étage max</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          aria-label="Code développeur"
          value={props.value}
          disabled={!props.canMutate}
          onChange={(event) => props.onChange(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") props.onApply(); }}
          placeholder="Exemple : G 10000"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#523520] bg-[#100805] px-3 text-xs font-mono text-[#fbf7f0] placeholder-[#5a483a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          disabled={!props.canMutate}
          onClick={props.onApply}
          className="min-h-11 shrink-0 rounded-lg border border-[#ebd7a0]/45 bg-gradient-to-b from-[#caa050] to-[#ab813a] px-4 text-xs font-bold text-[#110905] shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Invoquer
        </button>
      </div>
    </div>
  </details>;
}
