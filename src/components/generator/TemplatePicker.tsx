"use client";

import { useState } from "react";
import { ChevronDown, FileText, MessageSquare, Layout } from "lucide-react";
import type { ContentType } from "@/lib/types";
import { getTemplatesForType, type Template } from "@/lib/templates";

const TYPE_ICONS: Record<ContentType, typeof FileText> = {
  blog: FileText,
  social_post: MessageSquare,
  landing_page: Layout,
};

interface TemplatePickerProps {
  contentType: ContentType;
  onSelect: (template: Template) => void;
  disabled?: boolean;
}

export function TemplatePicker({ contentType, onSelect, disabled }: TemplatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const templates = getTemplatesForType(contentType);
  const Icon = TYPE_ICONS[contentType];

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
      >
        <span>Use a template</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="mt-2 max-h-56 overflow-y-auto space-y-1 pr-1">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => {
                onSelect(template);
                setIsOpen(false);
              }}
              disabled={disabled}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors disabled:opacity-50 group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <Icon size={12} className="text-accent shrink-0" />
                <span className="text-xs font-medium text-foreground group-hover:text-accent transition-colors">
                  {template.name}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pl-5">
                {template.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
