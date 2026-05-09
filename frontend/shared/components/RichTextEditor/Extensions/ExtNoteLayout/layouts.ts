export type NoteLayout =
  | "default"
  | "a4"
  | "a5"
  | "letter"
  | "presentation";

export const NOTE_LAYOUT_VALUES: readonly NoteLayout[] = [
  "default",
  "a4",
  "a5",
  "letter",
  "presentation",
];

export interface LayoutConfig {
  key: NoteLayout;
  label: string;
  icon: string; // lucide icon name
  description: string;
}

export const LAYOUTS: LayoutConfig[] = [
  {
    key: "default",
    label: "Default",
    icon: "layout-dashboard",
    description: "Card style",
  },
  {
    key: "a4",
    label: "A4",
    icon: "file-text",
    description: "210 × 297 mm",
  },
  {
    key: "a5",
    label: "A5",
    icon: "book-open",
    description: "148 × 210 mm",
  },
  {
    key: "letter",
    label: "Letter",
    icon: "file",
    description: "215.9 × 279.4 mm",
  },
  {
    key: "presentation",
    label: "Slides",
    icon: "presentation",
    description: "16:9 widescreen",
  },
];

export function isNoteLayout(value: unknown): value is NoteLayout {
  return (
    typeof value === "string" &&
    NOTE_LAYOUT_VALUES.includes(value as NoteLayout)
  );
}

export function getNoteLayoutStorageKey(noteId: string): string {
  return `mn_layout_${noteId}`;
}

export function readStoredNoteLayout(noteId?: string): NoteLayout {
  if (!noteId || typeof window === "undefined") {
    return "default";
  }

  const value = window.localStorage.getItem(getNoteLayoutStorageKey(noteId));
  return isNoteLayout(value) ? value : "default";
}

export function writeStoredNoteLayout(
  noteId: string,
  layout: NoteLayout,
): void {
  if (!noteId || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getNoteLayoutStorageKey(noteId), layout);
}
