import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getGetNoteQueryKey,
  ReqUpdateNote,
  ResDetailNote,
  useUpdateNote,
} from "@/shared/services/generated/api";

type FormState = {
  title: string;
  content: string;
  tags: string[];
};

function isFormChanged(current: FormState, lastSaved: FormState): boolean {
  return (
    current.title !== lastSaved.title ||
    current.content !== lastSaved.content ||
    JSON.stringify(current.tags) !== JSON.stringify(lastSaved.tags)
  );
}

export function useAutoSave(
  noteId: string,
  form: FormState,
  note: ResDetailNote | undefined,
  isSaving: boolean,
  setIsSaving: (value: boolean) => void
) {
  const queryClient = useQueryClient();
  const lastSavedRef = useRef(form);
  const queryKey = getGetNoteQueryKey(noteId);

  const updateNoteMutation = useUpdateNote(
    {
      mutation: {
        onMutate: async ({ noteId, data }) => {
          setIsSaving(true);
          await queryClient.cancelQueries({ queryKey });

          const previous = queryClient.getQueryData<ResDetailNote>(queryKey);

          queryClient.setQueryData<ResDetailNote>(queryKey, (old) =>
            old
              ? { ...old, ...data }
              : {
                  top_of_mind: false,
                  created_at: "",
                  updated_at: "",
                  ...data,
                }
          );

          return { previous };
        },
        onError: (_err, _vars, context) => {
          if (context?.previous) {
            queryClient.setQueryData(queryKey, context.previous);
          }
          toast.error("Failed to auto-save note");
        },
        onSuccess: (serverNote) => {
          queryClient.setQueryData(queryKey, serverNote);
        },
        onSettled: () => {
          setIsSaving(false);
        },
      },
    },
    queryClient
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!noteId || !form.title.trim() || isSaving) return;

      const changed = isFormChanged(form, lastSavedRef.current);
      if (!changed) return;

      const payload: ReqUpdateNote = {
        id: noteId,
        title: form.title,
        content: form.content,
        content_type: "text",
        status: note?.status ?? "draft",
        thumbnail: note?.thumbnail ?? "",
        tags: form.tags,
        is_public: note?.is_public ?? false,
      };

      lastSavedRef.current = form;
      updateNoteMutation.mutate({ noteId: noteId, data: payload });
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, noteId, note?.status, note?.thumbnail, note?.is_public, isSaving]);

  return {
    updateNoteMutation,
    lastSavedRef,
  };
}
