import { Extension } from "@tiptap/core";

export const ContinueWriting = Extension.create({
  name: "continueWriting",

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("bulletList") || this.editor.isActive("orderedList")) {
          return false;
        }

        const { $from, empty } = this.editor.state.selection;
        if (!empty) return false;

        const isAtEnd = $from.pos === $from.end();
        if (!isAtEnd) return false;

        document.dispatchEvent(new CustomEvent("continue-writing"));
        return true;
      },
    };
  },
});
