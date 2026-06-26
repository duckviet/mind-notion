export type ChatMessageItem = {
  id: string;
  role: "assistant" | "user" | "tool";
  content: string;
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
};

export type ActivePinnedNote = {
  title: string;
  preview: string;
} | null;
