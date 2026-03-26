"use client";

import { useState, useEffect, useCallback } from "react";
import { History } from "lucide-react";
import { PromptPanel } from "@/components/generator/PromptPanel";
import { ContentEditor } from "@/components/editor/ContentEditor";
import { StreamingPreview } from "@/components/editor/StreamingPreview";
import { GenerationStatusBar } from "@/components/generator/GenerationStatusBar";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { WordCount } from "@/components/editor/WordCount";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ImagePicker } from "@/components/editor/ImagePicker";
import { ContentScorePanel } from "@/components/editor/ContentScorePanel";
import { VersionHistoryPanel } from "@/components/editor/VersionHistoryPanel";
import { OutlineEditor } from "@/components/outline/OutlineEditor";
import { useEditorSetup } from "@/lib/hooks/useEditorSetup";
import { useContentGeneration } from "@/lib/hooks/useContentGeneration";
import { useContinueWriting } from "@/lib/hooks/useContinueWriting";
import { useVersionHistory } from "@/lib/hooks/useVersionHistory";
import type { ContentType, PromptInput } from "@/lib/types";
import type { ImageResult } from "@/lib/hooks/useImageSearch";

export default function EditorPage() {
  const [contentType, setContentType] = useState<ContentType>("blog");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [lastKeywords, setLastKeywords] = useState("");

  const editor = useEditorSetup();
  const generation = useContentGeneration(editor);
  const { isWriting, continueWriting, stopWriting } = useContinueWriting(editor);
  const versionHistory = useVersionHistory(editor);

  const handleGenerate = useCallback((input: PromptInput) => {
    setLastKeywords(input.keywords);
    versionHistory.clearHistory();
    generation.generate(input, contentType);
  }, [contentType, generation.generate, versionHistory.clearHistory]);

  const handleImageSelect = useCallback((image: ImageResult) => {
    if (!editor) return;
    versionHistory.createSnapshot("Before image insert");
    editor.chain().focus().setImage({
      src: image.regular,
      alt: image.alt,
    }).run();
    setShowImagePicker(false);
  }, [editor, versionHistory.createSnapshot]);

  const phase = generation.state.phase;
  const isGenerating = phase === "planning" || phase === "writing";
  const showOutline = phase === "outlining";
  const hasPreview = phase === "writing" || phase === "transitioning";
  const showPreview = phase === "writing" || phase === "transitioning";
  const showEditor = phase === "idle" || phase === "complete" || phase === "error";

  useEffect(() => {
    if (phase === "complete" && editor) {
      const html = editor.getHTML();
      if (html && html !== "<p></p>") {
        versionHistory.createSnapshot("Generated content");
      }
    }
  }, [phase, editor, versionHistory]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isGenerating) {
        generation.stop();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        versionHistory.createSnapshot("Manual save");
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    const openImageHandler = () => setShowImagePicker(true);
    document.addEventListener("open-image-picker", openImageHandler);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-image-picker", openImageHandler);
    };
  }, [isGenerating, generation, versionHistory.createSnapshot]);

  return (
    <main className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">MAGI</h1>
          <span className="text-sm text-muted-foreground">Content Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <WordCount editor={editor} />
          <button
            type="button"
            onClick={() => versionHistory.setIsOpen(!versionHistory.isOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              versionHistory.isOpen
                ? "border-accent bg-accent/5 text-accent"
                : "border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
            }`}
            title="Version History"
          >
            <History size={13} />
            History
            {versionHistory.snapshots.length > 0 && (
              <span className="px-1 py-0.5 text-[10px] rounded bg-muted leading-none">
                {versionHistory.snapshots.length}
              </span>
            )}
          </button>
          <ExportMenu editor={editor} />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[320px] border-r border-border flex flex-col shrink-0">
          <PromptPanel
            contentType={contentType}
            onContentTypeChange={setContentType}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          {isGenerating && (
            <GenerationStatusBar
              state={generation.state}
              onStop={generation.stop}
            />
          )}
          {phase === "error" && generation.state.error && (
            <ErrorBanner
              message={generation.state.error}
              onDismiss={generation.clearError}
            />
          )}
          <div className="flex-1 overflow-y-auto relative">
            <div className="max-w-4xl mx-auto py-10 px-8">
              {showOutline && generation.state.plan && (
                <OutlineEditor
                  plan={generation.state.plan}
                  onConfirm={(editedPlan) => generation.confirmOutline(editedPlan)}
                  onCancel={() => generation.clearError()}
                />
              )}

              {phase === "planning" && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="px-6 py-4">
                    <StreamingPreview
                      plan={null}
                      phase="planning"
                      sections={{}}
                      registerContainer={generation.registerContainer}
                    />
                  </div>
                </div>
              )}

              {hasPreview && (
                <div
                  className="transition-opacity duration-300 ease-out"
                  style={{
                    opacity: showPreview ? 1 : 0,
                    pointerEvents: showPreview ? "auto" : "none",
                    position: showEditor && !showPreview ? "absolute" : "relative",
                    visibility: showEditor && !showPreview ? "hidden" : "visible",
                  }}
                >
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="px-6 py-4">
                      <StreamingPreview
                        plan={generation.state.plan}
                        phase={generation.state.phase}
                        sections={generation.state.sections}
                        registerContainer={generation.registerContainer}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div
                className="transition-opacity duration-300 ease-in"
                style={{
                  opacity: showEditor ? 1 : 0,
                  pointerEvents: showEditor ? "auto" : "none",
                  position: showPreview && hasPreview ? "absolute" : "relative",
                  visibility: showPreview && hasPreview ? "hidden" : "visible",
                }}
              >
                <ContentEditor
                  editor={editor}
                  onRegenerateSection={(sectionId) => {
                    versionHistory.createSnapshot("Before regenerate");
                    generation.regenerateSection(sectionId);
                  }}
                  isRegenerating={generation.regeneratingSection}
                  onOpenImagePicker={() => setShowImagePicker(true)}
                  onContinueWriting={continueWriting}
                  isContinueWriting={isWriting}
                  onBeforeAction={(label) => versionHistory.createSnapshot(`Before ${label}`)}
                />
              </div>
            </div>
          </div>
          {showEditor && <ContentScorePanel editor={editor} keywords={lastKeywords} />}
        </div>

        {versionHistory.isOpen && (
          <aside className="w-[300px] shrink-0">
            <VersionHistoryPanel
              snapshots={versionHistory.snapshots}
              previewingId={versionHistory.previewingId}
              onPreview={versionHistory.previewSnapshot}
              onExitPreview={versionHistory.exitPreview}
              onRestore={versionHistory.restoreSnapshot}
              onDelete={versionHistory.deleteSnapshot}
              onSaveManual={() => versionHistory.createSnapshot("Manual save")}
              onClear={versionHistory.clearHistory}
              onClose={() => versionHistory.setIsOpen(false)}
            />
          </aside>
        )}
      </div>

      <ImagePicker
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImageSelect}
      />
    </main>
  );
}
