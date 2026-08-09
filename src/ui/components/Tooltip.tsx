import { useId, type ReactNode } from "react";
import { classNames } from "../classNames";

export type TooltipProps = {
  label: string;
  content: string;
  children: ReactNode;
  className?: string;
};

export default function Tooltip({ label, content, children, className }: TooltipProps) {
  const tooltipId = useId();
  return (
    <span tabIndex={0} aria-label={label} aria-describedby={tooltipId} className={classNames("group relative inline-flex rounded-sm focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)]", className)}>
      {children}
      <span id={tooltipId} role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-[var(--ui-layer-status)] mb-2 w-max max-w-[min(14rem,calc(100vw-2rem))] translate-x-0 rounded-ui-control border border-ui-border bg-ui-panel px-2 py-1 text-xs text-ui-text opacity-0 shadow-ui-panel transition-opacity duration-[var(--ui-motion-fast)] group-hover:opacity-100 group-focus-visible:opacity-100 sm:left-1/2 sm:-translate-x-1/2">
        {content}
      </span>
    </span>
  );
}
