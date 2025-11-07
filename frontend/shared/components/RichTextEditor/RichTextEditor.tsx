"use client";

import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { Fragment, useCallback, useEffect, useMemo } from "react";
import ExtLink from "./ExtLink";
import ExtListKit from "./ExtListKit";
import ExtCodeBlock from "./ExtCodeBlock";
import ExtHeading from "./ExtHeading";
import ExtMathematics, { migrateMathStrings } from "./ExtMathematics";
import ExtTableKit from "./ExtTable";
import { EditorView } from "@tiptap/pm/view";

// Extend Tiptap props: add onKeyDown handler support
interface TiptapProps {
  ref?: React.RefObject<HTMLDivElement>;
  className?: string;
  content?: string;
  onContentChange?: (content: string) => void;
  editable?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const Tiptap = ({
  ref,
  className,
  content: initialContent,
  onContentChange,
  editable,
  onKeyDown,
}: TiptapProps) => {
  const editorConfig = useMemo(
    () => ({
      extensions: [
        StarterKit.configure({
          // Exclude extensions that we override with custom versions
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
      editorProps: {
        attributes: {
          class: cn(
            "h-full focus:outline-none",
            !editable && "pointer-events-none select-text cursor-default"
          ),
        },
        handleDOMEvents: {
          // Wire the onKeyDown prop from parent if provided
          keydown: (_: EditorView, event: KeyboardEvent) => {
            // event is KeyboardEvent
            if (typeof onKeyDown === "function") {
              // Make a React KeyboardEvent-like wrapper
              // You can use event directly, but for type-safety, cast
              onKeyDown(
                event as unknown as React.KeyboardEvent<HTMLDivElement>
              );
            }
            // Don't prevent default, allow downstream plugins
            // Always return false so tiptap default keymaps run
            return false;
          },
        },
      },
      content: initialContent || "<p></p>",
      immediatelyRender: false,
      injectCSS: false,
      editable,
      enableInputRules: editable
        ? [
            ExtLink,
            "horizontalRule",
            ...ExtListKit,
            ExtCodeBlock,
            ExtHeading,
            ExtMathematics,
            ...ExtTableKit,
          ]
        : [],
    }),
    [initialContent, editable, onKeyDown]
  );

  const editor = useEditor(editorConfig, [initialContent, editable, onKeyDown]);

  // Memoize content change handler
  const handleContentChange = useCallback(
    (content: string) => {
      if (onContentChange) {
        // Throttle updates để performance tốt hơn
        onContentChange(content);
      }
    },
    [onContentChange]
  );

  // Setup event listeners with proper cleanup
  useEffect(() => {
    if (!editor) return;

    let lastContent = editor.getHTML();
    let timeoutId: NodeJS.Timeout;

    const handleUpdate = () => {
      const currentContent = editor.getHTML();
      // Only trigger onContentChange if content actually changed
      if (currentContent !== lastContent) {
        lastContent = currentContent;
        handleContentChange(currentContent);
      }
    };

    // Debounce updates để tránh quá nhiều calls
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleUpdate, 300);
    };

    // Only listen to 'update' event, not 'selectionUpdate'
    // 'selectionUpdate' fires on cursor movement without content changes
    editor.on("update", debouncedUpdate);

    // Migrate math strings on create
    migrateMathStrings(editor);

    return () => {
      clearTimeout(timeoutId);
      editor.off("update", debouncedUpdate);
    };
  }, [editor, handleContentChange]);

  // Update content when initialContent changes (for external updates)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentHTML = editor.getHTML();
      // Chỉ update nếu content thực sự thay đổi
      if (currentHTML !== initialContent) {
        editor.commands.setContent(initialContent, { emitUpdate: false }); // false = don't emit update
      }
    }
  }, [editor, initialContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);
  if (!editor) {
    return (
      <div
        className={cn(
          "w-full h-full animate-pulse bg-gray-100 rounded",
          className
        )}
      >
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }
  return (
    <EditorContent
      ref={ref}
      className={cn(
        "w-full h-full focus:outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:border-none resize-none",
        className
      )}
      editor={editor}
    />
  );
};

export default Tiptap;
