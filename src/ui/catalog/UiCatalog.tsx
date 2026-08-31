import { Sparkles } from "lucide-react";
import Alert from "../components/Alert";
import Button from "../primitives/Button";
import IconButton from "../primitives/IconButton";
import CatalogExtendedSections from "./CatalogExtendedSections";
import CatalogSection from "./CatalogSection";

const privateUiCatalogMarker = "CDIDLE_PRIVATE_UI_CATALOG";

export default function UiCatalog() {
  return (
    <main data-testid="ui-catalog-root" data-private-marker={privateUiCatalogMarker} className="min-h-screen min-w-0 bg-[#d8d2c6] p-4 text-ui-text sm:p-8">
      <div className="mx-auto grid w-full min-w-0 max-w-5xl gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ui-text-muted">Catalogue prive de developpement</p>
          <h1 className="font-serif text-3xl font-bold text-ui-accent">CDIdle UI Catalog</h1>
        </header>

        <CatalogSection title="Boutons" subtitle="Actions principales, secondaires et états indisponibles" testId="catalog-buttons">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">Action principale</Button>
            <Button>Action secondaire</Button>
            <Button variant="danger">Action dangereuse</Button>
            <Button variant="ghost">Action discrète</Button>
            <Button disabled>Désactivé</Button>
            <Button busy>Chargement</Button>
            <span><Button disabled aria-describedby="catalog-locked-reason">Verrouillé</Button><span id="catalog-locked-reason" className="mt-1 block max-w-40 text-xs text-ui-locked-text">Requiert Forge niveau 1.</span></span>
            <IconButton label="Générer un exemple"><Sparkles className="h-4 w-4" /></IconButton>
          </div>
        </CatalogSection>

        <CatalogSection title="Panneaux" subtitle="Un cadre transparent 9-slice, deux fonds existants" testId="catalog-panel-surfaces">
          <div className="grid gap-4 md:grid-cols-2">
            <figure className="min-w-0">
              <figcaption className="mb-2 text-xs text-ui-text-muted">Bois</figcaption>
              <div data-testid="catalog-panel-surface-wood" data-panel-material="wood" className="ui-catalog-panel-surface min-h-36 p-5">
                <strong className="font-serif text-sm text-[#f0dfbe]">Surface standard</strong>
              </div>
            </figure>
            <figure className="min-w-0">
              <figcaption className="mb-2 text-xs text-ui-text-muted">Ardoise</figcaption>
              <div data-testid="catalog-panel-surface-slate" data-panel-material="slate" className="ui-catalog-panel-surface min-h-36 p-5">
                <strong className="font-serif text-sm text-[#f0dfbe]">Surface Héros</strong>
              </div>
            </figure>
          </div>
        </CatalogSection>

        <CatalogExtendedSections />

        <CatalogSection title="Retours d'état" subtitle="Messages représentatifs" testId="catalog-feedback">
          <div className="grid gap-3 sm:grid-cols-2">
            <Alert variant="info" title="Information">Le marchand arrivera au prochain cycle.</Alert>
            <Alert variant="success" title="Succès">La construction est terminée.</Alert>
            <Alert variant="warning" title="Attention">Les ressources sont presque épuisées.</Alert>
            <Alert variant="error" title="Erreur">La commande n'a pas pu être appliquée.</Alert>
            <Alert variant="observer" title="Observateur">Le royaume est contrôlé dans un autre onglet.</Alert>
            <Alert variant="locked" title="Verrouillé">Requiert Forge niveau 1.</Alert>
          </div>
        </CatalogSection>
      </div>
    </main>
  );
}
