import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../classNames";

export type AlertVariant = "info" | "success" | "warning" | "error" | "observer" | "locked";

const variantClasses: Record<AlertVariant, string> = {
  info: "border-ui-info-border bg-ui-info-surface text-ui-info-text",
  success: "border-ui-success-border bg-ui-success-surface text-ui-success-text",
  warning: "border-ui-warning-border bg-ui-warning-surface text-ui-warning-text",
  error: "border-ui-danger-border bg-ui-danger-surface text-ui-danger-text",
  observer: "border-ui-observer-border bg-ui-observer-surface text-ui-observer-text",
  locked: "border-ui-locked-border bg-ui-locked-surface text-ui-locked-text",
};

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
  live?: "polite" | "assertive";
  children: ReactNode;
};

export default function Alert({ variant = "info", title, live, role, className, children, ...props }: AlertProps) {
  const effectiveRole = role ?? (live === "assertive" ? "alert" : live === "polite" ? "status" : undefined);
  return (
    <div {...props} role={effectiveRole} aria-live={live} className={classNames("rounded-ui-control border px-4 py-3 text-sm", variantClasses[variant], className)}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      {children}
    </div>
  );
}
