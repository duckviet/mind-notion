import {
  Node,
  type Editor,
  mergeAttributes,
  type JSONContent,
} from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ProposedEditNodeView from "./ProposedEditNodeView";

export type ProposedEditRange = {
  from: number;
  to: number;
};

export type ProposedEdit = {
  id?: string;
  originalText: string;
  proposedText: string;
  action?: string;
  customPrompt?: string;
  createdAt: number;
};

export type SetProposedEditInput = {
  id?: string;
  range: ProposedEditRange;
  originalText: string;
  proposedText: string;
  action?: string;
  customPrompt?: string;
  createdAt?: number;
};

const normalizeRange = (
  range: ProposedEditRange,
  maxPosition: number,
): ProposedEditRange | null => {
  const from = Math.max(1, Math.min(range.from, maxPosition));
  const to = Math.max(1, Math.min(range.to, maxPosition));

  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    return null;
  }

  return {
    from: Math.min(from, to),
    to: Math.max(from, to),
  };
};

const buildParagraphBlocks = (text: string): JSONContent[] => {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [{ type: "paragraph" }];
  }

  return lines.map((line) => ({
    type: "paragraph",
    content: [{ type: "text", text: line }],
  }));
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    proposedEdits: {
      setProposedEdit: (payload: SetProposedEditInput) => ReturnType;
      clearProposedEdit: (pos?: number) => ReturnType;
      acceptProposedEdit: (pos?: number) => ReturnType;
      rejectProposedEdit: (pos?: number) => ReturnType;
    };
  }
}

const ExtProposedEdits = Node.create<Record<string, never>>({
  name: "proposedEdits",

  group: "block",

  atom: true,

  selectable: true,

  draggable: false,

  isolating: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-id"),
      },
      originalText: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-original") || "",
      },
      proposedText: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-proposed") || "",
      },
      action: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-action"),
      },
      customPrompt: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-custom-prompt"),
      },
      createdAt: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-created-at");
          return value ? Number(value) : null;
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="proposed-edit"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const originalText = (node.attrs.originalText as string) || "";
    const proposedText = (node.attrs.proposedText as string) || "";

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "proposed-edit",
        "data-id": node.attrs.id,
        "data-original": originalText,
        "data-proposed": proposedText,
        "data-action": node.attrs.action,
        "data-custom-prompt": node.attrs.customPrompt,
        "data-created-at": node.attrs.createdAt,
        class: "proposed-edit-block",
      }),
      ["p", { "data-original": "true" }, originalText],
      ["p", { "data-proposed": "true" }, proposedText],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProposedEditNodeView);
  },

  addCommands() {
    const resolveNodePos = (editor: Editor, explicitPos?: number) => {
      if (typeof explicitPos === "number") {
        return explicitPos;
      }

      const { selection } = editor.state;

      if (
        selection instanceof NodeSelection &&
        selection.node.type.name === this.name
      ) {
        return selection.from;
      }

      const { $from } = selection;
      for (let depth = $from.depth; depth > 0; depth -= 1) {
        if ($from.node(depth).type.name === this.name) {
          return $from.before(depth);
        }
      }

      return null;
    };

    return {
      setProposedEdit:
        (payload) =>
        ({ state, dispatch }) => {
          const nodeType = state.schema.nodes[this.name];
          if (!nodeType) {
            return false;
          }

          const maxPosition = state.doc.content.size + 1;
          const range = normalizeRange(payload.range, maxPosition);

          if (!range) {
            return false;
          }

          const proposedEditNode = nodeType.create({
            id: payload.id ?? `proposed-edit-${Date.now()}`,
            createdAt: payload.createdAt ?? Date.now(),
            originalText: payload.originalText,
            proposedText: payload.proposedText,
            action: payload.action,
            customPrompt: payload.customPrompt,
          });

          if (dispatch) {
            dispatch(
              state.tr
                .replaceRangeWith(range.from, range.to, proposedEditNode)
                .scrollIntoView(),
            );
          }

          return true;
        },

      clearProposedEdit:
        (pos) =>
        ({ editor }) => {
          const targetPos = resolveNodePos(editor, pos);
          if (targetPos === null) {
            return false;
          }

          const node = editor.state.doc.nodeAt(targetPos);
          if (!node || node.type.name !== this.name) {
            return false;
          }

          return editor
            .chain()
            .focus()
            .insertContentAt(
              { from: targetPos, to: targetPos + node.nodeSize },
              buildParagraphBlocks((node.attrs.originalText as string) || ""),
            )
            .run();
        },

      acceptProposedEdit:
        (pos) =>
        ({ editor }) => {
          const targetPos = resolveNodePos(editor, pos);
          if (targetPos === null) {
            return false;
          }

          const node = editor.state.doc.nodeAt(targetPos);
          if (!node || node.type.name !== this.name) {
            return false;
          }

          return editor
            .chain()
            .focus()
            .insertContentAt(
              { from: targetPos, to: targetPos + node.nodeSize },
              buildParagraphBlocks((node.attrs.proposedText as string) || ""),
            )
            .run();
        },

      rejectProposedEdit:
        (pos) =>
        ({ editor }) => {
          return editor.commands.clearProposedEdit(pos);
        },
    };
  },
});

export default ExtProposedEdits;
