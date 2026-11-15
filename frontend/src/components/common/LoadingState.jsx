import React from "react";
import { Loader2 } from "lucide-react";

export function LoadingState({ message = "Loading records from database..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border shadow-xs">
      <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export default LoadingState;
