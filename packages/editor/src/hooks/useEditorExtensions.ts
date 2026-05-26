import { useMemo, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extension-placeholder";
import {
  ExtCustomCodeBlock,
  ExtHeading,
  ExtImage,
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
  ExtAlign,
  ExtNoteLayout,
  createCollaborationExtensions,
  type NoteLayout,
} from "../extensions";
import { CollaborationConfig } from "../types";
import { AISelectionContext } from "../extensions/ExtAI/types";
import { useStableRef } from "./useStableRef";
import { readStoredNoteLayout } from "../extensions/ExtNoteLayout/layouts";

interface UseEditorExtensionsProps {
  noteId?: string;
  placeholder: string;
  collaboration?: CollaborationConfig;
  uploadMediaRef: React.RefObject<
    (args: { data: { file: File } }) => Promise<{ url: string }>
  >;
  drawingSyncUri?: string;
  onOpenAI: (
    selection: string,
    range: { from: number; to: number },
    context: AISelectionContext,
  ) => void;
}

export function useEditorExtensions({
  noteId,
  placeholder,
  collaboration,
  uploadMediaRef,
  drawingSyncUri = "",
  onOpenAI,
}: UseEditorExtensionsProps) {
  const [toc, setToc] = useState(false);

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
        syncUri: drawingSyncUri,
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
        onOpenAI: (
          selection: string,
          range: { from: number; to: number },
          context: AISelectionContext,
        ) => {
          onOpenAIRef.current(selection, range, context);
        },
      }),
      ExtProposedEdits,
      ExtAlign,
      ExtNoteLayout.configure({
        initialLayout: readStoredNoteLayout(noteId),
      }),
      // ExtAutoResize.configure({
      //   font: "16px Inter",
      //   lineHeight: 24,
      //   paddingY: 32,
      //   minLines: 3,
      //   maxLines: 40,
      // }),

      ...collabExtensions,
    ],
    [
      placeholder,
      collabExtensions,
      drawingSyncUri,
      // Refs below are stable — listed for exhaustive-deps compliance
      onOpenAIRef,
      setTocRef,
      tocRef,
      uploadMediaRef,
    ],
  );

  return { extensions, collabEnabled };
}
