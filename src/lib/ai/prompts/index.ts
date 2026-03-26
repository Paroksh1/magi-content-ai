import type { ContentType } from "@/lib/types";
import { BLOG_PLANNER_PROMPT, BLOG_WRITER_PROMPT } from "./blog";
import { SOCIAL_PLANNER_PROMPT, SOCIAL_WRITER_PROMPT } from "./social";
import { LANDING_PLANNER_PROMPT, LANDING_WRITER_PROMPT } from "./landing";

export interface PromptContext {
  audience?: string;
  brandVoice?: string;
  language?: string;
  wordCountMultiplier?: number;
}

const PLANNER_PROMPTS: Record<ContentType, string> = {
  blog: BLOG_PLANNER_PROMPT,
  social_post: SOCIAL_PLANNER_PROMPT,
  landing_page: LANDING_PLANNER_PROMPT,
};

const WRITER_PROMPTS: Record<ContentType, string> = {
  blog: BLOG_WRITER_PROMPT,
  social_post: SOCIAL_WRITER_PROMPT,
  landing_page: LANDING_WRITER_PROMPT,
};

function applyContext(base: string, ctx?: PromptContext): string {
  if (!ctx) return base;

  const additions: string[] = [];

  if (ctx.audience) {
    additions.push(`Target audience: ${ctx.audience}. Adjust vocabulary, complexity, and references to match this audience.`);
  }
  if (ctx.brandVoice) {
    additions.push(`Brand voice: ${ctx.brandVoice}. Match this voice consistently throughout.`);
  }
  if (ctx.language) {
    additions.push(`Write in ${ctx.language}.`);
  }
  if (ctx.wordCountMultiplier && ctx.wordCountMultiplier !== 1) {
    additions.push(`Adjust all word count targets by a factor of ${ctx.wordCountMultiplier}x.`);
  }

  if (additions.length === 0) return base;

  return `${base}\n\nAdditional context:\n${additions.join("\n")}`;
}

export function getPlannerPrompt(contentType: ContentType, ctx?: PromptContext): string {
  return applyContext(PLANNER_PROMPTS[contentType], ctx);
}

export function getWriterPrompt(contentType: ContentType, ctx?: PromptContext): string {
  return applyContext(WRITER_PROMPTS[contentType], ctx);
}
