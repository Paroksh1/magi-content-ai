"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";

function stripLeadingDuplicate(response: string, lastLine: string): string {
  if (!lastLine) return response;

  const responseTrimmed = response.trim();
  const lastTrimmed = lastLine.trim().toLowerCase();

  // Check if response starts with the user's last line (case-insensitive)
  if (responseTrimmed.toLowerCase().startsWith(lastTrimmed)) {
    return responseTrimmed.slice(lastTrimmed.length).trim();
  }

  // Check partial overlap: response might start with the tail end of lastLine
  // e.g. lastLine="suppose lurniq ai", response="lurniq ai, which uses..."
  const words = lastTrimmed.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    const tail = words.slice(i).join(" ");
    if (responseTrimmed.toLowerCase().startsWith(tail)) {
      return responseTrimmed.slice(tail.length).trim();
    }
  }

  return responseTrimmed;
}

export function useContinueWriting(editor: Editor | null) {
  const [isWriting, setIsWriting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const continueRef = useRef<(() => void) | null>(null);

  const continueWriting = useCallback(async () => {
    if (!editor || isWriting) return;

    const { from } = editor.state.selection;
    const doc = editor.state.doc;

    let documentTitle = "";
    let sectionHeading = "";
    let sectionStart = 0;

    doc.descendants((node, pos) => {
      if (pos > from) return false;
      if (node.type.name === "heading" && node.attrs.level === 1) {
        documentTitle = node.textContent;
      }
      if (node.type.name === "heading" && node.attrs.level === 2 && pos < from) {
        sectionHeading = node.textContent;
        sectionStart = pos;
      }
      return true;
    });

    const fullSectionText = doc.textBetween(sectionStart, from, "\n");
    if (!fullSectionText.trim()) return;

    const textAfter = doc.textBetween(from, Math.min(doc.content.size, from + 300), "\n");
    const lines = fullSectionText.split("\n");
    const lastLine = lines[lines.length - 1]?.trim() || "";
    const sectionContext = lines.length > 1 ? lines.slice(0, -1).join("\n") : "";

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsWriting(true);

    try {
      const res = await fetch("/api/generate/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionContext: sectionContext || fullSectionText,
          lastLine,
          textAfter: textAfter || undefined,
          documentTitle: documentTitle || undefined,
          sectionHeading: sectionHeading || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setIsWriting(false);
        return;
      }

      // Collect full response first, then strip duplicates, then insert
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;
        fullResponse += decoder.decode(value, { stream: true });
      }

      if (controller.signal.aborted || !fullResponse.trim()) return;

      let cleaned = stripLeadingDuplicate(fullResponse, lastLine);
      if (!cleaned) return;

      const hasHTML = /<(?:p|ul|ol|li|strong|em|blockquote)[>\s/]/.test(cleaned);
      const pos = editor.state.selection.from;

      if (hasHTML) {
        if (!cleaned.startsWith("<")) {
          const firstTagIndex = cleaned.indexOf("<");
          if (firstTagIndex > 0) {
            const inlineText = cleaned.slice(0, firstTagIndex).trim();
            const blockHTML = cleaned.slice(firstTagIndex);
            if (inlineText) {
              const charBefore = fullSectionText[fullSectionText.length - 1];
              const prefix = (charBefore && charBefore !== " " && charBefore !== "\n") ? " " : "";
              const { tr } = editor.state;
              tr.insertText(prefix + inlineText, pos);
              editor.view.dispatch(tr);
            }
            const newPos = editor.state.selection.from;
            editor.commands.insertContentAt(newPos, blockHTML, {
              parseOptions: { preserveWhitespace: false },
            });
          } else {
            editor.commands.insertContentAt(pos, cleaned, {
              parseOptions: { preserveWhitespace: false },
            });
          }
        } else {
          editor.commands.insertContentAt(pos, cleaned, {
            parseOptions: { preserveWhitespace: false },
          });
        }
      } else {
        const charBefore = fullSectionText[fullSectionText.length - 1];
        if (charBefore && charBefore !== " " && charBefore !== "\n" && !cleaned.startsWith(" ")) {
          cleaned = " " + cleaned;
        }
        const { tr } = editor.state;
        tr.insertText(cleaned, pos);
        editor.view.dispatch(tr);
      }

    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    } finally {
      setIsWriting(false);
      abortRef.current = null;
    }
  }, [editor, isWriting]);

  const stopWriting = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsWriting(false);
  }, []);

  continueRef.current = continueWriting;

  useEffect(() => {
    const handler = () => continueRef.current?.();
    document.addEventListener("continue-writing", handler);
    return () => document.removeEventListener("continue-writing", handler);
  }, []);

  return { isWriting, continueWriting, stopWriting };
}
