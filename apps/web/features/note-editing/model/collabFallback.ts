type CollabEditStateInput = {
  readonly collabEnabled: boolean;
  readonly isFallbackActive: boolean;
  readonly isHydrated: boolean;
};

type CollabEditState = {
  readonly activeCollaboration: boolean;
  readonly showEditor: boolean;
  readonly useFallbackContent: boolean;
};

type CollabEditorContentInput = {
  readonly content: string;
  readonly fallbackContent: string;
  readonly useFallbackContent: boolean;
};

export const resolveCollabEditState = ({
  collabEnabled,
  isFallbackActive,
  isHydrated,
}: CollabEditStateInput): CollabEditState => {
  const activeCollaboration = collabEnabled && !isFallbackActive;
  const showEditor = !activeCollaboration || isHydrated;

  return {
    activeCollaboration,
    showEditor,
    useFallbackContent: !activeCollaboration,
  };
};

export const resolveCollabEditorContent = ({
  content,
  fallbackContent,
  useFallbackContent,
}: CollabEditorContentInput): string =>
  useFallbackContent ? fallbackContent : content;
