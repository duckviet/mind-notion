import React, { useEffect, useState } from "react";
import { User } from "../core/types";
import { Login } from "../features/auth/Login";
import { Register } from "../features/auth/Register";
import { NoteEditorCore } from "../features/note/NoteEditorCore";

type AuthView = "login" | "register";

export interface FloatingAppProps {
  selectedText: string;
  onClose: () => void;
  onOpenPiP: (user: User, selectedText: string) => void;
}

export function FloatingApp({ selectedText, onClose, onOpenPiP }: FloatingAppProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: "getUser" });
      if (response.authenticated && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("[Mind Notion] Auth check failed:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setAuthView("login");
  };

  const handleLogout = async () => {
    await chrome.runtime.sendMessage({ action: "logout" });
    setUser(null);
    setAuthView("login");
  };

  if (isLoading) {
    return (
      <div className="mn-floating-loading" style={{ padding: 24, textAlign: "center" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return authView === "login" ? (
      <Login onLogin={handleAuthSuccess} onSwitch={() => setAuthView("register")} />
    ) : (
      <Register onRegister={handleAuthSuccess} onSwitch={() => setAuthView("login")} />
    );
  }

  const initials = (user.name ?? user.username).charAt(0).toUpperCase();

  return (
    <>
      <div className="mn-floating-header" data-mn-drag-handle>
        <div className="mn-floating-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Mind Notion</span>
        </div>
        <div className="mn-floating-actions">
          <button
            type="button"
            className="mn-icon-btn"
            title="Open in Picture-in-Picture"
            onClick={() => onOpenPiP(user, selectedText)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <rect x="13" y="9" width="7" height="5" rx="1" />
            </svg>
          </button>
          <button type="button" className="mn-logout-btn" onClick={() => void handleLogout()} title="Logout">
            Logout
          </button>
          <button type="button" className="mn-icon-btn mn-icon-btn--close" title="Close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mn-floating-user">
        <div className="mn-avatar">{initials}</div>
        <div className="mn-user-meta">
          <span className="mn-user-name">{user.name ?? user.username}</span>
          <span className="mn-user-email">{user.email}</span>
        </div>
      </div>

      <div className="mn-floating-body">
        <NoteEditorCore
          initialContent={selectedText}
          sourceUrl={window.location.href}
          sourceTitle={document.title}
        />
      </div>
    </>
  );
}
