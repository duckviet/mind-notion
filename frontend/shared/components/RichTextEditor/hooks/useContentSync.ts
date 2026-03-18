import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";

interface UseContentSyncProps {
  editor: Editor | null;
  content: string;
  collabEnabled: boolean;
}

/**
 * Syncs external content prop → editor.
 * Avoids overwriting when user is actively editing or when the content
 * is an echo of what the editor itself just emitted.
 */
export function useContentSync({
  editor,
  content,
  collabEnabled,
}: UseContentSyncProps) {
  const isUserEditingRef = useRef(false);
  const lastSentContentRef = useRef(content);

  // Expose refs so the update handler can coordinate
  return {
    isUserEditingRef,
    lastSentContentRef,
    useSyncEffect: () => {
      useEffect(() => {
        if (!editor || collabEnabled) return;

        if (content === lastSentContentRef.current) return;
        if (isUserEditingRef.current) return;

        const currentContent = editor.getHTML();
        if (!content || currentContent === content) return;

        requestAnimationFrame(() => {
          if (editor.isDestroyed || isUserEditingRef.current) return;

          const { from, to } = editor.state.selection;
          editor.commands.setContent(content, { emitUpdate: false });

          try {
            const docSize = editor.state.doc.content.size;
            editor.commands.setTextSelection({
              from: Math.min(from, docSize),
              to: Math.min(to, docSize),
            });
          } catch {
            // Ignore selection restoration errors
          }
        });
      }, []);
    },
  };
}
