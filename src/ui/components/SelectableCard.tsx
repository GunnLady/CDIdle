import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { classNames } from "../classNames";

export type SelectableCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> & {
  selected: boolean;
  children: ReactNode;
};

const SelectableCard = forwardRef<HTMLButtonElement, SelectableCardProps>(function SelectableCard(
  { selected, className, children, ...props },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={props.type ?? "button"}
      aria-pressed={selected}
      data-selected={selected || undefined}
      className={classNames(
        "min-h-ui-control w-full cursor-pointer rounded-ui-panel border p-3 text-left shadow-sm transition-[color,background-color,border-color] duration-[var(--ui-motion-fast)] focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed disabled:opacity-60",
        selected ? "border-ui-accent bg-ui-panel text-ui-text" : "border-ui-border-subtle bg-ui-surface text-ui-text-muted hover:border-ui-border",
        className,
      )}
    >
      {children}
    </button>
  );
});

export default SelectableCard;
