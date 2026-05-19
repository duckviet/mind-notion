import { User } from "../../core/types";
import { DragHelper } from "./drag-helper";
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { FloatingApp } from "../../ui/FloatingApp";
import { PiPNoteCard } from "../../ui/PiPNoteCard";
import { preparePiPDocument, PIP_WINDOW_WIDTH, PIP_WINDOW_HEIGHT } from "../../core/utils/pipWindow";

export class FloatingPopup {
  private element: HTMLElement | null = null;
  private dragHelper: DragHelper | null = null;
  private reactRoot: Root | null = null;
  private pipWindow: Window | null = null;
  private pipReactRoot: Root | null = null;
  private selectedText = "";

  public isOpen(): boolean {
    return this.element !== null && document.body.contains(this.element);
  }

  public open(selectedText: string = "") {
    if (this.isOpen()) return;

    this.selectedText = selectedText;
    this.element = this.createElement();
    document.body.appendChild(this.element);

    const { left, top } = this.positionPopup();
    this.renderContent();
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

  private renderContent() {
    if (!this.element) return;

    this.reactRoot = createRoot(this.element);
    this.reactRoot.render(
      React.createElement(FloatingApp, {
        selectedText: this.selectedText,
        onClose: () => this.close(),
        onOpenPiP: (user, text) => void this.openPiP(user, text),
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
      const pipWindow = await (window as Window & { documentPictureInPicture: { requestWindow: (opts: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture.requestWindow({
        width: PIP_WINDOW_WIDTH,
        height: PIP_WINDOW_HEIGHT,
      });
      this.pipWindow = pipWindow;

      const mountEl = await preparePiPDocument(pipWindow);

      this.pipReactRoot = createRoot(mountEl);
      this.pipReactRoot.render(
        React.createElement(PiPNoteCard, {
          initialContent: selectedText,
          sourceUrl: window.location.href,
          sourceTitle: document.title,
        })
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

      this.close();
    } catch (err) {
      console.error("[Mind Notion] PiP failed:", err);
    }
  }
}

export const floatingPopup = new FloatingPopup();
