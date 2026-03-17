import { DragEndEvent } from "@dnd-kit/core";

const TOP_OF_MIND_ZONE_IDS = new Set([
  "top-of-mind-zone",
  "top-of-mind-zone-floating",
]);

const CHAT_BOT_ZONE_IDS = new Set(["chat-bot", "chat-bot-sidebar"]);
const SIDEBAR_FOLDER_SORT_PREFIX = "tree-folder-sort-";

export type HomeDropAction =
  | { type: "none" }
  | { type: "to-top-of-mind"; activeId: string }
  | { type: "to-chat-bot"; activeId: string }
  | { type: "to-grid"; activeId: string }
  | { type: "to-folder"; activeId: string; folderId: string };

export function normalizeHomeDragId(id: string): string {
  const withoutFloating = id.startsWith("floating-")
    ? id.slice("floating-".length)
    : id;

  return withoutFloating.startsWith("tom-")
    ? withoutFloating.slice("tom-".length)
    : withoutFloating;
}

export function resolveHomeDropAction(event: DragEndEvent): HomeDropAction {
  const { active, over } = event;

  if (!over) {
    return { type: "none" };
  }

  const activeId = normalizeHomeDragId(active.id.toString());
  const overId = over.id.toString();

  if (TOP_OF_MIND_ZONE_IDS.has(overId)) {
    return { type: "to-top-of-mind", activeId };
  }

  if (CHAT_BOT_ZONE_IDS.has(overId)) {
    return { type: "to-chat-bot", activeId };
  }

  if (overId === "grid-zone") {
    return { type: "to-grid", activeId };
  }

  if (overId.startsWith("folder-")) {
    return {
      type: "to-folder",
      activeId,
      folderId: overId.replace("folder-", ""),
    };
  }

  if (overId.startsWith(SIDEBAR_FOLDER_SORT_PREFIX)) {
    return {
      type: "to-folder",
      activeId,
      folderId: overId.replace(SIDEBAR_FOLDER_SORT_PREFIX, ""),
    };
  }

  return { type: "none" };
}

export function findNoteById<T extends { id: string }>(
  id: string,
  ...noteCollections: Array<ReadonlyArray<T> | undefined>
): T | undefined {
  for (const notes of noteCollections) {
    const matchedNote = notes?.find((note) => note.id === id);

    if (matchedNote) {
      return matchedNote;
    }
  }

  return undefined;
}
