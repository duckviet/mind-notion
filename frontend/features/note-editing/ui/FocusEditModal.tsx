import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, AlertCircle, Plus } from "lucide-react";
import Portal from "@/shared/components/PortalModal/PortalModal";
import { Input } from "@/shared/components/ui/input";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getGetNoteQueryKey,
  ReqUpdateNote,
  ResDetailNote,
  useGetNote,
  useUpdateNote,
} from "@/shared/services/generated/api";
import dayjs from "dayjs";
import { Button } from "@/shared/components/ui/button";

interface FocusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onSave?: (data: ReqUpdateNote) => void;
}

function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

export default function FocusEditModal({
  isOpen,
  onClose,
  noteId,
  onSave,
}: FocusEditModalProps) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => getGetNoteQueryKey(noteId), [noteId]);

  const { data: note } = useGetNote(
    noteId,
    {
      query: {
        enabled: isOpen && !!noteId,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
    queryClient
  );

  const [form, setForm] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // lưu lại lần cuối đã save để tránh gọi API khi không có thay đổi
  const lastSavedRef = useRef(form);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Prefill khi mở modal hoặc khi note thay đổi thực sự
  useEffect(() => {
    if (!isOpen || !note) return;

    const next = {
      title: note.title ?? "",
      content: note.content ?? "",
      tags: note.tags ?? [],
    };

    const same =
      next.title === form.title &&
      next.content === form.content &&
      JSON.stringify(next.tags) === JSON.stringify(form.tags);

    if (!same) {
      setForm(next);
      lastSavedRef.current = next; // coi state từ server là đã save
      setError("");
    }
  }, [isOpen, note]); // cố tình không đưa form vào deps

  const validateTitle = (t: string) => {
    if (!t.trim()) return "Title cannot be empty";
    if (t.length > 200) return "Title too long";
    return "";
  };

  const updateNoteMutation = useUpdateNote(
    {
      mutation: {
        onMutate: async ({ id, data }) => {
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

  // Auto-save chỉ khi form khác lastSavedRef
  useDebouncedEffect(
    () => {
      if (!noteId) return;
      const err = validateTitle(form.title);
      if (err || !form.title.trim() || isSaving) return;

      const changed =
        form.title !== lastSavedRef.current.title ||
        form.content !== lastSavedRef.current.content ||
        JSON.stringify(form.tags) !== JSON.stringify(lastSavedRef.current.tags);

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

      lastSavedRef.current = form; // đánh dấu đã lưu
      updateNoteMutation.mutate({ id: noteId, data: payload });
    },
    [form, noteId, note?.status, note?.thumbnail, note?.is_public],
    1500
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (name === "title") setError(validateTitle(value));
  }, []);

  const handleContentChange = useCallback(
    (val: string) => setForm((f) => ({ ...f, content: val })),
    []
  );

  const handleTagAdd = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter" || !newTag.trim()) return;
      e.preventDefault();
      const tag = newTag.trim();
      if (tag.length > 50) return toast.error("Tag too long");
      if (form.tags.includes(tag)) return toast.info("Tag exists");
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setNewTag("");
    },
    [newTag, form.tags]
  );

  const handleRemove = useCallback(
    (tag: string) =>
      setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) })),
    []
  );

  const handleSave = useCallback(() => {
    const err = validateTitle(form.title);
    if (err) {
      setError(err);
      titleRef.current?.focus();
      return;
    }

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
    onSave?.(payload);
    updateNoteMutation.mutate({ id: noteId, data: payload });
    toast.success("Saved");
  }, [form, note, noteId, onSave, updateNoteMutation]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSave();
  };

  const handleOutside = (e: React.MouseEvent) => {
    if (!modalRef.current?.contains(e.target as Node)) onClose();
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => titleRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (typeof window === "undefined") return null;

  return (
    <Portal lockScroll={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={handleOutside}
            />
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onKeyDown={handleKey}
              tabIndex={-1}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-auto h-full max-h-[90vh] items-center space-x-4 pointer-events-auto flex flex-col  ">
                <div className="flex-1 flex overflow-hidden w-full gap-4 justify-center">
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 rounded-2xl bg-white max-w-6xl min-w-5xl w-full">
                    <div>
                      <input
                        ref={titleRef}
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Your note title..."
                        className="w-full text-4xl font-semibold text-black outline-none mb-3"
                        maxLength={200}
                      />
                      {error && (
                        <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
                          <AlertCircle className="w-4 h-4" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                    <RichTextEditor
                      content={form.content}
                      onUpdate={handleContentChange}
                      editable
                    />
                  </div>

                  <div className="w-72  rounded-2xl border-gray-200 bg-gray-50 p-6 flex flex-col space-y-10">
                    <div className="">
                      <div className="text-sm  flex items-center">
                        <span className="text-gray-500"> Created by:</span>
                        <span className="ml-auto font-medium">{"Unknown"}</span>
                      </div>
                      <div className="text-sm  mt-1 flex items-center">
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-auto font-medium">
                          {note?.created_at
                            ? dayjs(note.created_at).format("DD/MM/YYYY HH:mm")
                            : dayjs().format("DD/MM/YYYY HH:mm")}
                        </span>
                      </div>
                      <div className="text-sm  mt-1 flex items-center">
                        <span className="text-gray-500"> Last modified: </span>
                        <span className="ml-auto font-medium">
                          {note?.updated_at
                            ? dayjs(note.updated_at).format("DD/MM/YYYY HH:mm")
                            : dayjs().format("DD/MM/YYYY HH:mm")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500 text-lg font-medium">
                          Tags ({form.tags.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3 overflow-auto max-h-40">
                        {form.tags.map((t) => (
                          <div
                            key={t}
                            className="bg-gray-200 rounded px-2 py-1 text-sm cursor-pointer hover:bg-red-100"
                            onClick={() => handleRemove(t)}
                          >
                            #{t} <X className="w-3 h-3 inline" />
                          </div>
                        ))}
                      </div>
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleTagAdd}
                        placeholder="New tag..."
                        maxLength={50}
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-lg font-medium">
                          Comments
                        </span>
                        <Button className="cursor-pointer text-gray-600 hover:text-gray-800">
                          <Plus className="w-6 h-6" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-4">
                        <span className="text-center text-white text-sm mt-3 bg-gray-200 rounded-md p-4">
                          No comments yet
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-right mt-auto text-gray-500">
                      {form.content.length} chars
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </Portal>
  );
}
