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
