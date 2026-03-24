import { useCallback, useMemo } from "react";
import { AIMenuState } from "../types";
import { useOpenState } from "../../../hooks/useOpenState";
import { AISelectionContext } from "../Extensions/ExtAI/types";

type AIMenuData = Omit<AIMenuState, "isOpen">;

const INITIAL_DATA: AIMenuData = {
  selection: "",
  range: null,
  context: null,
};

export function useAIMenu() {
  const { state, open, close } = useOpenState<AIMenuData>(INITIAL_DATA);

  const openAIMenu = useCallback(
    (
      selection: string,
      range: { from: number; to: number },
      context: AISelectionContext,
    ) => {
      open({ selection, range, context });
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
      context: state.data.context,
    }),
    [state],
  );

  return { aiMenuState, openAIMenu, closeAIMenu };
}
