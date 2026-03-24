import { DecorationSet } from "@tiptap/pm/view";

export type AISelectionStatus = "menu" | "processing";

export type AISelectionRange = { from: number; to: number };

export type AIBlockPayload = {
  type: string;
  nodeId: string | null;
  start: number;
  end: number;
  depth: number;
  attrs: Record<string, unknown>;
  content: unknown;
};

export type AISelectionContext = {
  contextBlocks: AIBlockPayload[];
};

export type AISelectionMeta =
  | {
      clear: true;
    }
  | {
      status: AISelectionStatus;
      range?: AISelectionRange;
    };

export type AISelectionPluginState = {
  status: AISelectionStatus | null;
  range: AISelectionRange | null;
  decorations: DecorationSet;
};

export type AIAction =
  | "improve"
  | "continue"
  | "fix"
  | "shorter"
  | "longer"
  | "summarize"
  | "translate"
  | "explain"
  | "custom";

export type AIActionItem = {
  id: AIAction;
  label: string;
  icon: React.ReactNode;
  description: string;
};
