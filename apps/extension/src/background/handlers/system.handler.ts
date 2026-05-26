import { MessageResponse } from "../../core/messages";

export function showNotification(
  type: "success" | "error" | "warning",
  message: string,
) {
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

  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2000);
}

export async function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "saveSelectedText",
      title: "💾 Save to Mind Notion",
      contexts: ["selection"],
    });
  });
}

export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
) {
  if (info.menuItemId !== "saveSelectedText" || !tab?.id) return;

  const selectedText = info.selectionText?.trim() || "";

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: "togglePopup",
      selectedText,
    });
  } catch (error) {
    console.error("[Mind Notion] Error opening popup:", error);
  }
}

export async function handleToggleFloatingPopup() {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!activeTab?.id) {
      throw new Error("No active tab found");
    }

    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: "togglePopup" });
    } catch (e: any) {
      if (
        e.message.includes("Could not establish connection") ||
        e.message.includes("Receiving end does not exist")
      ) {
        console.log("[Mind Notion] Injecting content script...");

        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ["src/content/index.ts"],
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        await chrome.tabs.sendMessage(activeTab.id, { action: "togglePopup" });
        return;
      }
      throw e;
    }
  } catch (error) {
    console.error("[Mind Notion] Toggle popup failed:", error);
    showNotification("error", "Could not open popup. Please refresh the page.");
  }
}
