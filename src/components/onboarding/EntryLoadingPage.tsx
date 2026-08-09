import { RefreshCw } from "lucide-react";
import EntryScreenFrame from "./EntryScreenFrame";

export default function EntryLoadingPage() {
  return <EntryScreenFrame testId="entry-loading-page">
    <div role="status" className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
      <RefreshCw className="h-9 w-9 animate-spin text-[#caa050] motion-reduce:animate-none" />
      <div><h1 className="font-serif text-lg font-bold uppercase tracking-wider text-[#d4af37]">Chargement du Royaume</h1><p className="mt-2 text-xs text-[#a89078]">Récupération de l’état canonique confirmé…</p></div>
    </div>
  </EntryScreenFrame>;
}
