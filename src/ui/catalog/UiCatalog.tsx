import { useState } from "react";
import { Info, Sparkles } from "lucide-react";
import Alert from "../components/Alert";
import Card from "../components/Card";
import Dialog from "../components/Dialog";
import Panel from "../components/Panel";
import Progress from "../components/Progress";
import Tooltip from "../components/Tooltip";
import Button from "../primitives/Button";
import IconButton from "../primitives/IconButton";
import TextField from "../primitives/TextField";
import CatalogExtendedSections from "./CatalogExtendedSections";
import CatalogProductSections from "./CatalogProductSections";
import buildingCabane from "../../assets/images/ui/buildings/building-card-habitation-v1.jpg";
import buildingFerme from "../../assets/images/ui/buildings/building-card-ferme-v1.jpg";
import buildingForge from "../../assets/images/ui/buildings/building-card-forge-v1.jpg";

const privateUiCatalogMarker = "CDIDLE_PRIVATE_UI_CATALOG";

export default function UiCatalog() {
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <main data-testid="ui-catalog-root" data-private-marker={privateUiCatalogMarker} className="min-h-screen min-w-0 bg-ui-canvas p-4 text-ui-text sm:p-8">
      <div className="mx-auto grid w-full min-w-0 max-w-5xl gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ui-text-muted">Catalogue prive de developpement</p>
          <h1 className="font-serif text-3xl font-bold text-ui-accent">CDIdle UI Catalog</h1>
        </header>

        <Panel title="Boutons" subtitle="Actions principales, secondaires et etats indisponibles" testId="catalog-buttons" titleAs="h2">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Action principale</Button>
            <Button>Action secondaire</Button>
            <Button variant="danger">Action dangereuse</Button>
            <Button variant="ghost">Action discrete</Button>
            <Button disabled>Desactive</Button>
            <Button busy>Chargement</Button>
            <span><Button disabled aria-describedby="catalog-locked-reason">Verrouille</Button><span id="catalog-locked-reason" className="mt-1 block max-w-40 text-xs text-ui-locked-text">Requiert Forge niveau 1.</span></span>
            <IconButton label="Generer un exemple"><Sparkles className="h-4 w-4" /></IconButton>
          </div>
        </Panel>

        <Panel title="Variantes chêne intégrées" subtitle="Composants Button et IconButton réels de production" testId="catalog-button-skin-prototypes" variant="strong" titleAs="h2">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primaire</Button>
            <Button>Secondaire</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Désactivé</Button>
            <Button variant="primary" busy>Chargement</Button>
            <Button size="sm" variant="primary">Petit</Button>
            <IconButton size="sm" variant="primary" label="Action iconique"><Sparkles className="h-4 w-4" /></IconButton>
          </div>
          <p className="mt-4 text-xs text-ui-text-muted">Les états désactivé et chargement dérivent de la variante demandée sans asset supplémentaire.</p>
        </Panel>

        <Panel title="Prototype des cartes Bâtiments" subtitle="Illustrations plein cadre avec fondu atmosphérique sous le texte" testId="catalog-building-card-prototypes" variant="strong" titleAs="h2">
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { id: "cabane", name: "Cabane", category: "Logement", description: "Augmente la population maximale.", level: "Niv. 1/10", image: buildingCabane, state: "selected" },
              { id: "ferme", name: "Ferme", category: "Production", description: "Produit la nourriture de la colonie.", level: "Niv. 3/10", image: buildingFerme, state: "available" },
              { id: "forge", name: "Forge rustique", category: "Vocation", description: "Façonne les équipements des champions.", level: "Verrouillée", image: buildingForge, state: "locked" },
            ].map((building) => <button key={building.id} type="button" data-prototype-state={building.state} aria-pressed={building.state === "selected"} className={`group relative h-[156px] min-w-0 overflow-hidden bg-transparent text-left shadow-[0_8px_18px_rgba(0,0,0,0.42)] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f4d58d] ${building.state === "selected" ? "brightness-110" : building.state === "locked" ? "grayscale opacity-55" : "hover:-translate-y-px"}`}>
              <span className="pointer-events-none absolute inset-0 overflow-hidden [clip-path:polygon(16px_0,calc(100%_-_16px)_0,100%_16px,100%_calc(100%_-_16px),calc(100%_-_16px)_100%,16px_100%,0_calc(100%_-_16px),0_16px)]">
                <img src={building.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#111419]/20 to-[#090b0f]/80" />
                <span className="absolute inset-0 bg-[#d7ad68]/0 transition-colors duration-150 group-hover:bg-[#d7ad68]/[0.06]" />
              </span>
              <span className="ui-building-card-frame pointer-events-none absolute inset-0 z-20" />
              <span className="ui-building-card-copy relative z-10 ml-auto flex h-full w-[54%] min-w-0 flex-col justify-center px-4 py-4">
                <span className="min-w-0"><span className="block whitespace-normal break-words font-serif text-sm font-bold leading-tight text-[#f0dfbe] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{building.name}</span><span className="mt-1 block font-serif text-[9px] font-bold text-[#e0bd58]">{building.level}</span><span className="mt-0.5 block font-mono text-[8px] uppercase tracking-wider text-[#bca27e]">{building.category}</span></span>
                <span className="mt-2 line-clamp-3 block text-[10px] leading-relaxed text-[#c8b9a4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">{building.description}</span>
              </span>
            </button>)}
          </div>
          <p className="mt-4 text-xs text-ui-text-muted">États montrés : Cabane sélectionnée, Ferme disponible, Forge verrouillée. Prototype catalogue uniquement.</p>
        </Panel>

        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="Champs" subtitle="Libelles, aide et erreur" testId="catalog-fields" titleAs="h2">
            <div className="grid gap-4">
              <TextField label="Nom du village" description="Visible par les visiteurs." defaultValue="Valdor" />
              <TextField label="Code d'invitation" error="Ce code n'est plus valide." defaultValue="EXPIRE" />
              <TextField label="Lecture seule" disabled defaultValue="Indisponible" />
            </div>
          </Panel>
          <Panel title="Panneau renforce" subtitle="Surface a priorite visuelle" testId="catalog-strong-panel" variant="strong" titleAs="h2">
            <Progress label="Construction" value={64} />
          </Panel>
        </div>

        <Panel title="Cartes et aide contextuelle" subtitle="Contenus selectionnes et information au focus" testId="catalog-cards" titleAs="h2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card><strong className="text-sm">Epee de voyage</strong><p className="text-xs text-ui-text-muted">Objet disponible.</p></Card>
            <Card selected><strong className="text-sm">Bouclier ancien</strong><p className="text-xs text-ui-text-muted">Objet selectionne.</p></Card>
          </div>
          <div className="mt-4 flex items-center gap-3"><Tooltip label="Aide contextuelle" content="Information disponible au survol et au focus"><Info className="h-5 w-5" /></Tooltip><span className="text-sm">Aide contextuelle accessible</span></div>
        </Panel>

        <Panel title="Retours d'etat" subtitle="Messages representatifs" testId="catalog-feedback" titleAs="h2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Alert variant="info" title="Information">Le marchand arrivera au prochain cycle.</Alert>
            <Alert variant="success" title="Succes">La construction est terminee.</Alert>
            <Alert variant="warning" title="Attention">Les ressources sont presque epuisees.</Alert>
            <Alert variant="error" title="Erreur">La commande n'a pas pu etre appliquee.</Alert>
            <Alert variant="observer" title="Observateur">Le royaume est controle dans un autre onglet.</Alert>
            <Alert variant="locked" title="Verrouille">Requiert Forge niveau 1.</Alert>
          </div>
        </Panel>

        <Panel title="Dialogue" subtitle="Focus contraint, fermeture Escape et restauration" testId="catalog-dialog" titleAs="h2">
          <Button onClick={() => setDialogOpen(true)}>Ouvrir le dialogue</Button>
        </Panel>
        <CatalogExtendedSections />
        <CatalogProductSections />
      </div>
      {dialogOpen && <Dialog title="Confirmer l'action" description="Exemple transversal sans regle metier." onDismiss={() => setDialogOpen(false)} footer={<><Button onClick={() => setDialogOpen(false)}>Annuler</Button><Button variant="primary" onClick={() => setDialogOpen(false)}>Confirmer</Button></>}><p className="text-sm text-ui-text">Le focus reste dans cette fenetre tant qu'elle est ouverte.</p></Dialog>}
    </main>
  );
}
