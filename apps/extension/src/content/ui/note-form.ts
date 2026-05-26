import { User } from "../../core/types";

export class NoteForm {
  private titleInput: HTMLInputElement;
  private textarea: HTMLTextAreaElement;
  private charCount: HTMLElement;
  private saveHint: HTMLElement;
  private messageEl: HTMLElement;
  private onSave: (title: string, content: string) => Promise<void>;

  constructor(
    container: HTMLElement,
    initialText: string,
    onSave: (title: string, content: string) => Promise<void>
  ) {
    this.onSave = onSave;
    
    this.titleInput = container.querySelector("#mn-note-title") as HTMLInputElement;
    this.textarea = container.querySelector("#mn-note-content") as HTMLTextAreaElement;
    this.charCount = container.querySelector("#mn-char-count") as HTMLElement;
    this.saveHint = container.querySelector("#mn-save-hint") as HTMLElement;
    this.messageEl = container.querySelector("#mn-message") as HTMLElement;

    this.setupListeners();
    this.updateSaveHint();
  }

  private setupListeners() {
    this.textarea.addEventListener("input", () => this.updateSaveHint());
    this.textarea.addEventListener("focus", () => this.updateSaveHint());
    this.textarea.addEventListener("blur", () => {
      if (!this.textarea.value.trim()) {
        this.saveHint.style.display = "none";
      }
    });

    this.textarea.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (this.textarea.value.trim()) {
          this.handleSave();
        }
      }
    });
  }

  private updateSaveHint() {
    const hasContent = this.textarea.value.trim();
    this.charCount.textContent = `${this.textarea.value.length} characters`;
    if (hasContent) {
      this.saveHint.style.display = "block";
    } else {
      this.saveHint.style.display = "none";
    }
  }

  private async handleSave() {
    const title = this.titleInput.value;
    const content = this.textarea.value;

    if (!content.trim()) {
      this.showMessage("warning", "Please enter some content");
      return;
    }

    this.setLoading(true);

    try {
      await this.onSave(title, content);
    } finally {
      this.setLoading(false);
    }
  }

  public showMessage(type: "success" | "warning" | "error", text: string) {
    this.saveHint.style.display = "none";
    this.messageEl.textContent = text;
    this.messageEl.className = `mn-message mn-message-${type} mn-message-show`;

    setTimeout(() => {
      this.messageEl.classList.remove("mn-message-show");
      this.messageEl.textContent = "";
    }, 3000);
  }

  public clearForm() {
    this.titleInput.value = "";
    this.textarea.value = "";
    this.updateSaveHint();
  }

  public setLoading(isLoading: boolean) {
    // Note form doesn't have a visible save button right now, but if it did:
    const buttons = document.querySelectorAll("button[type='submit'], .mn-btn-save");
    buttons.forEach((btn: any) => {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.classList.add("mn-btn-loading");
      } else {
        btn.classList.remove("mn-btn-loading");
      }
    });
  }
}
