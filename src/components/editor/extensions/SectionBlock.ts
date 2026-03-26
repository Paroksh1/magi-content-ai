import { Node, mergeAttributes } from "@tiptap/react";

export const SectionBlock = Node.create({
  name: "sectionBlock",
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
        default: null,
        parseHTML: (element) => element.getAttribute("data-section-type"),
        renderHTML: (attributes) => {
          if (!attributes.sectionType) return {};
          return { "data-section-type": attributes.sectionType };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "section-block" }),
      0,
    ];
  },
});
