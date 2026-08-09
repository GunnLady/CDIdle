import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { classNames } from "../classNames";

const focusableSelector = 'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type DialogProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onDismiss?: () => void;
  dismissDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
};

export default function Dialog({ title, description, children, footer, onDismiss, dismissDisabled = false, initialFocusRef, className }: DialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const onDismissRef = useRef(onDismiss);
  const dismissDisabledRef = useRef(dismissDisabled);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onDismissRef.current = onDismiss;
    dismissDisabledRef.current = dismissDisabled;
  }, [dismissDisabled, onDismiss]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
    (initialFocusRef?.current ?? focusable()[0] ?? dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onDismissRef.current && !dismissDisabledRef.current) {
        event.preventDefault();
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (controls.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [initialFocusRef]);

  return (
    <div className="fixed inset-0 z-[var(--ui-layer-dialog)] flex items-center justify-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm">
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={classNames("max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-ui-panel border-2 border-ui-accent bg-ui-panel-strong p-5 shadow-2xl focus:outline-none", className)}
      >
        <header className="mb-4 border-b border-ui-border pb-3">
          <h2 id={titleId} className="font-serif text-lg font-bold text-ui-accent">{title}</h2>
          {description && <p id={descriptionId} className="mt-1 text-sm text-ui-text-muted">{description}</p>}
        </header>
        {children}
        {footer && <footer className="mt-5 flex flex-wrap justify-end gap-3 border-t border-ui-border-subtle pt-4">{footer}</footer>}
      </section>
    </div>
  );
}
