// Popup Script for Mind Notion Extension

document.addEventListener("DOMContentLoaded", async () => {
  // DOM Elements
  const elements = {
    // Views
    loginView: document.getElementById("loginView"),
    registerView: document.getElementById("registerView"),
    appView: document.getElementById("appView"),

    // Auth elements
    loginForm: document.getElementById("loginForm"),
    registerForm: document.getElementById("registerForm"),
    loginBtn: document.getElementById("loginBtn"),
    registerBtn: document.getElementById("registerBtn"),
    showRegister: document.getElementById("showRegister"),
    showLogin: document.getElementById("showLogin"),
    logoutBtn: document.getElementById("logoutBtn"),

    // User info
    userInfo: document.getElementById("userInfo"),
    userName: document.getElementById("userName"),
    userEmail: document.getElementById("userEmail"),

    // App elements
    saveButton: document.getElementById("saveButton"),
    selectedTextPreview: document.getElementById("selectedTextPreview"),
    previewContent: document.getElementById("previewContent"),
    charCount: document.getElementById("charCount"),
    message: document.getElementById("message"),
    emptyState: document.getElementById("emptyState"),
  };

  // State
  let currentSelectedText = "";
  let currentTab = null;
  let currentUser = null;

  /**
   * Initialize popup
   */
  async function init() {
    try {
      // Setup event listeners first
      setupEventListeners();

      // Check auth status
      const authResult = await chrome.runtime.sendMessage({
        action: "getUser",
      });

      if (authResult.authenticated && authResult.user) {
        currentUser = authResult.user;
        showAppView();
        await loadSelectedText();
      } else {
        showLoginView();
      }
    } catch (error) {
      console.error("[Mind Notion] Init error:", error);
      showLoginView();
    }
  }
  // Initialize
  await init();
  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Auth navigation
    elements.showRegister.addEventListener("click", showRegisterView);
    elements.showLogin.addEventListener("click", showLoginView);
    elements.logoutBtn.addEventListener("click", handleLogout);

    // Forms
    elements.loginForm.addEventListener("submit", handleLogin);
    elements.registerForm.addEventListener("submit", handleRegister);

    // Save button
    elements.saveButton.addEventListener("click", handleSave);

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!elements.appView.classList.contains("hidden")) {
          handleSave();
        }
      }
    });
  }

  /**
   * Show login view
   */
  function showLoginView() {
    elements.loginView.classList.remove("hidden");
    elements.registerView.classList.add("hidden");
    elements.appView.classList.add("hidden");
    elements.logoutBtn.classList.add("hidden");
  }

  /**
   * Show register view
   */
  function showRegisterView() {
    elements.loginView.classList.add("hidden");
    elements.registerView.classList.remove("hidden");
    elements.appView.classList.add("hidden");
    elements.logoutBtn.classList.add("hidden");
  }

  /**
   * Show app view (logged in)
   */
  function showAppView() {
    elements.loginView.classList.add("hidden");
    elements.registerView.classList.add("hidden");
    elements.appView.classList.remove("hidden");
    elements.logoutBtn.classList.remove("hidden");

    // Update user info
    if (currentUser) {
      elements.userName.textContent =
        currentUser.name || currentUser.username || "User";
      elements.userEmail.textContent = currentUser.email || "";
    }
  }

  /**
   * Load selected text from page
   */
  async function loadSelectedText() {
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      currentTab = tab;

      // Get selected text
      const response = await chrome.runtime.sendMessage({
        action: "getSelectedText",
      });

      if (response.success && response.text) {
        currentSelectedText = response.text.trim();
        showPreview(currentSelectedText);
      } else {
        showEmptyState();
      }
    } catch (error) {
      console.error("[Mind Notion] Load text error:", error);
      showEmptyState();
    }
  }

  /**
   * Handle login form submit
   */
  async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(elements.loginForm);
    const username = formData.get("username");
    const password = formData.get("password");

    setButtonLoading(elements.loginBtn, true, "Signing in...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "login",
        data: { username, password },
      });

      if (response.success) {
        currentUser = response.user;
        showMessage("success", "Logged in successfully!");
        showAppView();
        await loadSelectedText();
      } else {
        showMessage("error", response.error || "Login failed");
      }
    } catch (error) {
      showMessage("error", error.message || "Login failed");
    } finally {
      setButtonLoading(elements.loginBtn, false, "Sign In");
    }
  }

  /**
   * Handle register form submit
   */
  async function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(elements.registerForm);
    const name = formData.get("name");
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    setButtonLoading(elements.registerBtn, true, "Creating account...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "register",
        data: { name, username, email, password },
      });

      if (response.success) {
        currentUser = response.user;
        showMessage("success", "Account created!");
        showAppView();
        await loadSelectedText();
      } else {
        showMessage("error", response.error || "Registration failed");
      }
    } catch (error) {
      showMessage("error", error.message || "Registration failed");
    } finally {
      setButtonLoading(elements.registerBtn, false, "Create Account");
    }
  }

  /**
   * Handle logout
   */
  async function handleLogout() {
    try {
      await chrome.runtime.sendMessage({ action: "logout" });
      currentUser = null;
      showMessage("success", "Logged out");
      showLoginView();
      elements.loginForm.reset();
      elements.registerForm.reset();
    } catch (error) {
      showMessage("error", "Logout failed");
    }
  }

  /**
   * Handle save button click
   */
  async function handleSave() {
    if (!currentSelectedText) {
      showMessage("warning", "No text selected to save");
      return;
    }

    setButtonLoading(elements.saveButton, true, "Saving...");

    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveSelection",
        data: {
          content: currentSelectedText,
          source_url: currentTab?.url || "",
          source_title: currentTab?.title || "",
        },
      });

      if (response.success) {
        showMessage("success", "Saved successfully! ✓");
        elements.saveButton.classList.add("success");
        setTimeout(() => {
          elements.saveButton.classList.remove("success");
        }, 1000);
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
      setButtonLoading(elements.saveButton, false, "Save Selection");
    }
  }

  /**
   * Show text preview
   */
  function showPreview(text) {
    elements.emptyState.classList.add("hidden");
    elements.selectedTextPreview.classList.remove("hidden");
    elements.saveButton.disabled = false;

    elements.previewContent.textContent = truncateText(text, 300);
    elements.charCount.textContent = `${text.length} characters`;
  }

  /**
   * Show empty state
   */
  function showEmptyState() {
    elements.emptyState.classList.remove("hidden");
    elements.selectedTextPreview.classList.add("hidden");
    elements.saveButton.disabled = true;
  }

  /**
   * Show message
   */
  function showMessage(type, text) {
    elements.message.textContent = text;
    elements.message.className = `message ${type} show`;

    setTimeout(() => {
      elements.message.classList.remove("show");
    }, 3000);
  }

  /**
   * Set button loading state
   */
  function setButtonLoading(button, isLoading, text) {
    button.disabled = isLoading;
    button.classList.toggle("loading", isLoading);

    if (isLoading) {
      button.innerHTML = `
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="60" stroke-linecap="round"/>
        </svg>
        <span>${text}</span>
      `;
    } else {
      if (button === elements.saveButton) {
        button.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>${text}</span>
        `;
      } else {
        button.innerHTML = `<span>${text}</span>`;
      }
    }
  }

  /**
   * Truncate text with ellipsis
   */
  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }
});
