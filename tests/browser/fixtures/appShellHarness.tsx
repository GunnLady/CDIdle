import { createRoot } from "react-dom/client";
import AppShell from "../../../src/components/app-shell/AppShell";
import ResourceHeader from "../../../src/components/app-shell/ResourceHeader";
import "../../../src/index.css";

function Harness() {
  return <AppShell
    header={<div data-testid="shell-resource-header"><ResourceHeader cityName="Valbois" authenticated resources={{ gold: 10, food: 10, wood: 10, stone: 10, ore: 10 }} rates={{ food: 1, wood: 1, stone: 1, ore: 1 }} accountActive={false} onOpenAccount={() => undefined} /></div>}
    statusLayer={null}
    navigation={<nav className="h-16 bg-ui-panel p-4">Navigation</nav>}
    progress={<aside className="h-24 bg-ui-panel p-4">Rappel Donjon</aside>}
  >
    <section data-testid="shell-tall-content" className="h-[1800px] bg-ui-surface p-4">Contenu long</section>
  </AppShell>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
