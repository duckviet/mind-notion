import { User } from "../../core/types";
import { DragHelper } from "./drag-helper";
import { NoteForm } from "./note-form";

export class FloatingPopup {
  private element: HTMLElement | null = null;
  private dragHelper: DragHelper | null = null;
  private noteForm: NoteForm | null = null;

  public isOpen(): boolean {
    return this.element !== null && document.body.contains(this.element);
  }

  public open(user: User, selectedText: string) {
    if (this.isOpen()) return;

    this.element = this.createElement();
    document.body.appendChild(this.element);

    const { left, top } = this.positionPopup();
    
    this.renderAppView(user, selectedText);
    
    this.dragHelper = new DragHelper(this.element, left, top);
  }

  public close() {
    if (this.element && document.body.contains(this.element)) {
      this.element.remove();
      this.element = null;
    }
    if (this.dragHelper) {
      this.dragHelper.destroy();
      this.dragHelper = null;
    }
    this.noteForm = null;
  }

  private createElement(): HTMLElement {
    const popup = document.createElement("div");
    popup.id = "mind-notion-popup";
    popup.className = "mind-notion-floating";
    popup.innerHTML = `
      <div class="mn-popup-body" id="mn-popup-body">
      </div>
    `;
    return popup;
  }

  private positionPopup(): { left: number; top: number } {
    if (!this.element) return { left: 0, top: 0 };

    const windowWidth = window.innerWidth;
    const popupWidth = 380;
    
    const left = windowWidth - popupWidth - 50;
    const top = 80;

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;

    return { left, top };
  }

  private renderAppView(user: User, selectedText: string) {
    if (!this.element) return;
    
    const body = this.element.querySelector("#mn-popup-body") as HTMLElement;
    body.innerHTML = `
      <button class="mn-app-close-btn" id="mn-app-close-btn" title="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="mn-note-form-container">
        <input type="text" id="mn-note-title" class="mn-note-title" placeholder="Add a new note" value="" />
        <textarea id="mn-note-content" class="mn-note-content" placeholder="Type your message here...">${selectedText}</textarea>
        <div class="mn-char-count">
          <span id="mn-char-count">${selectedText.length} characters</span>
        </div>
      </div>
      
      <div class="mn-save-hint" id="mn-save-hint" style="display: none;">
        <span>Press Ctrl + Enter to save</span>
      </div>

      <div class="mn-message" id="mn-message"></div>
    `;

    const closeBtn = body.querySelector("#mn-app-close-btn");
    closeBtn?.addEventListener("click", () => this.close());

    this.noteForm = new NoteForm(body, selectedText, async (title, content) => {
      await this.saveNote(title, content);
    });
  }

  private async saveNote(title: string, content: string) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSelection",
        data: {
          title: title.trim() || "Untitled Note",
          content: content.trim(),
          content_type: "text",
          status: "draft",
          source_url: window.location.href,
          source_title: document.title,
        },
      });

      if (response.success) {
        this.noteForm?.showMessage("success", "Saved successfully! ✓");
        setTimeout(() => {
          this.noteForm?.clearForm();
        }, 1500);
      } else {
        if (response.error?.includes("401") || response.error?.includes("unauthorized")) {
          this.noteForm?.showMessage("error", "Session expired. Please login again.");
          setTimeout(() => {
            this.close();
            chrome.runtime.sendMessage({ action: "openPopup" });
          }, 1500);
        } else {
          throw new Error(response.error || "Save failed");
        }
      }
    } catch (error: any) {
      console.error("[Mind Notion] Save error:", error);
      this.noteForm?.showMessage("error", error.message || "Failed to save");
    }
  }
}

export const floatingPopup = new FloatingPopup();
