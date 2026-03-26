import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance } from "tippy.js";
import { SlashCommandMenu, type SlashCommandMenuRef } from "@/components/editor/SlashCommandMenu";
import { getSlashCommands, filterCommands, type SlashCommand } from "./slashCommands";

const allCommands = getSlashCommands();

export const slashSuggestion = {
  items: ({ query }: { query: string }) => {
    return filterCommands(query, allCommands);
  },

  render: () => {
    let component: ReactRenderer<SlashCommandMenuRef> | null = null;
    let popup: Instance[] | null = null;

    return {
      onStart: (props: {
        editor: unknown;
        clientRect: (() => DOMRect | null) | null;
        command: (item: SlashCommand) => void;
        items: SlashCommand[];
      }) => {
        component = new ReactRenderer(SlashCommandMenu, {
          props: {
            items: props.items,
            command: (item: SlashCommand) => {
              props.command(item);
            },
          },
          editor: props.editor as any,
        });

        if (!props.clientRect) return;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          offset: [0, 8],
          animation: false,
          maxWidth: "none",
        });
      },

      onUpdate: (props: {
        items: SlashCommand[];
        clientRect: (() => DOMRect | null) | null;
        command: (item: SlashCommand) => void;
      }) => {
        if (!component) return;

        component.updateProps({
          items: props.items,
          command: (item: SlashCommand) => {
            props.command(item);
          },
        });

        if (popup && props.clientRect) {
          popup[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        }
      },

      onKeyDown: (props: { event: KeyboardEvent }) => {
        if (props.event.key === "Escape") {
          popup?.[0]?.hide();
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        popup?.[0]?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  },

  command: ({ editor, range, props }: { editor: any; range: any; props: SlashCommand }) => {
    props.action(editor, range);
  },
};
