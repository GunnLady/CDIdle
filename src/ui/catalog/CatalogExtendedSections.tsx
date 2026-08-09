import { Database, Search, Shield, Sparkles, Swords, UserRound } from "lucide-react";
import { useState } from "react";
import Alert from "../components/Alert";
import Badge from "../components/Badge";
import Dialog from "../components/Dialog";
import Disclosure from "../components/Disclosure";
import EmptySlot from "../components/EmptySlot";
import LoadingState from "../components/LoadingState";
import Metric from "../components/Metric";
import Panel from "../components/Panel";
import Progress from "../components/Progress";
import SelectableCard from "../components/SelectableCard";
import StatusBanner from "../components/StatusBanner";
import ActivityLog from "../patterns/ActivityLog";
import EntryScreen from "../patterns/EntryScreen";
import FloatingPrompt from "../patterns/FloatingPrompt";
import NavigationTabs from "../patterns/NavigationTabs";
import RoomProgress from "../patterns/RoomProgress";
import Button from "../primitives/Button";
import Checkbox from "../primitives/Checkbox";
import IconButton from "../primitives/IconButton";
import Select from "../primitives/Select";
import TextField from "../primitives/TextField";

type CatalogTab = "city" | "heroes" | "dungeon" | "storage";
type DialogExample = "choice" | "blocking" | null;

export default function CatalogExtendedSections() {
  const [selectedCard, setSelectedCard] = useState("forge");
  const [activeTab, setActiveTab] = useState<CatalogTab>("city");
  const [dialogExample, setDialogExample] = useState<DialogExample>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);

  return <>
    <Panel title="Variantes de contrôles" subtitle="Tailles, icônes, recherche, sélection et cases" testId="catalog-control-variants" titleAs="h2">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <div className="flex flex-wrap items-start gap-3"><Button size="sm"><Shield className="h-4 w-4" />Petit avec icône</Button><IconButton label="Action iconique indisponible" disabled><Sparkles className="h-4 w-4" /></IconButton></div>
          <Button block variant="primary"><Database className="h-4 w-4" />Action pleine largeur</Button>
          <TextField label="Recherche" type="search" leading={<Search className="h-4 w-4" />} placeholder="Rechercher un objet…" />
          <TextField label="Valeur en lecture seule" readOnly defaultValue="État confirmé" description="Consultable mais non modifiable." />
        </div>
        <div className="grid content-start gap-3">
          <Select label="Type d’objet" defaultValue="weapon" description="Filtre natif accessible."><option value="weapon">Armes</option><option value="armor">Armures</option></Select>
          <Select label="Sélection en erreur" defaultValue="" error="Choisissez une option valide."><option value="">Aucune option</option><option value="valid">Option valide</option></Select>
          <Select label="Sélection désactivée" disabled><option>Indisponible</option></Select>
          <Checkbox label="Accepter l’amélioration" description="La dépense supplémentaire sera confirmée." />
          <Checkbox label="Option verrouillée" disabled />
        </div>
      </div>
    </Panel>

    <Panel title="Sélection, badges et métriques" subtitle="Cartes interactives, traits, ressources et emplacements vides" testId="catalog-selection-metrics" titleAs="h2">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          <SelectableCard selected={selectedCard === "forge"} onClick={() => setSelectedCard("forge")}><strong className="block text-ui-text">Forge rustique</strong><span className="text-xs">Bâtiment sélectionnable</span></SelectableCard>
          <SelectableCard selected={selectedCard === "mine"} onClick={() => setSelectedCard("mine")}><strong className="block text-ui-text">Mine de pierre</strong><span className="text-xs">Bâtiment disponible</span></SelectableCard>
          <SelectableCard selected={false} disabled><strong className="block">Quartier verrouillé</strong><span className="text-xs">Sélection indisponible</span></SelectableCard>
          <EmptySlot>Place libre dans le groupe</EmptySlot>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2"><Badge>Neutre</Badge><Badge tone="accent">Rare</Badge><Badge tone="success">Actif</Badge><Badge tone="warning">Élite</Badge><Badge tone="danger">Danger</Badge><Badge tone="info">Mana</Badge><Badge tone="observer">Observateur</Badge></div>
          <div className="grid gap-2 sm:grid-cols-2"><Metric label="Or" value="12 450" detail="+24/s" icon="🪙" /><Metric label="Population" value="18/24" icon={<UserRound className="h-5 w-5" />} /></div>
        </div>
      </div>
    </Panel>

    <Panel title="Progressions" subtitle="Valeurs métier, jauges compactes et progression du Donjon" testId="catalog-progressions" titleAs="h2">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-3"><Progress label="Points de vie" value={72} max={100} size="compact" tone="health" /><Progress label="Mana" value={31} max={60} size="compact" tone="mana" /><Progress label="Expérience" value={840} max={1200} size="compact" tone="experience" /><Progress label="Progression sans valeur affichée" value={45} showValue={false} /></div>
        <RoomProgress label="Salles du Donjon" steps={[{ id: "1", label: "1", state: "completed" }, { id: "2", label: "2", state: "current" }, { id: "3", label: "3", state: "upcoming" }, { id: "boss", label: "4", state: "upcoming", boss: true }]} />
      </div>
    </Panel>

    <Panel title="Divulgation et journal" subtitle="Contenu repliable, filtres et chronologie" testId="catalog-disclosure-log" titleAs="h2">
      <div className="grid gap-4 lg:grid-cols-2">
        <Disclosure title="Filtres avancés" subtitle="Deux critères actifs"><div className="grid gap-3 sm:grid-cols-2"><Select label="Rareté"><option>Toutes</option><option>Épique</option></Select><Checkbox label="Objets équipables uniquement" /></div></Disclosure>
        <ActivityLog title="Historique" subtitle="Événements canoniques et notes locales" emptyMessage="Aucun événement." action={<Button size="sm">Effacer les notes</Button>} entries={[{ id: "1", timestamp: "12:04", content: "La Forge a terminé une épée.", tone: "success" }, { id: "2", timestamp: "12:08", content: "Le groupe entre dans la salle 2." }]} />
      </div>
    </Panel>

    <Panel title="Navigation et bannières" subtitle="États persistants de l’application" testId="catalog-navigation-status" titleAs="h2">
      <div className="grid gap-4">
        <NavigationTabs label="Navigation principale d’exemple" activeId={activeTab} onChange={setActiveTab} items={[{ id: "city", label: "Cité", icon: "🏰" }, { id: "heroes", label: "Aventuriers", icon: "⚔" }, { id: "dungeon", label: "Donjon", icon: "🛡" }, { id: "storage", label: "Coffre", icon: "📦", disabled: true }]} />
        <StatusBanner tone="warning">Mode hors connexion — cache en lecture seule.</StatusBanner>
        <StatusBanner tone="observer" action={<Button size="sm">Prendre le contrôle</Button>}>La partie est contrôlée dans un autre onglet.</StatusBanner>
        <StatusBanner tone="info">L’état serveur a été actualisé.</StatusBanner>
      </div>
    </Panel>

    <Panel title="États d’entrée et chargement" subtitle="Authentification, récupération et erreur bloquante" testId="catalog-entry-states" titleAs="h2">
      <div className="grid gap-4 lg:grid-cols-2">
        <EntryScreen preview><div className="text-center"><div className="mx-auto mb-3 text-3xl">🏰</div><h3 className="font-serif font-bold text-ui-accent">Idle City Donjon</h3><p className="mt-2 text-sm text-ui-text-muted">Accès au royaume</p><Button block className="mt-4">S’identifier</Button></div></EntryScreen>
        <div className="grid gap-4"><LoadingState title="Chargement du Royaume" description="Récupération de l’état canonique confirmé…" /><Alert variant="error" title="La partie doit être rechargée"><p>Une erreur d’affichage est survenue.</p><Button size="sm" variant="danger" className="mt-3">Recharger</Button></Alert></div>
      </div>
    </Panel>

    <Panel title="Notifications dynamiques et invite différée" subtitle="Annonce accessible et action flottante replacée dans son contexte" testId="catalog-dynamic-feedback" titleAs="h2">
      <div className="relative grid min-h-40 content-start gap-4 rounded-ui-panel border border-ui-border-subtle bg-ui-surface p-4">
        <Button size="sm" onClick={() => setLiveMessage("La synchronisation est terminée.")}>Simuler une notification</Button>
        {liveMessage && <Alert variant="success" live="polite">{liveMessage}</Alert>}
        <FloatingPrompt icon="🙏" className="self-end justify-self-start">Choisir la vocation plus tard</FloatingPrompt>
      </div>
    </Panel>

    <Panel title="Variantes de dialogue" subtitle="Choix, contenu défilant, backdrop et opération bloquée" testId="catalog-dialog-variants" titleAs="h2">
      <div className="flex flex-wrap gap-3"><Button className="inline-flex items-center gap-2 whitespace-nowrap" onClick={() => setDialogExample("choice")}><Swords className="h-4 w-4 shrink-0" />Ouvrir un choix</Button><Button onClick={() => setDialogExample("blocking")}>Ouvrir une opération bloquée</Button></div>
    </Panel>

    {dialogExample === "choice" && <Dialog title="Choisir une vocation" description="Sélection métier dans un dialogue défilant." dismissOnBackdrop onDismiss={() => setDialogExample(null)} footer={<Button onClick={() => setDialogExample(null)}>Décider plus tard</Button>} className="max-w-xl"><div className="grid gap-3"><SelectableCard selected={false}>Guerrier · affinité dominante</SelectableCard><SelectableCard selected={false}>Mage · affinité relative 82 %</SelectableCard><SelectableCard selected={false}>Rôdeur · affinité relative 68 %</SelectableCard></div></Dialog>}
    {dialogExample === "blocking" && <Dialog title="Synchronisation en cours" description="Escape et le backdrop sont temporairement désactivés." dismissDisabled onDismiss={() => setDialogExample(null)} footer={<Button variant="primary" onClick={() => setDialogExample(null)}>Terminer la simulation</Button>}><Alert variant="info">La commande serveur est encore en cours de traitement.</Alert><Button busy block className="mt-4">Chargement</Button></Dialog>}
  </>;
}
