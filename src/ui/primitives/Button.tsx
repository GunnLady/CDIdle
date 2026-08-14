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
  primary: "text-[#241307] [text-shadow:0_1px_0_#f5c77a]",
  secondary: "text-[#f4e3bd] [text-shadow:0_1px_2px_#000]",
  danger: "text-[#ffe0d8] [text-shadow:0_1px_2px_#260000]",
  ghost: "text-ui-accent [text-shadow:0_1px_2px_#000]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-11 px-2 py-0 text-xs",
  md: "min-h-12 px-3 py-0 text-sm",
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
      data-button-variant={variant}
      data-button-size={size}
      className={classNames(
        "ui-button-skin inline-flex cursor-pointer items-center justify-center gap-2 border-transparent bg-transparent text-center font-serif font-bold uppercase tracking-wider transition-[filter,transform,opacity] duration-[var(--ui-motion-fast)] focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] enabled:active:translate-y-px disabled:cursor-not-allowed",
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
