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

// 3. Extension icon click (no default_popup)
chrome.action.onClicked.addListener(() => {
  void handleToggleFloatingPopup();
});

// 4. Command shortcuts (Alt+M / Alt+Shift+M)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-floating-popup" || command === "_execute_action") {
    await handleToggleFloatingPopup();
  }
});

// 5. Message Router
chrome.runtime.onMessage.addListener(
  (
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: MessageResponse) => void,
  ) => {
    routeMessage(request)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Keep message channel open for async response
  },
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
    default:
      throw new Error(`Unknown action: ${request.action}`);
  }
}
