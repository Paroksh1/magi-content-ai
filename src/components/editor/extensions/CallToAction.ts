import { Node, mergeAttributes } from "@tiptap/react";

export const CallToAction = Node.create({
  name: "callToAction",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: "Get Started",
        parseHTML: (element) => element.textContent?.trim() || "Get Started",
      },
      href: {
        default: "#",
        parseHTML: (element) => element.getAttribute("data-href") || "#",
        renderHTML: (attributes) => ({ "data-href": attributes.href }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="cta-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { label, ...rest } = HTMLAttributes;
    return [
      "div",
      mergeAttributes(rest, { "data-type": "cta-block" }),
      label || "Get Started",
    ];
  },
});
