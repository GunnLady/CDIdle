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
  typography?: "default" | "large";
  titleAs?: "h2" | "h3" | "h4";
  children: ReactNode;
};

export default function Panel({ title, subtitle, testId, className, contentClassName, contentTestId, variant = "default", typography = "default", titleAs: Title = "h3", children }: PanelProps) {
  const strong = variant === "strong";
  const largeTypography = typography === "large";
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} data-testid={testId} data-panel-variant={variant} className={classNames("ui-panel-skin min-w-0 rounded-ui-panel border-ui-border p-4 shadow-ui-panel", strong ? "border-2 bg-ui-panel-strong" : "border bg-ui-panel", className)}>
      <header className={classNames("shrink-0", strong ? "mb-3" : "mb-4")}>
        <Title id={titleId} className={classNames("font-serif font-bold uppercase tracking-widest", largeTypography ? "text-[15px]" : "text-sm", strong ? "text-ui-accent-strong" : "text-ui-accent")}>{title}</Title>
        {subtitle && <p className={classNames("mt-1 text-ui-text-muted", largeTypography ? "text-[13px]" : "text-xs")}>{subtitle}</p>}
        <div className="ui-panel-title-separator mt-2" aria-hidden="true" />
      </header>
      <div data-testid={contentTestId} className={contentClassName}>{children}</div>
    </section>
  );
}
