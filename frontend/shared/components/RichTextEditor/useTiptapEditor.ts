import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useMemo, useRef } from "react";
import { EditorView } from "@tiptap/pm/view";

import { cn } from "@/lib/utils";
import ExtLink from "./ExtLink";
import ExtListKit from "./ExtListKit";
import ExtCodeBlock from "./ExtCodeBlock";
import ExtHeading from "./ExtHeading";
import ExtMathematics, { migrateMathStrings } from "./ExtMathematics";
import ExtTableKit from "./ExtTable";
import { Placeholder } from "@tiptap/extensions";

function useTiptapPlaceholderCSS() {
  useEffect(() => {
    const css = `
      .tiptap p.is-editor-empty:first-child::before {
        color: #adb5bd;
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
      }
    `;
    const styleTag = document.createElement("style");
    styleTag.setAttribute("data-tiptap-custom-placeholder", "true");
    styleTag.innerHTML = css;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
}

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
  // Inject the placeholder CSS
  useTiptapPlaceholderCSS();

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onKeyDownRef = useRef(onKeyDown);
  const contentRef = useRef(content);
  const isUpdatingRef = useRef(false);
  const lastUserInputRef = useRef<number>(0); // Track last user input time

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
      ExtLink,
      ...ExtListKit,
      ExtCodeBlock,
      ExtHeading,
      ExtMathematics,
      ...ExtTableKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
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
            "h-full focus:outline-none",
            !editable && "pointer-events-none select-text cursor-default"
          ),
        },
        handleDOMEvents: {
          keydown: (_: EditorView, event: KeyboardEvent) => {
            if (onKeyDownRef.current)
              onKeyDownRef.current(
                event as unknown as React.KeyboardEvent<HTMLDivElement>
              );
            return event.defaultPrevented;
          },
        },
      },
    },
    [editable, extensions] // Also depend on extensions for placeholder changes
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

  /** Sync when parent changes - only when content actually differs */
  useEffect(() => {
    if (!editor || content === undefined || isUpdatingRef.current) return;

    // Don't sync if user just made changes recently (within last 500ms)
    // This prevents race condition where debounced update triggers parent update
    // which then tries to sync back and overwrites user input
    const timeSinceLastInput = Date.now() - lastUserInputRef.current;
    if (timeSinceLastInput < 500) {
      contentRef.current = content;
      return;
    }

    const current = editor.getHTML();
    // Only update if content is truly different to avoid unnecessary updates
    if (current !== content) {
      isUpdatingRef.current = true;
      // Defer setContent to avoid flushSync conflict during React render
      queueMicrotask(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.setContent(content, { emitUpdate: false });
          // Reset flag after update completes
          requestAnimationFrame(() => {
            isUpdatingRef.current = false;
          });
        } else {
          isUpdatingRef.current = false;
        }
      });
    }
    contentRef.current = content;
  }, [editor, content]);

  /** Cleanup */
  useEffect(() => () => editor?.destroy(), [editor]);

  return editor;
};
