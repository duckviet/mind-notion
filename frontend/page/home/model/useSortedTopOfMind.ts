import { useMemo } from "react";
import { ListNotesTOMQueryResult } from "@/shared/services/generated/api";

export function useSortedTopOfMind(
  topOfMindNotesData: ListNotesTOMQueryResult | undefined,
) {
  return useMemo(() => {
    return [...(topOfMindNotesData ?? [])].sort((a, b) => {
      const orderA = a.top_of_mind ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.top_of_mind ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  }, [topOfMindNotesData]);
}
