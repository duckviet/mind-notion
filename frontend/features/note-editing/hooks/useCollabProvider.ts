import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { isYDocEmpty, hydrateYDocFromHtml } from "@/lib/collab-hydration";
import StarterKit from "@tiptap/starter-kit";

type CollabUser = {
  name: string;
  color: string;
};

type UseCollabProviderOptions = {
  noteId: string;
  token: string;
  enabled?: boolean;
  user?: CollabUser;
  initialHtml?: string;
};

const COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
];

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const getAnonymousName = () =>
  `Guest-${Math.random().toString(36).slice(2, 7)}`;

// Minimal extensions for HTML parsing (no need for full editor extensions)
const PARSE_EXTENSIONS = [StarterKit];

export const useCollabProvider = ({
  noteId,
  token,
  enabled = true,
  user,
  initialHtml,
}: UseCollabProviderOptions) => {
  const [isSynced, setIsSynced] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const initialHtmlRef = useRef<string | undefined>(initialHtml);
  const fallbackUserRef = useRef<CollabUser>({
    name: getAnonymousName(),
    color: getRandomColor(),
  });

  // Keep initialHtml ref updated
  useEffect(() => {
    initialHtmlRef.current = initialHtml;
  }, [initialHtml]);

  const collabUrl = useMemo(
    () => process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:1234",
    [],
  );

  useEffect(() => {
    if (!enabled || !noteId || !token) return;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(collabUrl, noteId, doc, {
      params: { token },
    });

    docRef.current = doc;
    providerRef.current = provider;
    setIsHydrated(false);

    const handleSync = (synced: boolean) => {
      setIsSynced(synced);

      // Hydrate on first sync if doc is empty and we have initial content
      if (synced && isYDocEmpty(doc) && initialHtmlRef.current) {
        const success = hydrateYDocFromHtml(
          doc,
          initialHtmlRef.current,
          PARSE_EXTENSIONS,
        );
        setIsHydrated(true);
        if (success) {
          console.log("[useCollabProvider] Hydrated Yjs doc from initial HTML");
        }
      } else if (synced) {
        setIsHydrated(true);
      }
    };

    provider.on("sync", handleSync);

    return () => {
      provider.off("sync", handleSync);
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      docRef.current = null;
      setIsSynced(false);
      setIsHydrated(false);
    };
  }, [enabled, noteId, token, collabUrl]);

  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;

    const resolvedUser = user ?? fallbackUserRef.current;
    provider.awareness.setLocalStateField("user", resolvedUser);
  }, [user, token]);

  return {
    doc: docRef.current,
    provider: providerRef.current,
    isSynced,
    isHydrated,
  };
};
