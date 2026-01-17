import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef } from "react";
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
import ExtBlockQuote from "./Extensions/ExtQuote";
import ExtHighLight from "./Extensions/ExtHighLight";

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

  const [toc, setToc] = usePersistentState(
    LocalStorageKeys.FOCUS_EDIT_TOC_COLLAPSED,
    false,
  );

  const { mutateAsync: uploadMedia } = useUploadMedia({
    mutation: {
      onError: () => toast.error("Failed to upload image"),
    },
  });

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
  }, [onKeyDown]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        heading: false,
        link: false,
        blockquote: false,
      }),
      ...ExtListKit,
      ExtCustomCodeBlock,
      ExtHeading,
      ExtMathematics,
      ExtBlockQuote,
      ExtHighLight,
      ...ExtTableKit,
      ExtTableOfContents.configure({
        initialToc: toc ?? false,
        onToggle: (newTocValue: boolean) => setToc(newTocValue),
      }),
      Placeholder.configure({ placeholder }),
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
    [placeholder, toc, setToc, uploadMedia],
  );

  const editor = useEditor(
    {
      extensions,
      content, // Chỉ dùng cho initial value
      immediatelyRender: false,
      editable,
      injectCSS: false,
      editorProps: {
        attributes: {
          class: cn(
            "tiptap ProseMirror h-full min-h-[150px] pr-4 focus:outline-none",
            !editable && "pointer-events-none select-text cursor-default",
          ),
        },
        handleKeyDown: (_view, event) => {
          onKeyDownRef.current?.(
            event as unknown as React.KeyboardEvent<HTMLDivElement>,
          );
          return false;
        },
      },
    },
    [editable, extensions],
  );

  // Update editor content when content prop changes
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (content && currentContent !== content) {
      setTimeout(() => {
        if (!editor.isDestroyed) {
          editor.commands.setContent(content);
        }
      });
    }
  }, [content, editor]);

  // Handle editor updates with debounce
  useEffect(() => {
    if (!editor) return;

    let lastContent = editor.getHTML();

    const handleUpdate = () => {
      const html = editor.getHTML();
      if (html !== lastContent) {
        lastContent = html;
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
  }, [editor]);

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return editor;
};
