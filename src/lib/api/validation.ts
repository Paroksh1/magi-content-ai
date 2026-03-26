import { z, type ZodSchema } from "zod";

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; error: string };
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export function validateRequest<T>(data: unknown, schema: ZodSchema<T>): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return { success: false, error: messages.join("; ") };
}

export const PlanRequestSchema = z.object({
  prompt: z.string().min(1, "Topic is required").max(5000, "Topic too long"),
  contentType: z.enum(["blog", "social_post", "landing_page"]),
  context: z.string().max(10000).optional(),
  audience: z.string().max(300).optional(),
  tone: z.enum(["professional", "casual", "technical", "persuasive"]).optional(),
  keywords: z.string().max(500).optional(),
});

export const SectionRequestSchema = z.object({
  sectionPlan: z.object({
    id: z.string(),
    type: z.string(),
    heading: z.string(),
    estimatedWords: z.number(),
  }),
  fullPlan: z.object({
    title: z.string(),
    tone: z.enum(["professional", "casual", "technical", "persuasive"]),
    sections: z.array(z.object({
      id: z.string(),
      type: z.string(),
      heading: z.string(),
    })),
  }),
  contentType: z.enum(["blog", "social_post", "landing_page"]),
  userPrompt: z.string().max(5000),
  context: z.string().max(10000).optional(),
  audience: z.string().max(300).optional(),
  tone: z.enum(["professional", "casual", "technical", "persuasive"]).optional(),
  keywords: z.string().max(500).optional(),
  previousContents: z.record(z.string(), z.string()).optional(),
});

export const RewriteRequestSchema = z.object({
  text: z.string().min(1, "Text is required").max(5000, "Text too long"),
  action: z.enum(["rewrite", "expand", "shorten", "change_tone"]),
  tone: z.enum(["professional", "casual", "technical", "persuasive"]).optional(),
});
