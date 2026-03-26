"use client";

import { useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { buildFinalHTML, wrapSection } from "@/lib/editor/streaming";
import { sanitizeHTML } from "@/lib/sanitize";
import { fetchImagesForSections } from "@/lib/images";
import type { ContentType, ContentPlan, GenerationState, PromptInput } from "@/lib/types";

function pushContentToDOM(
  container: HTMLDivElement | null,
  fullHTML: string,
  renderedBlockCount: { current: number }
) {
  if (!container) return;

  const sanitized = sanitizeHTML(fullHTML);
  const temp = document.createElement("div");
  temp.innerHTML = sanitized;
  const blocks = Array.from(temp.children);

  for (let i = renderedBlockCount.current; i < blocks.length; i++) {
    const block = blocks[i].cloneNode(true) as HTMLElement;
    block.classList.add("stream-block-enter");
    container.appendChild(block);
  }

  if (blocks.length > 0 && renderedBlockCount.current > 0) {
    const lastIdx = renderedBlockCount.current - 1;
    const lastRendered = container.children[lastIdx] as HTMLElement;
    const latestVersion = blocks[lastIdx] as HTMLElement;
    if (lastRendered && latestVersion && lastRendered.innerHTML !== latestVersion.innerHTML) {
      lastRendered.innerHTML = latestVersion.innerHTML;
    }
  }

  renderedBlockCount.current = Math.max(renderedBlockCount.current, blocks.length);
}


function getRecentContents(
  allContents: Record<string, string>,
  plan: ContentPlan,
  currentSectionId: string
): Record<string, string> {
  const currentIndex = plan.sections.findIndex((s) => s.id === currentSectionId);
  if (currentIndex <= 0) return {};

  const recent: Record<string, string> = {};
  const start = Math.max(0, currentIndex - 3);

  for (let i = start; i < currentIndex; i++) {
    const section = plan.sections[i];
    const content = allContents[section.id];
    if (!content) continue;
    const trimmed = content.length > 600 ? content.slice(0, 600) + "..." : content;
    recent[section.heading] = trimmed;
  }

  return recent;
}

function truncateText(html: string, maxChars: number): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text;
}

const INITIAL_STATE: GenerationState = {
  phase: "idle",
  plan: null,
  sections: {},
  error: null,
};

export function useContentGeneration(editor: Editor | null) {
  const [state, setState] = useState<GenerationState>(INITIAL_STATE);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sectionContentsRef = useRef<Record<string, string>>({});
  const lastContentTypeRef = useRef<ContentType>("blog");
  const lastInputRef = useRef<PromptInput | null>(null);
  const imageUrlsRef = useRef<Record<string, string>>({});
  const containerRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());
  const blockCountsMap = useRef<Map<string, { current: number }>>(new Map());

  const registerContainer = useCallback((sectionId: string, el: HTMLDivElement | null) => {
    if (el) {
      containerRefsMap.current.set(sectionId, el);
      if (!blockCountsMap.current.has(sectionId)) {
        blockCountsMap.current.set(sectionId, { current: 0 });
      }
    } else {
      containerRefsMap.current.delete(sectionId);
      blockCountsMap.current.delete(sectionId);
    }
  }, []);

  const fetchPlan = useCallback(
    async (input: PromptInput, contentType: ContentType, signal: AbortSignal): Promise<ContentPlan> => {
      const res = await fetch("/api/generate/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input.topic,
          contentType,
          context: input.context || undefined,
          audience: input.audience || undefined,
          tone: input.tone,
          keywords: input.keywords || undefined,
        }),
        signal,
      });
      if (!res.ok) throw new Error("Failed to generate content plan");
      return res.json();
    },
    []
  );

  const streamSection = useCallback(
    async (
      sectionPlan: ContentPlan["sections"][number],
      fullPlan: ContentPlan,
      contentType: ContentType,
      input: PromptInput,
      signal: AbortSignal,
      previousContents: Record<string, string>
    ): Promise<string> => {
      setState((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          [sectionPlan.id]: { id: sectionPlan.id, status: "streaming", content: "" },
        },
      }));

      const res = await fetch("/api/generate/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionPlan,
          fullPlan,
          contentType,
          userPrompt: input.topic,
          context: input.context || undefined,
          audience: input.audience || undefined,
          tone: input.tone,
          keywords: input.keywords || undefined,
          previousContents,
        }),
        signal,
      });

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          sections: {
            ...prev.sections,
            [sectionPlan.id]: { id: sectionPlan.id, status: "error", content: "" },
          },
        }));
        return "";
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let rafId = 0;

      const sectionContainer = containerRefsMap.current.get(sectionPlan.id) || null;
      const blockCount = blockCountsMap.current.get(sectionPlan.id) || { current: 0 };
      blockCount.current = 0;

      const flushToDOM = () => {
        if (signal.aborted) return;
        pushContentToDOM(sectionContainer, accumulated, blockCount);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (signal.aborted) break;

        accumulated += decoder.decode(value, { stream: true });
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(flushToDOM);
      }

      cancelAnimationFrame(rafId);
      if (signal.aborted) return accumulated;

      pushContentToDOM(sectionContainer, accumulated, blockCount);
      setState((prev) => ({
        ...prev,
        sections: {
          ...prev.sections,
          [sectionPlan.id]: { id: sectionPlan.id, status: "complete", content: accumulated },
        },
      }));

      return accumulated;
    },
    []
  );

  const generate = useCallback(
    async (input: PromptInput, contentType: ContentType) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      sectionContentsRef.current = {};
      lastContentTypeRef.current = contentType;
      lastInputRef.current = input;
      containerRefsMap.current.forEach((el) => { el.textContent = ""; });
      blockCountsMap.current.forEach((bc) => { bc.current = 0; });
      setState({ phase: "planning", plan: null, sections: {}, error: null });

      try {
        const rawPlan = await fetchPlan(input, contentType, controller.signal);
        const plan: ContentPlan = {
          ...rawPlan,
          sections: rawPlan.sections.map((s, i) => ({ ...s, id: `s${i + 1}` })),
        };

        setState((prev) => ({ ...prev, phase: "outlining", plan }));
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({ ...prev, phase: "error", error: (err as Error).message }));
      }
    },
    [fetchPlan]
  );

  const confirmOutline = useCallback(
    async (editedPlan: ContentPlan) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const plan: ContentPlan = {
        ...editedPlan,
        sections: editedPlan.sections.map((s, i) => ({ ...s, id: `s${i + 1}` })),
      };

      sectionContentsRef.current = {};
      containerRefsMap.current.forEach((el) => { el.textContent = ""; });
      blockCountsMap.current.forEach((bc) => { bc.current = 0; });

      setState((prev) => ({ ...prev, phase: "writing", plan }));

      const sectionStates: GenerationState["sections"] = {};
      for (const section of plan.sections) {
        sectionStates[section.id] = { id: section.id, status: "pending", content: "" };
      }
      setState((prev) => ({ ...prev, sections: sectionStates }));

      try {
        const input = lastInputRef.current!;
        const contentType = lastContentTypeRef.current;

        for (const section of plan.sections) {
          if (controller.signal.aborted) break;
          const recentContents = getRecentContents(sectionContentsRef.current, plan, section.id);
          const content = await streamSection(section, plan, contentType, input, controller.signal, recentContents);
          sectionContentsRef.current[section.id] = content;
        }

        if (editor && !controller.signal.aborted) {
          const imageUrls = await fetchImagesForSections(plan.sections);
          imageUrlsRef.current = imageUrls;
          const finalHTML = buildFinalHTML(plan, sectionContentsRef.current, imageUrls);
          editor.commands.setContent(finalHTML);
          setState((prev) => ({ ...prev, phase: "transitioning" }));
          await new Promise((resolve) => setTimeout(resolve, 350));
        }

        setState((prev) => ({ ...prev, phase: "complete" }));
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({ ...prev, phase: "error", error: (err as Error).message }));
      }
    },
    [editor, streamSection]
  );

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (editor && state.plan) {
      const finalHTML = buildFinalHTML(state.plan, sectionContentsRef.current, imageUrlsRef.current);
      editor.commands.setContent(finalHTML);
    }
    setState((prev) => ({ ...prev, phase: "transitioning" }));
    setTimeout(() => setState((prev) => ({ ...prev, phase: "complete" })), 350);
  }, [editor, state.plan]);

  const regenerateSection = useCallback(
    async (sectionId: string) => {
      if (!editor || !state.plan) return;

      const sectionPlan = state.plan.sections.find((s) => s.id === sectionId);
      if (!sectionPlan) return;

      setRegeneratingSection(sectionId);

      try {
        const res = await fetch("/api/generate/section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionPlan,
            fullPlan: state.plan,
            contentType: lastContentTypeRef.current,
            userPrompt: lastInputRef.current?.topic || "",
            context: lastInputRef.current?.context || undefined,
            audience: lastInputRef.current?.audience || undefined,
            tone: lastInputRef.current?.tone || "professional",
            keywords: lastInputRef.current?.keywords || undefined,
          }),
        });

        if (!res.ok) return;

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
        }

        sectionContentsRef.current[sectionId] = accumulated;

        if (state.plan) {
          const finalHTML = buildFinalHTML(state.plan, sectionContentsRef.current, imageUrlsRef.current);
          editor.commands.setContent(finalHTML);
        }
      } finally {
        setRegeneratingSection(null);
      }
    },
    [editor, state.plan]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, phase: "idle", error: null }));
  }, []);

  return { state, generate, confirmOutline, stop, registerContainer, regenerateSection, regeneratingSection, clearError };
}
