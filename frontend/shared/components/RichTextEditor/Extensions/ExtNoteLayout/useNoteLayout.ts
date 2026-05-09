import { useCallback, useEffect, useMemo, useState } from "react";
import { Editor } from "@tiptap/core";
import {
  readStoredNoteLayout,
  type NoteLayout,
  writeStoredNoteLayout,
} from "./layouts";
import { NoteLayoutPluginKey } from "./NoteLayoutPlugin";

export function useNoteLayout(editor: Editor | null, noteId: string) {
  const [layout, setLayout] = useState<NoteLayout>(() =>
    readStoredNoteLayout(noteId),
  );

  useEffect(() => {
    setLayout(readStoredNoteLayout(noteId));
  }, [noteId]);

  useEffect(() => {
    if (!editor) return;

    const syncLayoutFromEditor = () => {
      const currentLayout = NoteLayoutPluginKey.getState(editor.state);
      if (currentLayout) {
        setLayout(currentLayout);
      }
    };

    syncLayoutFromEditor();
    editor.on("transaction", syncLayoutFromEditor);

    return () => {
      editor.off("transaction", syncLayoutFromEditor);
    };
  }, [editor]);

  const changeLayout = useCallback(
    (next: NoteLayout) => {
      if (!editor) return;
      editor.commands.setLayout(next);
      writeStoredNoteLayout(noteId, next);
    },
    [editor, noteId],
  );

  return useMemo(() => ({ layout, changeLayout }), [layout, changeLayout]);
}
