
"use client";

import React from "react";
import { useCollaborativeEditor } from "../model/use-collaborative-editor";
import { Textarea } from "@/shared/components/ui/textarea";

export function CollaborativeEditor() {
  const { text, self, users, textAreaRef, handleTextChange } = useCollaborativeEditor();

  const otherUsers = users.filter((u) => (self ? u.id !== self.id : true));

  return (
    <div className="relative w-full">
      <div className="absolute top-2 right-2 flex -space-x-2">
        {self && (
          <div
            key={self.id}
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: self.color, zIndex: users.length + 1 }}
            title={`${self.name} (You)`}
          />
        )}
        {otherUsers.map((user, i) => (
          <div
            key={user.id}
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: user.color, zIndex: users.length - i }}
            title={user.name}
          />
        ))}
      </div>
      <Textarea
        ref={textAreaRef}
        value={text}
        onChange={handleTextChange}
        className="w-full h-96 text-lg p-4 border rounded-md shadow-inner resize-none focus:ring-2 focus:ring-accent-blue"
        placeholder="Start collaborating..."
      />
    </div>
  );
}
