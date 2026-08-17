import type { ReactNode } from "react";
import SecondaryNavigationRailFrame from "./SecondaryNavigationRailFrame";

interface AppShellProps {
  header: ReactNode;
  statusLayer: ReactNode;
  developerTools?: ReactNode;
  navigation: ReactNode;
  progress?: ReactNode;
  children: ReactNode;
}

export default function AppShell(props: AppShellProps) {
  return <div data-testid="app-shell" className="app-shell-background min-h-screen bg-[#110905] text-[#fbf7f0] flex flex-col font-sans selection:bg-[#ae8650] selection:text-white xl:h-screen xl:overflow-hidden">
    {props.header}
    {props.statusLayer}
    <PageViewport>
      {props.developerTools}
      <div data-testid="persistent-page-navigation" className="relative z-30 space-y-4 xl:flex xl:items-stretch xl:gap-0 xl:space-y-0 min-[1440px]:-mx-6 min-[1440px]:-mt-[10px] min-[1440px]:h-[178px] min-[1440px]:w-[1440px] min-[1440px]:shrink-0">
        <SecondaryNavigationRailFrame />
        <div data-testid="primary-navigation-slot" className="relative xl:basis-[40%] xl:shrink-0 min-[1440px]:absolute min-[1440px]:left-[113px] min-[1440px]:top-[36px] min-[1440px]:h-[105px] min-[1440px]:w-[496px] min-[1440px]:basis-auto">{props.navigation}</div>
        {props.progress && <div data-testid="dungeon-progress-slot" className="relative z-30 xl:min-w-0 xl:flex-1 xl:border-l xl:border-[#5c402b] min-[1440px]:absolute min-[1440px]:left-[645px] min-[1440px]:top-[35px] min-[1440px]:h-[102px] min-[1440px]:w-[600px] min-[1440px]:border-0">{props.progress}</div>}
      </div>
      <div data-testid="page-content-scroll-region" className="h-full">{props.children}</div>
    </PageViewport>
  </div>;
}

export function PageViewport({ children }: { children: ReactNode }) {
  return <main className="app-page-viewport min-h-0 flex-1 w-full overflow-visible xl:overflow-x-hidden xl:overflow-y-auto select-none text-[15px] sm:text-base leading-relaxed">
    <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col gap-3 p-3 sm:gap-4 sm:px-6 sm:py-4 xl:pt-2.5">
      {children}
    </div>
  </main>;
}
