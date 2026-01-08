// Content Script - Floating Popup
(function () {
  let floatingPopup = null;
  let isDragging = false;
  let currentX = 0;
  let currentY = 0;
  let initialX = 0;
  let initialY = 0;
  let xOffset = 0;
  let yOffset = 0;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "togglePopup") {
      togglePopup(request.selectedText);
      sendResponse({ success: true });
    } else if (request.action === "closePopup") {
      closePopup();
      sendResponse({ success: true });
    }
    return true;
  });

  /**
   * Toggle popup visibility
   */
  function togglePopup(selectedText = "") {
    if (floatingPopup && document.body.contains(floatingPopup)) {
      closePopup();
    } else {
      openPopup(selectedText);
    }
  }

  /**
   * Open floating popup
   */
  async function openPopup(selectedText = "") {
    if (floatingPopup && document.body.contains(floatingPopup)) {
      return;
    }

    // Get selected text if not provided
    if (!selectedText) {
      selectedText = window.getSelection()?.toString().trim() || "";
    }

    // Check auth status
    const authResult = await chrome.runtime.sendMessage({
      action: "getUser",
    });

    floatingPopup = createPopupElement();
    document.body.appendChild(floatingPopup);

    // Position popup (top-right corner)
    positionPopup();

    // Show appropriate view - only show if authenticated
    if (authResult.authenticated && authResult.user) {
      showAppView(authResult.user, selectedText);
      // Setup drag functionality
      setupDragging();
    } else {
      // Not authenticated - remove popup and open default popup
      floatingPopup.remove();
      floatingPopup = null;
      // Open default popup for login
      chrome.runtime.sendMessage({ action: "openPopup" });
    }
  }

  /**
   * Close popup
   */
  function closePopup() {
    if (floatingPopup && document.body.contains(floatingPopup)) {
      floatingPopup.remove();
      floatingPopup = null;
    }
  }

  /**
   * Create popup HTML element
   */
  function createPopupElement() {
    const popup = document.createElement("div");
    popup.id = "mind-notion-popup";
    popup.className = "mind-notion-floating";
    popup.innerHTML = `
      <div class="mn-popup-body" id="mn-popup-body">
        <!-- Content will be injected here -->
      </div>
    `;
    return popup;
  }

  /**
   * Position popup
   */
  function positionPopup() {
    const popup = floatingPopup;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const popupWidth = 380;
    const popupHeight = 500;

    // Position at top-right with some margin
    const left = windowWidth - popupWidth - 50;
    const top = 80;

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    xOffset = left;
    yOffset = top;
  }

  /**
   * Setup dragging
   */
  function setupDragging() {
    // Attach drag to the outer popup, detect if clicking on padding area
    floatingPopup.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);
  }

  function dragStart(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    floatingPopup.style.cursor = "grabbing";
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    xOffset = currentX;
    yOffset = currentY;

    setTranslate(currentX, currentY, floatingPopup);
  }

  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    floatingPopup.style.cursor = "default";
  }

  function setTranslate(xPos, yPos, el) {
    el.style.left = `${xPos}px`;
    el.style.top = `${yPos}px`;
  }

  /**
   * Show app view (logged in)
   */
  function showAppView(user, selectedText = "") {
    const body = floatingPopup.querySelector("#mn-popup-body");
    body.innerHTML = `
        <!-- Close Button (Absolute) -->
        <button class="mn-app-close-btn" id="mn-app-close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <!-- Note Form Container -->
        <div class="mn-note-form-container">
          <!-- Title Input -->
          <input
            type="text"
            id="mn-note-title"
            class="mn-note-title"
            placeholder="Add a new note"
            value=""
          />

          <!-- Content Textarea -->
          <textarea 
            id="mn-note-content" 
            class="mn-note-content"
            placeholder="Type your message here..."
          >${selectedText}</textarea>

          
          <!-- Character Count -->
          <div class="mn-char-count">
          <span id="mn-char-count">${selectedText.length} characters</span>
          </div>

          </div>
          <!-- Save Hint -->
          <div class="mn-save-hint" id="mn-save-hint" style="display: none;">
            <span>Press Ctrl + Enter to save</span>
          </div>

        <!-- Message -->
        <div class="mn-message" id="mn-message"></div>
    `;

    // Setup event listeners
    const titleInput = body.querySelector("#mn-note-title");
    const textarea = body.querySelector("#mn-note-content");
    const charCount = body.querySelector("#mn-char-count");
    const closeBtn = body.querySelector("#mn-app-close-btn");
    const saveHint = body.querySelector("#mn-save-hint");

    // Close button
    closeBtn.addEventListener("click", closePopup);

    // Update character count and show save hint
    const updateSaveHint = () => {
      const hasContent = textarea.value.trim();
      charCount.textContent = `${textarea.value.length} characters`;
      if (hasContent) {
        saveHint.style.display = "block";
      } else {
        saveHint.style.display = "none";
      }
    };

    textarea.addEventListener("input", updateSaveHint);
    textarea.addEventListener("focus", updateSaveHint);
    textarea.addEventListener("blur", () => {
      if (!textarea.value.trim()) {
        saveHint.style.display = "none";
      }
    });

    // Handle Ctrl+Enter to save
    textarea.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (textarea.value.trim()) {
          handleSave(titleInput.value, textarea.value);
        }
      }
    });
  }

  /**
   * Handle save note
   */
  async function handleSave(title, content) {
    if (!content.trim()) {
      showMessage("warning", "Please enter some content");
      return;
    }

    setLoading(true);

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
        showMessage("success", "Saved successfully! ✓");
        // Clear form after 1.5 seconds
        setTimeout(() => {
          const titleInput = floatingPopup.querySelector("#mn-note-title");
          const contentInput = floatingPopup.querySelector("#mn-note-content");
          if (titleInput) titleInput.value = "";
          if (contentInput) contentInput.value = "";
        }, 1500);
      } else {
        if (
          response.error?.includes("401") ||
          response.error?.includes("unauthorized")
        ) {
          showMessage("error", "Session expired. Please login again.");
          setTimeout(() => showLoginView(), 1500);
        } else {
          throw new Error(response.error || "Save failed");
        }
      }
    } catch (error) {
      console.error("[Mind Notion] Save error:", error);
      showMessage("error", error.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Show message
   */
  function showMessage(type, text) {
    const messageEl = floatingPopup.querySelector("#mn-message");
    if (!messageEl) return;
    const saveHint = floatingPopup.querySelector("#mn-save-hint");
    saveHint.style.display = "none";
    messageEl.textContent = text;
    messageEl.className = `mn-message mn-message-${type} mn-message-show`;

    setTimeout(() => {
      messageEl.classList.remove("mn-message-show");
      floatingPopup.querySelector("#mn-message").textContent = "";
    }, 3000);
  }

  /**
   * Set loading state
   */
  function setLoading(isLoading) {
    const buttons = floatingPopup.querySelectorAll(
      "button[type='submit'], .mn-btn-save"
    );
    buttons.forEach((btn) => {
      btn.disabled = isLoading;
      if (isLoading) {
        btn.classList.add("mn-btn-loading");
      } else {
        btn.classList.remove("mn-btn-loading");
      }
    });
  }
})();
