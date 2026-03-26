"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Download, FileText, Code, Copy, Check } from "lucide-react";
import { exportToStyledHTML, exportToClipboardHTML, exportToMarkdown, downloadFile } from "@/lib/editor/export";

interface ExportMenuProps {
  editor: Editor | null;
}

export function ExportMenu({ editor }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleCopyStyled = async () => {
    if (!editor) return;
    const html = exportToClipboardHTML(editor);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([editor.getText()], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  };

  const handleExportHTML = () => {
    if (!editor) return;
    const html = exportToStyledHTML(editor);
    downloadFile(html, "content.html", "text/html");
    setOpen(false);
  };

  const handleExportMarkdown = () => {
    if (!editor) return;
    const md = exportToMarkdown(editor);
    downloadFile(md, "content.md", "text/markdown");
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={!editor}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-40"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Download size={14} />}
        {copied ? "Copied" : "Export"}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg py-1 min-w-[200px] z-50">
          <button
            type="button"
            onClick={handleCopyStyled}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Copy size={14} />
            Copy (with formatting)
          </button>
          <button
            type="button"
            onClick={handleExportHTML}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Code size={14} />
            Download HTML
          </button>
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <FileText size={14} />
            Download Markdown
          </button>
        </div>
      )}
    </div>
  );
}
