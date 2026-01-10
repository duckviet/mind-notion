import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";
import { Placeholder } from "@tiptap/extensions";
import usePersistentState from "@/shared/hooks/usePersistentState/usePersistentState";
import { LocalStorageKeys } from "@/shared/configs/localStorageKeys";
import ExtImage from "./Extensions/ExtImage";
import { toast } from "sonner";
import { useUploadMedia } from "@/shared/services/generated/api";
import {
  ExtCustomCodeBlock,
  ExtHeading,
  ExtImageUpload,
  ExtListKit,
  ExtMathematics,
  ExtTableKit,
  ExtTableOfContents,
  ExtSplitView,
  SplitViewColumn,
} from "./Extensions";

import { migrateMathStrings } from "@tiptap/extension-mathematics";

interface UseTiptapEditorProps {
  content?: string;
  placeholder?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const useTiptapEditor = ({
  content = "",
  placeholder = "Type your message here...",
  onUpdate,
  editable = true,
  onKeyDown,
}: UseTiptapEditorProps) => {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onKeyDownRef = useRef(onKeyDown);
  const contentRef = useRef(content);
  const isUpdatingRef = useRef(false);
  const lastUserInputRef = useRef<number>(0); // Track last user input time

  const [toc, setToc] = usePersistentState(
    LocalStorageKeys.FOCUS_EDIT_TOC_COLLAPSED,
    false
  );
  const { mutateAsync: uploadMedia } = useUploadMedia({
    mutation: {
      onError: () => toast.error("Failed to upload image"),
    },
  });
  // Keep refs updated without causing re-renders
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);
  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
  }, [onKeyDown]);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Memoize extensions to prevent recreation
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        heading: false,
        link: false,
      }),
      ...ExtListKit,
      ExtCustomCodeBlock,
      ExtHeading,
      ExtMathematics,
      ...ExtTableKit,
      ExtTableOfContents.configure({
        initialToc: toc ?? false,
        onToggle: (newTocValue: boolean) => setToc(newTocValue),
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
      ExtImage,
      ExtImageUpload.configure({
        uploadFn: async (file: File) => {
          const res = await uploadMedia({ data: { file } });
          return res.url;
        },
      }),
      ExtSplitView,
      SplitViewColumn,
    ],
    [placeholder]
  );

  const editor = useEditor(
    {
      extensions,
      content: contentRef.current,
      immediatelyRender: false,
      editable,
      injectCSS: false,
      editorProps: {
        attributes: {
          class: cn(
            "tiptap ProseMirror h-full min-h-[150px] pr-4 focus:outline-none",
            !editable && "pointer-events-none select-text cursor-default"
          ),
        },
        handleKeyDown: (_view, event) => {
          onKeyDownRef.current?.(
            event as unknown as React.KeyboardEvent<HTMLDivElement>
          );
          return false;
        },
      },
    },
    [editable, extensions]
  );

  /** Handle editor updates (with debounce) */
  useEffect(() => {
    if (!editor) return;
    let lastContent = editor.getHTML();

    const handleUpdate = () => {
      const html = editor.getHTML();
      if (html !== lastContent) {
        lastContent = html;
        lastUserInputRef.current = Date.now(); // Track when user made changes
        onUpdateRef.current?.(html);
      }
    };

    const debouncedUpdate = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(handleUpdate, 300);
    };

    editor.on("update", debouncedUpdate);
    migrateMathStrings(editor);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      editor.off("update", debouncedUpdate);
    };
  }, [editor]); // Remove onUpdate from deps, use ref instead

  useEffect(() => {
    // Thêm kiểm tra editor.isDestroyed và editor.view
    if (
      !editor ||
      editor.isDestroyed ||
      !editor.view?.dom ||
      content === undefined ||
      isUpdatingRef.current
    ) {
      return;
    }

    const currentHTML = editor.getHTML();

    // Update content regardless of focus state
    if (content !== currentHTML) {
      isUpdatingRef.current = true;

      // Sử dụng setTimeout để đảm bảo thực thi sau khi React render xong
      setTimeout(() => {
        if (editor && !editor.isDestroyed && editor.view?.dom) {
          editor.commands.setContent(content, { emitUpdate: false });
        }
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [content, editor]);

  /** Cleanup */
  useEffect(() => () => editor?.destroy(), [editor]);

  return editor;
};
