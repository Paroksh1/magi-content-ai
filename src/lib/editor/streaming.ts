import { sanitizeHTML, escapeHtml } from "@/lib/sanitize";
import type { ContentPlan, Section } from "@/lib/types";

export function wrapSection(section: Section, innerHTML: string, imageUrl?: string): string {
  const heading = escapeHtml(section.heading || "Untitled");
  const content = sanitizeHTML(innerHTML || "");
  const id = section.id;

  switch (section.type) {
    case "hero":
      return `<div data-type="hero-section" data-section-id="${id}" data-section-type="hero"><h1>${heading}</h1>${content || "<p></p>"}</div>`;

    case "two_column": {
      const parts = splitContentForColumns(content);
      return (
        `<div data-type="section-block" data-section-id="${id}" data-section-type="two_column">` +
        `<h2>${heading}</h2>` +
        `<div data-type="multi-column" >` +
        `<div data-type="column">${parts[0]}</div>` +
        `<div data-type="column">${parts[1]}</div>` +
        `</div>` +
        `</div>`
      );
    }

    case "text_with_image": {
      const imgSrc = imageUrl || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop";
      return (
        `<div data-type="section-block" data-section-id="${id}" data-section-type="text_with_image">` +
        `<h2>${heading}</h2>` +
        `<div data-type="multi-column" >` +
        `<div data-type="column">${content || "<p></p>"}</div>` +
        `<div data-type="column"><figure data-type="image-block"><img src="${imgSrc}" alt="${escapeHtml(section.heading)}" /><figcaption>${escapeHtml(section.heading)}</figcaption></figure></div>` +
        `</div>` +
        `</div>`
      );
    }

    case "cta":
      return (
        `<div data-type="section-block" data-section-id="${id}" data-section-type="cta">` +
        `<h2>${heading}</h2>` +
        `${content || "<p></p>"}` +
        `<div data-type="cta-block">Get Started</div>` +
        `</div>`
      );

    case "stats":
      return (
        `<div data-type="section-block" data-section-id="${id}" data-section-type="stats">` +
        `<h2>${heading}</h2>` +
        `${content || "<p></p>"}` +
        `</div>`
      );

    case "quote":
      return (
        `<div data-type="section-block" data-section-id="${id}" data-section-type="quote">` +
        `<h2>${heading}</h2>` +
        `${content || "<blockquote><p></p></blockquote>"}` +
        `</div>`
      );

    default:
      return (
        `<div data-type="section-block" data-section-id="${id}" data-section-type="${section.type}">` +
        `<h2>${heading}</h2>` +
        `${content || "<p></p>"}` +
        `</div>`
      );
  }
}

function splitContentForColumns(html: string): [string, string] {
  if (!html.trim()) return ["<p></p>", "<p></p>"];

  const tagPattern = /<(?:p|ul|ol|blockquote|div|h[2-6])[^>]*>[\s\S]*?<\/(?:p|ul|ol|blockquote|div|h[2-6])>/gi;
  const blocks = html.match(tagPattern);

  if (!blocks || blocks.length < 2) {
    return [html, "<p></p>"];
  }

  const midpoint = Math.ceil(blocks.length / 2);
  return [
    blocks.slice(0, midpoint).join(""),
    blocks.slice(midpoint).join(""),
  ];
}

export function wrapSectionBody(section: Section, rawContent: string): string {
  const content = sanitizeHTML(rawContent || "");
  if (!content) return "<p></p>";

  switch (section.type) {
    case "two_column": {
      const parts = splitContentForColumns(content);
      return (
        `<div data-type="multi-column">` +
        `<div data-type="column">${parts[0]}</div>` +
        `<div data-type="column">${parts[1]}</div>` +
        `</div>`
      );
    }

    case "text_with_image":
      return content;


    case "cta":
      return `${content}<div data-type="cta-block">Get Started</div>`;

    default:
      return content;
  }
}

export function buildFinalHTML(
  plan: ContentPlan,
  sectionContents: Record<string, string>,
  imageUrls?: Record<string, string>
): string {
  return plan.sections
    .map((section) => wrapSection(section, sectionContents[section.id] || "", imageUrls?.[section.id]))
    .join("");
}
