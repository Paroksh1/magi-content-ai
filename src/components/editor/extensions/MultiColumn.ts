import { Node, mergeAttributes } from "@tiptap/react";

export const MultiColumn = Node.create({
  name: "multiColumn",
  group: "block",
  content: "column+",
  defining: true,

  addAttributes() {
    return {
      columns: { default: 2 },
      sectionId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="multi-column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "multi-column",
      }),
      0,
    ];
  },
});

export const Column = Node.create({
  name: "column",
  group: "block",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "column" }), 0];
  },
});
