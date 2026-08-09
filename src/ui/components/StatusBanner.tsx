import type { ReactNode } from "react";
import { classNames } from "../classNames";

export type StatusBannerTone = "info" | "warning" | "observer";

const toneClasses: Record<StatusBannerTone, string> = {
  info: "border-ui-info-border bg-ui-info-surface text-ui-info-text",
  warning: "border-ui-warning-border bg-ui-warning-surface text-ui-warning-text",
  observer: "border-ui-observer-border bg-ui-observer-surface text-ui-observer-text",
};

export type StatusBannerProps = {
  tone?: StatusBannerTone;
  children: ReactNode;
  action?: ReactNode;
  live?: boolean;
  sticky?: boolean;
  className?: string;
};

export default function StatusBanner({ tone = "info", children, action, live = false, sticky = false, className }: StatusBannerProps) {
  return (
    <div role={live ? "status" : undefined} aria-live={live ? "polite" : undefined} className={classNames("flex min-h-ui-control min-w-0 max-w-full flex-wrap items-center justify-center gap-3 border px-4 py-2 text-center text-sm", toneClasses[tone], sticky && "sticky top-0 z-[var(--ui-layer-status)]", className)}>
      <span className="min-w-0 break-words">{children}</span>{action}
    </div>
  );
}
