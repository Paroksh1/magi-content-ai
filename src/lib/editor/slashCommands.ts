import type { Editor, Range } from "@tiptap/core";

export interface SlashCommand {
  title: string;
  description: string;
  category: "ai-write" | "ai-tone" | "insert" | "format";
  keywords: string[];
  icon: string;
  action: (editor: Editor, range: Range) => void | Promise<void>;
}

function getParagraphText(editor: Editor, range: Range): string {
  const $pos = editor.state.doc.resolve(range.from);
  const paragraph = $pos.parent;
  const text = paragraph.textContent.replace(/\/\S*$/, "").trim();
  return text;
}

function getDocumentTitle(editor: Editor): string {
  let title = "";
  editor.state.doc.descendants((node) => {
    if (!title && node.type.name === "heading" && node.attrs.level === 1) {
      title = node.textContent;
    }
    return !title;
  });
  return title;
}

function getSectionHeading(editor: Editor, range: Range): string {
  let heading = "";
  editor.state.doc.descendants((node, pos) => {
    if (pos > range.from) return false;
    if (node.type.name === "heading" && node.attrs.level === 2) {
      heading = node.textContent;
    }
    return true;
  });
  return heading;
}

async function executeRewrite(
  editor: Editor,
  range: Range,
  action: "rewrite" | "expand" | "shorten" | "summarize",
  tone?: string
) {
  const text = getParagraphText(editor, range);
  if (!text) {
    editor.chain().focus().deleteRange(range).run();
    return;
  }

  editor.chain().focus().deleteRange(range).run();

  const body: Record<string, string> = { text, action: action === "summarize" ? "shorten" : action };
  if (tone) body.tone = tone;

  try {
    const res = await fetch("/api/generate/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) return;

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }

    if (!result.trim()) return;

    let html = result.trim();
    if (!html.startsWith("<")) {
      html = `<p>${html}</p>`;
    }

    const $pos = editor.state.doc.resolve(editor.state.selection.from);
    const parentStart = $pos.start();
    const parentEnd = $pos.end();

    editor.commands.insertContentAt(
      { from: parentStart, to: parentEnd },
      html,
      { parseOptions: { preserveWhitespace: false } }
    );
  } catch {
    // Network or parsing failure — content unchanged
  }
}

async function executeContinue(editor: Editor, range: Range) {
  editor.chain().focus().deleteRange(range).run();
  document.dispatchEvent(new CustomEvent("continue-writing"));
}

function executeInsertImage(editor: Editor, range: Range) {
  editor.chain().focus().deleteRange(range).run();
  document.dispatchEvent(new CustomEvent("open-image-picker"));
}

export function getSlashCommands(): SlashCommand[] {
  return [
    {
      title: "Rewrite",
      description: "Rewrite the current paragraph",
      category: "ai-write",
      keywords: ["rewrite", "rephrase", "improve", "rw"],
      icon: "↻",
      action: (editor, range) => executeRewrite(editor, range, "rewrite"),
    },
    {
      title: "Expand",
      description: "Add more detail to the paragraph",
      category: "ai-write",
      keywords: ["expand", "longer", "more", "detail", "elaborate"],
      icon: "↔",
      action: (editor, range) => executeRewrite(editor, range, "expand"),
    },
    {
      title: "Shorten",
      description: "Make the paragraph more concise",
      category: "ai-write",
      keywords: ["shorten", "shorter", "concise", "brief", "compress"],
      icon: "↕",
      action: (editor, range) => executeRewrite(editor, range, "shorten"),
    },
    {
      title: "Summarize",
      description: "Condense into 1-2 key sentences",
      category: "ai-write",
      keywords: ["summarize", "summary", "tldr", "brief"],
      icon: "≡",
      action: (editor, range) => executeRewrite(editor, range, "summarize"),
    },
    {
      title: "Continue Writing",
      description: "AI continues from your cursor",
      category: "ai-write",
      keywords: ["continue", "write", "more", "keep going", "next"],
      icon: "→",
      action: executeContinue,
    },
    {
      title: "Professional Tone",
      description: "Rewrite in a professional tone",
      category: "ai-tone",
      keywords: ["professional", "formal", "business", "tone"],
      icon: "Pr",
      action: (editor, range) => executeRewrite(editor, range, "rewrite", "professional"),
    },
    {
      title: "Casual Tone",
      description: "Rewrite in a casual, friendly tone",
      category: "ai-tone",
      keywords: ["casual", "friendly", "informal", "relaxed", "tone"],
      icon: "Ca",
      action: (editor, range) => executeRewrite(editor, range, "rewrite", "casual"),
    },
    {
      title: "Technical Tone",
      description: "Rewrite with technical precision",
      category: "ai-tone",
      keywords: ["technical", "precise", "detailed", "tone"],
      icon: "Te",
      action: (editor, range) => executeRewrite(editor, range, "rewrite", "technical"),
    },
    {
      title: "Persuasive Tone",
      description: "Rewrite to be more persuasive",
      category: "ai-tone",
      keywords: ["persuasive", "convincing", "compelling", "tone"],
      icon: "Pe",
      action: (editor, range) => executeRewrite(editor, range, "rewrite", "persuasive"),
    },
    {
      title: "Insert Image",
      description: "Search and insert an image",
      category: "insert",
      keywords: ["image", "photo", "picture", "img"],
      icon: "Im",
      action: executeInsertImage,
    },
    {
      title: "Heading 1",
      description: "Large section heading",
      category: "format",
      keywords: ["h1", "heading", "title"],
      icon: "H1",
      action: (editor, range) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      category: "format",
      keywords: ["h2", "heading", "subtitle"],
      icon: "H2",
      action: (editor, range) => {
        editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
      },
    },
    {
      title: "Bullet List",
      description: "Create a bulleted list",
      category: "format",
      keywords: ["bullet", "list", "ul", "unordered"],
      icon: "•",
      action: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a numbered list",
      category: "format",
      keywords: ["number", "ordered", "ol", "list"],
      icon: "1.",
      action: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Blockquote",
      description: "Add a quote block",
      category: "format",
      keywords: ["quote", "blockquote", "callout"],
      icon: "❝",
      action: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: "Divider",
      description: "Insert a horizontal rule",
      category: "format",
      keywords: ["divider", "hr", "line", "separator"],
      icon: "—",
      action: (editor, range) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
  ];
}

export function filterCommands(query: string, commands: SlashCommand[]): SlashCommand[] {
  if (!query) return commands;

  const q = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(q) ||
      cmd.keywords.some((kw) => kw.includes(q))
  );
}

export const CATEGORY_LABELS: Record<string, string> = {
  "ai-write": "AI Writing",
  "ai-tone": "Change Tone",
  insert: "Insert",
  format: "Format",
};
