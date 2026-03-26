import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { errorResponse, classifyError } from "@/lib/api/errors";
import { z } from "zod";

const ContinueSchema = z.object({
  sectionContext: z.string().max(5000),
  lastLine: z.string().max(1000),
  textAfter: z.string().max(1000).optional(),
  documentTitle: z.string().max(500).optional(),
  sectionHeading: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON", 400);
  }

  const parsed = ContinueSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid request", 400);
  }

  const { sectionContext, lastLine, textAfter, documentTitle, sectionHeading } = parsed.data;

  const systemPrompt = `You are a writing assistant. You continue text from exactly where the user's cursor is.

Output format:
- Output clean HTML. Use <p>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote> as appropriate.
- If continuing a sentence, output just the text (no <p> wrapper needed for inline continuation).
- If adding new paragraphs, points, or lists after the current sentence, use proper HTML tags.
- If the continuation includes a list of points, use <ul><li>...</li></ul>.
- If the continuation includes numbered steps, use <ol><li>...</li></ol>.
- Use <strong> for key terms or important phrases.

Rules:
- Output ONLY the NEW continuation. NEVER repeat any existing text.
- Do NOT repeat the user's last line or any part of it. Start with new words.
- Write 2-4 sentences or a short list (3-5 items).
- Match the tone and style of the existing content.
- Keep sentences under 20 words.
- Your first word should naturally follow the last word of the user's text.`;

  const parts: string[] = [];

  if (documentTitle) {
    parts.push(`DOCUMENT TOPIC: "${documentTitle}"`);
  }
  if (sectionHeading) {
    parts.push(`CURRENT SECTION: "${sectionHeading}"`);
  }

  parts.push(`SECTION CONTENT SO FAR:\n${sectionContext}`);

  if (lastLine) {
    parts.push(`THE USER JUST TYPED THIS LINE (continue from the END of this exact sentence):\n>>> ${lastLine} <<<\n\nYour continuation MUST directly follow from "${lastLine}". Pick up the exact thought, example, or argument the user started. If the user mentioned a specific name, company, or example, your continuation must explain how it relates to "${sectionHeading || documentTitle || "the topic"}".`);
  } else {
    parts.push(`Continue from the end of the section content above. Stay on the topic of "${sectionHeading || documentTitle || "the content"}".`);
  }

  if (textAfter) {
    parts.push(`TEXT THAT COMES AFTER THE CURSOR (do not repeat this):\n${textAfter}`);
  }

  try {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: parts.join("\n\n"),
      temperature: 0.7,
      maxOutputTokens: 400,
      abortSignal: AbortSignal.timeout(20000),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const { message, status } = classifyError(err);
    return errorResponse(message, status);
  }
}
