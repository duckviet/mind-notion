import "./style.css";
import { floatingPopup } from "./ui/floating-popup";

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "togglePopup") {
    void togglePopup(request.selectedText);
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
    return;
  }

  if (!selectedText) {
    selectedText = window.getSelection()?.toString().trim() || "";
  }

  floatingPopup.open(selectedText);
}
