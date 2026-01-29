import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentAttributes {
  id: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      setComment: (attributes: CommentAttributes) => ReturnType;
      unsetComment: () => ReturnType;
      toggleComment: (attributes: CommentAttributes) => ReturnType;
    };
  }
}

const ExtComment = Mark.create({
  name: "comment",

  addOptions() {
    return {
      HTMLAttributes: {
        class:
          "rounded-sm bg-yellow-100/60 text-foreground transition-colors dark:bg-yellow-500/20",
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) => ({
          "data-comment-id": attributes.id,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetComment:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
      toggleComment:
        (attributes) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
    };
  },
});

export default ExtComment;
