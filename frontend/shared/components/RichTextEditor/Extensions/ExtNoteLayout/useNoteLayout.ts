import { useCallback, useEffect, useState } from "react";
import { Editor } from "@tiptap/core";
import type { NoteLayout } from "./layouts";

const STORAGE_KEY = (noteId: string) => `mn_layout_${noteId}`;

export function useNoteLayout(editor: Editor | null, noteId: string) {
  const [layout, setLayout] = useState<NoteLayout>(() => {
    return (
      (localStorage.getItem(STORAGE_KEY(noteId)) as NoteLayout) ?? "default"
    );
  });

  const changeLayout = useCallback(
    (next: NoteLayout) => {
      if (!editor) return;
      editor.commands.setLayout(next);
      // The transaction above will fire the handler which calls setLayout.
      // We only need to persist here — no direct setLayout to avoid double setState.
      localStorage.setItem(STORAGE_KEY(noteId), next);
    },
    [editor, noteId],
  );

  return { layout, changeLayout };
}
