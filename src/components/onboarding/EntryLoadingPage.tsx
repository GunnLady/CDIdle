import LoadingState from "../../ui/components/LoadingState";
import EntryScreenFrame from "./EntryScreenFrame";

export default function EntryLoadingPage() {
  return <EntryScreenFrame testId="entry-loading-page">
    <LoadingState title="Chargement du Royaume" description="Récupération de l’état canonique confirmé…" />
  </EntryScreenFrame>;
}
