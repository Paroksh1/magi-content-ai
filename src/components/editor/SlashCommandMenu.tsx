"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useRef,
} from "react";
import type { SlashCommand } from "@/lib/editor/slashCommands";
import { CATEGORY_LABELS } from "@/lib/editor/slashCommands";

export interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashCommandMenuProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      const el = itemRefs.current[selectedIndex];
      if (el) {
        el.scrollIntoView({ block: "nearest" });
      }
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) command(item);
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev >= items.length - 1 ? 0 : prev + 1));
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        if (event.key === "Escape") {
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="slash-menu-container bg-background border border-border rounded-lg shadow-lg p-2 w-64">
          <p className="text-xs text-muted-foreground px-2 py-1.5">No matching commands</p>
        </div>
      );
    }

    const grouped: Record<string, { items: SlashCommand[]; startIndex: number }> = {};
    let runningIndex = 0;
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = { items: [], startIndex: runningIndex };
      }
      grouped[item.category].items.push(item);
      runningIndex++;
    }

    let flatIndex = 0;

    return (
      <div
        ref={menuRef}
        className="slash-menu-container bg-background border border-border rounded-lg shadow-lg overflow-hidden w-64 max-h-80 overflow-y-auto"
      >
        {Object.entries(grouped).map(([category, group]) => (
          <div key={category}>
            <div className="px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {CATEGORY_LABELS[category] || category}
              </span>
            </div>
            {group.items.map((item) => {
              const currentIndex = flatIndex++;
              return (
                <button
                  key={item.title}
                  ref={(el) => { itemRefs.current[currentIndex] = el; }}
                  type="button"
                  className={`flex items-center gap-3 w-full px-3 py-1.5 text-left transition-colors ${
                    currentIndex === selectedIndex
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => selectItem(currentIndex)}
                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded-md bg-muted text-xs font-medium shrink-0">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);

SlashCommandMenu.displayName = "SlashCommandMenu";
