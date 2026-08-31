import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { classNames } from "../classNames";

export type DisclosureProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: "default" | "plain";
  className?: string;
  testId?: string;
};

export default function Disclosure({ title, subtitle, children, defaultOpen = false, variant = "default", className, testId }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const plain = variant === "plain";
  return (
    <details data-testid={testId} open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className={classNames("group", plain ? "bg-transparent" : "rounded-ui-panel border border-ui-border bg-ui-panel", className)}>
      <summary className={classNames("flex cursor-pointer list-none items-center justify-between gap-3 focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] [&::-webkit-details-marker]:hidden", plain ? "min-h-0 p-0" : "min-h-ui-control rounded-ui-panel px-4 py-3")}>
        <span><span className={classNames("block font-serif font-bold text-ui-accent", plain ? "text-[15px]" : "text-sm")}>{title}</span>{subtitle && <span className={classNames("mt-0.5 block text-ui-text-muted", plain ? "text-[13px]" : "text-xs")}>{subtitle}</span>}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ui-accent transition-transform duration-[var(--ui-motion-fast)] group-open:rotate-180" />
      </summary>
      <div className={plain ? "mt-3 pt-3" : "border-t border-ui-border-subtle p-4"}>{children}</div>
    </details>
  );
}
