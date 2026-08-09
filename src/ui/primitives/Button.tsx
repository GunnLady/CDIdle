import { forwardRef, type ButtonHTMLAttributes } from "react";
import { classNames } from "../classNames";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  busy?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border-ui-accent-strong bg-ui-accent text-ui-canvas hover:bg-ui-accent-strong active:translate-y-px",
  secondary: "border-ui-border bg-ui-panel text-ui-accent hover:bg-ui-surface active:translate-y-px",
  danger: "border-ui-danger-border bg-ui-danger-surface text-ui-danger-text hover:border-ui-danger hover:bg-ui-danger-surface-hover active:translate-y-px",
  ghost: "border-transparent bg-transparent text-ui-text-muted hover:border-ui-border hover:text-ui-text",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-ui-control px-3 py-2 text-sm",
  md: "min-h-ui-control px-4 py-2.5 text-sm",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", block = false, busy = false, disabled, className, children, ...props },
  ref,
) {
  const unavailable = disabled || busy;
  return (
    <button
      {...props}
      ref={ref}
      disabled={unavailable}
      aria-busy={busy || undefined}
      data-state={busy ? "loading" : unavailable ? "disabled" : "ready"}
      className={classNames(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-ui-control border text-center font-serif font-bold uppercase tracking-wider transition-[color,background-color,border-color,transform] duration-[var(--ui-motion-fast)] focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed disabled:border-ui-border-subtle disabled:bg-ui-panel-strong disabled:text-ui-text-disabled disabled:opacity-70",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
});

export default Button;
