import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import { cn } from "@/lib/utils";

import { UseTiptapEditorProps } from "./types";
import { useStableRef } from "./hooks/useStableRef";
import { useEditToken } from "./hooks/useEditToken";
import { useAIMenu } from "./hooks/useAIMenu";
import { useUploadMediaRef } from "./hooks/useUploadMediaRef";
import { useEditorExtensions } from "./hooks/useEditorExtensions";
import { useContentSync } from "./hooks/useContentSync";
import { useEditorUpdates } from "./hooks/useEditorUpdates";
import { useActiveComment } from "./hooks/useActiveComment";

export type { CollaborationConfig, UseTiptapEditorProps } from "./types";

export const useTiptapEditor = ({
  noteId,
  content = "",
  placeholder = "Type your message here...",
  onUpdate,
  editable = true,
  onKeyDown,
  collaboration,
  onActiveCommentChange,
}: UseTiptapEditorProps) => {
  // --- Stable refs for callbacks ---
  const onUpdateRef = useStableRef(onUpdate);
  const onKeyDownRef = useStableRef(onKeyDown);
  const onActiveCommentChangeRef = useStableRef(onActiveCommentChange);

  // --- Side-effect hooks ---
  useEditToken();

  const { aiMenuState, openAIMenu, closeAIMenu } = useAIMenu();
  const uploadMediaRef = useUploadMediaRef();

  const { extensions, collabEnabled } = useEditorExtensions({
    placeholder,
    collaboration,
    uploadMediaRef,
    onOpenAI: openAIMenu,
  });

  // --- Create editor ---
  const editor = useEditor(
    {
      extensions,
      content: collabEnabled ? undefined : content,
      immediatelyRender: false,
      editable,
      injectCSS: false,
      editorProps: {
        attributes: {
          class: cn(
            "tiptap ProseMirror h-full min-h-[150px] pr-4 focus:outline-none",
            !editable && "pointer-events-none select-text cursor-default",
          ),
          "data-note-id": noteId ?? "",
        },
        handleKeyDown: (_view: unknown, event: KeyboardEvent) => {
          onKeyDownRef.current?.(
            event as unknown as React.KeyboardEvent<HTMLDivElement>,
          );
          return false;
        },
      },
    },
    [editable, extensions],
  );

  // --- Content sync (external prop → editor) ---
  const { isUserEditingRef, lastSentContentRef, useSyncEffect } =
    useContentSync({ editor, content, collabEnabled });
  useSyncEffect();

  // --- Editor updates (editor → parent callback) ---
  useEditorUpdates({
    editor,
    collabEnabled,
    onUpdateRef,
    isUserEditingRef,
    lastSentContentRef,
  });

  // --- Active comment tracking ---
  useActiveComment(editor, onActiveCommentChangeRef);

  // --- Cleanup ---
  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return { editor, aiMenuState, closeAIMenu };
};
