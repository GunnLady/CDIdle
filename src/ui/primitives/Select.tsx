import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { classNames } from "../classNames";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, description, error, wrapperClassName, className, id, "aria-describedby": describedBy, children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const labelId = `${selectId}-label`;
  const messageId = `${selectId}-message`;
  const message = error ?? description;
  const ariaDescribedBy = [describedBy, message ? messageId : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <div className={classNames("grid min-w-0 gap-1.5 text-sm text-ui-text-muted", wrapperClassName)}>
      {label && <label id={labelId} htmlFor={selectId} className="font-semibold text-ui-text">{label}</label>}
      <select
        {...props}
        ref={ref}
        id={selectId}
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={ariaDescribedBy}
        className={classNames(
          "min-h-ui-control w-full cursor-pointer rounded-ui-control border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed disabled:text-ui-text-disabled disabled:opacity-60",
          error && "border-ui-danger",
          className,
        )}
      >
        {children}
      </select>
      {message && <span id={messageId} className={classNames("text-xs", error ? "text-ui-danger" : "text-ui-text-muted")}>{message}</span>}
    </div>
  );
});

export default Select;
