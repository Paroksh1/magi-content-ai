export type ContentType = "blog" | "social_post" | "landing_page";

export type SectionType =
  | "hero"
  | "text"
  | "text_with_image"
  | "two_column"
  | "quote"
  | "list"
  | "cta"
  | "stats";

export type ToneType = "professional" | "casual" | "technical" | "persuasive";

export const TONE_OPTIONS: { value: ToneType; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "technical", label: "Technical" },
  { value: "persuasive", label: "Persuasive" },
];

export interface Section {
  id: string;
  type: SectionType;
  heading: string;
  estimatedWords: number;
}

export interface ContentPlan {
  title: string;
  tone: ToneType;
  sections: Section[];
}

export type SectionStatus = "pending" | "streaming" | "complete" | "error";

export interface SectionState {
  id: string;
  status: SectionStatus;
  content: string;
}

export interface PromptInput {
  topic: string;
  audience: string;
  tone: ToneType;
  keywords: string;
  context: string;
}

export interface GenerationState {
  phase: "idle" | "planning" | "outlining" | "writing" | "transitioning" | "complete" | "error";
  plan: ContentPlan | null;
  sections: Record<string, SectionState>;
  error: string | null;
}
