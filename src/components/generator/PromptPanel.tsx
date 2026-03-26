"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, MessageSquare, Layout, Loader2, Sparkles, Paperclip, X } from "lucide-react";
import { TONE_OPTIONS } from "@/lib/types";
import type { ContentType, ToneType, PromptInput } from "@/lib/types";
import { validateFiles, parseFiles, filesToContextString, type ParsedFile } from "@/lib/files/parser";
import { TemplatePicker } from "./TemplatePicker";
import type { Template } from "@/lib/templates";

const CONTENT_TYPES: { value: ContentType; label: string; icon: typeof FileText }[] = [
  { value: "blog", label: "Blog Post", icon: FileText },
  { value: "social_post", label: "Social Post", icon: MessageSquare },
  { value: "landing_page", label: "Landing Page", icon: Layout },
];

interface PromptPanelProps {
  contentType: ContentType;
  onContentTypeChange: (value: ContentType) => void;
  onGenerate: (input: PromptInput) => void;
  isGenerating: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function PromptPanel({
  contentType,
  onContentTypeChange,
  onGenerate,
  isGenerating,
}: PromptPanelProps) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<ToneType>("professional");
  const [keywords, setKeywords] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<ParsedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isMac, setIsMac] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent));
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setFileError(null);
    const files = Array.from(fileList);
    const { valid, errors } = validateFiles(files);
    if (errors.length > 0) {
      setFileError(errors.map((err) => `${err.name}: ${err.reason}`).join(", "));
    }
    if (valid.length > 0) {
      const parsed = await parseFiles(valid);
      setAttachedFiles((prev) => [...prev, ...parsed]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    const context = filesToContextString(attachedFiles);
    onGenerate({ topic: topic.trim(), audience: audience.trim(), tone, keywords: keywords.trim(), context });
  }, [topic, audience, tone, keywords, attachedFiles, onGenerate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const applyTemplate = useCallback((template: Template) => {
    setTopic(template.topic);
    setAudience(template.audience);
    setTone(template.tone);
    setKeywords(template.keywords);
    if (template.contentType !== contentType) {
      onContentTypeChange(template.contentType);
    }
  }, [contentType, onContentTypeChange]);

  const inputClass = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50";

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto" onKeyDown={handleKeyDown}>
      <div>
        <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Content Type</label>
        <div className="grid grid-cols-3 gap-1.5">
          {CONTENT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onContentTypeChange(value)}
              disabled={isGenerating}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                contentType === value
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/40"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <TemplatePicker
        contentType={contentType}
        onSelect={applyTemplate}
        disabled={isGenerating}
      />

      <div>
        <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Topic *</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What should this content be about?"
          disabled={isGenerating}
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Target Audience</label>
        <input
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. CTOs at B2B SaaS companies"
          disabled={isGenerating}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as ToneType)}
            disabled={isGenerating}
            className={inputClass}
          >
            {TONE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">Keywords</label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="SEO terms, brands..."
            disabled={isGenerating}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reference Files</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Paperclip size={11} />
            Attach
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        {attachedFiles.length > 0 ? (
          <div className="flex flex-col gap-1">
            {attachedFiles.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center justify-between px-2 py-1 bg-muted rounded text-xs"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileText size={11} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground shrink-0">({formatFileSize(file.size)})</span>
                </div>
                <button type="button" onClick={() => removeFile(i)} className="ml-1.5 text-muted-foreground hover:text-foreground shrink-0">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">.txt, .md, .csv, .json, .pdf</p>
        )}
        {fileError && <p className="text-xs text-destructive mt-1">{fileError}</p>}
      </div>

      <div className="mt-auto pt-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate
            </>
          )}
        </button>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {isMac ? "Cmd" : "Ctrl"}+Enter
        </p>
      </div>
    </div>
  );
}
