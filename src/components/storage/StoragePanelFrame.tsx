import type { ReactNode } from "react";

export default function StoragePanelFrame(props: {
  title: string;
  subtitle?: string;
  testId: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return <section data-testid={props.testId} className={`rounded-xl border border-[#5c402b] bg-[#18100a] p-4 shadow-lg ${props.className ?? ""}`}>
    <header className="mb-4 shrink-0 border-b border-[#3c291a] pb-3">
      <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#caa050]">{props.title}</h3>
      {props.subtitle && <p className="mt-1 text-[10px] text-[#9f8872]">{props.subtitle}</p>}
    </header>
    <div className={props.contentClassName}>{props.children}</div>
  </section>;
}
