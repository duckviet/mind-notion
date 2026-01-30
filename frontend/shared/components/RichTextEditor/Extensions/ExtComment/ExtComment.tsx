import { getMarkRange, Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

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
        class: "rounded-sm bg-yellow-100/60 text-foreground",
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
  addProseMirrorPlugins() {
    let lastFrom = -1;
    let lastTo = -1;
    let cachedDecorations = DecorationSet.empty;

    return [
      new Plugin({
        key: new PluginKey("commentHighlight"),
        props: {
          decorations: (state) => {
            const { selection, doc } = state;
            const { from, to } = selection;

            // Cache: nếu selection không đổi, trả về decorations cũ
            if (from === lastFrom && to === lastTo) {
              return cachedDecorations;
            }

            lastFrom = from;
            lastTo = to;

            // Kiểm tra xem tại vị trí hiện tại có Mark 'comment' không
            const isCommentActive = state.selection.$from
              .marks()
              .some((mark) => mark.type.name === "comment");

            if (!isCommentActive) {
              cachedDecorations = DecorationSet.empty;
              return cachedDecorations;
            }

            // Lấy phạm vi chính xác của Mark comment tại vị trí con trỏ
            const range = getMarkRange(
              doc.resolve(from),
              state.schema.marks.comment,
            );

            if (!range) {
              cachedDecorations = DecorationSet.empty;
              return cachedDecorations;
            }

            // Tạo một Decoration (inline) bao phủ toàn bộ range của comment
            cachedDecorations = DecorationSet.create(doc, [
              Decoration.inline(range.from, range.to, {
                class: "border-b-1 border-yellow-400",
              }),
            ]);

            return cachedDecorations;
          },
        },
      }),
    ];
  },
});

export default ExtComment;
