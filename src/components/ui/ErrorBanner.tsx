"use client";

import { X, AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="mx-6 mt-4 flex items-start gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
      <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
      <p className="flex-1 text-foreground">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
