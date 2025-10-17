"use client";

import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import React, { Fragment } from "react";

const Tiptap = ({ className }: { className?: string }) => {
  const editor = useEditor(
    {
      extensions: [StarterKit, Link],
      editorProps: {
        attributes: {
          class: "h-full focus:outline-none",
        },
      },
      content: "<p>Hello World! 🌎️</p>",
      // Don't render immediately on the server to avoid SSR issues
      immediatelyRender: false,
      injectCSS: false,
      enableInputRules: [Link, "horizontalRule"],
    },
    []
  );

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
