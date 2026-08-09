import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportUnexpectedError } from "../lib/errorReporting";
import Alert from "../ui/components/Alert";
import EntryScreen from "../ui/patterns/EntryScreen";
import Button from "../ui/primitives/Button";

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
      <EntryScreen>
        <Alert role="alert" variant="error" title="La partie doit être rechargée"><p>Une erreur d’affichage est survenue. Vos sauvegardes serveur restent inchangées.</p></Alert>
        <Button type="button" variant="primary" block onClick={() => window.location.reload()} className="mt-4">Recharger</Button>
      </EntryScreen>
    );
  }
}
