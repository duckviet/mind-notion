"use client";

import { create } from "zustand";
import type { ChatbotDropPayload } from "../model/use-chatbot";

type ChatbotSidebarState = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  activeTab: "comments" | "maind";
  setActiveTab: (tab: "comments" | "maind") => void;
  droppedNotePayload: ChatbotDropPayload | null;
  setDroppedNotePayload: (payload: ChatbotDropPayload) => void;
  clearDroppedNotePayload: () => void;
};

export const useChatbotSidebarStore = create<ChatbotSidebarState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  activeTab: "comments",
  setActiveTab: (activeTab) => set({ activeTab }),
  droppedNotePayload: null,
  setDroppedNotePayload: (payload) => set({ droppedNotePayload: payload, isOpen: true }),
  clearDroppedNotePayload: () => set({ droppedNotePayload: null }),
}));
