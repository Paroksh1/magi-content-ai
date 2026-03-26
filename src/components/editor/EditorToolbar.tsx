"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? "bg-accent/10 text-accent"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

function LinkPopover({
  editor,
  onClose,
  anchorRef,
}: {
  editor: Editor;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [url, setUrl] = useState(() => {
    const attrs = editor.getAttributes("link");
    return (attrs.href as string) || "";
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  const apply = () => {
    if (url.trim()) {
      editor.chain().focus().setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    onClose();
  };

  const remove = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-lg shadow-lg p-3 w-72"
    >
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="https://example.com"
          className="flex-1 text-sm px-2.5 py-1.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={apply}
          className="px-3 py-1.5 text-sm font-medium bg-accent text-accent-foreground rounded hover:bg-accent/90"
        >
          Apply
        </button>
      </div>
      {editor.isActive("link") && (
        <button
          type="button"
          onClick={remove}
          className="mt-2 text-xs text-destructive hover:underline"
        >
          Remove link
        </button>
      )}
    </div>
  );
}

function ImagePopover({
  editor,
  onClose,
  anchorRef,
}: {
  editor: Editor;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  const apply = () => {
    if (url.trim()) {
      editor.chain().focus().setImage({ src: url.trim(), alt: alt.trim() }).run();
    }
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 z-50 bg-background border border-border rounded-lg shadow-lg p-3 w-72"
    >
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Image URL"
          className="text-sm px-2.5 py-1.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Alt text (optional)"
          className="text-sm px-2.5 py-1.5 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={apply}
          className="px-3 py-1.5 text-sm font-medium bg-accent text-accent-foreground rounded hover:bg-accent/90"
        >
          Insert Image
        </button>
      </div>
    </div>
  );
}

export function EditorToolbar({ editor, onOpenImagePicker, onContinueWriting, isContinueWriting }: EditorToolbarProps & { onOpenImagePicker?: () => void; onContinueWriting?: () => void; isContinueWriting?: boolean }) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const linkBtnRef = useRef<HTMLDivElement>(null);
  const imageBtnRef = useRef<HTMLDivElement>(null);

  const closeLinkPopover = useCallback(() => setShowLinkPopover(false), []);
  const closeImagePopover = useCallback(() => setShowImagePopover(false), []);

  if (!editor) return null;

  const iconSize = 16;

  return (
    <div className="editor-toolbar sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline"
      >
        <Underline size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        <Heading3 size={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote size={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Align Left"
      >
        <AlignLeft size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Align Center"
      >
        <AlignCenter size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Align Right"
      >
        <AlignRight size={iconSize} />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive("highlight")}
        title="Highlight"
      >
        <Highlighter size={iconSize} />
      </ToolbarButton>

      <Divider />

      <div className="relative" ref={linkBtnRef}>
        <ToolbarButton
          onClick={() => {
            setShowLinkPopover((prev) => !prev);
            setShowImagePopover(false);
          }}
          isActive={editor.isActive("link")}
          title="Link"
        >
          <LinkIcon size={iconSize} />
        </ToolbarButton>
        {showLinkPopover && (
          <LinkPopover
            editor={editor}
            onClose={closeLinkPopover}
            anchorRef={linkBtnRef}
          />
        )}
      </div>

      <ToolbarButton
        onClick={() => {
          setShowLinkPopover(false);
          if (onOpenImagePicker) {
            onOpenImagePicker();
          } else {
            setShowImagePopover((prev) => !prev);
          }
        }}
        title="Insert Image"
      >
        <ImageIcon size={iconSize} />
      </ToolbarButton>
      {!onOpenImagePicker && showImagePopover && (
        <div className="relative" ref={imageBtnRef}>
          <ImagePopover
            editor={editor}
            onClose={closeImagePopover}
            anchorRef={imageBtnRef}
          />
        </div>
      )}

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo2 size={iconSize} />
      </ToolbarButton>

      {onContinueWriting && (
        <>
          <Divider />
          <button
            type="button"
            onClick={onContinueWriting}
            disabled={isContinueWriting}
            title="Continue writing from cursor (Tab)"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors text-accent hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isContinueWriting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {isContinueWriting ? "Writing..." : "Continue"}
          </button>
        </>
      )}
    </div>
  );
}
