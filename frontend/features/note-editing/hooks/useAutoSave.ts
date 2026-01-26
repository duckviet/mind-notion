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
  setIsSaving: (value: boolean) => void,
  syncContent: boolean = true,
) {
  const queryClient = useQueryClient();
  const lastSavedRef = useRef<FormState>(form);
  const noteMetadataRef = useRef<
    | {
        status: string;
        thumbnail: string;
        folder_id: string | null;
        is_public: boolean;
      }
    | undefined
  >(undefined);
  const queryKey = getGetNoteQueryKey(noteId);

  // Initialize metadata once when component mounts or noteId changes
  useEffect(() => {
    if (note && !noteMetadataRef.current) {
      noteMetadataRef.current = {
        status: note.status ?? "draft",
        thumbnail: note.thumbnail ?? "",
        folder_id: note.folder_id ?? null,
        is_public: note.is_public ?? false,
      };
    }
  }, [noteId]);

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
              : serverNote,
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
    queryClient,
  );

  useEffect(() => {
    if (!noteId || !form.title.trim() || isSaving) return;

    // Fix: Chỉ compare các field sẽ được save
    const formToCompare = syncContent
      ? form
      : { title: form.title, tags: form.tags };

    const lastToCompare = syncContent
      ? lastSavedRef.current
      : { title: lastSavedRef.current.title, tags: lastSavedRef.current.tags };

    const changed = !isEqual(formToCompare, lastToCompare);

    console.log("🔍 Auto-save check:", {
      changed,
      formToCompare,
      lastToCompare,
      syncContent,
    });

    if (!changed) return;

    const timer = setTimeout(() => {
      const metadata = noteMetadataRef.current ?? {
        status: "draft",
        thumbnail: "",
        folder_id: null,
        is_public: false,
      };

      const payload: ReqUpdateNote = {
        id: noteId,
        title: form.title,
        content: syncContent ? form.content : undefined,
        content_type: "text",
        status: metadata.status,
        thumbnail: metadata.thumbnail,
        folder_id: metadata.folder_id,
        tags: form.tags,
        is_public: metadata.is_public,
      };

      // Fix: Update lastSavedRef TRƯỚC khi mutate để tránh race condition
      lastSavedRef.current = {
        title: form.title,
        content: form.content, // Luôn lưu content hiện tại
        tags: [...form.tags],
      };

      updateNoteMutation.mutate({ noteId, data: payload });
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, noteId, isSaving, syncContent]);

  return { updateNoteMutation, lastSavedRef };
}
