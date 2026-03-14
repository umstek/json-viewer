import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for graceful error handling in JSON viewer
 *
 * Catches JavaScript errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 *
 * @example
 * <JsonViewerErrorBoundary>
 *   <JsonViewer json={data} />
 * </JsonViewerErrorBoundary>
 */
export class JsonViewerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('JsonViewer Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="border-destructive/50 bg-destructive/10 flex flex-col items-center justify-center gap-4 rounded-lg border p-6 text-center">
          <AlertTriangle className="text-destructive h-10 w-10" />
          <div className="space-y-2">
            <h3 className="text-destructive font-semibold">Something went wrong</h3>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default JsonViewerErrorBoundary;
