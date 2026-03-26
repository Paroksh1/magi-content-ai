import { z } from "zod";

export const SectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "hero",
    "text",
    "text_with_image",
    "two_column",
    "quote",
    "list",
    "cta",
    "stats",
  ]),
  heading: z.string(),
  estimatedWords: z.number(),
});

export const ContentPlanSchema = z.object({
  title: z.string(),
  tone: z.enum(["professional", "casual", "technical", "persuasive"]),
  sections: z.array(SectionSchema).min(1).max(12),
});
