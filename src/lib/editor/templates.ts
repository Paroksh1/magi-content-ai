import { escapeHtml } from "@/lib/sanitize";
import type { ContentPlan } from "@/lib/types";

export function planToEditorHTML(plan: ContentPlan): string {
  return plan.sections
    .map((section) => {
      const isHero = section.type === "hero";
      const tag = isHero ? "hero-section" : "section-block";
      const headingTag = isHero ? "h1" : "h2";
      const heading = escapeHtml(section.heading || "Untitled");

      return `<div data-type="${tag}" data-section-id="${section.id}" data-section-type="${section.type}"><${headingTag}>${heading}</${headingTag}><p></p></div>`;
    })
    .join("");
}
