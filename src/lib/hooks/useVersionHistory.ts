"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

const STORAGE_KEY = "magi-version-history";
const MAX_SNAPSHOTS = 30;

export interface Snapshot {
  id: string;
  html: string;
  label: string;
  timestamp: number;
  wordCount: number;
}

function generateId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function loadSnapshots(): Snapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSnapshots(snapshots: Snapshot[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = snapshots.slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full — remove oldest entries and retry
    try {
      const trimmed = snapshots.slice(0, 10);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // give up silently
    }
  }
}

export function useVersionHistory(editor: Editor | null) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const savedHTMLRef = useRef<string | null>(null);

  useEffect(() => {
    setSnapshots(loadSnapshots());
  }, []);

  const createSnapshot = useCallback((label: string) => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === "<p></p>") return;

    setSnapshots((prev) => {
      if (prev.length > 0 && prev[0].html === html) return prev;

      const snapshot: Snapshot = {
        id: generateId(),
        html,
        label,
        timestamp: Date.now(),
        wordCount: countWords(html),
      };

      const updated = [snapshot, ...prev].slice(0, MAX_SNAPSHOTS);
      saveSnapshots(updated);
      return updated;
    });
  }, [editor]);

  const previewSnapshot = useCallback((id: string) => {
    if (!editor) return;

    if (!savedHTMLRef.current) {
      savedHTMLRef.current = editor.getHTML();
    }

    const snapshot = snapshots.find((s) => s.id === id);
    if (!snapshot) return;

    editor.commands.setContent(snapshot.html);
    setPreviewingId(id);
  }, [editor, snapshots]);

  const exitPreview = useCallback(() => {
    if (!editor || !savedHTMLRef.current) return;
    editor.commands.setContent(savedHTMLRef.current);
    savedHTMLRef.current = null;
    setPreviewingId(null);
  }, [editor]);

  const restoreSnapshot = useCallback((id: string) => {
    if (!editor) return;
    const snapshot = snapshots.find((s) => s.id === id);
    if (!snapshot) return;

    if (savedHTMLRef.current) {
      createSnapshot("Before restore");
    }

    editor.commands.setContent(snapshot.html);
    savedHTMLRef.current = null;
    setPreviewingId(null);
  }, [editor, snapshots, createSnapshot]);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSnapshots(updated);
      return updated;
    });

    if (previewingId === id) {
      exitPreview();
    }
  }, [previewingId, exitPreview]);

  const clearHistory = useCallback(() => {
    setSnapshots([]);
    saveSnapshots([]);
    if (previewingId) exitPreview();
  }, [previewingId, exitPreview]);

  return {
    snapshots,
    isOpen,
    setIsOpen,
    previewingId,
    createSnapshot,
    previewSnapshot,
    exitPreview,
    restoreSnapshot,
    deleteSnapshot,
    clearHistory,
  };
}
