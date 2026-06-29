import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { isCollabSessionForNote } from "./collab-session-query";

describe("isCollabSessionForNote", () => {
  it("matches every cached collab session variant for a note", () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(["collab-session", "note-1", undefined], {
      content: "old",
    });
    queryClient.setQueryData(["collab-session", "note-1", "edit-token"], {
      content: "old",
    });
    queryClient.setQueryData(["collab-session", "note-2", undefined], {
      content: "other",
    });

    const queries = queryClient.getQueryCache().findAll();
    const matchingKeys = queries
      .filter((query) => isCollabSessionForNote(query, "note-1"))
      .map((query) => query.queryKey);

    expect(matchingKeys).toEqual([
      ["collab-session", "note-1", undefined],
      ["collab-session", "note-1", "edit-token"],
    ]);
  });
});
