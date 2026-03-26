"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";
import { BubbleMenuBar } from "./BubbleMenuBar";
import { SectionActions } from "./SectionActions";

interface ContentEditorProps {
  editor: Editor | null;
  onRegenerateSection?: (sectionId: string) => void;
  isRegenerating?: string | null;
  onOpenImagePicker?: () => void;
  onContinueWriting?: () => void;
  isContinueWriting?: boolean;
  onBeforeAction?: (label: string) => void;
}

export function ContentEditor({
  editor,
  onRegenerateSection,
  isRegenerating,
  onOpenImagePicker,
  onContinueWriting,
  isContinueWriting,
  onBeforeAction,
}: ContentEditorProps) {
  if (!editor) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Enter a prompt and click Generate to start creating content.
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg">
      <div className="sticky top-0 z-20 bg-background rounded-t-lg border-b border-border">
        <EditorToolbar
          editor={editor}
          onOpenImagePicker={onOpenImagePicker}
          onContinueWriting={onContinueWriting}
          isContinueWriting={isContinueWriting}
        />
      </div>
      <div className="relative px-6 py-4 pl-12">
        {onRegenerateSection && (
          <SectionActions
            editor={editor}
            onRegenerateSection={onRegenerateSection}
            isRegenerating={isRegenerating}
          />
        )}
        <BubbleMenuBar editor={editor} onBeforeAction={onBeforeAction} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
