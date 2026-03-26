import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getWriterPrompt } from "@/lib/ai/prompts";
import { validateRequest, SectionRequestSchema } from "@/lib/api/validation";
import { errorResponse, classifyError } from "@/lib/api/errors";
import type { ContentType } from "@/lib/types";

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  blog: "blog post",
  social_post: "social media post (LinkedIn/Twitter)",
  landing_page: "high-converting landing page",
};

const MAX_TOKENS_BY_TYPE: Record<string, number> = {
  hero: 200,
  text: 1000,
  text_with_image: 800,
  two_column: 800,
  quote: 400,
  list: 800,
  cta: 200,
  stats: 500,
};

function buildStructuredPrompt(
  sectionPlan: { id: string; type: string; heading: string; estimatedWords: number },
  fullPlan: { title: string; tone: string; sections: { id: string; type: string; heading: string }[] },
  contentType: ContentType,
  userPrompt: string,
  opts: {
    context?: string;
    audience?: string;
    tone?: string;
    keywords?: string;
    previousContents?: Record<string, string>;
  }
): string {
  const contentLabel = CONTENT_TYPE_LABELS[contentType];
  const sectionIndex = fullPlan.sections.findIndex((s) => s.id === sectionPlan.id);
  const totalSections = fullPlan.sections.length;
  const previousSections = fullPlan.sections.slice(0, sectionIndex);
  const upcomingSections = fullPlan.sections.slice(sectionIndex + 1);

  const parts: string[] = [];

  parts.push(`<task>
Write section ${sectionIndex + 1} of ${totalSections} for a ${contentLabel}.
</task>`);

  parts.push(`<document>
Title: ${fullPlan.title}
Tone: ${fullPlan.tone}
Content type: ${contentLabel}
</document>`);

  if (opts.audience) {
    parts.push(`<target_audience>\n${opts.audience}\n</target_audience>`);
  }

  if (opts.keywords) {
    parts.push(`<keywords_to_include>\n${opts.keywords}\n</keywords_to_include>`);
  }

  parts.push(`<current_section>
Heading: "${sectionPlan.heading}"
Type: ${sectionPlan.type}
Target word count: ${sectionPlan.estimatedWords}
</current_section>`);

  parts.push(`<document_outline>
${fullPlan.sections.map((s, i) => `${i + 1}. [${s.type}] ${s.heading}${s.id === sectionPlan.id ? " ← YOU ARE HERE" : ""}`).join("\n")}
</document_outline>`);

  if (opts.previousContents && Object.keys(opts.previousContents).length > 0) {
    const entries = Object.entries(opts.previousContents);
    const summaries = entries.map(([heading, content]) => {
      const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const trimmed = text.length > 400 ? text.slice(0, 400) + "..." : text;
      return `[${heading}]\n${trimmed}`;
    });
    parts.push(`<previously_written_content>
Here is what was written in recent sections. Reference specific details from these to maintain narrative flow. Do NOT repeat the same examples or points.
${summaries.join("\n\n")}
</previously_written_content>`);
  } else if (previousSections.length > 0) {
    parts.push(`<context_already_written>
These sections have been written. Do NOT repeat their content:
${previousSections.map((s) => `- ${s.heading}`).join("\n")}
</context_already_written>`);
  }

  if (upcomingSections.length > 0) {
    parts.push(`<upcoming_sections>
These sections come after yours. Do NOT cover their topics:
${upcomingSections.map((s) => `- ${s.heading}`).join("\n")}
</upcoming_sections>`);
  }

  parts.push(`<user_request>\n${userPrompt}\n</user_request>`);

  if (opts.context) {
    parts.push(`<reference_material>
Ground your writing in specific details, terminology, and facts from this source:
${opts.context}
</reference_material>`);
  }

  const keywordRule = opts.keywords
    ? `- MUST naturally incorporate these keywords into the text: ${opts.keywords}. Each keyword should appear at least once.`
    : "";

  parts.push(`<constraints>
- Write EXACTLY for the "${sectionPlan.type}" section type
- Target ~${sectionPlan.estimatedWords} words (±20%)
- Do NOT include the heading "${sectionPlan.heading}" — it's already rendered
- Do NOT include the document title
- Start directly with HTML content
- Output only HTML body content, no wrappers
- Write at a 6th-8th grade reading level. Use common 1-2 syllable words whenever possible.
- AVOID jargon and multi-syllable words like "revolutionize", "implementation", "comprehensive", "utilize". Use simpler alternatives: "change", "setup", "full", "use".
- Keep sentences between 8-18 words. Vary length for rhythm but never exceed 22 words.
- Target Flesch-Kincaid readability score of 80+ (easy to read for any audience).
${keywordRule}
</constraints>`);

  return parts.join("\n\n");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON in request body", 400);
  }

  const validated = validateRequest(body, SectionRequestSchema);
  if (!validated.success) {
    return errorResponse(validated.error, 400);
  }

  const { sectionPlan, fullPlan, contentType, userPrompt, context, audience, tone, keywords, previousContents } = validated.data;
  const systemPrompt = getWriterPrompt(contentType);
  const maxOutputTokens = MAX_TOKENS_BY_TYPE[sectionPlan.type] || 800;

  const userMessage = buildStructuredPrompt(sectionPlan, fullPlan, contentType, userPrompt, {
    context, audience, tone, keywords, previousContents,
  });

  try {
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
      maxOutputTokens,
      abortSignal: AbortSignal.timeout(45000),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const { message, status } = classifyError(err);
    return errorResponse(message, status);
  }
}
