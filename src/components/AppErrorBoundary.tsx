import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  private readonly children: ReactNode;

  public constructor(props: Props) {
    super(props);
    this.children = props.children;
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown): void {
    console.error("Application render error", error);
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
