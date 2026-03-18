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
  registerHandlers: (id: string, handlers: GlobalDndHandlers | null) => void;
};

const GlobalDndContext = createContext<GlobalDndContextValue | null>(null);

export function GlobalDndProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Map<string, GlobalDndHandlers>>(new Map());
  const [isDisabled, setIsDisabled] = useState(false);

  const registerHandlers = useCallback(
    (id: string, handlers: GlobalDndHandlers | null) => {
      if (handlers) {
        handlersRef.current.set(id, handlers);
      } else {
        handlersRef.current.delete(id);
      }

      const hasDisabledHandler = [...handlersRef.current.values()].some(
        (entry) => Boolean(entry.disabled),
      );
      setIsDisabled(hasDisabledHandler);
    },
    [],
  );

  const getHandlers = useCallback(() => {
    return [...handlersRef.current.values()];
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      getHandlers().forEach((handler) => {
        handler.onDragStart?.(event);
      });
    },
    [getHandlers],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      getHandlers().forEach((handler) => {
        handler.onDragOver?.(event);
      });
    },
    [getHandlers],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      getHandlers().forEach((handler) => {
        handler.onDragEnd?.(event);
      });
    },
    [getHandlers],
  );

  const handleRenderOverlay = useCallback(
    (activeId: UniqueIdentifier | null) => {
      const handlers = getHandlers();

      for (let index = handlers.length - 1; index >= 0; index -= 1) {
        const overlay = handlers[index].renderOverlay?.(activeId);
        if (overlay) {
          return overlay;
        }
      }

      return null;
    },
    [getHandlers],
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
  const handlerIdRef = useRef(
    `global-dnd-${Math.random().toString(36).slice(2, 10)}`,
  );

  React.useEffect(() => {
    registerHandlers(handlerIdRef.current, handlers);

    return () => {
      registerHandlers(handlerIdRef.current, null);
    };
  }, [registerHandlers, handlers]);
}
