import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ResDetailNote } from "@/shared/services/generated/api";

type FormState = {
  title: string;
  content: string;
  tags: string[];
};

function validateTitle(title: string): string {
  if (!title.trim()) return "Title cannot be empty";
  if (title.length > 200) return "Title too long";
  return "";
}

export function useNoteForm(isOpen: boolean, note: ResDetailNote | undefined) {
  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    tags: [],
  });
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // Track noteId đã được khởi tạo
  const initializedNoteIdRef = useRef<string | null>(null);

  // Chỉ sync từ note khi:
  // 1. Modal mới mở VÀ noteId thay đổi
  // 2. KHÔNG sync lại khi note update từ auto-save
  useEffect(() => {
    if (!isOpen) {
      initializedNoteIdRef.current = null;
      return;
    }

    if (!note?.id) return;

    // Chỉ khởi tạo 1 lần cho mỗi noteId
    if (initializedNoteIdRef.current === note.id) return;

    setForm({
      title: note.title ?? "",
      content: note.content ?? "",
      tags: note.tags ?? [],
    });
    setError("");
    initializedNoteIdRef.current = note.id;
  }, [isOpen, note?.id, note?.title, note?.content, note?.tags]);

  // Focus title on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => titleRef.current?.focus(), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, title: value }));
      setError(validateTitle(value));
    },
    []
  );

  const handleContentChange = useCallback(
    (value: string) => setForm((f) => ({ ...f, content: value })),
    []
  );

  const handleTagAdd = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter" || !newTag.trim()) return;
      e.preventDefault();
      const tag = newTag.trim();
      if (tag.length > 50) {
        toast.error("Tag too long");
        return;
      }
      if (form.tags.includes(tag)) {
        toast.info("Tag exists");
        return;
      }
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
      setNewTag("");
    },
    [newTag, form.tags]
  );

  const handleTagRemove = useCallback(
    (tag: string) =>
      setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) })),
    []
  );

  return {
    form,
    newTag,
    error,
    titleRef,
    setNewTag,
    handleTitleChange,
    handleContentChange,
    handleTagAdd,
    handleTagRemove,
    validateTitle: () => validateTitle(form.title),
  };
}
