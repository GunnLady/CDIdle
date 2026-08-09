import { RefreshCw } from "lucide-react";

export type LoadingStateProps = { title: string; description?: string; fullPage?: boolean };

export default function LoadingState({ title, description, fullPage = false }: LoadingStateProps) {
  return (
    <div role="status" className={fullPage ? "flex min-h-screen flex-col items-center justify-center gap-4 bg-ui-canvas p-6 text-center text-ui-text" : "flex min-h-40 flex-col items-center justify-center gap-4 text-center text-ui-text"}>
      <RefreshCw aria-hidden="true" className="h-9 w-9 animate-spin text-ui-accent motion-reduce:animate-none" />
      <div><p className="font-serif text-lg font-bold text-ui-accent">{title}</p>{description && <p className="mt-2 text-sm text-ui-text-muted">{description}</p>}</div>
    </div>
  );
}
