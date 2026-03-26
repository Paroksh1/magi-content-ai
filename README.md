# MAGI Content Editor

An AI-powered content editor built on TipTap (ProseMirror) with a multi-pass generation pipeline, progressive streaming, and structured layout rendering. Generates blog posts, social posts, and landing pages with real-time AI assistance.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key
- Pexels API key (free, instant at [pexels.com/api](https://www.pexels.com/api/))

### Setup

```bash
git clone <repo-url>
cd magi-content-editor
npm install
```

Create a `.env.local` file in the project root:

```
OPENAI_API_KEY=sk-your-openai-key-here
PEXELS_API_KEY=your-pexels-key-here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

---

## Architecture Overview

### The Core Problem

When AI generates large content (blog posts, landing pages), the JSON payload for TipTap is massive and complex. Users wait for the entire generation to complete before seeing anything. No streaming, no progressive rendering.

### Solution: Multi-Pass Content Pipeline

Instead of generating a single monolithic JSON blob, the system breaks generation into discrete passes:

```
User Input (structured fields)
        |
        v
  PASS 1: Content Planner (gpt-4o-mini)
        |  Output: JSON plan with typed sections
        |  Method: generateObject with Zod schema
        v
  Outline Editor (user can reorder/edit/add/remove sections)
        |
        v
  PASS 2: Section Writer (gpt-4o, per-section)
        |  Output: Streamed HTML per section
        |  Method: streamText with SSE
        |  Sections rendered progressively
        v
  Layout Wrapper (deterministic)
        |  Wraps AI HTML into typed structures
        |  MultiColumn, HeroSection, CTA, ImageBlock
        v
  TipTap Editor (editable structured document)
```

### Why This Architecture

**Separation of concerns.** The AI is responsible for prose content. The system is responsible for layout structure. LLMs don't reliably produce nested div structures with correct data attributes mid-stream. A deterministic template layer wraps AI output into the correct layout for each section type.

**Progressive UX.** Pass 1 (plan) uses `generateObject`, returns complete JSON in 2-3s. The skeleton renders immediately. Pass 2 streams each section sequentially so content fills top-to-bottom.

**Streamability.** The AI outputs clean HTML which can be incrementally parsed at tag boundaries. Structured JSON (ProseMirror nodes) would require the entire tree to be valid before parsing.

**Extensibility.** Adding a new content type requires one prompt file and one template entry. No architecture changes. Swapping the LLM provider requires changing one model string in the API route.

---

## System Design

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | SSR-ready, co-located API routes |
| Editor | TipTap (open-source only) | ProseMirror-based rich text editing |
| Styling | Tailwind CSS | Utility-first, dark mode support |
| State | React hooks + refs | Generation state, version history, editor state |

### Backend (Next.js API Routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/generate/plan` | POST | Pass 1: content plan via `generateObject` |
| `/api/generate/section` | POST | Pass 2: section content via `streamText` |
| `/api/generate/rewrite` | POST | Text transformation (rewrite/expand/shorten/tone) |
| `/api/generate/continue` | POST | Continues writing from cursor position |
| `/api/pexels` | GET | Proxies Pexels image search |

All routes use Zod validation, structured error responses, and timeout guards.

### AI Layer

| Component | Model | Purpose |
|-----------|-------|---------|
| Content Planner | gpt-4o-mini | Fast structured plan generation |
| Section Writer | gpt-4o | High-quality prose per section |
| Rewrite/Tone | gpt-4o | Selection-based text transformation |
| Continue Writing | gpt-4o-mini | Inline continuation from cursor |

### Custom TipTap Extensions (all open-source)

| Extension | Purpose |
|-----------|---------|
| `MultiColumn` + `Column` | CSS Grid two-column layouts |
| `HeroSection` | Full-width gradient banner with large heading |
| `CallToAction` | Styled CTA button block |
| `SectionBlock` | Generic section wrapper with typed styling |
| `ImageBlock` | Image with caption support |
| `SlashCommands` | Notion-style `/` command menu |
| `ContinueWriting` | Tab key triggers AI continuation |

---

## Key Design Decisions

### 1. HTML as transport format, not ProseMirror JSON

The AI outputs HTML. The system wraps it in layout structures. TipTap parses the final HTML into ProseMirror nodes.

HTML streams well (parse at `>` boundaries). ProseMirror JSON requires valid tree structure. HTML also allows the AI to use familiar tags rather than learning ProseMirror's node schema.

Tradeoff: HTML-to-ProseMirror parsing can silently drop unsupported tags. Mitigated by constraining AI output to a small set of allowed tags and sanitizing before insertion.

### 2. Layout enforced deterministically, not by AI

The AI never generates layout markup. `buildFinalHTML()` and `wrapSectionBody()` wrap AI content into the correct structure based on `section.type`.

If the plan says `two_column`, the output is always a valid two-column grid. The AI's job is writing; the system's job is layout.

### 3. Plan pass as non-streaming generateObject

Pass 1 uses `generateObject` (complete JSON) instead of `streamObject` (progressive). The plan is small (~500 tokens) and must be fully valid before the skeleton can render. Streaming saves ~0.5s but adds parsing complexity for no UX gain.

### 4. Sequential section generation with context passing

Sections stream one after another, top-to-bottom. Each section writer receives the content of the last 2-3 completed sections as context, maintaining narrative continuity. Parallel generation would break this continuity.

### 5. Streaming preview as separate component

During generation, a `StreamingPreview` React component renders content. After completion, the full HTML is loaded into TipTap via `setContent`. TipTap's DOM is controlled by ProseMirror; directly manipulating it during streaming causes conflicts.

---

## Prompt Engineering

All prompts follow a structured format with XML-delimited sections:

**System prompt structure:**
```
<role>           Persona and expertise
<output_format>  Allowed HTML tags, wrapper rules
<writing_rules>  Style, tone, formatting guidance
<formatting_by_section_type>  Per-type output patterns
<examples>       Concrete HTML output examples
<banned_phrases> Explicit anti-patterns
<quality_standard> Evaluation criteria
```

**Section writer user prompt structure:**
```
<task>            Position in document, content type
<document>        Title, tone, content type
<target_audience> Who the content is for
<keywords_to_include> SEO/brand terms to incorporate
<current_section> Heading, type, target word count
<document_outline> Full outline with position marker
<previously_written_content> Last 2-3 section summaries
<upcoming_sections> Future sections to avoid overlap
<user_request>    Original prompt
<reference_material> Parsed file attachments (XML-structured)
<constraints>     Word count, readability, formatting rules
```

**File context** is structured as XML:
```xml
<file name="report.pdf" type=".pdf" size="245000">
[Page 1]
Extracted text content...

---

[Page 2]
More content...
</file>
```

---

## Validation Layer

Every API route validates input before processing:

| Route | Schema | Validation |
|-------|--------|-----------|
| `/api/generate/plan` | `PlanRequestSchema` | prompt (1-5000 chars), contentType enum, optional audience/tone/keywords/context |
| `/api/generate/section` | `SectionRequestSchema` | Nested sectionPlan + fullPlan objects, contentType, context fields, previousContents |
| `/api/generate/rewrite` | `RewriteRequestSchema` | text (1-5000 chars), action enum, optional tone |
| `/api/generate/continue` | `ContinueSchema` | sectionContext, lastLine, optional textAfter/documentTitle/sectionHeading |
| `/api/pexels` | Inline validation | query (1-200 chars), trimmed and length-checked |

Error handling uses `classifyError()` to detect rate limits (429), auth failures (401), timeouts, and context length errors. Plan route has retry logic via `withRetry()`.

---

## Features

### Content Generation
- Three content types: Blog Post, Social Post, Landing Page
- Structured prompt input: topic, audience, tone, keywords
- File attachments as context (PDF with text extraction, TXT, MD, CSV, JSON)
- Template library with pre-built presets
- Interactive outline editor before generation (reorder, rename, add, remove sections)

### Editor
- Full TipTap editor with toolbar (formatting, alignment, lists, links, images)
- Custom layout extensions (multi-column, hero, CTA, image blocks)
- Section-level regeneration with layout preservation
- Bubble menu for AI-assisted rewrite/expand/shorten/tone change on selection
- Slash commands: `/rewrite`, `/expand`, `/shorten`, `/summarize`, `/continue`, `/professional`, `/casual`, `/technical`, `/persuasive`, `/image`, `/h1`, `/h2`, `/bullet`, `/number`, `/quote`, `/divider`
- Continue writing from cursor (Tab key)
- Dark mode toggle

### Streaming and UX
- Progressive section-by-section rendering during generation
- Skeleton placeholders appear immediately after planning
- Per-section progress indicators with completion tracking
- Stop generation (Escape key)
- Debounced HTML insertion at tag boundaries for smooth rendering

### Analysis and Export
- Content quality scoring: Flesch-Kincaid readability (content-type-aware), word count, reading time, average sentence length, passive voice detection, keyword density tracking
- Export as HTML, Markdown, or styled HTML (inline CSS for paste compatibility with Gmail, Google Docs, WordPress)
- Version history with automatic snapshots on generation, regeneration, and AI actions; manual save via Cmd+S; stored in localStorage

---

## Project Structure

```
src/
  app/
    api/generate/           API routes for AI generation
      plan/route.ts         Pass 1: content planner
      section/route.ts      Pass 2: section writer (streaming)
      rewrite/route.ts      Text transformation
      continue/route.ts     Continue writing from cursor
    api/pexels/route.ts   Pexels image search proxy
    page.tsx                Main editor page
    layout.tsx              Root layout with theme support

  components/
    editor/                 Editor UI components
      ContentEditor.tsx     TipTap editor wrapper
      EditorToolbar.tsx     Formatting toolbar
      BubbleMenuBar.tsx     Selection-based AI menu
      SlashCommandMenu.tsx  Slash command dropdown
      StreamingPreview.tsx  Progressive rendering during generation
      ContentScorePanel.tsx Readability and quality analysis
      VersionHistoryPanel.tsx Snapshot timeline
      ImagePicker.tsx       Pexels image search modal
      SectionActions.tsx    Per-section regenerate/delete
      ExportMenu.tsx        Export options
      extensions/           Custom TipTap extensions
    generator/              Generation UI
      PromptPanel.tsx       Structured input form
      TemplatePicker.tsx    Content templates
      GenerationStatusBar.tsx Progress indicator
    outline/
      OutlineEditor.tsx     Interactive pre-generation outline

  lib/
    ai/
      prompts/              Content-type-specific prompts
      schemas.ts            Zod schemas for content plan
    api/
      validation.ts         Request validation schemas
      errors.ts             Error classification
      retry.ts              Retry logic
    editor/
      streaming.ts          buildFinalHTML, wrapSectionBody
      slashCommands.ts      Slash command definitions
      slashSuggestion.tsx   TipTap suggestion plugin config
      export.ts             Styled HTML export
    analysis/index.ts       Readability scoring algorithms
    files/parser.ts         File parsing (PDF, text, CSV, JSON)
    hooks/                  React hooks for generation, editor, history
    types/index.ts          Shared TypeScript types
```

---

## What I'd Improve With More Time

1. **WebSocket-based streaming** for bidirectional communication and collaboration readiness.

2. **Parallel section generation with priority queue** to generate hero and CTA first, then fill middle sections.

3. **Content caching** for similar prompts to skip Pass 1 on repeat generations.

4. **Collaborative editing** via Yjs (TipTap has first-class support).

5. **LLM evaluation pipeline** to A/B test models and prompts, tracking readability scores and quality metrics.

6. **Image generation** via DALL-E or Stable Diffusion instead of stock photography.

7. **SEO optimization pass** as a third generation pass analyzing heading hierarchy, keyword placement, and meta descriptions.

8. **Native undo integration** for AI actions within ProseMirror's undo stack.

9. **Diff view between version snapshots** showing what changed visually.

10. **Token usage tracking** with per-session cost estimates.
