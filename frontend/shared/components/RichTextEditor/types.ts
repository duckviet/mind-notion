import type { WebsocketProvider } from "y-websocket";
import type * as Y from "yjs";

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
  onAIAction?: (
    action: string,
    selectedText: string,
    customPrompt?: string,
  ) => Promise<string>;
}
