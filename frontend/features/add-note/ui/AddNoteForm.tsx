import React, { useState, KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/shared/components/Card";
import { ReqCreateNote } from "@/shared/services/generated/api";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
export default function AddNoteForm({
  folder_id,
  onCreate,
}: {
  folder_id?: string | null;
  onCreate: (data: ReqCreateNote) => void;
}) {
  const [title, setTitle] = useState<string>(""); // Note title
  const [content, setContent] = useState<string>(""); // Note content
  const [isFocus, setIsFocus] = useState<boolean>(false); // Focus state
  const [isSaving, setIsSaving] = useState<boolean>(false); // Saving state

  // Handle Ctrl + Enter for saving
  const handleEnter = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      if (content.trim() && !isSaving) {
        setIsSaving(true);
        try {
          await onCreate({
            title,
            content,
            content_type: "text",
            status: "draft",
            thumbnail: "",
            tags: [],
            is_public: false,
            folder_id,
          });
          setTitle("");
          setContent("");
          setIsFocus(false);
        } catch (err) {
          console.error("Failed to create note", err);
        } finally {
          setIsSaving(false);
        }
      } else {
        // No content; ignore
      }
    }
  };

  console.log(content);

  const isSaveHintVisible =
    content.trim() && content !== "<p></p>" ? true : false;
  return (
    <div className="relative h-full break-inside-avoid mb-6">
      {/* Overlay */}
      {isFocus && (
        <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-[0.5px] z-30" />
      )}

      {/* Card Container */}
      <Card
        className={cn(
          "relative rounded-2xl transition-all duration-200 h-full",
          isFocus ? "z-40" : "hover:shadow-lg",
        )}
      >
        {/* Title Input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          className="text-xl px-6 pt-6 mb-2 bg-transparent w-full focus:outline-none"
          placeholder="Add a new note"
        />

        <RichTextEditor
          toolbar={false}
          placeholder="Type your message here..."
          content={content}
          onUpdate={(content) => setContent(content)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onKeyDown={handleEnter}
          className="min-h-36 max-h-100 overflow-y-auto cursor-text w-full h-full p-0"
        />
        {/* Save Hint */}
        {isSaveHintVisible && (
          <p
            style={{ color: "white" }}
            className="bg-red-400 text-white absolute px-4 left-0 bottom-0 rounded-2xl rounded-t-none text-center w-full"
          >
            {isSaving ? "Saving..." : "Press Ctrl + Enter to save"}
          </p>
        )}
      </Card>
    </div>
  );
}
