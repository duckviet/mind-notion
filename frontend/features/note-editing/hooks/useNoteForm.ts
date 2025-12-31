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

function isFormUnchanged(next: FormState, current: FormState): boolean {
  return (
    next.title === current.title &&
    next.content === current.content &&
    JSON.stringify(next.tags) === JSON.stringify(current.tags)
  );
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

  // Initialize form when modal opens
  useEffect(() => {
    if (!isOpen || !note) return;

    const next = {
      title: note.title ?? "",
      content: note.content ?? "",
      tags: note.tags ?? [],
    };

    if (!isFormUnchanged(next, form)) {
      setForm(next);
      setError("");
    }
  }, [isOpen, note]);

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
