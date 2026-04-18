export type NoteLayout =
  | "default"
  | "a4"
  | "a5"
  | "letter"
  | "presentation";

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
