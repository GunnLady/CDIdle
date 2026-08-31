import type { ReactNode } from "react";
import { classNames } from "../../ui/classNames";

export default function HeroDetailFrame({ compact = false, className, children }: {
  compact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return <div className={classNames("relative isolate min-w-0 bg-black/24", compact ? "px-3 py-3" : "px-5 py-4", className)}>
    <span aria-hidden="true" data-frame-size={compact ? "compact" : "default"} className="ui-building-card-frame ui-hero-detail-frame pointer-events-none absolute inset-0 z-20" />
    <div className="relative z-10">{children}</div>
  </div>;
}
