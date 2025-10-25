"use client";

import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import React, { Fragment, useEffect } from "react";
import ExtLink from "./ExtLink";
import ExtListKit from "./ExtListKit";
import ExtCodeBlock from "./ExtCodeBlock";
import ExtHeading from "./ExtHeading";
import ExtMathematics, { migrateMathStrings } from "./ExtMathematics";
import ExtTableKit from "./ExtTable";

const Tiptap = ({
  className,
  content,
  onContentChange,
}: {
  className?: string;
  content?: string;
  onContentChange?: (content: string) => void;
}) => {
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        ExtLink,
        ...ExtListKit,
        ExtCodeBlock,
        ExtHeading,
        ExtMathematics,
        ...ExtTableKit,
      ],
      editorProps: {
        attributes: {
          class: "h-full focus:outline-none",
        },
      },
      content: content || "<p>Hello World! 🌎️</p>",
      // Don't render immediately on the server to avoid SSR issues
      immediatelyRender: false,
      injectCSS: false,
      enableInputRules: [
        ExtLink,
        "horizontalRule",
        ...ExtListKit,
        ExtCodeBlock,
        ExtHeading,
        ExtMathematics,
        ...ExtTableKit,
      ],
      onCreate: ({ editor: currentEditor }) => {
        migrateMathStrings(currentEditor);
      },
    },
    []
  );

  useEffect(() => {
    if (onContentChange && editor) {
      const handleUpdate = () => {
        onContentChange(editor.getHTML());
      };

      editor.on("update", handleUpdate);

      return () => {
        editor.off("update", handleUpdate);
      };
    }
  }, [editor, onContentChange]);

  return (
    <Fragment>
      <EditorContent
        className={cn(
          "w-full h-full focus:outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:border-none resize-none",
          className
        )}
        editor={editor}
      />
    </Fragment>
  );
};

export default Tiptap;
