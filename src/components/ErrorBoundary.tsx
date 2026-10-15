import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally no raw error display — keep UI messages generic.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-display text-2xl font-bold text-text">
            Something went wrong
          </h1>
          <p className="text-sm text-muted">
            Please refresh the page and try again.
          </p>
          <Button onClick={() => window.location.assign("/")}>
            Go to home
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
