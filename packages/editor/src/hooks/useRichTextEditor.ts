import { useEditor } from "@tiptap/react";
import { migrateMathStrings } from "@tiptap/extension-mathematics";
import { useEffect } from "react";
import { cn } from "../utils/cn";

import { useStableRef } from "./useStableRef";
import { useEditorSync } from "./useEditorSync";
import { useActiveMark } from "./useActiveMark";
import { useEditorLifecycle } from "./useEditorLifecycle";
import { useEditorExtensions } from "./useEditorExtensions";
import type { UseTiptapEditorProps } from "../types";

export type { CollaborationConfig, UseTiptapEditorProps } from "../types";

const NOOP = () => {};

const EDITOR_CLASS = cn(
  "tiptap ProseMirror h-full min-h-[150px] pr-4 focus:outline-none focus:ring-0",
);
const READONLY_CLASS = cn(
  EDITOR_CLASS,
  "pointer-events-none select-text cursor-default",
);

export const useTiptapEditor = ({
  noteId,
  content = "",
  placeholder = "Type your message here...",
  onUpdate,
  editable = true,
  onKeyDown,
  collaboration,
  onActiveCommentChange,
  onOpenAI,
  uploadMedia,
  drawingSyncUri,
}: UseTiptapEditorProps) => {
  const onKeyDownRef = useStableRef(onKeyDown);
  const uploadMediaRef = useStableRef(
    async ({ data }: { data: { file: File } }) => {
      if (!uploadMedia) return { url: "" };
      return { url: await uploadMedia(data.file) };
    },
  );

  const { extensions, collabEnabled } = useEditorExtensions({
    noteId,
    placeholder,
    collaboration,
    uploadMediaRef,
    drawingSyncUri,
    onOpenAI: onOpenAI ?? NOOP,
  });

  const editor = useEditor(
    {
      extensions,
      content: collabEnabled ? undefined : content,
      immediatelyRender: false,
      editable: true,
      injectCSS: false,
      editorProps: {
        attributes: {
          class: EDITOR_CLASS,
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
    [extensions],
  );

  // Migrate math strings on load
  useEffect(() => {
    if (editor) migrateMathStrings(editor);
  }, [editor]);

  // --- Reusable primitives ---
  useEditorLifecycle(editor, {
    editable,
    className: EDITOR_CLASS,
    readonlyClassName: READONLY_CLASS,
  });

  useEditorSync(editor, {
    content,
    onUpdate,
    skipInbound: collabEnabled,
    debounceMs: collabEnabled ? 0 : 300,
    serialize: (editor) => editor.getHTML(),
  });

  useActiveMark(editor, {
    markName: "comment",
    onChange: onActiveCommentChange,
  });

  return { editor };
};
