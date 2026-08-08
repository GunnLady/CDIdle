import type { ReactNode } from "react";
import { BUILD_VERSION, DISPLAY_BUILD_VERSION } from "../../lib/buildVersion";

interface AppShellProps {
  header: ReactNode;
  statusLayer: ReactNode;
  beforeViewport?: ReactNode;
  developerTools?: ReactNode;
  navigation: ReactNode;
  progress?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export default function AppShell(props: AppShellProps) {
  return <div data-testid="app-shell" className="h-screen min-h-screen overflow-hidden bg-[#110905] text-[#fbf7f0] flex flex-col font-sans selection:bg-[#ae8650] selection:text-white">
    {props.header}
    {props.statusLayer}
    {props.beforeViewport}
    <PageViewport>
      {props.developerTools}
      <div data-testid="persistent-page-navigation" className="sticky top-0 z-30 space-y-4 xl:flex xl:items-stretch xl:gap-0 xl:space-y-0 xl:rounded-xl xl:border xl:border-[#5c402b] xl:bg-[#18100a] xl:p-1.5 xl:shadow-lg">
        <div data-testid="primary-navigation-slot" className="xl:basis-[40%] xl:shrink-0">{props.navigation}</div>
        {props.progress && <div data-testid="dungeon-progress-slot" className="xl:min-w-0 xl:flex-1 xl:border-l xl:border-[#5c402b]">{props.progress}</div>}
      </div>
      <div className="h-full">{props.children}</div>
    </PageViewport>
    {props.footer}
  </div>;
}

export function PageViewport({ children }: { children: ReactNode }) {
  return <main className="min-h-0 flex-1 p-3 sm:p-6 overflow-y-auto max-w-[1440px] mx-auto w-full flex flex-col gap-4 select-none text-[15px] sm:text-base leading-relaxed">
    {children}
  </main>;
}

interface AppFooterProps {
  totalCitizens: number;
  heroesCount: number;
  highestFloor: number;
}

export function AppFooter(props: AppFooterProps) {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-center text-xs text-gray-500 font-mono mt-auto shrink-0 select-none">
      <p>© 2026 Colonie &amp; Donjon Idle. Tous droits réservés. Bâti sur les sables fins d&apos;Antigravity.</p>
      <p className="text-[10px] text-indigo-400 mt-1">Taux globaux : {props.totalCitizens} Citoyens • {props.heroesCount} Champions • Étage record : {props.highestFloor}</p>
      <p className="text-[10px] text-slate-500 mt-1 select-text" title={`Version complète : ${BUILD_VERSION}`}>Build {DISPLAY_BUILD_VERSION}</p>
    </footer>
  );
}
