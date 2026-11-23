import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorMessage({ error, message: fallback, onRetry }) {
  const message =
    (typeof error === "string" ? error : error?.message) ||
    fallback ||
    "An unexpected error occurred.";

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p role="alert" className="break-words text-sm">
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
