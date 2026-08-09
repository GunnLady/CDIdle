import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { classNames } from "../classNames";

export type DisclosureProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  testId?: string;
};

export default function Disclosure({ title, subtitle, children, defaultOpen = false, className, testId }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details data-testid={testId} open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className={classNames("group rounded-ui-panel border border-ui-border bg-ui-panel", className)}>
      <summary className="flex min-h-ui-control cursor-pointer list-none items-center justify-between gap-3 rounded-ui-panel px-4 py-3 focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] [&::-webkit-details-marker]:hidden">
        <span><span className="block font-serif text-sm font-bold text-ui-accent">{title}</span>{subtitle && <span className="mt-0.5 block text-xs text-ui-text-muted">{subtitle}</span>}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ui-accent transition-transform duration-[var(--ui-motion-fast)] group-open:rotate-180" />
      </summary>
      <div className="border-t border-ui-border-subtle p-4">{children}</div>
    </details>
  );
}
