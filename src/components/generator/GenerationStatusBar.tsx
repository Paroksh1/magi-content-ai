"use client";

import { Loader2, Check, Square } from "lucide-react";
import type { GenerationState } from "@/lib/types";

interface GenerationStatusBarProps {
  state: GenerationState;
  onStop?: () => void;
}

export function GenerationStatusBar({ state, onStop }: GenerationStatusBarProps) {
  const sectionEntries = Object.values(state.sections);
  const total = sectionEntries.length;
  const completed = sectionEntries.filter((s) => s.status === "complete").length;

  const isActive = state.phase === "planning" || state.phase === "writing";

  let label = "Planning content structure...";
  if (state.phase === "writing") {
    label = `Writing sections (${completed}/${total})`;
  }

  return (
    <div className="flex items-center gap-3 px-6 py-2 border-b border-border bg-muted/50 shrink-0">
      {isActive ? (
        <Loader2 size={14} className="animate-spin text-accent" />
      ) : (
        <Check size={14} className="text-green-600" />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
      {total > 0 && (
        <div className="flex-1 max-w-48 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      )}
      {isActive && onStop && (
        <button
          type="button"
          onClick={onStop}
          className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
          title="Stop generation"
        >
          <Square size={12} />
          Stop
        </button>
      )}
    </div>
  );
}
