import { Node, mergeAttributes } from "@tiptap/react";

export const HeroSection = Node.create({
  name: "heroSection",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      sectionId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-id"),
        renderHTML: (attributes) => {
          if (!attributes.sectionId) return {};
          return { "data-section-id": attributes.sectionId };
        },
      },
      sectionType: {
        default: "hero",
        parseHTML: () => "hero",
        renderHTML: () => ({ "data-section-type": "hero" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="hero-section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "hero-section" }),
      0,
    ];
  },
});
