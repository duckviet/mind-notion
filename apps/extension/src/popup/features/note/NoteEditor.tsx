import React, { useEffect, useState } from "react";
import { User } from "../../../core/types";

interface NoteEditorProps {
  user: User;
}

export function NoteEditor({ user }: NoteEditorProps) {
  const [selectedText, setSelectedText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadSelectedText();
  }, []);

  const loadSelectedText = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        setSourceUrl(tab.url || "");
        setSourceTitle(tab.title || "");
      }

      const response = await chrome.runtime.sendMessage({ action: "getSelectedText" });
      if (response.success && response.text) {
        setSelectedText(response.text.trim());
      }
    } catch (error) {
      console.error("Failed to load text:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedText) {
      setMessage({ type: "warning", text: "No text selected to save" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSelection",
        data: {
          content: selectedText,
          source_url: sourceUrl,
          source_title: sourceTitle,
        },
      });

      if (response.success) {
        setMessage({ type: "success", text: "Saved successfully! ✓" });
      } else {
        setMessage({ type: "error", text: response.error || "Save failed" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to save" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
          {user.name?.charAt(0) || user.username.charAt(0)}
        </div>
        <div>
          <div className="font-semibold text-sm">{user.name || user.username}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>

      {!selectedText ? (
        <div className="text-center p-6 border rounded border-dashed text-gray-500">
          <p>Select text on any webpage to save</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Selected Text</span>
            <span className="text-xs text-gray-500">{selectedText.length} chars</span>
          </div>
          <div className="p-3 bg-gray-50 border rounded text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
            {selectedText.length > 300 ? selectedText.substring(0, 300) + "..." : selectedText}
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? "Saving..." : "Save to Mind Notion"}
          </button>
        </div>
      )}

      {message.text && (
        <div
          className={`p-2 text-sm text-center rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
