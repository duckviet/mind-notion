import { MessageRequest, MessageResponse } from "../core/messages";
import {
  handleLogin,
  handleRegister,
  handleLogout,
  handleCheckAuth,
  handleGetUser,
} from "./handlers/auth.handler";
import {
  handleSaveSelection,
  handleGetSelectedText,
} from "./handlers/note.handler";
import {
  handleOpenPopup,
  setupContextMenu,
  handleContextMenuClick,
  handleToggleFloatingPopup,
} from "./handlers/system.handler";

// 1. Install Event
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
  console.log("[Mind Notion] Extension installed, context menu created.");
});

// 2. Context Menu Click
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// 3. Command Shortcut (Alt+Shift+M or Alt+M)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-floating-popup" || command === "_execute_action") {
    // Actually _execute_action handles default popup natively, but if user customizes it:
    if (command === "toggle-floating-popup") {
      await handleToggleFloatingPopup();
    }
  }
});

// 4. Message Router
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    routeMessage(request)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for async response
  }
);

async function routeMessage(request: MessageRequest): Promise<MessageResponse> {
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
      return handleOpenPopup();
    default:
      throw new Error(`Unknown action: ${request.action}`);
  }
}
