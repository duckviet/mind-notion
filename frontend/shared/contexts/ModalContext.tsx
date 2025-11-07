import React, { createContext, useContext, useState, useCallback } from "react";

interface ModalContextValue {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modalCount, setModalCount] = useState(0);

  const openModal = useCallback(() => {
    setModalCount((prev) => prev + 1);
  }, []);

  const closeModal = useCallback(() => {
    setModalCount((prev) => Math.max(0, prev - 1));
  }, []);

  const isModalOpen = modalCount > 0;

  return (
    <ModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
