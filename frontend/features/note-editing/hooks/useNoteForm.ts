import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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

    setTitle(note.title ?? "");
    setContent(note.content ?? "");
    setTags(note.tags ?? []);
    setError("");
    initializedNoteIdRef.current = note.id;
  }, [isOpen, note?.id]);

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
      setTitle(value);
      setError(validateTitle(value));
    },
    [],
  );

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
  }, []);

  const handleTagAdd = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter" || !newTag.trim()) return;
      e.preventDefault();
      const tag = newTag.trim();
      if (tag.length > 50) {
        toast.error("Tag too long");
        return;
      }
      setTags((current) => {
        if (current.includes(tag)) {
          toast.info("Tag exists");
          return current;
        }
        return [...current, tag];
      });
      setNewTag("");
    },
    [newTag],
  );

  const handleTagRemove = useCallback((tag: string) => {
    setTags((current) => current.filter((t) => t !== tag));
  }, []);

  return {
    form: { title, content, tags },
    newTag,
    error,
    titleRef,
    setNewTag,
    handleTitleChange,
    handleContentChange,
    handleTagAdd,
    handleTagRemove,
    validateTitle: () => validateTitle(title),
  };
}
