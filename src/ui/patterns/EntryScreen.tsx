import type { ReactNode } from "react";
import { classNames } from "../classNames";

export default function EntryScreen({ children, wide = false, preview = false, testId }: { children: ReactNode; wide?: boolean; preview?: boolean; testId?: string }) {
  const Root = preview ? "section" : "main";
  return (
    <Root data-testid={testId} className={classNames("overflow-y-auto bg-ui-canvas p-4 text-ui-text", preview ? "min-h-72 rounded-ui-panel border border-ui-border" : "min-h-screen")}>
      <div className={classNames("flex items-center justify-center", preview ? "min-h-64" : "min-h-[calc(100vh-2rem)]")}>
        <div data-entry-panel="true" data-panel-variant="strong" className={classNames("ui-panel-skin w-full rounded-ui-panel border-2 border-ui-border bg-ui-panel-strong p-6 shadow-ui-panel", wide ? "max-w-5xl" : "max-w-md")}>{children}</div>
      </div>
    </Root>
  );
}
