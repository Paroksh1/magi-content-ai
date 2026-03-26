import type { Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/react";

const STYLES = {
  hero: "background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:#ffffff;padding:2.5rem 2rem;border-radius:12px;text-align:center;margin-bottom:1.5rem;",
  heroH1: "font-size:2rem;font-weight:700;line-height:1.2;margin:0 0 0.5rem 0;color:#ffffff;",
  sectionBlock: "padding:1.5rem 0;border-bottom:1px solid #e5e5e5;",
  h2: "font-size:1.5rem;font-weight:600;line-height:1.3;margin:0 0 1rem 0;color:#111111;",
  p: "line-height:1.7;margin:0 0 0.75rem 0;color:#333333;font-size:1rem;",
  strong: "font-weight:600;color:#111111;",
  em: "font-style:italic;",
  a: "color:#2563eb;text-decoration:underline;",
  ul: "padding-left:1.5rem;margin:0.75rem 0;list-style:disc;",
  ol: "padding-left:1.5rem;margin:0.75rem 0;list-style:decimal;",
  li: "line-height:1.7;margin-bottom:0.35rem;color:#333333;",
  blockquote: "border-left:3px solid #2563eb;padding:0.75rem 1rem;margin:0.75rem 0;color:#555555;font-style:italic;background:#f0f7ff;border-radius:0 8px 8px 0;",
  multiColumn: "display:flex;gap:1.5rem;margin:1rem 0;",
  column: "flex:1;min-width:0;",
  imageBlock: "margin:1rem 0;text-align:center;",
  img: "max-width:100%;height:auto;border-radius:8px;",
  figcaption: "margin-top:0.5rem;font-size:0.875rem;color:#888888;font-style:italic;",
  cta: "text-align:center;padding:2rem 1.5rem;background:#f8fafc;border-radius:12px;margin:1rem 0;",
  ctaButton: "display:inline-block;padding:0.75rem 2rem;background:#2563eb;color:#ffffff;border-radius:8px;font-weight:600;font-size:1rem;text-decoration:none;",
  quote: "font-size:1.15rem;",
  statsNumber: "font-size:2rem;font-weight:700;color:#2563eb;display:block;margin-bottom:0.25rem;",
};

function inlineStyleHTML(rawHTML: string): string {
  if (typeof window === "undefined") return rawHTML;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${rawHTML}</body>`, "text/html");

  doc.querySelectorAll('[data-type="hero-section"]').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.hero);
    el.querySelectorAll("h1").forEach((h) => h.setAttribute("style", STYLES.heroH1));
    el.querySelectorAll("p").forEach((p) => p.setAttribute("style", "line-height:1.7;margin:0 0 0.5rem 0;color:#ffffffcc;font-size:1.05rem;"));
  });

  doc.querySelectorAll('[data-type="section-block"]').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.sectionBlock);
    const sectionType = el.getAttribute("data-section-type");

    if (sectionType === "cta") {
      (el as HTMLElement).setAttribute("style", STYLES.sectionBlock + STYLES.cta);
    }
  });

  doc.querySelectorAll('[data-type="multi-column"]').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.multiColumn);
  });

  doc.querySelectorAll('[data-type="column"]').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.column);
  });

  doc.querySelectorAll('[data-type="cta-block"]').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.ctaButton);
  });

  doc.querySelectorAll('figure[data-type="image-block"]').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.imageBlock);
    el.querySelectorAll("img").forEach((img) => img.setAttribute("style", STYLES.img));
    el.querySelectorAll("figcaption").forEach((fig) => fig.setAttribute("style", STYLES.figcaption));
  });

  doc.querySelectorAll('[data-section-type="stats"] p strong').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.statsNumber);
  });

  doc.querySelectorAll('[data-section-type="quote"] blockquote').forEach((el) => {
    (el as HTMLElement).setAttribute("style", STYLES.blockquote + STYLES.quote);
  });

  const body = doc.body;

  body.querySelectorAll("h2").forEach((el) => {
    if (!el.closest('[data-type="hero-section"]')) {
      el.setAttribute("style", STYLES.h2);
    }
  });

  body.querySelectorAll("p").forEach((el) => {
    if (!el.closest('[data-type="hero-section"]') && !el.getAttribute("style")) {
      el.setAttribute("style", STYLES.p);
    }
  });

  body.querySelectorAll("strong").forEach((el) => {
    if (!el.closest('[data-section-type="stats"]')) {
      el.setAttribute("style", STYLES.strong);
    }
  });

  body.querySelectorAll("em").forEach((el) => el.setAttribute("style", STYLES.em));
  body.querySelectorAll("a").forEach((el) => el.setAttribute("style", STYLES.a));
  body.querySelectorAll("ul").forEach((el) => el.setAttribute("style", STYLES.ul));
  body.querySelectorAll("ol").forEach((el) => el.setAttribute("style", STYLES.ol));
  body.querySelectorAll("li").forEach((el) => el.setAttribute("style", STYLES.li));

  body.querySelectorAll("blockquote").forEach((el) => {
    if (!el.getAttribute("style")) {
      el.setAttribute("style", STYLES.blockquote);
    }
  });

  return body.innerHTML;
}

export function exportToStyledHTML(editor: Editor): string {
  const rawHTML = editor.getHTML();
  const styledBody = inlineStyleHTML(rawHTML);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Content Export</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1.5rem; color: #333; line-height: 1.7; }
  img { max-width: 100%; height: auto; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
${styledBody}
</body>
</html>`;
}

export function exportToClipboardHTML(editor: Editor): string {
  return inlineStyleHTML(editor.getHTML());
}

export function exportToHTML(editor: Editor): string {
  return exportToStyledHTML(editor);
}

export function exportToMarkdown(editor: Editor): string {
  const json = editor.getJSON();
  return jsonToMarkdown(json);
}

function jsonToMarkdown(node: JSONContent): string {
  if (node.type === "text") {
    let text = node.text || "";
    if (node.marks) {
      for (const mark of node.marks) {
        switch (mark.type) {
          case "bold":
            text = `**${text}**`;
            break;
          case "italic":
            text = `*${text}*`;
            break;
          case "underline":
            text = `<u>${text}</u>`;
            break;
          case "strike":
            text = `~~${text}~~`;
            break;
          case "link":
            text = `[${text}](${mark.attrs?.href || ""})`;
            break;
          case "highlight":
            text = `==${text}==`;
            break;
        }
      }
    }
    return text;
  }

  const children = (node.content || []).map(jsonToMarkdown).join("");

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return children + "\n\n";
    case "heading": {
      const level = node.attrs?.level || 1;
      return "#".repeat(level) + " " + children + "\n\n";
    }
    case "bulletList":
      return children + "\n";
    case "orderedList":
      return children + "\n";
    case "listItem":
      return "- " + children.trim() + "\n";
    case "blockquote":
      return children
        .split("\n")
        .filter(Boolean)
        .map((line) => "> " + line)
        .join("\n") + "\n\n";
    case "image":
      return `![${node.attrs?.alt || ""}](${node.attrs?.src || ""})\n\n`;
    case "hardBreak":
      return "\n";
    case "horizontalRule":
      return "---\n\n";
    case "heroSection":
      return children;
    case "sectionBlock":
      return children + "---\n\n";
    case "multiColumn":
      return children;
    case "column":
      return children;
    case "callToAction":
      return `**[${node.attrs?.label || "Get Started"}](${node.attrs?.href || "#"})**\n\n`;
    case "imageBlock":
      return `![${node.attrs?.alt || node.attrs?.caption || ""}](${node.attrs?.src || ""})\n*${node.attrs?.caption || ""}*\n\n`;
    default:
      return children;
  }
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
