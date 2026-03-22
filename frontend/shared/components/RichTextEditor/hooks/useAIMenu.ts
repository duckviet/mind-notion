import { useCallback, useMemo } from "react";
import { AIMenuState } from "../types";
import { useOpenState } from "./useOpenState";

type AIMenuData = Omit<AIMenuState, "isOpen">;

const INITIAL_DATA: AIMenuData = {
  selection: "",
  range: null,
};

export function useAIMenu() {
  const { state, open, close } = useOpenState<AIMenuData>(INITIAL_DATA);

  const openAIMenu = useCallback(
    (selection: string, range: { from: number; to: number }) => {
      open({ selection, range });
    },
    [open],
  );

  const closeAIMenu = useCallback(() => {
    close();
  }, [close]);

  const aiMenuState = useMemo<AIMenuState>(
    () => ({
      isOpen: state.isOpen,
      selection: state.data.selection,
      range: state.data.range,
    }),
    [state],
  );

  return { aiMenuState, openAIMenu, closeAIMenu };
}
