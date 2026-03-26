import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { validateRequest, RewriteRequestSchema } from "@/lib/api/validation";
import { errorResponse, classifyError } from "@/lib/api/errors";

type RewriteAction = "rewrite" | "expand" | "shorten" | "change_tone";

const SYSTEM_PROMPTS: Record<RewriteAction, string> = {
  rewrite: `Rewrite the following text while preserving its core meaning.
Make it clearer and more engaging.
IMPORTANT: Always wrap your output in HTML tags. Use <p> for paragraphs, <strong> for emphasis, <em> for italics.
Never output raw text without HTML tags.`,

  expand: `Expand the following text with more detail, examples, and depth.
Roughly double the length while keeping it focused and valuable.
IMPORTANT: Always wrap your output in HTML tags. Use <p> for paragraphs, <strong>, <em>, <ul>, <ol>, <li>.
Never output raw text without HTML tags.`,

  shorten: `Condense the following text to roughly half its length.
Keep the key points and remove redundancy. Be direct.
IMPORTANT: Always wrap your output in HTML tags. Use <p> for paragraphs, <strong> for emphasis.
Never output raw text without HTML tags.`,

  change_tone: `Rewrite the following text in the specified tone.
Preserve the meaning and key information.
IMPORTANT: Always wrap your output in HTML tags. Use <p> for paragraphs, <strong> for emphasis.
Never output raw text without HTML tags.`,
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON in request body", 400);
  }

  const validated = validateRequest(body, RewriteRequestSchema);
  if (!validated.success) {
    return errorResponse(validated.error, 400);
  }

  const { text, action, tone } = validated.data;

  let system = SYSTEM_PROMPTS[action];
  if (action === "change_tone" && tone) {
    system += `\n\nTarget tone: ${tone}`;
  }

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system,
      prompt: text,
      temperature: 0.6,
      maxOutputTokens: action === "expand" ? 2000 : 1000,
      abortSignal: AbortSignal.timeout(30000),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const { message, status } = classifyError(err);
    return errorResponse(message, status);
  }
}
