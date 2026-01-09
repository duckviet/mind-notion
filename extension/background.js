// Background Service Worker for Mind Notion Extension
// Handles context menu and authentication

importScripts("config.js", "api.js");

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  // Only create menu for text selection
  chrome.contextMenus.create({
    id: "saveSelectedText",
    title: "💾 Save to Mind Notion",
    contexts: ["selection"],
  });

  console.log("[Mind Notion] Extension installed, context menu created.");
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "saveSelectedText") return;

  const selectedText = info.selectionText?.trim();

  // Open floating popup with selected text
  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: "togglePopup",
      selectedText: selectedText || "",
    });
  } catch (error) {
    console.error("[Mind Notion] Error opening popup:", error);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request)
    .then((result) => sendResponse(result))
    .catch((error) => sendResponse({ success: false, error: error.message }));
  return true; // Keep message channel open for async response
});

// Keyboard shortcut - Toggle floating popup
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-floating-popup") return;

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab?.id) {
      throw new Error("No active tab found");
    }

    // Try to send message to content script
    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: "togglePopup" });
      return;
    } catch (e) {
      // Content script not injected yet, try to inject it
      if (
        e.message.includes("Could not establish connection") ||
        e.message.includes("Receiving end does not exist")
      ) {
        console.log("[Mind Notion] Injecting content script...");

        // Inject content.js and content.css
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["content.js"],
        });

        await chrome.scripting.insertCSS({
          target: { tabId: activeTab.id },
          files: ["content.css"],
        });

        // Wait a bit for scripts to load, then send message
        await new Promise((resolve) => setTimeout(resolve, 300));

        await chrome.tabs.sendMessage(activeTab.id, { action: "togglePopup" });
        console.log("[Mind Notion] Floating popup opened");
        return;
      }
      throw e;
    }
  } catch (error) {
    console.error("[Mind Notion] Toggle popup failed:", error);
    showNotification("error", "Could not open popup. Please refresh the page.");
  }
});

/**
 * Handle messages from popup
 */
async function handleMessage(request) {
  switch (request.action) {
    case "login":
      return handleLogin(request.data);

    case "register":
      return handleRegister(request.data);

    case "logout":
      return handleLogout();

    case "checkAuth":
      return handleCheckAuth();

    case "getUser":
      return handleGetUser();

    case "saveSelection":
      return handleSaveSelection(request.data);

    case "getSelectedText":
      return handleGetSelectedText();

    case "openPopup":
      // Open the default extension popup for login
      return handleOpenPopup();

    default:
      throw new Error("Unknown action");
  }
}

/**
 * Handle login
 */
async function handleLogin(data) {
  try {
    const result = await apiService.login(data.username, data.password);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle register
 */
async function handleRegister(data) {
  try {
    const result = await apiService.register(
      data.username,
      data.email,
      data.password,
      data.name
    );
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  await apiService.logout();
  return { success: true };
}

/**
 * Handle check auth
 */
async function handleCheckAuth() {
  try {
    const isAuth = await apiService.isAuthenticated();
    if (!isAuth) {
      return { success: false, authenticated: false };
    }
    const user = await apiService.checkAuth();
    return { success: true, authenticated: true, user };
  } catch (error) {
    return { success: false, authenticated: false, error: error.message };
  }
}

/**
 * Handle get user from storage
 */
async function handleGetUser() {
  const user = await apiService.getUser();
  const isAuth = await apiService.isAuthenticated();
  return { success: true, user, authenticated: isAuth };
}

/**
 * Handle save selection request from popup
 */
async function handleSaveSelection(data) {
  try {
    const result = await apiService.saveSelectedText(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get selected text from the active tab
 */
async function handleGetSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) {
      return { success: false, error: "No active tab found" };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || "",
    });

    return { success: true, text: results[0]?.result || "" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Open default popup for login
 */
async function handleOpenPopup() {
  try {
    await chrome.action.openPopup();
    return { success: true };
  } catch (error) {
    // Fallback: show notification
    showNotification("warning", "Please login via extension icon");
    return { success: false, error: "Could not open popup" };
  }
}

/**
 * Show browser notification via badge
 */
function showNotification(type, message) {
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "!",
  };

  chrome.action.setBadgeText({ text: icons[type] || "•" });
  chrome.action.setBadgeBackgroundColor({ color: colors[type] || "#6366f1" });

  // Clear badge after 2 seconds
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2000);
}
