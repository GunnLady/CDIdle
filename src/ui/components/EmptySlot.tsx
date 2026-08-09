import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "../classNames";

export type EmptySlotProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export default function EmptySlot({ className, children, ...props }: EmptySlotProps) {
  return <div {...props} className={classNames("flex min-h-ui-control items-center justify-center rounded-ui-control border border-dashed border-ui-border bg-ui-surface p-3 text-center text-xs text-ui-text-disabled", className)}>{children}</div>;
}
