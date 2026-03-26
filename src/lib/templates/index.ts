import type { ContentType, ToneType } from "@/lib/types";

export interface Template {
  id: string;
  name: string;
  description: string;
  contentType: ContentType;
  topic: string;
  audience: string;
  tone: ToneType;
  keywords: string;
}

export const TEMPLATES: Template[] = [
  {
    id: "blog-seo-howto",
    name: "SEO How-To Guide",
    description: "Step-by-step guide optimized for search",
    contentType: "blog",
    topic: "How to [solve specific problem] — a practical guide with actionable steps and real examples",
    audience: "Marketing managers and content strategists",
    tone: "professional",
    keywords: "step-by-step, best practices, guide, tutorial",
  },
  {
    id: "blog-thought-leadership",
    name: "Thought Leadership",
    description: "Opinionated industry insight piece",
    contentType: "blog",
    topic: "Why [common industry belief] is wrong, and what forward-thinking teams are doing instead",
    audience: "C-suite executives and senior decision-makers",
    tone: "professional",
    keywords: "industry trends, strategy, innovation",
  },
  {
    id: "blog-listicle",
    name: "Listicle",
    description: "Numbered list post for quick reads",
    contentType: "blog",
    topic: "[N] tools every [role] should know in 2025",
    audience: "Mid-career professionals looking for curated recommendations",
    tone: "casual",
    keywords: "top, best, list, must-have, tools",
  },
  {
    id: "blog-case-study",
    name: "Case Study",
    description: "Story-driven customer success post",
    contentType: "blog",
    topic: "How [Company] achieved [specific result] using [product/approach] — a deep-dive breakdown",
    audience: "Prospective buyers evaluating solutions",
    tone: "professional",
    keywords: "case study, results, ROI, success story",
  },
  {
    id: "blog-technical",
    name: "Technical Deep Dive",
    description: "Developer-focused tutorial with code",
    contentType: "blog",
    topic: "Building [feature] with [technology] — architecture decisions, trade-offs, and implementation",
    audience: "Software engineers and technical leads",
    tone: "technical",
    keywords: "implementation, architecture, code, API",
  },
  {
    id: "social-product-launch",
    name: "Product Launch",
    description: "Announce a new feature or product",
    contentType: "social_post",
    topic: "Introducing [feature/product] — [one-line value prop]. Here's what it means for your workflow",
    audience: "Existing users and followers on LinkedIn",
    tone: "persuasive",
    keywords: "launch, new, introducing, announcement",
  },
  {
    id: "social-stat-hook",
    name: "Stat-Driven Hook",
    description: "Post built around a surprising number",
    contentType: "social_post",
    topic: "[Surprising statistic] — here's why this matters and what you can do about it today",
    audience: "Business professionals on LinkedIn",
    tone: "professional",
    keywords: "data, statistic, insight, trend",
  },
  {
    id: "social-founder-story",
    name: "Founder Story",
    description: "Personal narrative micro-post",
    contentType: "social_post",
    topic: "The moment I realized [key insight] that changed how I think about [domain]",
    audience: "Startup and entrepreneurship community",
    tone: "casual",
    keywords: "founder, lesson, startup, journey",
  },
  {
    id: "social-tips",
    name: "Quick Tips",
    description: "Actionable advice in list format",
    contentType: "social_post",
    topic: "[N] quick tips for [achieving specific outcome] — practical advice you can apply today",
    audience: "Practitioners and hands-on professionals",
    tone: "casual",
    keywords: "tips, actionable, quick wins, advice",
  },
  {
    id: "social-engagement",
    name: "Engagement Poll",
    description: "Question-led discussion starter",
    contentType: "social_post",
    topic: "What is the biggest challenge you face with [topic]? Here are the patterns I keep seeing",
    audience: "Industry peers and community members",
    tone: "casual",
    keywords: "poll, question, community, discussion",
  },
  {
    id: "landing-saas",
    name: "SaaS Product",
    description: "Feature-benefit page for software",
    contentType: "landing_page",
    topic: "[Product] helps [target user] [achieve outcome] without [pain point]",
    audience: "SMB owners and team leads evaluating software",
    tone: "persuasive",
    keywords: "features, pricing, free trial, demo, ROI",
  },
  {
    id: "landing-lead-magnet",
    name: "Lead Magnet",
    description: "Download-gated resource page",
    contentType: "landing_page",
    topic: "Get the free [resource type]: [title] — [number] pages of actionable [topic] strategies",
    audience: "Marketing professionals looking to upskill",
    tone: "professional",
    keywords: "free download, guide, ebook, whitepaper",
  },
  {
    id: "landing-event",
    name: "Event / Webinar",
    description: "Registration page for an event",
    contentType: "landing_page",
    topic: "Join us for [event name] — learn [key topic] from industry experts on [date]",
    audience: "Professionals interested in [industry topic]",
    tone: "professional",
    keywords: "register, webinar, event, live, speakers",
  },
  {
    id: "landing-waitlist",
    name: "Waitlist / Coming Soon",
    description: "Pre-launch hype page",
    contentType: "landing_page",
    topic: "[Product] is coming — be the first to experience [core value prop]",
    audience: "Early adopters and tech-forward users",
    tone: "persuasive",
    keywords: "waitlist, early access, launching soon",
  },
  {
    id: "landing-comparison",
    name: "Comparison Page",
    description: "Competitive vs page",
    contentType: "landing_page",
    topic: "[Your product] vs [Competitor] — honest comparison of features, pricing, and performance",
    audience: "Buyers actively comparing solutions",
    tone: "professional",
    keywords: "compare, vs, alternative, switch, features",
  },
];

export function getTemplatesForType(contentType: ContentType): Template[] {
  return TEMPLATES.filter((t) => t.contentType === contentType);
}
