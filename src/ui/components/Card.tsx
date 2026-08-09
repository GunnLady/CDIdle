import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../classNames";

export type CardProps = HTMLAttributes<HTMLElement> & {
  selected?: boolean;
  children: ReactNode;
};

export default function Card({ selected = false, className, children, ...props }: CardProps) {
  return (
    <article
      {...props}
      data-selected={selected || undefined}
      className={classNames(
        "rounded-ui-panel border p-3 shadow-sm",
        selected ? "border-ui-accent bg-ui-panel" : "border-ui-border-subtle bg-ui-surface",
        className,
      )}
    >
      {children}
    </article>
  );
}
