import { floatingPopup } from "./ui/floating-popup";

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "togglePopup") {
    togglePopup(request.selectedText);
    sendResponse({ success: true });
  } else if (request.action === "closePopup") {
    floatingPopup.close();
    sendResponse({ success: true });
  }
  return true;
});

async function togglePopup(selectedText: string = "") {
  if (floatingPopup.isOpen()) {
    floatingPopup.close();
  } else {
    await openPopup(selectedText);
  }
}

async function openPopup(selectedText: string = "") {
  if (floatingPopup.isOpen()) {
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

  if (authResult.authenticated && authResult.user) {
    floatingPopup.open(authResult.user, selectedText);
  } else {
    // Not authenticated - open default popup for login
    chrome.runtime.sendMessage({ action: "openPopup" });
  }
}
