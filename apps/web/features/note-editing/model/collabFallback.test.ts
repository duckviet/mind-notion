import { describe, expect, it } from "vitest";

import {
  resolveCollabEditState,
  resolveCollabEditorContent,
} from "./collabFallback";

describe("resolveCollabEditState", () => {
  it("shows fallback editor when collaboration is requested but offline fallback activates", () => {
    const result = resolveCollabEditState({
      collabEnabled: true,
      isFallbackActive: true,
      isHydrated: false,
    });

    expect(result).toEqual({
      activeCollaboration: false,
      showEditor: true,
      useFallbackContent: true,
    });
  });

  it("uses non-collab content mode when token is missing or fallback is empty", () => {
    const withoutToken = resolveCollabEditState({
      collabEnabled: false,
      isFallbackActive: false,
      isHydrated: false,
    });

    const emptyFallback = resolveCollabEditState({
      collabEnabled: true,
      isFallbackActive: true,
      isHydrated: false,
    });

    expect(withoutToken.showEditor).toBe(true);
    expect(withoutToken.useFallbackContent).toBe(true);
    expect(emptyFallback.showEditor).toBe(true);
    expect(emptyFallback.useFallbackContent).toBe(true);
  });

  it("keeps collaboration active after remote hydration succeeds", () => {
    const result = resolveCollabEditState({
      collabEnabled: true,
      isFallbackActive: false,
      isHydrated: true,
    });

    expect(result).toEqual({
      activeCollaboration: true,
      showEditor: true,
      useFallbackContent: false,
    });
  });

  it("keeps fallback content active after offline fallback has already rendered", () => {
    const result = resolveCollabEditState({
      collabEnabled: true,
      isFallbackActive: true,
      isHydrated: true,
    });

    expect(result.activeCollaboration).toBe(false);
    expect(result.showEditor).toBe(true);
    expect(result.useFallbackContent).toBe(true);
  });

  it("selects sanitized content when fallback content mode is active", () => {
    const result = resolveCollabEditorContent({
      content: '<p>Safe</p><script>alert("bad")</script>',
      fallbackContent: "<p>Safe</p>",
      useFallbackContent: true,
    });

    expect(result).toBe("<p>Safe</p>");
  });
});
