import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { classNames } from "../classNames";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, "aria-describedby": describedBy, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  return (
    <div className="flex min-h-ui-control items-start gap-3 text-sm text-ui-text has-[:disabled]:text-ui-text-disabled">
      <input
        {...props}
        ref={ref}
        id={inputId}
        type="checkbox"
        aria-describedby={[describedBy, description ? descriptionId : undefined].filter(Boolean).join(" ") || undefined}
        className={classNames("mt-1 h-5 w-5 cursor-pointer accent-ui-accent focus-visible:outline-ui-focus focus-visible:[outline-width:var(--ui-focus-width)] focus-visible:[outline-offset:var(--ui-focus-offset)] disabled:cursor-not-allowed", className)}
      />
      <span><label htmlFor={inputId} className="block cursor-pointer font-semibold has-[:disabled]:cursor-not-allowed">{label}</label>{description && <span id={descriptionId} className="mt-0.5 block text-xs text-ui-text-muted">{description}</span>}</span>
    </div>
  );
});

export default Checkbox;
