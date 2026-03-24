import { useCallback } from "react";
import type { Editor } from "@tiptap/react";

interface MarkRange {
  from: number;
  to: number;
  text: string;
}

export function useEditorMarkRange(editor: Editor, markName: string) {
  const resolve = useCallback(
    (domNode: HTMLElement): MarkRange | null => {
      try {
        const pos = editor.view.posAtDOM(domNode, 0);
        const { doc } = editor.state;
        const resolved = doc.resolve(pos);
        const start = resolved.start();

        let from = pos;
        let to = pos;

        while (
          from > start &&
          doc
            .resolve(from - 1)
            .marks()
            .some((m) => m.type.name === markName)
        ) {
          from--;
        }

        while (
          to < resolved.end() &&
          doc
            .resolve(to)
            .marks()
            .some((m) => m.type.name === markName)
        ) {
          to++;
        }

        return { from, to, text: doc.textBetween(from, to, "") };
      } catch {
        return null;
      }
    },
    [editor, markName],
  );

  const remove = useCallback(
    (domNode: HTMLElement) => {
      const pos = editor.view.posAtDOM(domNode, 0);
      editor
        .chain()
        .focus()
        .setTextSelection(pos)
        .extendMarkRange(markName)
        .unsetMark(markName)
        .run();
    },
    [editor, markName],
  );

  return { resolve, remove };
}
