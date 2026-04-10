import { Component, type ReactNode } from 'react';
import { useTranslation } from '@/lib/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  error,
  onReload,
  onClearData,
}: {
  error: Error | null;
  onReload: () => void;
  onClearData: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="mx-auto max-w-md w-full rounded-2xl border bg-card p-8 space-y-6 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t.errorBoundaryTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.errorBoundaryMessage}</p>
        {error && (
          <pre className="max-h-24 overflow-auto rounded-lg bg-muted p-3 text-xs text-left text-muted-foreground">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={onReload}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t.errorBoundaryReload}
          </button>
          <button
            onClick={onClearData}
            className="w-full rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            {t.errorBoundaryClearData}
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearData = () => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReload={this.handleReload} onClearData={this.handleClearData} />;
    }

    return this.props.children;
  }
}
