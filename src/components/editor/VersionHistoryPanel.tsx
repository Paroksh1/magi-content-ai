"use client";

import { X, RotateCcw, Eye, EyeOff, Trash2, Clock, Save, AlertTriangle } from "lucide-react";
import type { Snapshot } from "@/lib/hooks/useVersionHistory";

interface VersionHistoryPanelProps {
  snapshots: Snapshot[];
  previewingId: string | null;
  onPreview: (id: string) => void;
  onExitPreview: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveManual: () => void;
  onClear: () => void;
  onClose: () => void;
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - ts;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getLabelIcon(label: string): string {
  if (label.includes("Generated")) return "sparkle";
  if (label.includes("Regenerated")) return "refresh";
  if (label.includes("Manual")) return "save";
  if (label.includes("Before")) return "shield";
  return "clock";
}

function getLabelColor(label: string): string {
  if (label.includes("Generated")) return "text-green-400";
  if (label.includes("Regenerated")) return "text-blue-400";
  if (label.includes("Manual")) return "text-yellow-400";
  if (label.includes("Before")) return "text-orange-400";
  return "text-muted-foreground";
}

export function VersionHistoryPanel({
  snapshots,
  previewingId,
  onPreview,
  onExitPreview,
  onRestore,
  onDelete,
  onSaveManual,
  onClear,
  onClose,
}: VersionHistoryPanelProps) {
  return (
    <div className="flex flex-col h-full border-l border-border bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">Version History</span>
          <span className="text-xs text-muted-foreground">({snapshots.length})</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {previewingId && (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 shrink-0">
          <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
          <span className="text-xs text-yellow-500">Previewing snapshot</span>
          <button
            type="button"
            onClick={onExitPreview}
            className="ml-auto text-xs text-yellow-500 hover:text-yellow-400 underline"
          >
            Exit preview
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
        <button
          type="button"
          onClick={onSaveManual}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted transition-colors"
        >
          <Save size={11} />
          Save snapshot
        </button>
        {snapshots.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors ml-auto"
          >
            <Trash2 size={11} />
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {snapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <Clock size={32} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No snapshots yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Snapshots are created automatically after each generation
            </p>
          </div>
        ) : (
          <div className="py-2">
            {snapshots.map((snap, index) => {
              const isPreviewing = previewingId === snap.id;
              const isLatest = index === 0;
              const labelColor = getLabelColor(snap.label);

              return (
                <div
                  key={snap.id}
                  className={`group relative px-4 py-3 transition-colors ${
                    isPreviewing
                      ? "bg-yellow-500/5 border-l-2 border-l-yellow-500"
                      : "hover:bg-muted/50 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isLatest && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/10 text-accent uppercase tracking-wide">
                            Latest
                          </span>
                        )}
                        <span className={`text-xs font-medium ${labelColor}`}>
                          {snap.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(snap.timestamp)}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60">
                          {snap.wordCount} words
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        type="button"
                        onClick={() => isPreviewing ? onExitPreview() : onPreview(snap.id)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title={isPreviewing ? "Exit preview" : "Preview"}
                      >
                        {isPreviewing ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRestore(snap.id)}
                        className="p-1.5 rounded hover:bg-accent/10 text-muted-foreground hover:text-accent transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(snap.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
