import type { ReactNode } from "react";
import { classNames } from "../classNames";

export type NavigationTab<Id extends string> = {
  id: Id;
  label: string;
  icon?: ReactNode;
  labelClassName?: string;
  disabled?: boolean;
  backgroundImage?: string;
  activeBackgroundImage?: string;
};

export default function NavigationTabs<Id extends string>(props: {
  label: string;
  items: Array<NavigationTab<Id>>;
  activeId: Id;
  onChange: (id: Id) => void;
  className?: string;
  listClassName?: string;
  junctionUpperImage?: string;
  junctionLowerImage?: string;
}) {
  return (
    <nav aria-label={props.label} className={classNames("relative min-w-0 max-w-full rounded-ui-panel border border-ui-border bg-ui-panel p-1.5", props.className)}>
      <div className={classNames("relative z-10 flex min-w-0 max-w-full gap-1", props.listClassName)}>
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
              "relative flex min-h-ui-control min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-ui-control px-2 py-2 text-sm font-bold transition-colors duration-[var(--ui-motion-fast)] focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed disabled:text-ui-text-disabled disabled:opacity-60 min-[1440px]:flex-col min-[1440px]:gap-0.5 min-[1440px]:overflow-visible min-[1440px]:rounded-none min-[1440px]:border-0 min-[1440px]:p-0",
              active ? "border border-ui-accent bg-ui-accent text-ui-canvas min-[1440px]:bg-transparent min-[1440px]:text-[#fff1be] min-[1440px]:hover:bg-transparent" : "border border-transparent text-ui-text-muted hover:bg-ui-surface hover:text-ui-text min-[1440px]:bg-transparent min-[1440px]:text-[#e9d8ab] min-[1440px]:hover:bg-transparent min-[1440px]:hover:text-[#fff1be]",
            )}
          >
            {item.backgroundImage && <img
              src={active ? item.activeBackgroundImage ?? item.backgroundImage : item.backgroundImage}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 hidden w-full select-none object-fill min-[1440px]:-top-0.5 min-[1440px]:block min-[1440px]:h-[calc(100%+2px)]"
            />}
            {item.icon && <span aria-hidden="true" className="relative z-10 shrink-0 min-[1440px]:text-xl min-[1440px]:leading-none">{item.icon}</span>}
            <span className={classNames("relative z-10 hidden min-w-0 truncate font-serif uppercase tracking-wide sm:inline min-[1440px]:text-[0.7rem] min-[1440px]:leading-none", item.labelClassName)}>{item.label}</span>
          </button>
          );
        })}
      </div>
      {props.junctionUpperImage && props.junctionLowerImage ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden min-[1440px]:block"
          data-testid="navigation-junction-ornaments"
        >
          {["left-1/4", "left-1/2", "left-3/4"].map((positionClass) => (
            <span className={classNames("absolute inset-y-0 w-0", positionClass)} key={positionClass}>
              <img
                src={props.junctionUpperImage}
                alt=""
                className="absolute -top-[6px] left-0 z-20 h-[25px] w-[38px] max-w-none -translate-x-1/2 select-none"
                draggable={false}
              />
              <img
                src={props.junctionLowerImage}
                alt=""
                className="absolute -bottom-[3px] left-0 z-0 h-[25px] w-[38px] max-w-none -translate-x-1/2 select-none"
                draggable={false}
              />
            </span>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
