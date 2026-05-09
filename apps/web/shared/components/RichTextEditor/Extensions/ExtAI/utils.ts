import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { AIBlockPayload, AISelectionRange, AISelectionStatus } from "./types";
import { type Node as ProseMirrorNode } from "@tiptap/pm/model";

export const normalizeRange = (
  range: AISelectionRange,
  maxPosition: number,
): AISelectionRange | null => {
  const from = Math.max(1, Math.min(range.from, maxPosition));
  const to = Math.max(1, Math.min(range.to, maxPosition));

  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) {
    return null;
  }

  return {
    from: Math.min(from, to),
    to: Math.max(from, to),
  };
};

export const extractNodeId = (node: ProseMirrorNode): string | null => {
  const attrs = (node.attrs ?? {}) as Record<string, unknown>;
  const rawId = attrs.id ?? attrs.nodeId ?? attrs["data-id"];
  return typeof rawId === "string" && rawId.trim() ? rawId : null;
};

export const toBlockPayload = (
  node: ProseMirrorNode,
  start: number,
  depth: number,
): AIBlockPayload => {
  const json = node.toJSON() as { content?: unknown };

  return {
    type: node.type.name,
    nodeId: extractNodeId(node),
    start,
    end: start + node.nodeSize,
    depth,
    attrs: ((node.attrs ?? {}) as Record<string, unknown>) ?? {},
    content: json.content ?? null,
  };
};

export const getContextBlocksBetween = (
  doc: ProseMirrorNode,
  from: number,
  to: number,
): { node: ProseMirrorNode; start: number; end: number }[] => {
  const blocks: { node: ProseMirrorNode; start: number; end: number }[] = [];

  doc.nodesBetween(
    from,
    to,
    (node: ProseMirrorNode, pos: number, parent: ProseMirrorNode | null) => {
      // Chỉ lấy direct children của doc (depth 1)
      if (parent === doc) {
        blocks.push({ node, start: pos, end: pos + node.nodeSize });
        return false; // skip children
      }
      return true;
    },
  );

  return blocks;
};

export const buildDecorations = (
  doc: Parameters<typeof DecorationSet.create>[0],
  range: AISelectionRange | null,
  status: AISelectionStatus | null,
) => {
  if (!range || !status) {
    return DecorationSet.empty;
  }

  return DecorationSet.create(doc, [
    Decoration.inline(range.from, range.to, {
      "data-ai-selection": status,
      class:
        status === "processing"
          ? "ai-selection-range ai-selection-range--processing"
          : "ai-selection-range ai-selection-range--menu",
      style:
        status === "processing"
          ? "background-color: rgba(59, 130, 246, 0.2); border-radius: 4px; box-shadow: inset 0 -1px 0 rgba(37, 99, 235, 0.55);"
          : "background-color: rgba(147, 197, 253, 0.38); border-radius: 4px;",
    }),
  ]);
};
