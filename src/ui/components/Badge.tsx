import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../classNames";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "observer";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-ui-border-subtle bg-ui-surface text-ui-text-muted",
  accent: "border-ui-border bg-ui-panel text-ui-accent",
  success: "border-ui-success-border bg-ui-success-surface text-ui-success-text",
  warning: "border-ui-warning-border bg-ui-warning-surface text-ui-warning-text",
  danger: "border-ui-danger-border bg-ui-danger-surface text-ui-danger-text",
  info: "border-ui-info-border bg-ui-info-surface text-ui-info-text",
  observer: "border-ui-observer-border bg-ui-observer-surface text-ui-observer-text",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; children: ReactNode };

export default function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return <span {...props} className={classNames("inline-flex min-h-6 items-center rounded-ui-control border px-2 py-0.5 text-xs font-semibold", toneClasses[tone], className)}>{children}</span>;
}
