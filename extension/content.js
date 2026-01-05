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

    // Show appropriate view
    if (authResult.authenticated && authResult.user) {
      showAppView(authResult.user, selectedText);
    } else {
      showLoginView();
    }

    // Setup drag functionality
    setupDragging();
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
      <div class="mn-popup-header" id="mn-drag-handle">
        <div class="mn-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>Mind Notion</span>
        </div>
        <button class="mn-close-btn" id="mn-close-btn" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
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
    const left = windowWidth - popupWidth - 20;
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
    const dragHandle = floatingPopup.querySelector("#mn-drag-handle");
    const closeBtn = floatingPopup.querySelector("#mn-close-btn");

    dragHandle.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    closeBtn.addEventListener("click", closePopup);
  }

  function dragStart(e) {
    if (e.target.closest("#mn-close-btn")) return;

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
   * Show login view
   */
  function showLoginView() {
    const body = floatingPopup.querySelector("#mn-popup-body");
    body.innerHTML = `
      <div class="mn-auth-view">
        <div class="mn-auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to save your notes</p>
        </div>
        <form class="mn-auth-form" id="mn-login-form">
          <div class="mn-form-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="Enter username" required autocomplete="username">
          </div>
          <div class="mn-form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Enter password" required autocomplete="current-password">
          </div>
          <button type="submit" class="mn-btn mn-btn-primary">Sign In</button>
        </form>
        <div class="mn-auth-footer">
          <span>Don't have an account?</span>
          <button type="button" class="mn-link-btn" id="mn-show-register">Sign Up</button>
        </div>
        <div class="mn-message" id="mn-message"></div>
      </div>
    `;

    // Setup event listeners
    const form = body.querySelector("#mn-login-form");
    const showRegisterBtn = body.querySelector("#mn-show-register");

    form.addEventListener("submit", handleLogin);
    showRegisterBtn.addEventListener("click", showRegisterView);
  }

  /**
   * Show register view
   */
  function showRegisterView() {
    const body = floatingPopup.querySelector("#mn-popup-body");
    body.innerHTML = `
      <div class="mn-auth-view">
        <div class="mn-auth-header">
          <h2>Create Account</h2>
          <p>Sign up to start saving notes</p>
        </div>
        <form class="mn-auth-form" id="mn-register-form">
          <div class="mn-form-group">
            <label>Full Name</label>
            <input type="text" name="name" placeholder="Enter your name" required>
          </div>
          <div class="mn-form-group">
            <label>Username</label>
            <input type="text" name="username" placeholder="Choose a username" required autocomplete="username">
          </div>
          <div class="mn-form-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="Enter your email" required autocomplete="email">
          </div>
          <div class="mn-form-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="Create a password" required minlength="6" autocomplete="new-password">
          </div>
          <button type="submit" class="mn-btn mn-btn-primary">Create Account</button>
        </form>
        <div class="mn-auth-footer">
          <span>Already have an account?</span>
          <button type="button" class="mn-link-btn" id="mn-show-login">Sign In</button>
        </div>
        <div class="mn-message" id="mn-message"></div>
      </div>
    `;

    const form = body.querySelector("#mn-register-form");
    const showLoginBtn = body.querySelector("#mn-show-login");

    form.addEventListener("submit", handleRegister);
    showLoginBtn.addEventListener("click", showLoginView);
  }

  /**
   * Show app view (logged in)
   */
  function showAppView(user, selectedText = "") {
    const body = floatingPopup.querySelector("#mn-popup-body");
    body.innerHTML = `
      <div class="mn-app-view">
        <div class="mn-user-info">
          <div class="mn-user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="mn-user-details">
            <span class="mn-user-name">${
              user.name || user.username || "User"
            }</span>
            <span class="mn-user-email">${user.email || ""}</span>
          </div>
          <button class="mn-logout-btn" id="mn-logout-btn" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
        
        <div class="mn-form-group">
          <label>Note Content</label>
          <textarea 
            id="mn-note-content" 
            placeholder="Enter or paste your note here..." 
            rows="10"
          >${selectedText}</textarea>
          <div class="mn-char-count">
            <span id="mn-char-count">${selectedText.length} characters</span>
          </div>
        </div>

        <button class="mn-btn mn-btn-primary mn-btn-save" id="mn-save-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save Note
        </button>

        <div class="mn-message" id="mn-message"></div>
      </div>
    `;

    // Setup event listeners
    const textarea = body.querySelector("#mn-note-content");
    const charCount = body.querySelector("#mn-char-count");
    const saveBtn = body.querySelector("#mn-save-btn");
    const logoutBtn = body.querySelector("#mn-logout-btn");

    textarea.addEventListener("input", () => {
      charCount.textContent = `${textarea.value.length} characters`;
    });

    saveBtn.addEventListener("click", () => handleSave(textarea.value));
    logoutBtn.addEventListener("click", handleLogout);
  }

  /**
   * Handle login
   */
  async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "login",
        data: { username, password },
      });

      if (response.success) {
        showMessage("success", "Logged in successfully!");
        setTimeout(() => {
          showAppView(response.user);
        }, 500);
      } else {
        showMessage("error", response.error || "Login failed");
      }
    } catch (error) {
      showMessage("error", error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle register
   */
  async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "register",
        data: { name, username, email, password },
      });

      if (response.success) {
        showMessage("success", "Account created!");
        setTimeout(() => {
          showAppView(response.user);
        }, 500);
      } else {
        showMessage("error", response.error || "Registration failed");
      }
    } catch (error) {
      showMessage("error", error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle logout
   */
  async function handleLogout() {
    try {
      await chrome.runtime.sendMessage({ action: "logout" });
      showMessage("success", "Logged out");
      setTimeout(() => {
        showLoginView();
      }, 500);
    } catch (error) {
      showMessage("error", "Logout failed");
    }
  }

  /**
   * Handle save note
   */
  async function handleSave(content) {
    if (!content.trim()) {
      showMessage("warning", "Please enter some text");
      return;
    }

    setLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSelection",
        data: {
          content: content.trim(),
          source_url: window.location.href,
          source_title: document.title,
        },
      });

      if (response.success) {
        showMessage("success", "Saved successfully! ✓");
        // Clear textarea after 1 second
        setTimeout(() => {
          const textarea = floatingPopup.querySelector("#mn-note-content");
          if (textarea) textarea.value = "";
          const charCount = floatingPopup.querySelector("#mn-char-count");
          if (charCount) charCount.textContent = "0 characters";
        }, 1000);
      } else {
        throw new Error(response.error || "Save failed");
      }
    } catch (error) {
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

    messageEl.textContent = text;
    messageEl.className = `mn-message mn-message-${type} mn-message-show`;

    setTimeout(() => {
      messageEl.classList.remove("mn-message-show");
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
