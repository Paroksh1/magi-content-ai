"use client";

import { useEffect, useRef, useCallback, memo } from "react";
import type { ContentPlan, GenerationState, Section } from "@/lib/types";
import { escapeHtml } from "@/lib/sanitize";

interface StreamingPreviewProps {
  plan: ContentPlan | null;
  phase: GenerationState["phase"];
  sections: GenerationState["sections"];
  registerContainer: (sectionId: string, el: HTMLDivElement | null) => void;
}

function SkeletonLine({ width }: { width: string }) {
  return <div className="h-3.5 rounded bg-muted shimmer-line" style={{ width }} />;
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 py-2">
      <SkeletonLine width="85%" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="72%" />
      <SkeletonLine width="90%" />
    </div>
  );
}

function PlanningPlaceholder() {
  return (
    <div className="tiptap prose prose-neutral max-w-none">
      <div className="mb-8">
        <div className="h-9 w-3/4 rounded bg-muted shimmer-line mb-3" />
        <div className="h-4 w-1/2 rounded bg-muted shimmer-line" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="mb-6 pb-6 border-b border-border last:border-b-0">
          <div className="h-6 w-2/5 rounded bg-muted shimmer-line mb-3" />
          <SectionSkeleton />
        </div>
      ))}
    </div>
  );
}

const SectionView = memo(function SectionView({
  section,
  sectionState,
  registerContainer,
}: {
  section: Section;
  sectionState: GenerationState["sections"][string] | undefined;
  registerContainer: (sectionId: string, el: HTMLDivElement | null) => void;
}) {
  const isHero = section.type === "hero";
  const isPending = !sectionState || sectionState.status === "pending";
  const isStreaming = sectionState?.status === "streaming";
  const isComplete = sectionState?.status === "complete";
  const heading = escapeHtml(section.heading || "Untitled");

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    registerContainer(section.id, el);
  }, [section.id, registerContainer]);

  return (
    <div
      id={`preview-${section.id}`}
      data-type={isHero ? "hero-section" : "section-block"}
      data-section-type={section.type}
    >
      {isHero ? <h1>{section.heading}</h1> : <h2>{section.heading}</h2>}

      {isPending && <SectionSkeleton />}

      {!isPending && section.type === "two_column" && (
        <div data-type="multi-column">
          <div data-type="column">
            <div ref={containerRef} className="streaming-content" />
          </div>
          <div data-type="column">
            <div className="streaming-content" data-second-column={section.id} />
          </div>
        </div>
      )}

      {!isPending && section.type === "text_with_image" && (
        <div data-type="multi-column">
          <div data-type="column">
            <div ref={containerRef} className="streaming-content" />
          </div>
          <div data-type="column">
            <figure data-type="image-block">
              <div className="w-full aspect-[3/2] rounded-lg bg-muted shimmer-line flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Loading image...</span>
              </div>
              <figcaption>{section.heading}</figcaption>
            </figure>
          </div>
        </div>
      )}

      {!isPending && section.type === "cta" && (
        <>
          <div ref={containerRef} className="streaming-content" />
          <div data-type="cta-block">Get Started</div>
        </>
      )}

      {!isPending && section.type !== "two_column" && section.type !== "text_with_image" && section.type !== "cta" && (
        <div ref={containerRef} className="streaming-content" />
      )}

      {(isStreaming) && (
        <div className="streaming-cursor-container">
          <span className="streaming-cursor" />
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  if (prev.section.id !== next.section.id) return false;
  const prevStatus = prev.sectionState?.status;
  const nextStatus = next.sectionState?.status;
  if (prevStatus === "complete" && nextStatus === "complete") return true;
  return prevStatus === nextStatus;
});

export function StreamingPreview({ plan, phase, sections, registerContainer }: StreamingPreviewProps) {
  const lastScrolledSection = useRef<string | null>(null);

  useEffect(() => {
    if (!plan) return;
    const activeSection = plan.sections.find((s) => sections[s.id]?.status === "streaming");
    if (!activeSection || activeSection.id === lastScrolledSection.current) return;
    lastScrolledSection.current = activeSection.id;
    const el = document.getElementById(`preview-${activeSection.id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [plan, sections]);

  if (phase === "planning" || !plan) {
    return <PlanningPlaceholder />;
  }

  return (
    <div className="tiptap prose prose-neutral max-w-none">
      {plan.sections.map((section) => (
        <SectionView
          key={section.id}
          section={section}
          sectionState={sections[section.id]}
          registerContainer={registerContainer}
        />
      ))}
    </div>
  );
}
