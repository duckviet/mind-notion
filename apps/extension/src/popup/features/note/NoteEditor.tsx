import React, { useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { User } from "../../../core/types";
import { NoteEditorCore } from "./NoteEditorCore";
import {
  preparePiPDocument,
  PIP_WINDOW_WIDTH,
  PIP_WINDOW_HEIGHT,
} from "../../../core/utils/pipWindow";

// Vite ?inline → returns CSS file as a plain string (no DOM injection).
// We pass it manually to preparePiPDocument so the PiP window gets the
// exact same styles without relying on document.styleSheets (which fails
// in extension contexts due to CORS / bundler opacity).
import pipStyles from "../../index.css?inline";

interface NoteEditorProps {
  user: User;
}

export function NoteEditor({ user }: NoteEditorProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [isPiPOpen, setIsPiPOpen] = useState(false);
  const pipRootRef = useRef<Root | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        setSourceUrl(tab.url ?? "");
        setSourceTitle(tab.title ?? "");
      }
      const res = await chrome.runtime.sendMessage({ action: "getSelectedText" });
      if (res.success && res.text) {
        setInitialContent(res.text.trim());
      }
    } catch (e) {
      console.error("[Mind Notion] Failed to load context:", e);
    }
  };

  const handleOpenPiP = async () => {
    if (!("documentPictureInPicture" in window)) {
      alert("Your browser doesn't support Document Picture-in-Picture.");
      return;
    }
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.focus();
      return;
    }
    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: PIP_WINDOW_WIDTH,
        height: PIP_WINDOW_HEIGHT,
      });
      pipWindowRef.current = pipWindow;

      // Pass the bundled CSS string — no copying from document.styleSheets
      const mountEl = preparePiPDocument(pipWindow, pipStyles);

      pipRootRef.current = createRoot(mountEl);
      pipRootRef.current.render(
        <div className="mn-pip-shell">
          <div className="mn-pip-header">
            <div className="mn-pip-logo">
               Mind Notion
            </div>
          </div>
          <NoteEditorCore
            initialContent={initialContent}
            sourceUrl={sourceUrl}
            sourceTitle={sourceTitle}
          />
        </div>
      );

      setIsPiPOpen(true);
      pipWindow.addEventListener(
        "pagehide",
        () => {
          pipRootRef.current?.unmount();
          pipRootRef.current = null;
          pipWindowRef.current = null;
          setIsPiPOpen(false);
        },
        { once: true }
      );
    } catch (err) {
      console.error("[Mind Notion] PiP failed:", err);
    }
  };

  const initials =
    (user.name ?? user.username).charAt(0).toUpperCase();

  return (
    <div className="mn-note-editor">
      {/* User card */}
      <div className="mn-user-card">
        <div className="mn-avatar">{initials}</div>
        <div className="mn-user-meta">
          <span className="mn-user-name">{user.name ?? user.username}</span>
          <span className="mn-user-email">{user.email}</span>
        </div>
        <button
          className="mn-pip-trigger"
          onClick={handleOpenPiP}
          title={isPiPOpen ? "PiP is open" : "Open in Picture-in-Picture"}
          disabled={isPiPOpen}
        >
          <PiPIcon />
          {isPiPOpen ? "PiP active" : "PiP"}
        </button>
      </div>

      {/* Editor */}
      <NoteEditorCore
        initialContent={initialContent}
        sourceUrl={sourceUrl}
        sourceTitle={sourceTitle}
      />
    </div>
  );
}

function PiPIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <rect x="13" y="9" width="7" height="5" rx="1" />
    </svg>
  );
}