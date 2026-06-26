import type { ChatMessageItem } from "../ui/components/types";

export type ChatMessage = ChatMessageItem;

export type ChatbotDroppedNote = {
  id: string;
  title?: string | null;
  content?: string | null;
};

export type ChatbotDropPayload = {
  note: ChatbotDroppedNote;
  droppedAt: number;
};

export type ChatbotPendingConsent = {
  toolName: string;
};

export type PinnedNote = {
  id: string;
  title: string;
  content: string;
  preview: string;
  droppedAt: number;
};
