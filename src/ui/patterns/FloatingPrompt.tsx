import type { ReactNode } from "react";
import { classNames } from "../classNames";
import Button, { type ButtonProps } from "../primitives/Button";

export default function FloatingPrompt({ icon, children, className, ...props }: ButtonProps & { icon?: ReactNode }) {
  return <Button {...props} className={classNames("shadow-ui-panel", className)}>{icon && <span aria-hidden="true">{icon}</span>}{children}</Button>;
}
