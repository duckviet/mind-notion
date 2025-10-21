import React, { useState, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card } from "@/shared/components/Card";
import {
  createNote,
  getListNotesQueryKey,
} from "@/shared/services/generated/api";
export default function NoteCard() {
  const [title, setTitle] = useState<string>(""); // Note title
  const [content, setContent] = useState<string>(""); // Note content
  const [isFocus, setIsFocus] = useState<boolean>(false); // Focus state
  const [isSaving, setIsSaving] = useState<boolean>(false); // Saving state
  const queryClient = useQueryClient();

  // Handle Ctrl + Enter for saving
  const handleEnter = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "Enter") {
      if (content.trim() && !isSaving) {
        setIsSaving(true);
        try {
          const payload = {
            title: title?.trim() ? title : "New note",
            content_type: "text",
            status: "draft",
            content,
            thumbnail: "",
            tags: [] as string[],
            is_public: false,
          };
          const response = await createNote(payload);
          console.log("Saved note response:", response);

          // Invalidate and refetch notes list
          await queryClient.invalidateQueries({
            queryKey: ["/notes/list"],
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

  return (
    <div className="relative h-full">
      {/* Overlay */}
      {isFocus && <div className="fixed inset-0 bg-gray-300/40 z-30" />}

      {/* Card Container */}
      <Card
        className={cn(
          "relative  rounded-lg   transition-all duration-200 h-full",
          isFocus ? "z-40" : "hover:shadow-lg"
        )}
      >
        {/* Title Input */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          className="text-xl text-red-500 placeholder:text-red-500 mb-2 bg-transparent w-full focus:outline-none"
          placeholder="Add a new note"
        />

        {/* Note Content */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onKeyDown={handleEnter}
          className="p-0 shadow-none mb-4 ring-0 ring-offset-0 no-scrollbar focus-visible:ring-0 focus-visible:border-none text-lg border-none resize-none bg-transparent"
          placeholder="Type your message here..."
        />

        {/* Save Hint */}
        {content && (
          <p className="bg-red-400 text-white absolute px-4 left-0 bottom-0 rounded-md rounded-t-none text-center w-full">
            {isSaving ? "Saving..." : "Press Ctrl + Enter to save"}
          </p>
        )}
      </Card>
    </div>
  );
}
