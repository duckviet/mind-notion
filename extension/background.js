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
