import { floatingPopup } from "./ui/floating-popup";

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Mind Notion] Content script received message:", request);
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
  console.log("[Mind Notion] togglePopup called. Current isOpen:", floatingPopup.isOpen());
  if (floatingPopup.isOpen()) {
    floatingPopup.close();
  } else {
    await openPopup(selectedText);
  }
}

async function openPopup(selectedText: string = "") {
  console.log("[Mind Notion] openPopup called with selectedText:", selectedText);
  if (floatingPopup.isOpen()) {
    console.log("[Mind Notion] Popup is already open, ignoring");
    return;
  }

  // Get selected text if not provided
  if (!selectedText) {
    selectedText = window.getSelection()?.toString().trim() || "";
  }

  // Check auth status
  console.log("[Mind Notion] Checking auth status...");
  try {
    const authResult = await chrome.runtime.sendMessage({
      action: "getUser",
    });
    console.log("[Mind Notion] Auth result:", authResult);

    if (authResult.authenticated && authResult.user) {
      floatingPopup.open(authResult.user, selectedText);
    } else {
      console.log("[Mind Notion] Not authenticated, opening default popup");
      // Not authenticated - open default popup for login
      chrome.runtime.sendMessage({ action: "openPopup" });
    }
  } catch (error) {
    console.error("[Mind Notion] Error in openPopup:", error);
  }
}
