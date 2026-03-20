import { useMemo } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions/placeholder";
import usePersistentState from "@/shared/hooks/usePersistentState/usePersistentState";
import { LocalStorageKeys } from "@/shared/configs/localStorageKeys";
import createCollaborationExtensions from "../Extensions/ExtCollaboration";
import ExtImage from "../Extensions/ExtImage/ExtImage";
import {
  ExtCustomCodeBlock,
  ExtHeading,
  ExtImageUpload,
  ExtListKit,
  ExtMathematics,
  ExtTableKit,
  ExtTableOfContents,
  ExtSplitView,
  SplitViewColumn,
  ExtBlockQuote,
  ExtHighLight,
  ExtAI,
  ExtLink,
  ExtComment,
  ExtTaskList,
  ExtDrawing,
  ExtProposedEdits,
} from "../Extensions";
import { useStableRef } from "./useStableRef";
import { CollaborationConfig } from "../types";

interface UseEditorExtensionsProps {
  placeholder: string;
  collaboration?: CollaborationConfig;
  uploadMediaRef: React.RefObject<
    (args: { data: { file: File } }) => Promise<{ url: string }>
  >;
  onOpenAI: (selection: string, range: { from: number; to: number }) => void;
}

export function useEditorExtensions({
  placeholder,
  collaboration,
  uploadMediaRef,
  onOpenAI,
}: UseEditorExtensionsProps) {
  const [toc, setToc] = usePersistentState(
    LocalStorageKeys.FOCUS_EDIT_TOC_COLLAPSED,
    false,
  );

  const tocRef = useStableRef(toc);
  const setTocRef = useStableRef(setToc);
  const onOpenAIRef = useStableRef(onOpenAI);

  const collabEnabled = Boolean(
    collaboration?.document && collaboration?.provider,
  );
  const collabDocument = collaboration?.document;
  const collabProvider = collaboration?.provider;

  const collabExtensions = useMemo(() => {
    if (!collabEnabled || !collabDocument || !collabProvider) return [];
    return createCollaborationExtensions(collabDocument, collabProvider);
  }, [collabEnabled, collabDocument, collabProvider]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        heading: false,
        link: false,
        blockquote: false,
        undoRedo: false,
      }),
      ...ExtListKit,
      ...ExtTaskList,
      ExtLink,
      ExtComment,
      ExtCustomCodeBlock,
      ExtHeading,
      ExtMathematics,
      ExtBlockQuote,
      ExtHighLight,
      ...ExtTableKit,
      ExtTableOfContents.configure({
        initialToc: tocRef.current ?? false,
        onToggle: (newTocValue: boolean) => setTocRef.current(newTocValue),
      }),
      Placeholder.configure({ placeholder }),
      ExtImage,
      ExtImageUpload.configure({
        uploadFn: async (file: File) => {
          const res = await uploadMediaRef.current({
            data: { file },
          });
          return res.url;
        },
      }),
      ExtDrawing.configure({
        syncUri: process.env.NEXT_PUBLIC_TLDRAW_SYNC_URL || "",
        uploadPreviewFn: async (file: File) => {
          const res = await uploadMediaRef.current({
            data: { file },
          });
          return res.url;
        },
      }),
      ExtSplitView,
      SplitViewColumn,
      ExtAI.configure({
        onOpenAI: (selection: string, range: { from: number; to: number }) => {
          onOpenAIRef.current(selection, range);
        },
      }),
      ExtProposedEdits,
      ...collabExtensions,
    ],
    [
      placeholder,
      collabExtensions,
      onOpenAIRef,
      setTocRef,
      tocRef,
      uploadMediaRef,
    ],
  );

  return { extensions, collabEnabled };
}
