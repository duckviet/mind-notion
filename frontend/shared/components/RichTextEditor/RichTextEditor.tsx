"use client";

import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect, useMemo, useRef } from "react";
import ExtLink from "./ExtLink";
import ExtListKit from "./ExtListKit";
import ExtCodeBlock from "./ExtCodeBlock";
import ExtHeading from "./ExtHeading";
import ExtMathematics, { migrateMathStrings } from "./ExtMathematics";
import ExtTableKit from "./ExtTable";
import { EditorView } from "@tiptap/pm/view";

interface TiptapProps {
  ref?: React.RefObject<HTMLDivElement>;
  className?: string;
  content?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const Tiptap = ({
  ref,
  className,
  content = "<p></p>",
  onUpdate,
  editable = true,
  onKeyDown,
}: TiptapProps) => {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  const onKeyDownRef = useRef(onKeyDown);
  const contentRef = useRef(content);
  const isUpdatingRef = useRef(false);

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
    ],
    []
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
            return false;
          },
        },
      },
    },
    [editable] // Only recreate when editable changes
  );

  /** Handle editor updates (with debounce) */
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
  }, [editor]); // Remove onUpdate from deps, use ref instead

  /** Sync when parent changes - only when content actually differs */
  useEffect(() => {
    if (!editor || content === undefined || isUpdatingRef.current) return;

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

  if (!editor) {
    return (
      <div
        className={cn(
          "w-full h-full animate-pulse bg-gray-100 rounded",
          className
        )}
      />
    );
  }

  return (
    <EditorContent
      ref={ref}
      editor={editor}
      className={cn(
        "w-full h-full focus:outline-none ring-0 ring-offset-0 resize-none",
        className
      )}
    />
  );
};

export default Tiptap;
