import type { ReactNode } from "react";
import {
  BookOpen,
  File,
  FileText,
  LayoutDashboard,
  Presentation,
} from "lucide-react";
import type { NoteLayout } from "./layouts";

export const NOTE_LAYOUT_ICONS: Record<NoteLayout, ReactNode> = {
  default: <LayoutDashboard size={14} />,
  a4: <FileText size={14} />,
  a5: <BookOpen size={14} />,
  letter: <File size={14} />,
  presentation: <Presentation size={14} />,
};
