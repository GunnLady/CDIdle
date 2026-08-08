import type { ReactNode } from "react";

export default function HeroPanelFrame({ title, subtitle, testId, className, contentClassName, children }: {
  title: string;
  subtitle?: string;
  testId: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return <section data-testid={testId} className={`rounded-xl border border-[#5c402b] bg-[#18100a] p-4 shadow-lg ${className ?? ""}`}>
    <header className="mb-4 shrink-0 border-b border-[#3c291a] pb-3">
      <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#caa050]">{title}</h3>
      {subtitle && <p className="mt-1 text-[10px] text-[#9f8872]">{subtitle}</p>}
    </header>
    <div className={contentClassName}>{children}</div>
  </section>;
}
