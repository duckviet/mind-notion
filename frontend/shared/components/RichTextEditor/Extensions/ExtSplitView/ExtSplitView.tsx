import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SplitViewComponent from "./SplitViewComponent";

export interface SplitViewOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    splitView: {
      /**
       * Insert a split view
       */
      insertSplitView: (options?: {
        leftWidth?: number;
        border?: boolean;
      }) => ReturnType;
      /**
       * Update split view ratio
       */
      updateSplitViewRatio: (leftWidth: number) => ReturnType;

      /**
       * Toogle border display
       */
      toogleBorderDisplay: (isBorder: boolean) => ReturnType;
    };
  }
}

const ExtSplitView = Node.create<SplitViewOptions>({
  name: "splitView",

  group: "block",

  content: "splitViewColumn splitViewColumn",

  draggable: true,

  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      leftWidth: {
        default: 50,
        parseHTML: (element) => {
          return parseInt(element.getAttribute("data-left-width") || "50", 10);
        },
        renderHTML: (attributes) => {
          return {
            "data-left-width": attributes.leftWidth,
          };
        },
      },
      border: {
        default: true,
        parseHTML: (element) => {
          const attr = element.getAttribute("data-border");
          return attr === "false" ? false : true;
        },
        renderHTML: (attributes) => {
          return {
            "data-border": attributes.border,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="split-view"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "split-view",
        class: "split-view",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SplitViewComponent);
  },

  addCommands() {
    return {
      insertSplitView:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              leftWidth: options?.leftWidth ?? 50,
              border: options?.border ?? true,
            },
            content: [
              {
                type: "splitViewColumn",
                attrs: { position: "left" },
                content: [{ type: "paragraph" }],
              },
              {
                type: "splitViewColumn",
                attrs: { position: "right" },
                content: [{ type: "paragraph" }],
              },
            ],
          });
        },
      updateSplitViewRatio:
        (leftWidth) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { leftWidth });
        },
      toogleBorderDisplay:
        (isBorder) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { border: isBorder });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-s": () => this.editor.commands.insertSplitView(),
    };
  },
});

// Column node for split view
export const SplitViewColumn = Node.create({
  name: "splitViewColumn",

  group: "splitViewColumn",

  content: "block+",

  isolating: true,

  addAttributes() {
    return {
      position: {
        // default: "left",
        parseHTML: (element) => element.getAttribute("data-position") || "left",
        renderHTML: (attributes) => {
          console.log(attributes);
          return {
            "data-position": attributes.position,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="split-view-column"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "split-view-column",
        class: "split-view-column",
      }),
      0,
    ];
  },
});

export default ExtSplitView;
