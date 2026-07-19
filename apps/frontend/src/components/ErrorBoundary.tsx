import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Top-level error boundary so one bad render doesn't blank the whole app.
 * Shows a recoverable error screen with a "Try again" button.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, errorMessage };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
            <h2 className="mb-3 text-xl font-semibold text-destructive">Something went wrong</h2>
            <p className="mb-6 text-sm text-muted-foreground">{this.state.errorMessage}</p>
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
