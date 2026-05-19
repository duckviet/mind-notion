import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ExtHeading,
  ExtHighLight,
  ExtBlockQuote,
  ExtListKit,
  ExtMathematics,
  ExtTaskListKit,
  ExtTableKit,
  ExtLink,
} from "@mind-notion/editor";

interface NoteEditorCoreProps {
  initialContent?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  onSaved?: () => void;
  /** If true, shows the PiP trigger button */
  showPiPButton?: boolean;
  onOpenPiP?: () => void;
}

export function NoteEditorCore({
  initialContent = "",
  sourceUrl = "",
  sourceTitle = "",
  onSaved,
  showPiPButton = false,
  onOpenPiP,
}: NoteEditorCoreProps) {
  const [loading, setLoading] = React.useState(false);
  const [htmlContent, setHtmlContent] = React.useState(initialContent);
  const [status, setStatus] = React.useState<{
    type: "success" | "warning" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      ExtHeading,
      ExtHighLight,
      ExtBlockQuote,
      ...ExtListKit,
      ExtMathematics,
      ...ExtTaskListKit,
      ...ExtTableKit,
      ExtLink,
      Placeholder.configure({ placeholder: "Start writing your note…" }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => setHtmlContent(editor.getHTML()),
    editorProps: {
      attributes: { class: "mn-editor" },
    },
  });

  const charCount = editor?.getText().length ?? 0;

  const handleSave = async () => {
    const text = editor?.getText().trim();
    if (!text) {
      flash("warning", "Write something first.");
      return;
    }
    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSelection",
        data: { content: htmlContent, source_url: sourceUrl, source_title: sourceTitle },
      });
      if (response.success) {
        flash("success", "Saved! ✓");
        onSaved?.();
      } else {
        flash("error", response.error || "Save failed");
      }
    } catch (err: any) {
      flash("error", err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const flash = (type: typeof status.type, text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus({ type: "", text: "" }), 3000);
  };

  return (
    <div className="mn-core">
      {/* Toolbar row */}
      <div className="mn-core-toolbar">
        <span className="mn-char-count">{charCount} chars</span>
        {showPiPButton && onOpenPiP && (
          <button className="mn-pip-btn" onClick={onOpenPiP} title="Open in Picture-in-Picture">
            <PiPIcon />
            PiP
          </button>
        )}
      </div>

      {/* Editor area */}
      <div className="mn-editor-wrap">
        <EditorContent editor={editor} />
      </div>

      {/* Status */}
      {status.text && (
        <div className={`mn-status mn-status-${status.type}`}>{status.text}</div>
      )}

      {/* Save */}
      <button
        className="mn-btn-save"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? (
          <>
            <SpinnerIcon /> Saving…
          </>
        ) : (
          <>
            <SaveIcon /> Save to Mind Notion
          </>
        )}
      </button>
    </div>
  );
}

/* ── Icons ── */
function PiPIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <rect x="13" y="9" width="7" height="5" rx="1" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mn-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}