import type { ReactNode } from "react";
import { classNames } from "../classNames";

export type NavigationTab<Id extends string> = {
  id: Id;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export default function NavigationTabs<Id extends string>(props: {
  label: string;
  items: Array<NavigationTab<Id>>;
  activeId: Id;
  onChange: (id: Id) => void;
  className?: string;
  listClassName?: string;
}) {
  return (
    <nav aria-label={props.label} className={classNames("min-w-0 max-w-full rounded-ui-panel border border-ui-border bg-ui-panel p-1.5", props.className)}>
      <div className={classNames("flex min-w-0 max-w-full gap-1", props.listClassName)}>
        {props.items.map((item) => {
          const active = props.activeId === item.id;
          return (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            aria-label={item.label}
            aria-current={props.activeId === item.id ? "page" : undefined}
            onClick={() => props.onChange(item.id)}
            className={classNames(
              "relative flex min-h-ui-control min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-ui-control px-2 py-2 text-sm font-bold transition-colors duration-[var(--ui-motion-fast)] focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed disabled:text-ui-text-disabled disabled:opacity-60",
              active ? "border border-ui-accent bg-ui-accent text-ui-canvas" : "border border-transparent text-ui-text-muted hover:bg-ui-surface hover:text-ui-text",
            )}
          >
            {item.icon && <span aria-hidden="true" className="relative z-10 shrink-0">{item.icon}</span>}<span className="relative z-10 hidden min-w-0 truncate font-serif uppercase tracking-wide sm:inline">{item.label}</span>
          </button>
          );
        })}
      </div>
    </nav>
  );
}
