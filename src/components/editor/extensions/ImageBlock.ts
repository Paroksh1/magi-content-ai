import { Node, mergeAttributes } from "@tiptap/react";

export const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => {
          const img = element.querySelector("img");
          return img?.getAttribute("src") || null;
        },
      },
      alt: {
        default: "",
        parseHTML: (element) => {
          const img = element.querySelector("img");
          return img?.getAttribute("alt") || "";
        },
      },
      caption: {
        default: "",
        parseHTML: (element) => {
          const fig = element.querySelector("figcaption");
          return fig?.textContent || "";
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, ...rest } = HTMLAttributes;
    return [
      "figure",
      mergeAttributes(rest, { "data-type": "image-block" }),
      ["img", { src, alt: alt || caption, draggable: "false" }],
      ["figcaption", {}, caption || alt || ""],
    ];
  },
});
