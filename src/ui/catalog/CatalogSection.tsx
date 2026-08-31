import type { ReactNode } from "react";
import { classNames } from "../classNames";

type CatalogSectionProps = {
  title: string;
  subtitle?: string;
  testId: string;
  className?: string;
  children: ReactNode;
};

export default function CatalogSection({ title, subtitle, testId, className, children }: CatalogSectionProps) {
  return (
    <section
      data-testid={testId}
      className={classNames("min-w-0 border-b border-ui-border-subtle pb-6", className)}
    >
      <header className="mb-4">
        <h2 className="font-serif text-lg font-bold text-ui-accent">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-ui-text-muted">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
