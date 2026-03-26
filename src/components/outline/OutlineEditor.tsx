"use client";

import { useState, useCallback, useRef } from "react";
import { GripVertical, Trash2, Plus, Sparkles, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import type { ContentPlan, Section, SectionType } from "@/lib/types";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "text", label: "Text" },
  { value: "text_with_image", label: "Text + Image" },
  { value: "two_column", label: "Two Column" },
  { value: "quote", label: "Quote" },
  { value: "list", label: "List" },
  { value: "stats", label: "Stats" },
  { value: "cta", label: "CTA" },
];

const TYPE_COLORS: Record<SectionType, string> = {
  hero: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  text: "bg-neutral-500/15 text-neutral-600 border-neutral-500/30",
  text_with_image: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  two_column: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  quote: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  list: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  stats: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  cta: "bg-orange-500/15 text-orange-600 border-orange-500/30",
};

interface OutlineEditorProps {
  plan: ContentPlan;
  onConfirm: (editedPlan: ContentPlan) => void;
  onCancel: () => void;
}

export function OutlineEditor({ plan, onConfirm, onCancel }: OutlineEditorProps) {
  const [title, setTitle] = useState(plan.title);
  const [sections, setSections] = useState<Section[]>(plan.sections);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const updateSection = useCallback((index: number, updates: Partial<Section>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }, []);

  const deleteSection = useCallback((index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const newSectionRef = useRef<string | null>(null);

  const addSection = useCallback((afterIndex?: number, type: SectionType = "text") => {
    const id = `new_${Date.now()}`;
    const wordDefaults: Partial<Record<SectionType, number>> = {
      hero: 50, text: 200, text_with_image: 180, two_column: 200,
      quote: 80, list: 150, stats: 100, cta: 50,
    };
    const newSection: Section = {
      id,
      type,
      heading: "",
      estimatedWords: wordDefaults[type] || 200,
    };
    newSectionRef.current = id;
    setSections((prev) => {
      const idx = afterIndex !== undefined ? afterIndex + 1 : prev.length;
      const next = [...prev];
      next.splice(idx, 0, newSection);
      return next;
    });
  }, []);

  const moveSection = useCallback((index: number, direction: "up" | "down") => {
    setSections((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("opacity-50");
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    setSections((prev) => {
      const next = [...prev];
      const dragged = next.splice(dragItem.current!, 1)[0];
      next.splice(dragOverItem.current!, 0, dragged);
      return next;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const hasEmptyHeadings = sections.some((s) => !s.heading.trim());

  const handleConfirm = () => {
    if (hasEmptyHeadings) return;
    const cleaned = sections.map((s) => ({
      ...s,
      heading: s.heading.trim(),
    }));
    onConfirm({ ...plan, title: title.trim(), sections: cleaned });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Content Outline</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reorder, rename, or adjust sections before generating
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          Document Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
      </div>

      <div className="space-y-1.5 mb-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className="group flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg bg-background hover:border-accent/30 transition-colors"
          >
            <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
              <GripVertical size={16} />
            </div>

            <span className="text-xs text-muted-foreground tabular-nums w-5 shrink-0">
              {index + 1}
            </span>

            <select
              value={section.type}
              onChange={(e) => updateSection(index, { type: e.target.value as SectionType })}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border appearance-none cursor-pointer ${TYPE_COLORS[section.type]}`}
            >
              {SECTION_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <input
              type="text"
              value={section.heading}
              onChange={(e) => updateSection(index, { heading: e.target.value })}
              ref={(el) => {
                if (el && newSectionRef.current === section.id) {
                  el.focus();
                  newSectionRef.current = null;
                }
              }}
              className={`flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground ${
                !section.heading.trim() ? "placeholder:text-destructive/60" : ""
              }`}
              placeholder="Enter a specific heading for this section..."
            />

            <input
              type="number"
              value={section.estimatedWords}
              onChange={(e) => updateSection(index, { estimatedWords: parseInt(e.target.value) || 100 })}
              className="w-14 text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-center border-none outline-none"
              title="Estimated words"
            />

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveSection(index, "up")}
                disabled={index === 0}
                className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-0"
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveSection(index, "down")}
                disabled={index === sections.length - 1}
                className="p-0.5 text-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-0"
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => deleteSection(index)}
                disabled={sections.length <= 1}
                className="p-0.5 text-muted-foreground/30 hover:text-destructive transition-colors disabled:opacity-0"
                title="Delete section"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addSection()}
        className="flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors"
      >
        <Plus size={14} />
        Add Section
      </button>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <span>{sections.length} sections &middot; ~{sections.reduce((sum, s) => sum + s.estimatedWords, 0)} words</span>
          {hasEmptyHeadings && (
            <span className="ml-2 text-destructive">Fill all section headings to continue</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={sections.length === 0 || hasEmptyHeadings}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          <Sparkles size={16} />
          Generate Content
        </button>
      </div>
    </div>
  );
}
