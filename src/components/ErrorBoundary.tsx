import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[React ErrorBoundary Caught Error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))] p-6 text-center">
          <div className="max-w-md space-y-4 rounded-3xl border border-danger/30 bg-[rgb(var(--card))] p-8 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/20 text-danger">
              <AlertTriangle size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold">Something went wrong</h2>
            <p className="text-sm text-soft">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw size={16} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
