import { useCallback, useState } from "react";
import { AIMenuState } from "../types";

const INITIAL_STATE: AIMenuState = {
  isOpen: false,
  selection: "",
  range: null,
};

export function useAIMenu() {
  const [aiMenuState, setAIMenuState] = useState<AIMenuState>(INITIAL_STATE);

  const openAIMenu = useCallback(
    (selection: string, range: { from: number; to: number }) => {
      setAIMenuState({ isOpen: true, selection, range });
    },
    [],
  );

  const closeAIMenu = useCallback(() => {
    setAIMenuState(INITIAL_STATE);
  }, []);

  return { aiMenuState, openAIMenu, closeAIMenu };
}
