import {
  Node,
  type Editor,
  mergeAttributes,
} from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import { Node as PMNode } from "@tiptap/pm/model";
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
  createdBy?: string;
};

export type SetProposedEditInput = {
  id?: string;
  range: ProposedEditRange;
  originalText: string;
  proposedText: string;
  action?: string;
  customPrompt?: string;
  createdAt?: number;
  createdBy?: string;
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

const buildReplacementNodes = (
  schema: any,
  text: string,
  contextType: string = "paragraph",
  codeLanguage?: string,
  headingLevel?: number,
): PMNode[] => {
  if (contextType === "codeBlock") {
    const codeBlockType = schema.nodes.codeBlock;
    if (codeBlockType) {
      return [
        codeBlockType.create(
          { language: codeLanguage ?? null },
          text ? schema.text(text) : undefined,
        ),
      ];
    }
  }

  if (contextType === "heading") {
    const headingType = schema.nodes.heading;
    if (headingType) {
      return [
        headingType.create(
          { level: headingLevel ?? 1 },
          text ? schema.text(text) : undefined,
        ),
      ];
    }
  }

  if (contextType === "blockquote") {
    const blockquoteType = schema.nodes.blockquote;
    if (blockquoteType) {
      const lines = text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);

      const innerNodes = lines.map((line) =>
        schema.nodes.paragraph.create(null, line ? schema.text(line) : undefined)
      );

      return [
        blockquoteType.create(
          null,
          innerNodes.length > 0 ? innerNodes : [schema.nodes.paragraph.create()]
        ),
      ];
    }
  }

  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [schema.nodes.paragraph.create()];
  }

  return lines.map((line) => {
    return schema.nodes.paragraph.create(
      null,
      line ? schema.text(line) : undefined,
    );
  });
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
      createdBy: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-created-by"),
      },
      contextType: {
        default: "paragraph",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-context-type") || "paragraph",
      },
      codeLanguage: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-code-language"),
      },
      headingLevel: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute("data-heading-level");
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
        "data-created-by": node.attrs.createdBy,
        "data-context-type": node.attrs.contextType,
        "data-code-language": node.attrs.codeLanguage,
        "data-heading-level": node.attrs.headingLevel,
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

            const $from = state.doc.resolve(range.from);
            const parentNode = $from.parent;
            const parentTypeName = parentNode?.type?.name || "paragraph";

            const isInsideCodeBlock = parentTypeName === "codeBlock";
            const isInsideHeading = parentTypeName === "heading";
            const isInsideBlockquote = parentTypeName === "blockquote";

            let replaceFrom = range.from;
            let replaceTo = range.to;

            const shouldReplaceParent = isInsideCodeBlock || isInsideHeading || isInsideBlockquote;

            if (shouldReplaceParent) {
              replaceFrom = $from.before($from.depth);
              replaceTo = replaceFrom + parentNode.nodeSize;
            }

            const proposedEditNode = nodeType.create({
              id: payload.id ?? `proposed-edit-${Date.now()}`,
              createdAt: payload.createdAt ?? Date.now(),
              createdBy: payload?.createdBy || "",
              originalText: payload.originalText,
              proposedText: payload.proposedText,
              action: payload.action,
              customPrompt: payload.customPrompt,
              contextType: shouldReplaceParent ? parentTypeName : "paragraph",
              codeLanguage: isInsideCodeBlock ? (parentNode.attrs.language ?? null) : null,
              headingLevel: isInsideHeading ? (parentNode.attrs.level ?? 1) : null,
            });

            if (dispatch) {
              dispatch(
                state.tr
                  .replaceRangeWith(replaceFrom, replaceTo, proposedEditNode)
                  .scrollIntoView(),
              );
            }

            return true;
          },

      clearProposedEdit:
        (pos) =>
          ({ state, dispatch, editor }) => {
            const targetPos = resolveNodePos(editor, pos);
            if (targetPos === null) {
              return false;
            }

            const node = state.doc.nodeAt(targetPos);
            if (!node || node.type.name !== this.name) {
              return false;
            }

            if (dispatch) {
              const contextType = (node.attrs.contextType as string) ?? "paragraph";
              const codeLanguage = (node.attrs.codeLanguage as string) ?? undefined;
              const headingLevel = (node.attrs.headingLevel as number) ?? undefined;
              const nodes = buildReplacementNodes(
                state.schema,
                (node.attrs.originalText as string) || "",
                contextType,
                codeLanguage,
                headingLevel,
              );
              dispatch(
                state.tr.replaceWith(targetPos, targetPos + node.nodeSize, nodes)
              );
            }
            return true;
          },

      acceptProposedEdit:
        (pos) =>
          ({ state, dispatch, editor }) => {
            const targetPos = resolveNodePos(editor, pos);
            if (targetPos === null) {
              return false;
            }

            const node = state.doc.nodeAt(targetPos);
            if (!node || node.type.name !== this.name) {
              return false;
            }

            if (dispatch) {
              const contextType = (node.attrs.contextType as string) ?? "paragraph";
              const codeLanguage = (node.attrs.codeLanguage as string) ?? undefined;
              const headingLevel = (node.attrs.headingLevel as number) ?? undefined;
              const nodes = buildReplacementNodes(
                state.schema,
                (node.attrs.proposedText as string) || "",
                contextType,
                codeLanguage,
                headingLevel,
              );
              dispatch(
                state.tr.replaceWith(targetPos, targetPos + node.nodeSize, nodes)
              );
            }
            return true;
          },

      rejectProposedEdit:
        (pos) =>
          ({ commands }) => {
            return commands.clearProposedEdit(pos);
          },
    };
  },
});

export default ExtProposedEdits;
