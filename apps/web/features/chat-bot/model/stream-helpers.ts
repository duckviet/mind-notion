import type { ChatMessage, PinnedNote } from "./chatbot-types";

const CONTENT_CLIP_LENGTH = 3000;

/** Build a single prompt string that includes pinned-note context. */
export function buildMessageWithPinnedNotes(prompt: string, notes: PinnedNote[]): string {
  if (!notes.length) return prompt;

  const notesContext = notes
    .map((note, index) => {
      const raw = note.content.trim();
      const clipped = raw.length > CONTENT_CLIP_LENGTH
        ? `${raw.slice(0, CONTENT_CLIP_LENGTH)}...`
        : raw;

      return [
        `Pinned note ${index + 1}: ${note.title} (ID: ${note.id})`,
        clipped ? `Content:\n${clipped}` : "Content: (empty)",
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    "Use the pinned notes below as context when relevant.",
    "",
    notesContext,
    "",
    "User prompt:",
    prompt,
  ].join("\n");
}

/** Generate a UUID (with fallback for environments without crypto). */
export function newId(prefix: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}`;
}

/** Insert a tool-call message just before `beforeId`, deduplicating by ID. */
export function insertToolMessage(
  prev: ChatMessage[],
  toolCallId: string,
  toolName: string,
  beforeId: string,
): ChatMessage[] {
  if (prev.some((m) => m.id === toolCallId)) return prev;

  const newMsg: ChatMessage = {
    id: toolCallId,
    role: "tool",
    content: "",
    toolName,
    toolStatus: "running",
  };

  const idx = prev.findIndex((m) => m.id === beforeId);
  if (idx !== -1) {
    const copy = [...prev];
    copy.splice(idx, 0, newMsg);
    return copy;
  }

  return [...prev, newMsg];
}
