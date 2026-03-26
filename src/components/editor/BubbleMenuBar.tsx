"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  Languages,
  Loader2,
} from "lucide-react";
import { TONE_OPTIONS } from "@/lib/types";
import type { ToneType } from "@/lib/types";
import { normalizeAIHTML } from "@/lib/sanitize";

type RewriteAction = "rewrite" | "expand" | "shorten" | "change_tone";

interface BubbleMenuBarProps {
  editor: Editor;
  onBeforeAction?: (label: string) => void;
}

export function BubbleMenuBar({ editor, onBeforeAction }: BubbleMenuBarProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [showTones, setShowTones] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const { empty } = editor.state.selection;
    if (empty || editor.isActive("callToAction") || editor.isActive("imageBlock")) {
      setVisible(false);
      setShowTones(false);
      return;
    }

    const { from, to } = editor.state.selection;

    try {
      const start = editor.view.coordsAtPos(from);
      const end = editor.view.coordsAtPos(to);
      const editorRect = editor.view.dom.getBoundingClientRect();

      const top = start.top - editorRect.top - 48;
      const left = Math.max(
        80,
        Math.min(
          (start.left + end.left) / 2 - editorRect.left,
          editorRect.width - 80
        )
      );

      setPosition({ top, left });
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [editor]);

  useEffect(() => {
    editor.on("selectionUpdate", updatePosition);

    const handleBlur = () => {
      setTimeout(() => {
        if (!menuRef.current?.contains(document.activeElement)) {
          setVisible(false);
          setShowTones(false);
        }
      }, 150);
    };

    editor.on("blur", handleBlur);

    const scrollContainer = editor.view.dom.closest(".overflow-y-auto");
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", updatePosition, { passive: true });
    }

    return () => {
      editor.off("selectionUpdate", updatePosition);
      editor.off("blur", handleBlur);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", updatePosition);
      }
    };
  }, [editor, updatePosition]);

  const handleAIAction = useCallback(
    async (action: RewriteAction, tone?: ToneType) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");
      if (!selectedText.trim()) return;

      const actionLabels: Record<RewriteAction, string> = {
        rewrite: "Rewrite",
        expand: "Expand",
        shorten: "Shorten",
        change_tone: `Tone → ${tone || ""}`,
      };
      onBeforeAction?.(actionLabels[action]);

      setIsRewriting(true);
      setShowTones(false);

      try {
        const res = await fetch("/api/generate/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: selectedText, action, tone }),
        });

        if (!res.ok) {
          setIsRewriting(false);
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }

        const html = normalizeAIHTML(accumulated);

        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContentAt(from, html, {
            updateSelection: false,
            parseOptions: { preserveWhitespace: false },
          })
          .run();
      } finally {
        setIsRewriting(false);
        setVisible(false);
      }
    },
    [editor, onBeforeAction]
  );

  if (!visible) return null;

  const iconSize = 14;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-background border border-border rounded-lg shadow-lg">
        {isRewriting ? (
          <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            Processing...
          </div>
        ) : (
          <>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAIAction("rewrite")}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
            >
              <RefreshCw size={iconSize} />
              Rewrite
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAIAction("expand")}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
            >
              <Maximize2 size={iconSize} />
              Expand
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleAIAction("shorten")}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
            >
              <Minimize2 size={iconSize} />
              Shorten
            </button>

            <div className="w-px h-4 bg-border mx-0.5" />

            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowTones((prev) => !prev)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-muted transition-colors"
              >
                <Languages size={iconSize} />
                Tone
              </button>
              {showTones && (
                <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                  {TONE_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleAIAction("change_tone", value)}
                      className="block w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
