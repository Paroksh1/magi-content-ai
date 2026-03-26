"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

interface WordCountProps {
  editor: Editor | null;
}

export function WordCount({ editor }: WordCountProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const text = editor.state.doc.textContent;
      const words = text.split(/\s+/).filter(Boolean).length;
      setCount(words);
    };

    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  if (!editor || count === 0) return null;

  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {count.toLocaleString()} {count === 1 ? "word" : "words"}
    </span>
  );
}
