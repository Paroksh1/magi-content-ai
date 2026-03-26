"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronUp, BookOpen, Clock, AlignLeft, AlertTriangle, Target, Award } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { analyzeContent, type ContentScore } from "@/lib/analysis";

interface ContentScorePanelProps {
  editor: Editor | null;
  keywords?: string;
}

function Metric({ icon: Icon, label, value, sub }: {
  icon: typeof BookOpen;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 70) return "green";
  if (score >= 55) return "amber";
  return "red";
}

export function ContentScorePanel({ editor, keywords }: ContentScorePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [score, setScore] = useState<ContentScore | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const html = editor.getHTML();
        const text = html
          .replace(/<\/?(p|h[1-6]|li|blockquote|div|br\s*\/?)>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&nbsp;/g, " ")
          .replace(/#\w+/g, "")
          .replace(/[→↳•—]/g, "")
          .replace(/\n{2,}/g, "\n")
          .trim();
        if (text.length > 0) {
          setScore(analyzeContent(text, keywords));
        } else {
          setScore(null);
        }
      }, 500);
    };

    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editor, keywords]);

  const color = useMemo(() => score ? scoreColor(score.qualityScore) : "green", [score]);

  const badgeClass = useMemo(() => {
    if (color === "green") return "bg-green-500/15 text-green-600";
    if (color === "amber") return "bg-amber-500/15 text-amber-600";
    return "bg-red-500/15 text-red-600";
  }, [color]);

  const barClass = useMemo(() => {
    if (color === "green") return "bg-green-500";
    if (color === "amber") return "bg-amber-500";
    return "bg-red-500";
  }, [color]);

  if (!score || score.wordCount === 0) return null;

  return (
    <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center gap-4 px-5 py-2 text-xs hover:bg-muted/50 transition-colors"
      >
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${badgeClass}`}>
          <Award size={11} />
          <span className="font-semibold">{score.qualityScore}</span>
          <span>{score.qualityLabel}</span>
        </div>
        <span className="text-muted-foreground">{score.readingTimeMinutes} min read</span>
        <span className="text-muted-foreground">{score.wordCount} words</span>
        <span className="text-muted-foreground">Passive: {score.passiveVoice.percentage}%</span>
        <ChevronUp
          size={12}
          className={`ml-auto text-muted-foreground transition-transform duration-200 ${isExpanded ? "" : "rotate-180"}`}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-4 pt-2 grid grid-cols-3 gap-6 border-t border-border">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content Quality</div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold tabular-nums ${
                color === "green" ? "text-green-500" : color === "amber" ? "text-amber-500" : "text-red-500"
              }`}>{score.qualityScore}</span>
              <span className="text-xs text-muted-foreground pb-1">/ 100</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                style={{ width: `${score.qualityScore}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <div className="flex justify-between">
                <span>Readability (Flesch-Kincaid)</span>
                <span className="font-medium">{score.readabilityScore} — {score.readabilityLabel}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Writing Stats</div>
            <Metric icon={AlignLeft} label="Words" value={score.wordCount} />
            <Metric icon={Clock} label="Reading Time" value={`${score.readingTimeMinutes} min`} />
            <Metric
              icon={AlignLeft}
              label="Avg Sentence"
              value={`${score.avgSentenceLength} words`}
              sub={score.avgSentenceLength > 25 ? "Consider shorter sentences" : undefined}
            />
            <Metric
              icon={AlertTriangle}
              label="Passive Voice"
              value={`${score.passiveVoice.percentage}%`}
              sub={`${score.passiveVoice.count} of ${score.passiveVoice.total} sentences`}
            />
          </div>

          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Keywords</div>
            {score.keywordDensity && score.keywordDensity.length > 0 ? (
              <div className="space-y-2">
                {score.keywordDensity.map(({ keyword, density }) => (
                  <div key={keyword} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Target size={11} className="text-muted-foreground" />
                      <span className="text-xs">{keyword}</span>
                    </div>
                    <span className={`text-xs font-medium tabular-nums ${
                      density >= 0.5 && density <= 4 ? "text-green-600" :
                      density > 0 ? "text-amber-600" : "text-muted-foreground"
                    }`}>
                      {density}%
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">Target: 1-3% per keyword</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Add keywords in the prompt panel to track density.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
