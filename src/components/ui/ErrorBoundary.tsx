import React from "react";
import { AlertCircle } from "lucide-react";
import { captureError } from "@/lib/observability";
import { useI18n } from "@/i18n";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  error,
  onReload,
}: {
  error: Error | null;
  onReload: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-ritual-black flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-6 sm:p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-500" size={24} />
          <h2 className="text-xl font-bold text-white">{t("error.title")}</h2>
        </div>
        <p className="text-zinc-400 mb-4 break-words">
          {error?.message ?? t("error.unknown")}
        </p>
        <button
          onClick={onReload}
          className="w-full min-h-11 bg-ritual-accent text-black font-bold py-2 px-4 rounded-lg hover:bg-emerald-400 transition-colors"
        >
          {t("error.reload")}
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <ErrorFallback
        error={this.state.error}
        onReload={() => {
          this.setState({ hasError: false, error: null });
          window.location.reload();
        }}
      />
    );
  }
}
