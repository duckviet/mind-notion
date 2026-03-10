"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { MultiZoneDndProvider } from "./MultiZoneDndProvider";

type GlobalDndHandlers = {
  onDragEnd?: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  renderOverlay?: (activeId: UniqueIdentifier | null) => React.ReactNode;
  disabled?: boolean;
};

type GlobalDndContextValue = {
  registerHandlers: (handlers: GlobalDndHandlers | null) => void;
};

const GlobalDndContext = createContext<GlobalDndContextValue | null>(null);

export function GlobalDndProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<GlobalDndHandlers | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);

  const registerHandlers = useCallback((handlers: GlobalDndHandlers | null) => {
    handlersRef.current = handlers;
    setIsDisabled(Boolean(handlers?.disabled));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    handlersRef.current?.onDragStart?.(event);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    handlersRef.current?.onDragOver?.(event);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    handlersRef.current?.onDragEnd?.(event);
  }, []);

  const handleRenderOverlay = useCallback(
    (activeId: UniqueIdentifier | null) =>
      handlersRef.current?.renderOverlay?.(activeId) ?? null,
    [],
  );

  return (
    <GlobalDndContext.Provider value={{ registerHandlers }}>
      <MultiZoneDndProvider
        disabled={isDisabled}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        renderOverlay={handleRenderOverlay}
      >
        {children}
      </MultiZoneDndProvider>
    </GlobalDndContext.Provider>
  );
}

export function useGlobalDndHandlers(handlers: GlobalDndHandlers | null) {
  const context = useContext(GlobalDndContext);

  if (!context) {
    throw new Error(
      "useGlobalDndHandlers must be used within GlobalDndProvider",
    );
  }

  const { registerHandlers } = context;

  React.useEffect(() => {
    registerHandlers(handlers);

    return () => {
      registerHandlers(null);
    };
  }, [registerHandlers, handlers]);
}
