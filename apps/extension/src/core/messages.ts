import { User, NotePayload } from "./types";

export type MessageAction =
  | "login"
  | "register"
  | "logout"
  | "checkAuth"
  | "getUser"
  | "saveSelection"
  | "getSelectedText"
  | "togglePopup"
  | "closePopup";

export interface MessageRequest<T = any> {
  action: MessageAction;
  data?: T;
  selectedText?: string;
}

export interface MessageResponse<T = any> {
  success: boolean;
  error?: string;
  authenticated?: boolean;
  user?: User | null;
  data?: T;
  text?: string;
}
