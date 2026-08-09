import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { classNames } from "../classNames";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  description?: string;
  error?: string;
  leading?: ReactNode;
  wrapperClassName?: string;
  inputClassName?: string;
};

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, description, error, leading, wrapperClassName, inputClassName, id, "aria-describedby": describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const effectiveDescription = error ?? description;
  const ariaDescribedBy = [describedBy, effectiveDescription ? messageId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className={classNames("grid min-w-0 gap-1.5 text-sm text-ui-text-muted", wrapperClassName)}>
      {label && <label className="font-semibold text-ui-text" htmlFor={inputId}>{label}</label>}
      <span className="relative block">
        {leading && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ui-text-muted">{leading}</span>}
        <input
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={ariaDescribedBy}
          className={classNames(
            "min-h-ui-control w-full rounded-ui-control border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text placeholder:text-ui-text-disabled focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed disabled:text-ui-text-disabled disabled:opacity-60",
            leading && "pl-9",
            error && "border-ui-danger",
            inputClassName,
          )}
        />
      </span>
      {effectiveDescription && <span id={messageId} className={classNames("text-xs", error ? "text-ui-danger" : "text-ui-text-muted")}>{effectiveDescription}</span>}
    </div>
  );
});

export default TextField;
