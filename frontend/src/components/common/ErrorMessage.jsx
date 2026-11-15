import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorMessage({ error, onRetry }) {
  const message = typeof error === "string" ? error : error?.message || "An unexpected error occurred.";

  return (
    <div className="p-4 mb-6 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 shadow-xs">
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold">Backend Connection / Operation Error</h4>
        <p className="text-xs mt-1 text-destructive/90">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Request
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
