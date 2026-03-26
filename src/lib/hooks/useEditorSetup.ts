"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  MultiColumn,
  Column,
  HeroSection,
  CallToAction,
  SectionBlock,
  ImageBlock,
  ContinueWriting,
} from "@/components/editor/extensions";
import { SlashCommands } from "@/components/editor/extensions/SlashCommands";
import { slashSuggestion } from "@/lib/editor/slashSuggestion";

export function useEditorSetup() {
  return useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Placeholder.configure({ placeholder: "Start writing or generate content..." }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextStyle,
      Color,
      MultiColumn,
      Column,
      HeroSection,
      CallToAction,
      SectionBlock,
      ImageBlock,
      ContinueWriting,
      SlashCommands.configure({
        suggestion: slashSuggestion,
      }),
    ],
    editorProps: {
      attributes: {
        class: "tiptap prose prose-neutral max-w-none focus:outline-none",
      },
    },
  });
}
