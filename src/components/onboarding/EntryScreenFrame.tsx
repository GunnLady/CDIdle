import type { ReactNode } from "react";

export default function EntryScreenFrame(props: { children: ReactNode; wide?: boolean; testId: string }) {
  return <main data-testid={props.testId} className="min-h-screen overflow-y-auto bg-[#060403] p-4 text-[#e3dbc8] selection:bg-[#926430]/60">
    <div className="pointer-events-none fixed left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#8c5a2b]/10 blur-[120px]" />
    <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-red-950/20 blur-[140px]" />
    <div className="relative flex min-h-[calc(100vh-2rem)] items-center justify-center">
      <div className={`w-full rounded-3xl border-2 border-[#5c402b] bg-[#160f0a] p-6 shadow-[0_10px_50px_rgba(0,0,0,0.85)] sm:p-8 ${props.wide ? "max-w-7xl" : "max-w-md"}`}>
        {props.children}
      </div>
    </div>
  </main>;
}
