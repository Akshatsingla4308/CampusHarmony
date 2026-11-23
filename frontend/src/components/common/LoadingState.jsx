import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading records…" }) {
  return (
    <div
      role="status"
      className="flex min-h-24 items-center justify-center gap-2 rounded-lg bg-muted/50 p-4 text-center"
    >
      <Loader2
        aria-hidden="true"
        className="size-4 shrink-0 text-primary motion-safe:animate-spin"
      />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export default LoadingState;
