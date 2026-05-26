import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ExtBlockQuote,
  ExtHeading,
  ExtHighLight,
  ExtLink,
  ExtListKit,
  ExtMathematics,
  ExtTableKit,
  ExtTaskListKit,
} from "@mind-notion/editor";

type PiPNoteCardProps = {
  initialContent?: string;
  sourceUrl?: string;
  sourceTitle?: string;
};

type SaveStatus = {
  type: "success" | "warning" | "error" | "";
  text: string;
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: 14,
    boxSizing: "border-box",
    background: "#e9edf3",
  },
  card: {
    width: "100%",
    height: "calc(100vh - 28px)",
    boxSizing: "border-box",
    borderRadius: 16,
    background: "#ffffff",
    padding: "18px 18px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxShadow: "0 18px 48px rgba(15, 23, 42, 0.16)",
    overflow: "hidden",
  },
  titleInput: {
    width: "100%",
    border: 0,
    outline: "none",
    padding: 0,
    margin: 0,
    fontFamily: "inherit",
    fontSize: 18,
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#111827",
    background: "transparent",
  },
  editorWrap: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    overflowY: "auto",
    margin: "4px 0 0",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 4,
  },
  meta: {
    fontSize: 11,
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },
  button: {
    border: 0,
    borderRadius: 10,
    padding: "6px 12px",
    minWidth: 100,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    color: "#ffffff",
    background: "#2563eb",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.24)",
  },
  status: {
    minHeight: 16,
    fontSize: 11,
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>;

const editorStyles = `
  .mn-pip-editor {
    min-height: 100%;
    outline: none;
    color: #334155;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.2;
    font-style: normal;
  }

  .mn-pip-editor p {
    margin: 0 0 0.45em;
  }

  .mn-pip-editor h1,
  .mn-pip-editor h2,
  .mn-pip-editor h3 {
    margin: 0.35em 0 0.25em;
    color: #111827;
    font-weight: 700;
    line-height: 1.18;
  }

  .mn-pip-editor h1 { font-size: 18px; }
  .mn-pip-editor h2 { font-size: 16px; }
  .mn-pip-editor h3 { font-size: 15px; }

  .mn-pip-editor ul,
  .mn-pip-editor ol {
    margin: 0.35em 0;
    padding-left: 1.35em;
  }

  .mn-pip-editor blockquote {
    margin: 0.45em 0;
    padding-left: 0.75em;
    border-left: 2px solid #cbd5e1;
    color: #64748b;
  }

  .mn-pip-editor code {
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 4px;
    background: #f1f5f9;
  }

  .mn-pip-editor.ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    color: #94a3b8;
    float: left;
    height: 0;
    pointer-events: none;
    font-style: italic;
  }
`;

const statusColors: Record<SaveStatus["type"], string> = {
  "": "transparent",
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
};

export function PiPNoteCard({
  initialContent = "",
  sourceUrl = "",
  sourceTitle = "",
}: PiPNoteCardProps) {
  const [title, setTitle] = React.useState(sourceTitle || "Add a new note");
  const [htmlContent, setHtmlContent] = React.useState(initialContent);
  const [charCount, setCharCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<SaveStatus>({
    type: "",
    text: "",
  });

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
      Placeholder.configure({ placeholder: "Type your message here..." }),
    ],
    content: initialContent,
    onCreate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      setCharCount(editor.getText().length);
    },
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      setCharCount(editor.getText().length);
    },
    editorProps: {
      attributes: { class: "mn-pip-editor" },
    },
  });

  React.useEffect(() => {
    editor?.commands.focus();
  }, [editor]);

  const flash = (type: SaveStatus["type"], text: string) => {
    setStatus({ type, text });
    window.setTimeout(() => setStatus({ type: "", text: "" }), 2600);
  };

  const handleSave = async () => {
    if (!editor?.getText().trim()) {
      flash("warning", "Write something first.");
      return;
    }

    setLoading(true);
    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSelection",
        data: {
          title: title.trim() || sourceTitle || "Saved from PiP",
          content: htmlContent,
          source_url: sourceUrl,
        },
      });

      if (response.success) {
        flash("success", "Saved");
      } else {
        flash("error", response.error || "Save failed");
      }
    } catch (err: unknown) {
      flash("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSave();
    }
  };

  return (
    <main style={styles.page}>
      <style>{editorStyles}</style>
      <section style={styles.card} aria-label="Mind Notion PiP note">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          style={styles.titleInput}
          aria-label="Note title"
          spellCheck
        />

        <div style={styles.editorWrap} onKeyDown={handleEditorKeyDown}>
          <EditorContent editor={editor} />
        </div>

        <div style={styles.footer}>
          <div>
            <div style={styles.meta}>{charCount} chars</div>
            <div style={{ ...styles.status, color: statusColors[status.type] }}>
              {status.text}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.72 : 1,
              cursor: loading ? "default" : "pointer",
            }}
          >
            <SaveIcon />
            {loading ? "Saving..." : "Save note"}
          </button>
        </div>
      </section>
    </main>
  );
}

function SaveIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
