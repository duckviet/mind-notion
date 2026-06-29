import type { Query } from "@tanstack/react-query";

export function isCollabSessionForNote(query: Query, noteId: string) {
  const [scope, cachedNoteId] = query.queryKey;
  return scope === "collab-session" && cachedNoteId === noteId;
}
