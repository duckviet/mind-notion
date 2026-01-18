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
  // Track if user is actively editing to prevent race conditions
  const isUserEditingRef = useRef(false);
  // Track the last content we sent to parent to detect external changes
  const lastSentContentRef = useRef<string>(content);
  // Track the last content we received from props
  const lastReceivedContentRef = useRef<string>(content);

  const [toc, setToc] = usePersistentState(
    LocalStorageKeys.FOCUS_EDIT_TOC_COLLAPSED,
    false,
  );

  const { mutateAsync: uploadMedia } = useUploadMedia({
    mutation: {
      onError: () => toast.error("Failed to upload image"),
    },
  });

  // Use refs for unstable callbacks to prevent extensions from recreating
  const uploadMediaRef = useRef(uploadMedia);
  const setTocRef = useRef(setToc);
  const tocRef = useRef(toc);

  useEffect(() => {
    uploadMediaRef.current = uploadMedia;
  }, [uploadMedia]);

  useEffect(() => {
    setTocRef.current = setToc;
    tocRef.current = toc;
  }, [setToc, toc]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
  }, [onKeyDown]);

  // IMPORTANT: Use minimal dependencies to prevent editor recreation
  // Callbacks use refs so they stay stable
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
        initialToc: tocRef.current ?? false,
        onToggle: (newTocValue: boolean) => setTocRef.current(newTocValue),
      }),
      Placeholder.configure({ placeholder }),
      ExtImage,
      ExtImageUpload.configure({
        uploadFn: async (file: File) => {
          const res = await uploadMediaRef.current({ data: { file } });
          return res.url;
        },
      }),
      ExtSplitView,
      SplitViewColumn,
    ],
    // Only recreate extensions when placeholder changes (rarely)
    // toc, setToc, uploadMedia are accessed via refs
    [placeholder],
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

  // Update editor content when content prop changes from EXTERNAL source
  // Only sync if: content changed, not from our own update, and user is not actively editing
  useEffect(() => {
    if (!editor) return;

    // Store the received content for reference
    lastReceivedContentRef.current = content;

    // Skip if this content is what we just sent (echo from parent)
    if (content === lastSentContentRef.current) {
      return;
    }

    // Skip if user is actively editing (prevents race condition)
    if (isUserEditingRef.current) {
      return;
    }

    const currentContent = editor.getHTML();
    // Only update if content actually differs
    if (content && currentContent !== content) {
      // Use requestAnimationFrame to avoid flushSync warning and ensure smooth update
      requestAnimationFrame(() => {
        if (!editor.isDestroyed && !isUserEditingRef.current) {
          // Preserve cursor position if possible
          const { from, to } = editor.state.selection;
          editor.commands.setContent(content, { emitUpdate: false });
          // Try to restore cursor position
          try {
            const docSize = editor.state.doc.content.size;
            const safeFrom = Math.min(from, docSize);
            const safeTo = Math.min(to, docSize);
            editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
          } catch {
            // Ignore selection restoration errors
          }
        }
      });
    }
  }, [content, editor]);

  // Handle editor updates with debounce and track user editing state
  useEffect(() => {
    if (!editor) return;

    let lastContent = editor.getHTML();

    const handleUpdate = () => {
      const html = editor.getHTML();
      if (html !== lastContent) {
        lastContent = html;
        // Track the content we're sending to parent to detect echoes
        lastSentContentRef.current = html;
        onUpdateRef.current?.(html);
      }
      // Reset editing flag after update is sent
      isUserEditingRef.current = false;
    };

    const debouncedUpdate = () => {
      // Mark as user editing when content changes
      isUserEditingRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(handleUpdate, 300);
    };

    // Track focus state to prevent content sync while typing
    const handleFocus = () => {
      isUserEditingRef.current = true;
    };

    const handleBlur = () => {
      // Small delay to allow pending updates to complete
      setTimeout(() => {
        isUserEditingRef.current = false;
      }, 100);
    };

    editor.on("update", debouncedUpdate);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    migrateMathStrings(editor);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      editor.off("update", debouncedUpdate);
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor]);

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return editor;
};
