"use client";

import { create } from "zustand";
import type { ChatbotDropPayload } from "../model/use-chatbot";

type ChatbotSidebarState = {
  droppedNotePayload: ChatbotDropPayload | null;
  setDroppedNotePayload: (payload: ChatbotDropPayload) => void;
  clearDroppedNotePayload: () => void;
};

export const useChatbotSidebarStore = create<ChatbotSidebarState>((set) => ({
  droppedNotePayload: null,
  setDroppedNotePayload: (payload) => set({ droppedNotePayload: payload }),
  clearDroppedNotePayload: () => set({ droppedNotePayload: null }),
}));
