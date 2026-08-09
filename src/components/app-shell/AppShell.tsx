import type { ReactNode } from "react";

interface AppShellProps {
  header: ReactNode;
  statusLayer: ReactNode;
  developerTools?: ReactNode;
  navigation: ReactNode;
  progress?: ReactNode;
  children: ReactNode;
}

export default function AppShell(props: AppShellProps) {
  return <div data-testid="app-shell" className="h-screen min-h-screen overflow-hidden bg-[#110905] text-[#fbf7f0] flex flex-col font-sans selection:bg-[#ae8650] selection:text-white">
    {props.header}
    {props.statusLayer}
    <PageViewport>
      {props.developerTools}
      <div data-testid="persistent-page-navigation" className="sticky top-0 z-30 space-y-4 xl:flex xl:items-stretch xl:gap-0 xl:space-y-0 xl:rounded-xl xl:border xl:border-[#5c402b] xl:bg-[#18100a] xl:p-1.5 xl:shadow-lg">
        <div data-testid="primary-navigation-slot" className="xl:basis-[40%] xl:shrink-0">{props.navigation}</div>
        {props.progress && <div data-testid="dungeon-progress-slot" className="xl:min-w-0 xl:flex-1 xl:border-l xl:border-[#5c402b]">{props.progress}</div>}
      </div>
      <div className="h-full">{props.children}</div>
    </PageViewport>
  </div>;
}

export function PageViewport({ children }: { children: ReactNode }) {
  return <main className="min-h-0 flex-1 p-3 sm:p-6 overflow-y-auto max-w-[1440px] mx-auto w-full flex flex-col gap-4 select-none text-[15px] sm:text-base leading-relaxed">
    {children}
  </main>;
}
