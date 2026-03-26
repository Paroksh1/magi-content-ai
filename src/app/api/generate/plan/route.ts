import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { ContentPlanSchema } from "@/lib/ai/schemas";
import { getPlannerPrompt } from "@/lib/ai/prompts";
import { validateRequest, PlanRequestSchema } from "@/lib/api/validation";
import { errorResponse, classifyError } from "@/lib/api/errors";
import { withRetry } from "@/lib/api/retry";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON in request body", 400);
  }

  const validated = validateRequest(body, PlanRequestSchema);
  if (!validated.success) {
    return errorResponse(validated.error, 400);
  }

  const { prompt, contentType, context, audience, tone, keywords } = validated.data;

  const systemPrompt = getPlannerPrompt(contentType);

  const parts: string[] = [`<topic>\n${prompt}\n</topic>`];

  if (audience) parts.push(`<target_audience>\n${audience}\n</target_audience>`);
  if (tone) parts.push(`<tone>\n${tone}\n</tone>`);
  if (keywords) parts.push(`<keywords>\nThese keywords MUST appear in the section headings and content: ${keywords}\n</keywords>`);
  if (context) {
    parts.push(`<reference_material>\nUse the following to inform the content plan — choose topics, examples, and terminology that align with this source:\n${context}\n</reference_material>`);
  }

  const userMessage = parts.join("\n\n");

  try {
    const { object } = await withRetry(
      () => generateObject({
        model: openai("gpt-4o-mini"),
        schema: ContentPlanSchema,
        system: systemPrompt,
        prompt: userMessage,
        temperature: 0.3,
        maxOutputTokens: 2000,
        abortSignal: AbortSignal.timeout(30000),
      }),
      { maxAttempts: 2 }
    );

    return Response.json(object);
  } catch (err) {
    const { message, status } = classifyError(err);
    return errorResponse(message, status);
  }
}
