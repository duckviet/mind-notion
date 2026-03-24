import { useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";

export interface EditorSyncOptions {
  /** External content to sync into editor */
  content: string;
  /** Callback when editor content changes */
  onUpdate?: (content: string) => void;
  /** Skip both inbound and outbound sync (backward compatible escape hatch) */
  skip?: boolean;
  /** Skip outbound sync (editor -> parent) */
  skipOutbound?: boolean;
  /** Skip inbound sync (parent -> editor) */
  skipInbound?: boolean;
  /** Debounce ms for outbound updates. 0 = immediate */
  debounceMs?: number;
  /** How long after last user action to consider "active" */
  gracePeriodMs?: number;
  /** Content serializer — defaults to editor.getHTML() */
  serialize?: (editor: Editor) => string;
  /** How to push content into editor */
  deserialize?: (editor: Editor, content: string) => void;
}

interface SyncState {
  lastEmitted: string;
  lastUserActionAt: number;
}

const defaultSerialize = (editor: Editor) => editor.getHTML();

const defaultDeserialize = (editor: Editor, content: string) => {
  const { from, to } = editor.state.selection;
  editor.commands.setContent(content, { emitUpdate: false });

  try {
    const size = editor.state.doc.content.size;
    editor.commands.setTextSelection({
      from: Math.min(from, size),
      to: Math.min(to, size),
    });
  } catch {
    /* selection restore failed */
  }
};

export function useEditorSync(
  editor: Editor | null,
  {
    content,
    onUpdate,
    skip = false,
    skipOutbound = false,
    skipInbound = false,
    debounceMs = 300,
    gracePeriodMs = 500,
    serialize = defaultSerialize,
    deserialize = defaultDeserialize,
  }: EditorSyncOptions,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const serializeRef = useRef(serialize);
  serializeRef.current = serialize;

  const deserializeRef = useRef(deserialize);
  deserializeRef.current = deserialize;

  const state = useRef<SyncState>({
    lastEmitted: content,
    lastUserActionAt: 0,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUserActive = useCallback(
    () => Date.now() - state.current.lastUserActionAt < gracePeriodMs,
    [gracePeriodMs],
  );

  const shouldSkipOutbound = skip || skipOutbound;
  const shouldSkipInbound = skip || skipInbound;

  // --- Outbound: editor → parent ---
  useEffect(() => {
    if (!editor || shouldSkipOutbound) return;

    const emit = () => {
      if (editor.isDestroyed) return;
      const value = serializeRef.current(editor);
      if (value === state.current.lastEmitted) return;
      state.current.lastEmitted = value;
      onUpdateRef.current?.(value);
    };

    const handleUpdate = () => {
      state.current.lastUserActionAt = Date.now();
      if (debounceMs === 0) {
        emit();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(emit, debounceMs);
    };

    const handleFocus = () => {
      state.current.lastUserActionAt = Date.now();
    };

    editor.on("update", handleUpdate);
    editor.on("focus", handleFocus);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      editor.off("update", handleUpdate);
      editor.off("focus", handleFocus);
    };
  }, [editor, shouldSkipOutbound, debounceMs]);

  // --- Inbound: parent → editor ---
  useEffect(() => {
    if (!editor || shouldSkipInbound) return;
    if (content === state.current.lastEmitted) return;

    const tryApply = (): boolean => {
      if (editor.isDestroyed) return true;
      if (isUserActive()) return false;

      const current = serializeRef.current(editor);
      if (!content || current === content) return true;

      deserializeRef.current(editor, content);
      state.current.lastEmitted = content;
      return true;
    };

    if (tryApply()) return;

    const id = setInterval(() => {
      if (tryApply()) clearInterval(id);
    }, gracePeriodMs);

    return () => clearInterval(id);
  }, [editor, content, shouldSkipInbound, isUserActive, gracePeriodMs]);
}
