import React, { useState, KeyboardEvent } from "react";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
// import noteAction from "@/services/note.action";
import { toast } from "sonner";
export default function NoteCard() {
  const [title, setTitle] = useState<string>(""); // Note title
  const [content, setContent] = useState<string>(""); // Note content
  const [isFocus, setIsFocus] = useState<boolean>(false); // Focus state

  // Handle Ctrl + Enter for saving
  const handleEnter = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // if (e.ctrlKey && e.key === "Enter") {
    //   if (content.trim()) {
    //     const response = await noteAction.postAddNote(
    //       !title ? "New note" : title,
    //       content
    //     );
    //     console.log("Saved note response:", response);
    //     setTitle("");
    //     setContent("");
    //     setIsFocus(false);
    //   } else {
    //     toast.warning("Please fill in note content before saving.");
    //   }
    // }
  };

  return (
    <div className="relative h-full">
      {/* Overlay */}
      {isFocus && <div className="fixed inset-0 bg-gray-200/40 z-30" />}

      {/* Card Container */}
      <div
        className={cn(
          "relative bg-gray-50 p-4 rounded-lg shadow-md transition-all duration-200 h-full",
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
          className="p-0 h-[90%] no-scrollbar focus-visible:ring-0 focus-visible:border-none text-lg border-none resize-none bg-transparent"
          placeholder="Type your message here..."
        />

        {/* Save Hint */}
        {content && (
          <p className="bg-red-400 text-white absolute px-4 left-0   bottom-0  rounded-md rounded-t-none text-center w-full">
            Press Ctrl + Enter to save
          </p>
        )}
      </div>
    </div>
  );
}
