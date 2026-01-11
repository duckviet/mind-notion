import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getGetNoteQueryKey,
  ReqUpdateNote,
  ResDetailNote,
  useUpdateNote,
} from "@/shared/services/generated/api";
import { isEqual } from "lodash";

type FormState = {
  title: string;
  content: string;
  tags: string[];
};

export function useAutoSave(
  noteId: string,
  form: FormState,
  note: ResDetailNote | undefined,
  isSaving: boolean,
  setIsSaving: (value: boolean) => void
) {
  const queryClient = useQueryClient();
  const lastSavedRef = useRef<FormState>(form);
  const queryKey = getGetNoteQueryKey(noteId);

  const updateNoteMutation = useUpdateNote(
    {
      mutation: {
        onMutate: async () => {
          setIsSaving(true);
          await queryClient.cancelQueries({ queryKey });
          const previous = queryClient.getQueryData<ResDetailNote>(queryKey);
          return { previous };
        },
        onError: (_err, _vars, context) => {
          if (context?.previous) {
            queryClient.setQueryData(queryKey, context.previous);
          }
          toast.error("Failed to auto-save note");
        },
        onSuccess: (serverNote, { data }) => {
          queryClient.setQueryData<ResDetailNote>(queryKey, (old) =>
            old
              ? {
                  ...old,
                  title: data.title ?? old.title,
                  content: data.content ?? old.content,
                  tags: data.tags ?? old.tags,
                  updated_at: serverNote.updated_at,
                }
              : serverNote
          );

          lastSavedRef.current = {
            title: data.title ?? "",
            content: data.content ?? "",
            tags: data.tags ?? [],
          };
        },
        onSettled: () => {
          setIsSaving(false);
        },
      },
    },
    queryClient
  );

  useEffect(() => {
    if (!noteId || !form.title.trim() || isSaving) return;

    const changed = !isEqual(form, lastSavedRef.current);
    if (!changed) return;

    const timer = setTimeout(() => {
      const payload: ReqUpdateNote = {
        id: noteId,
        title: form.title,
        content: form.content,
        content_type: "text",
        status: note?.status ?? "draft",
        thumbnail: note?.thumbnail ?? "",
        folder_id: note?.folder_id ?? null,
        tags: form.tags,
        is_public: note?.is_public ?? false,
      };

      updateNoteMutation.mutate({ noteId, data: payload });
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    form,
    noteId,
    note?.status,
    note?.thumbnail,
    note?.folder_id,
    note?.is_public,
    isSaving,
    updateNoteMutation,
  ]);

  return { updateNoteMutation, lastSavedRef };
}
