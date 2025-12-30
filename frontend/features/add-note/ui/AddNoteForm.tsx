import React, { useState, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card } from "@/shared/components/Card";
import {
  createNote,
  getListNotesQueryKey,
  ReqCreateNote,
} from "@/shared/services/generated/api";
import { RichTextEditor } from "@/shared/components/RichTextEditor";
export default function AddNoteForm({
  onCreate,
}: {
  onCreate: (data: ReqCreateNote) => void;
}) {
  const [title, setTitle] = useState<string>(""); // Note title
  const [content, setContent] = useState<string>(""); // Note content
  const [isFocus, setIsFocus] = useState<boolean>(false); // Focus state
  const [isSaving, setIsSaving] = useState<boolean>(false); // Saving state
  const queryClient = useQueryClient();

  // Handle Ctrl + Enter for saving
  const handleEnter = async (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      if (content.trim() && !isSaving) {
        setIsSaving(true);
        try {
          onCreate({
            title,
            content,
            content_type: "text",
            status: "draft",
            thumbnail: "",
            tags: [],
            is_public: false,
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

  const isSaveHintVisible =
    content.trim() && content !== "<p></p>" ? true : false;
  return (
    <div className="relative h-full">
      {/* Overlay */}
      {isFocus && <div className="fixed inset-0 bg-gray-300/40 z-30" />}

      {/* Card Container */}
      <Card
        className={cn(
          "relative bg-white rounded-2xl transition-all duration-200 h-full",
          isFocus ? "z-40" : "hover:shadow-lg"
        )}
      >
        {/* Title Input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          className="text-xl mb-2 bg-transparent w-full focus:outline-none"
          placeholder="Add a new note"
        />

        {/* Note Content */}
        {/* <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onKeyDown={handleEnter}
          className="p-0 shadow-none mb-4 ring-0 ring-offset-0 no-scrollbar focus-visible:ring-0 focus-visible:border-none text-lg border-none resize-none bg-transparent min-h-36"
          placeholder="Type your message here..."
        /> */}

        <RichTextEditor
          toolbar={false}
          placeholder="Type your message here..."
          content={content}
          onUpdate={(content) => setContent(content)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onKeyDown={handleEnter}
          className="min-h-36 max-h-100 overflow-y-auto cursor-text w-full h-full"
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
