import { useId, type ReactNode } from "react";
import { classNames } from "../classNames";

export type PanelProps = {
  title: string;
  subtitle?: string;
  testId?: string;
  className?: string;
  contentClassName?: string;
  contentTestId?: string;
  variant?: "default" | "strong";
  titleAs?: "h2" | "h3" | "h4";
  children: ReactNode;
};

export default function Panel({ title, subtitle, testId, className, contentClassName, contentTestId, variant = "default", titleAs: Title = "h3", children }: PanelProps) {
  const strong = variant === "strong";
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} data-testid={testId} data-panel-variant={variant} className={classNames("ui-panel-skin min-w-0 rounded-ui-panel border-ui-border p-4 shadow-ui-panel", strong ? "border-2 bg-ui-panel-strong" : "border bg-ui-panel", className)}>
      <header className={classNames("shrink-0", strong ? "mb-3" : "mb-4")}>
        <Title id={titleId} className={classNames("font-serif text-sm font-bold uppercase tracking-widest", strong ? "text-ui-accent-strong" : "text-ui-accent")}>{title}</Title>
        {subtitle && <p className="mt-1 text-xs text-ui-text-muted">{subtitle}</p>}
        <div className="ui-panel-title-separator mt-2" aria-hidden="true" />
      </header>
      <div data-testid={contentTestId} className={contentClassName}>{children}</div>
    </section>
  );
}
