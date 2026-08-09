import type { ReactNode } from "react";

export default function DungeonPanelFrame({
  title,
  subtitle,
  testId,
  className = "",
  contentClassName = "",
  contentTestId,
  children,
}: {
  title: string;
  subtitle?: string;
  testId: string;
  className?: string;
  contentClassName?: string;
  contentTestId?: string;
  children: ReactNode;
}) {
  return <section data-testid={testId} className={`rounded-xl border-2 border-[#5c402b] bg-[#18110b] p-4 shadow-xl ${className}`}>
    <header className="mb-3 border-b border-[#5c402b]/40 pb-2">
      <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#d4af37]">{title}</h3>
      {subtitle && <p className="mt-1 text-[10px] text-[#a89078]">{subtitle}</p>}
    </header>
    <div data-testid={contentTestId} className={contentClassName}>{children}</div>
  </section>;
}
