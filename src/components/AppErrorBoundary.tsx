import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportUnexpectedError } from "../lib/errorReporting";

type Props = {
  children: ReactNode;
  onError?: typeof reportUnexpectedError;
};
type State = { hasError: boolean };

export default class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  private readonly children: ReactNode;
  private readonly onError: typeof reportUnexpectedError;

  public constructor(props: Props) {
    super(props);
    this.children = props.children;
    this.onError = props.onError ?? reportUnexpectedError;
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Application render error", error);
    const stack = [
      error instanceof Error ? error.stack : undefined,
      info.componentStack ? `React component stack:${info.componentStack}` : undefined,
    ].filter(Boolean).join("\n");
    void this.onError({
      category: "react",
      error,
      ...(stack ? { stack } : {}),
      surface: "app",
    });
  }

  public render(): ReactNode {
    if (!this.state.hasError) return this.children;
    return (
      <main role="alert" className="min-h-screen bg-[#060403] text-[#e3dbc8] flex items-center justify-center p-6 text-center">
        <section className="max-w-md space-y-4">
          <h1 className="text-xl font-serif font-bold">La partie doit être rechargée</h1>
          <p className="text-sm text-[#c5ad94]">Une erreur d’affichage est survenue. Vos sauvegardes serveur restent inchangées.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-[#caa050] px-4 py-2 text-sm">Recharger</button>
        </section>
      </main>
    );
  }
}
