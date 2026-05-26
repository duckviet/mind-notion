import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import DrawingNodeView from "./DrawingNodeView";

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `drawing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const encodeSnapshot = (value: string) => {
  try {
    return encodeURIComponent(value);
  } catch {
    return "";
  }
};

const decodeSnapshot = (value: string) => {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

type InsertDrawingOptions = {
  drawingId?: string;
  roomId?: string;
  snapshot?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
};

type UpdateDrawingOptions = {
  snapshot?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  updatedAt?: string;
  snapshotVersion?: number;
};

export interface ExtDrawingOptions {
  HTMLAttributes: Record<string, unknown>;
  syncUri?: string;
  maxSnapshotSize?: number;
  uploadPreviewFn?: (file: File) => Promise<string | null>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    drawingBlock: {
      insertDrawing: (options?: InsertDrawingOptions) => ReturnType;
      updateDrawing: (options: UpdateDrawingOptions) => ReturnType;
    };
  }
}

const ExtDrawing = Node.create<ExtDrawingOptions>({
  name: "drawingBlock",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      maxSnapshotSize: 1024 * 1024,
    };
  },

  addAttributes() {
    return {
      drawingId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-drawing-id") || "",
        renderHTML: (attributes) => ({
          "data-drawing-id": attributes.drawingId,
        }),
      },
      roomId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-room-id") || "",
        renderHTML: (attributes) => ({
          "data-room-id": attributes.roomId,
        }),
      },
      snapshot: {
        default: "",
        parseHTML: (element) =>
          decodeSnapshot(element.getAttribute("data-drawing-snapshot") || ""),
        renderHTML: (attributes) => ({
          "data-drawing-snapshot": encodeSnapshot(attributes.snapshot || ""),
        }),
      },
      previewUrl: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-preview-url") || "",
        renderHTML: (attributes) => ({
          "data-preview-url": attributes.previewUrl || "",
        }),
      },
      width: {
        default: 960,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-width"));
          return Number.isFinite(value) && value > 0 ? value : 960;
        },
        renderHTML: (attributes) => ({
          "data-width": attributes.width || 960,
        }),
      },
      height: {
        default: 540,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-height"));
          return Number.isFinite(value) && value > 0 ? value : 540;
        },
        renderHTML: (attributes) => ({
          "data-height": attributes.height || 540,
        }),
      },
      updatedAt: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-updated-at") || "",
        renderHTML: (attributes) => ({
          "data-updated-at": attributes.updatedAt || "",
        }),
      },
      snapshotVersion: {
        default: 1,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-snapshot-version"));
          return Number.isFinite(value) && value > 0 ? value : 1;
        },
        renderHTML: (attributes) => ({
          "data-snapshot-version": attributes.snapshotVersion || 1,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="drawing-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "drawing-block",
        class: "drawing-block",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingNodeView);
  },

  addCommands() {
    return {
      insertDrawing:
        (options) =>
        ({ commands }) => {
          const drawingId = options?.drawingId || createId();

          return commands.insertContent({
            type: this.name,
            attrs: {
              drawingId,
              roomId: options?.roomId || drawingId,
              snapshot: options?.snapshot || "",
              previewUrl: options?.previewUrl || "",
              width: options?.width || 960,
              height: options?.height || 540,
              updatedAt: new Date().toISOString(),
              snapshotVersion: 1,
            },
          });
        },
      updateDrawing:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-d": () => this.editor.commands.insertDrawing(),
    };
  },
});

export default ExtDrawing;
