import type { ReactNode } from "react";
import Button, { type ButtonProps } from "./Button";
import { classNames } from "../classNames";

export type IconButtonProps = Omit<ButtonProps, "aria-label" | "block" | "children"> & {
  label: string;
  children: ReactNode;
};

export default function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <Button {...props} aria-label={label} className={classNames("inline-flex min-w-ui-control items-center justify-center px-2", className)}>
      {children}
    </Button>
  );
}
