import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
import NoteMetadataPanel from "./NoteMetadataPanel";
import NoteTagsSection from "./NoteTagsSection";
import CommentSection from "./CommentSection";
import usePersistentState from "@/shared/hooks/usePersistentState/usePersistentState";
import { LocalStorageKeys } from "@/shared/configs/localStorageKeys";

interface FocusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onSave?: (data: ReqUpdateNote) => void;
}

type FormState = {
  title: string;
  content: string;
  tags: string[];
};

function useDebouncedEffect(effect: () => void, deps: any[], delay: number) {
  useEffect(() => {
    const handler = setTimeout(effect, delay);
    return () => clearTimeout(handler);
  }, [...deps, delay]);
}

function isFormUnchanged(next: FormState, current: FormState): boolean {
  return (
    next.title === current.title &&
    next.content === current.content &&
    JSON.stringify(next.tags) === JSON.stringify(current.tags)
  );
}

function isFormChanged(current: FormState, lastSaved: FormState): boolean {
  return (
    current.title !== lastSaved.title ||
    current.content !== lastSaved.content ||
    JSON.stringify(current.tags) !== JSON.stringify(lastSaved.tags)
  );
}

function canAutoSave(
  noteId: string,
  form: FormState,
  isSaving: boolean,
  isChanged: boolean
): boolean {
  if (!noteId) return false;
  if (!form.title.trim()) return false;
  if (isSaving) return false;
  return isChanged;
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = usePersistentState(
    LocalStorageKeys.FOCUS_EDIT_SIDEBAR_COLLAPSED,
    () => false
  );
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

    if (!isFormUnchanged(next, form)) {
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
      const err = validateTitle(form.title);
      if (err || !form.title.trim() || isSaving) return;

      const changed = isFormChanged(form, lastSavedRef.current);
      if (!canAutoSave(noteId, form, isSaving, changed)) return;

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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
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
              className="fixed inset-0 z-100 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-[95vw] h-full max-h-[90vh]  items-center space-x-4 pointer-events-auto flex flex-col  ">
                <div className="flex-1 flex overflow-hidden w-full gap-4 justify-center bg-[#f0f2f5] p-2 rounded-[16px]">
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 rounded-2xl bg-white   w-full ">
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
                      showTOC={true}
                      content={form.content}
                      onUpdate={handleContentChange}
                      editable
                    />
                  </div>

                  <motion.aside
                    initial={false}
                    animate={{ width: isSidebarCollapsed ? 42 : 320 }}
                    transition={{ type: "spring", stiffness: 260, damping: 30 }}
                    className="shrink-0 rounded-2xl p-2 flex flex-col bg-transparent"
                  >
                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                        aria-label={
                          isSidebarCollapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                        }
                      >
                        {isSidebarCollapsed ? (
                          <ChevronLeft className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <AnimatePresence initial={false}>
                      {!isSidebarCollapsed && (
                        <motion.div
                          key="sidebar-content"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.15 }}
                          className="flex flex-col space-y-10 mt-4 min-w-0"
                        >
                          <NoteMetadataPanel note={note} />
                          <NoteTagsSection
                            tags={form.tags}
                            newTag={newTag}
                            onNewTagChange={setNewTag}
                            onTagAdd={handleTagAdd}
                            onTagRemove={handleRemove}
                            disabled={isSaving}
                          />
                          <CommentSection />{" "}
                          <div className="text-xs text-right mt-auto text-gray-500">
                            {" "}
                            {form.content.length} chars{" "}
                          </div>{" "}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.aside>
                </div>
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </Portal>
  );
}
