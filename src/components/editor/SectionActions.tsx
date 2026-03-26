"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Trash2, Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";

interface SectionActionsProps {
  editor: Editor;
  onRegenerateSection?: (sectionId: string) => void;
  isRegenerating?: string | null;
}

export function SectionActions({ editor, onRegenerateSection, isRegenerating }: SectionActionsProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [position, setPosition] = useState({ top: 0 });
  const actionsRef = useRef<HTMLDivElement>(null);

  const updateHoveredSection = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const sectionEl =
      target.closest("[data-type='section-block']") ||
      target.closest("[data-type='hero-section']");

    if (!sectionEl) {
      setActiveSectionId(null);
      return;
    }

    const id = sectionEl.getAttribute("data-section-id");
    if (!id) {
      setActiveSectionId(null);
      return;
    }

    const editorRect = editor.view.dom.getBoundingClientRect();
    const sectionRect = sectionEl.getBoundingClientRect();
    const top = sectionRect.top - editorRect.top;

    setActiveSectionId(id);
    setPosition({ top });
  }, [editor]);

  useEffect(() => {
    const editorDom = editor.view.dom;
    editorDom.addEventListener("mousemove", updateHoveredSection);
    editorDom.addEventListener("mouseleave", () => setActiveSectionId(null));

    return () => {
      editorDom.removeEventListener("mousemove", updateHoveredSection);
    };
  }, [editor, updateHoveredSection]);

  const handleRegenerate = () => {
    if (activeSectionId && onRegenerateSection) {
      onRegenerateSection(activeSectionId);
    }
  };

  const handleDelete = () => {
    if (!activeSectionId) return;

    let targetPos: { from: number; to: number } | null = null;
    editor.state.doc.descendants((node, pos) => {
      if (targetPos) return false;
      if (node.attrs?.sectionId === activeSectionId) {
        targetPos = { from: pos, to: pos + node.nodeSize };
        return false;
      }
      return true;
    });

    if (targetPos) {
      editor.chain().deleteRange(targetPos).run();
      setActiveSectionId(null);
    }
  };

  const isThisSectionRegenerating = isRegenerating === activeSectionId;

  if (!activeSectionId || !onRegenerateSection) return null;

  return (
    <div
      ref={actionsRef}
      className="absolute -left-10 z-20 flex flex-col gap-1 transition-all duration-150"
      style={{ top: position.top }}
      onMouseEnter={() => {}}
    >
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={!!isRegenerating}
        title="Regenerate section"
        className="p-1.5 rounded-md bg-background border border-border shadow-sm text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors disabled:opacity-40"
      >
        {isThisSectionRegenerating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <RefreshCw size={14} />
        )}
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!!isRegenerating}
        title="Delete section"
        className="p-1.5 rounded-md bg-background border border-border shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-40"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
