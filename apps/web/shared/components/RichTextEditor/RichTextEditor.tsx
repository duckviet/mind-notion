"use client";

import { RichTextEditor as BaseRichTextEditor } from "@mind-notion/editor";
import type { RichTextEditorProps } from "@mind-notion/editor";
import { toast } from "sonner";
import {
  useCreateComment,
  useUploadMedia,
} from "@/shared/services/generated/api";
import { requestInlineEdit } from "@/shared/services/ai/inline-edit";
import { useEditToken } from "./hooks/useEditToken";

export default function RichTextEditor(props: RichTextEditorProps) {
  useEditToken();

  const { mutateAsync: uploadMedia } = useUploadMedia({
    mutation: {
      onError: () => toast.error("Failed to upload image"),
    },
  });
  const { mutateAsync: createComment } = useCreateComment({
    mutation: {
      onSuccess: () => toast.success("Comment added"),
      onError: () => toast.error("Failed to add comment"),
    },
  });

  return (
    <BaseRichTextEditor
      {...props}
      drawingSyncUri={
        props.drawingSyncUri ?? process.env.NEXT_PUBLIC_TLDRAW_SYNC_URL ?? ""
      }
      uploadMedia={
        props.uploadMedia ??
        (async (file) => {
          const result = await uploadMedia({ data: { file } });
          return result.url;
        })
      }
      createComment={
        props.createComment ??
        (async ({ content }) => {
          if (!props.noteId) return null;
          return createComment({
            noteId: props.noteId,
            data: { content },
          });
        })
      }
      onAIAction={
        props.onAIAction ??
        (async (action, selectedText, customPrompt, context) =>
          requestInlineEdit({
            workspaceId: "default-workspace",
            noteId: props.noteId,
            action: action as Parameters<typeof requestInlineEdit>[0]["action"],
            selectedText,
            customPrompt,
            context,
          }))
      }
    />
  );
}

export type { RichTextEditorProps };
