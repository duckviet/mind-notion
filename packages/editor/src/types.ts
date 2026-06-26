import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";
import { AISelectionContext } from "./extensions/ExtAI/types";

export type CollaborationConfig = {
  document: Y.Doc;
  provider: WebsocketProvider;
  user?: {
    name: string;
    color: string;
  };
};

export type AIMenuState = {
  isOpen: boolean;
  selection: string;
  range: { from: number; to: number } | null;
  context: AISelectionContext | null;
};

export interface UseTiptapEditorProps {
  noteId?: string;
  content?: string;
  placeholder?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  collaboration?: CollaborationConfig;
  onActiveCommentChange?: (commentId: string | null) => void;
  onOpenAI?: (
    selection: string,
    range: { from: number; to: number },
    context: AISelectionContext,
  ) => void;
  uploadMedia?: (file: File) => Promise<string>;
  drawingSyncUri?: string;
}

export type AIActionResult =
  | string
  | {
      text: string;
      model?: string;
      usage?: {
        total_tokens?: number;
        prompt_tokens?: number;
        completion_tokens?: number;
      };
    }
  | {
      type: "edit_proposal";
      original: string;
      proposed: string;
      summary: string;
      confidence?: number;
      model?: string;
    }
  | {
      type: "inline_transform";
      replacement: string;
      summary?: string;
      model?: string;
    }
  | {
      type: "inline_assist" | "rag_answer";
      explanation?: string;
      answer?: string;
      summary?: string;
      model?: string;
    };
