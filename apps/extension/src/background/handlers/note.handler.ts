import { noteService } from "../../services/note.service";
import { MessageResponse } from "../../core/messages";
import { NotePayload } from "../../core/types";

export async function handleSaveSelection(data: Partial<NotePayload> & { content: string }): Promise<MessageResponse> {
  try {
    const result = await noteService.saveSelectedText(data);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleGetSelectedText(): Promise<MessageResponse> {
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
