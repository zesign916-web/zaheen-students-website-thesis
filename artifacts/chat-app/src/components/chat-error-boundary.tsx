import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ChatErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("AI workspace failed to render", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold">The AI workspace couldn’t load</h1>
            <p className="mt-2 text-sm text-muted-foreground">A rendering error interrupted the page. Reload to try again.</p>
            <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">{this.state.error.message}</pre>
            <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => window.location.reload()}>Reload workspace</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
