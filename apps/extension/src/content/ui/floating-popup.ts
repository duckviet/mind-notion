import { User } from "../../core/types";
import { DragHelper } from "./drag-helper";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { NoteEditorCore } from "../../popup/features/note/NoteEditorCore";
import { preparePiPDocument, PIP_WINDOW_WIDTH, PIP_WINDOW_HEIGHT } from "../../core/utils/pipWindow";

// Same ?inline trick — content script CSS injected via manifest can't be
// read from document.styleSheets either (it's a separate stylesheet context).
import pipStyles from "../style.css?inline";

export class FloatingPopup {
  private element: HTMLElement | null = null;
  private dragHelper: DragHelper | null = null;
  private reactRoot: Root | null = null;
  private pipWindow: Window | null = null;
  private pipReactRoot: Root | null = null;

  public isOpen(): boolean {
    return this.element !== null && document.body.contains(this.element);
  }

  public open(user: User, selectedText: string) {
    if (this.isOpen()) return;

    this.element = this.createElement();
    document.body.appendChild(this.element);

    const { left, top } = this.positionPopup();
    this.renderContent(user, selectedText);
    this.dragHelper = new DragHelper(this.element, left, top);
  }

  public close() {
    this.reactRoot?.unmount();
    this.reactRoot = null;

    if (this.element && document.body.contains(this.element)) {
      this.element.remove();
      this.element = null;
    }

    this.dragHelper?.destroy();
    this.dragHelper = null;
  }

  private createElement(): HTMLElement {
    const popup = document.createElement("div");
    popup.id = "mind-notion-popup";
    popup.className = "mn-floating";
    return popup;
  }

  private positionPopup(): { left: number; top: number } {
    if (!this.element) return { left: 0, top: 0 };
    const left = window.innerWidth - 400 - 20;
    const top = 80;
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
    return { left, top };
  }

  private renderContent(user: User, selectedText: string) {
    if (!this.element) return;

    // Header
    const header = document.createElement("div");
    header.className = "mn-floating-header";
    header.innerHTML = `
      <div class="mn-floating-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span>Mind Notion</span>
      </div>
      <div class="mn-floating-actions">
        <button id="mn-pip-btn" class="mn-icon-btn" title="Open in Picture-in-Picture">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <rect x="13" y="9" width="7" height="5" rx="1"/>
          </svg>
        </button>
        <button id="mn-close-btn" class="mn-icon-btn mn-icon-btn--close" title="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;

    // User strip
    const userStrip = document.createElement("div");
    userStrip.className = "mn-floating-user";
    const initials = (user.name ?? user.username).charAt(0).toUpperCase();
    userStrip.innerHTML = `
      <div class="mn-avatar">${initials}</div>
      <div class="mn-user-meta">
        <span class="mn-user-name">${user.name ?? user.username}</span>
        <span class="mn-user-email">${user.email}</span>
      </div>
    `;

    // React mount point
    const editorMount = document.createElement("div");
    editorMount.className = "mn-floating-body";

    this.element.appendChild(header);
    this.element.appendChild(userStrip);
    this.element.appendChild(editorMount);

    // Wire up buttons
    header.querySelector("#mn-close-btn")!.addEventListener("click", () => this.close());
    header.querySelector("#mn-pip-btn")!.addEventListener("click", () => this.openPiP(user, selectedText));

    // Render React editor core
    this.reactRoot = createRoot(editorMount);
    this.reactRoot.render(
      React.createElement(NoteEditorCore, {
        initialContent: selectedText,
        sourceUrl: window.location.href,
        sourceTitle: document.title,
      })
    );
  }

  private async openPiP(user: User, selectedText: string) {
    if (!("documentPictureInPicture" in window)) {
      alert("Your browser doesn't support Document Picture-in-Picture.");
      return;
    }
    if (this.pipWindow && !this.pipWindow.closed) {
      this.pipWindow.focus();
      return;
    }

    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
        width: PIP_WINDOW_WIDTH,
        height: PIP_WINDOW_HEIGHT,
      });
      this.pipWindow = pipWindow;

      const mountEl = preparePiPDocument(pipWindow, pipStyles);

      this.pipReactRoot = createRoot(mountEl);
      this.pipReactRoot.render(
        React.createElement(
          "div",
          { className: "mn-pip-shell" },
          React.createElement(
            "div",
            { className: "mn-pip-header" },
            React.createElement("span", { className: "mn-pip-title" }, "Mind Notion")
          ),
          React.createElement(NoteEditorCore, {
            initialContent: selectedText,
            sourceUrl: window.location.href,
            sourceTitle: document.title,
          })
        )
      );

      pipWindow.addEventListener(
        "pagehide",
        () => {
          this.pipReactRoot?.unmount();
          this.pipReactRoot = null;
          this.pipWindow = null;
        },
        { once: true }
      );

      // Close floating popup since PiP takes over
      this.close();
    } catch (err) {
      console.error("[Mind Notion] PiP failed:", err);
    }
  }
}

export const floatingPopup = new FloatingPopup();