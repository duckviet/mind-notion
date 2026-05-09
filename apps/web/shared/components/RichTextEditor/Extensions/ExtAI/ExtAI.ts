import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { type Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  AISelectionContext,
  AISelectionMeta,
  AISelectionPluginState,
  AISelectionStatus,
} from "./types";
import {
  buildDecorations,
  getContextBlocksBetween,
  normalizeRange,
  toBlockPayload,
} from "./utils";

const AI_SELECTION_PLUGIN_KEY = new PluginKey<AISelectionPluginState>(
  "aiSelection",
);
export interface AIOptions {
  /**
   * Callback function khi kích hoạt AI
   */
  onOpenAI: (
    selection: string,
    range: { from: number; to: number },
    context: AISelectionContext,
  ) => void;
  /**
   * Các thuộc tính HTML tùy chỉnh (nếu cần)
   */
  HTMLAttributes: Record<string, any>;
}

// Khai báo module để hỗ trợ IntelliSense cho editor.commands
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ai: {
      /**
       * Mở giao diện AI với vùng văn bản đang chọn
       */
      openAI: () => ReturnType;
      /**
       * Cập nhật trạng thái vùng bôi đen cho AI menu/processing
       */
      setAISelection: (
        status: AISelectionStatus,
        range?: { from: number; to: number },
      ) => ReturnType;
      /**
       * Xóa trạng thái vùng bôi đen cho AI
       */
      clearAISelection: () => ReturnType;
    };
  }
}

export const ExtAI = Extension.create<AIOptions>({
  name: "ai",

  addOptions() {
    return {
      onOpenAI: () => {},
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      openAI:
        () =>
        ({ state, editor, dispatch }) => {
          const { selection, doc } = state;
          const { from, to } = selection;

          const contextBlocks = getContextBlocksBetween(doc, from, to).map(
            ({ node, start }) => toBlockPayload(node, start, 1),
          );
          const context: AISelectionContext = {
            contextBlocks,
          };
          //           console.log($from.node(1).toJSON());
          console.log("AI Selection Context:", context);
          // Lấy text trong vùng chọn, nếu không có selection thì text sẽ trống
          const selectedText = doc.textBetween(from, to, " ");

          if (dispatch) {
            const range = normalizeRange(
              { from, to },
              state.doc.content.size + 1,
            );
            if (range) {
              dispatch(
                state.tr.setMeta(AI_SELECTION_PLUGIN_KEY, {
                  status: "menu",
                  range,
                } satisfies AISelectionMeta),
              );
            }
          }

          // Thực thi callback được truyền từ bên ngoài qua options
          if (this.options.onOpenAI) {
            this.options.onOpenAI(selectedText, { from, to }, context);
            return true;
          }

          return false;
        },
      setAISelection:
        (status, range) =>
        ({ state, dispatch }) => {
          if (!dispatch) return true;

          const fallbackRange = {
            from: state.selection.from,
            to: state.selection.to,
          };
          const normalizedRange = normalizeRange(
            range ?? fallbackRange,
            state.doc.content.size + 1,
          );

          if (!normalizedRange) {
            dispatch(
              state.tr.setMeta(AI_SELECTION_PLUGIN_KEY, {
                clear: true,
              } satisfies AISelectionMeta),
            );
            return true;
          }

          dispatch(
            state.tr.setMeta(AI_SELECTION_PLUGIN_KEY, {
              status,
              range: normalizedRange,
            } satisfies AISelectionMeta),
          );
          return true;
        },
      clearAISelection:
        () =>
        ({ state, dispatch }) => {
          if (!dispatch) return true;
          dispatch(
            state.tr.setMeta(AI_SELECTION_PLUGIN_KEY, {
              clear: true,
            } satisfies AISelectionMeta),
          );
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Sử dụng alias command đã định nghĩa trong addCommands
      "Alt-m": () => this.editor.commands.openAI(),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<AISelectionPluginState>({
        key: AI_SELECTION_PLUGIN_KEY,
        state: {
          init: (_, state) => ({
            status: null,
            range: null,
            decorations: buildDecorations(state.doc, null, null),
          }),
          apply: (tr, pluginState, _oldState, newState) => {
            let range = pluginState.range;
            let status = pluginState.status;

            if (range && tr.docChanged) {
              const mappedFrom = tr.mapping.map(range.from);
              const mappedTo = tr.mapping.map(range.to);
              range = normalizeRange(
                { from: mappedFrom, to: mappedTo },
                newState.doc.content.size + 1,
              );
              if (!range) {
                status = null;
              }
            }

            const meta = tr.getMeta(AI_SELECTION_PLUGIN_KEY) as
              | AISelectionMeta
              | undefined;

            if (meta) {
              if ("clear" in meta && meta.clear) {
                range = null;
                status = null;
              } else if ("status" in meta) {
                status = meta.status;
                const nextRange = meta.range ?? range;
                range = nextRange
                  ? normalizeRange(nextRange, newState.doc.content.size + 1)
                  : null;

                if (!range) {
                  status = null;
                }
              }
            }

            return {
              status,
              range,
              decorations: buildDecorations(newState.doc, range, status),
            };
          },
        },
        props: {
          decorations: (state) =>
            AI_SELECTION_PLUGIN_KEY.getState(state)?.decorations ??
            DecorationSet.empty,
        },
      }),
    ];
  },
});

export default ExtAI;
