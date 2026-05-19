export { useActiveMark } from "./hooks/useActiveMark";
export { useBubbleMenuVisibility } from "./hooks/useBubbleMenuVisibility";
export { useEditorLifecycle } from "./hooks/useEditorLifecycle";
export { useEditorMarkRange } from "./hooks/useEditorMarkRange";
export { useEditorSync } from "./hooks/useEditorSync";
export { useFloatingElement } from "./hooks/useFloatingElement";
export { useIsMobile } from "./hooks/useMobile";
export { useStableRef } from "./hooks/useStableRef";
export { useCurrentTiptapEditor } from "./hooks/useTiptapEditor";
export { useTiptapEditor } from "./hooks/useRichTextEditor";
export type { CollaborationConfig, UseTiptapEditorProps } from "./types";
export type { FloatingElementReturn } from "./hooks/useFloatingElement";
export type { EditorSyncOptions } from "./hooks/useEditorSync";
export { cn } from "./utils/cn";
export { sanitizeHtml } from "./utils/sanitizeHtml";
export {
	isYDocEmpty,
	isEditorContentEmpty,
	hydrateYDocFromHtml,
} from "./utils/collab-hydration";

export { default as ExtHeading } from "./extensions/ExtHeading";
export { default as ExtHighLight } from "./extensions/ExtHighLight";
export { default as ExtBlockQuote } from "./extensions/ExtQuote";
export { default as ExtListKit } from "./extensions/ExtListKit";
export { default as ExtMathematics } from "./extensions/ExtMathematics";
export { default as ExtTaskListKit } from "./extensions/ExtTaskList";
export { default as ExtTableKit } from "./extensions/ExtTable";
export { default as ExtAutoResize } from "./extensions/ExtAutoResize/ExtAutoResize";
export { default as ExtLink } from "./extensions/ExtLink";
export { default as ExtTableOfContents } from "./extensions/ExtTableOfContents";
export { default as createCollaborationExtensions } from "./extensions/ExtCollaboration";
export { migrateMathStrings } from "./extensions/ExtMathematics";

// New Exports
export { default as ExtAlign } from "./extensions/ExtAlign";
export { default as ExtImage } from "./extensions/ExtImage/ExtImage";
export { default as ExtSplitView, SplitViewColumn } from "./extensions/ExtSplitView/ExtSplitView";
export { default as ExtImageUpload } from "./extensions/ExtImageUpload";
export { default as RichTextEditor } from "./components/RichTextEditor/RichTextEditor";
export type { RichTextEditorProps } from "./components/RichTextEditor/RichTextEditor";
export { TableOfContents } from "./components/TableOfContents/TableOfContents";
export { default as ExtCustomCodeBlock } from "./extensions/ExtCodeBlock";
export { default as ExtComment } from "./extensions/ExtComment/ExtComment";
export { default as CommentHoverPopup } from "./extensions/ExtComment/CommentPopup";
export { default as ExtAI } from "./extensions/ExtAI";
export { AIMenu } from "./extensions/ExtAI";
export type { AIAction, AISelectionContext } from "./extensions/ExtAI/types";
export { default as ExtDrawing } from "./extensions/ExtDrawing";
export { default as ExtProposedEdits } from "./extensions/ExtProposedEdits";
export { ExtNoteLayout, NoteLayoutPicker, useNoteLayout } from "./extensions/ExtNoteLayout";
export type { NoteLayout } from "./extensions/ExtNoteLayout";
export { getHeaderToolbarConfigs, getBubbleToolbarConfigs, getSplashMenuToolbarConfigs } from "./components/Toolbar/ToolbarConfig";
export { Toolbar } from "./components/Toolbar/Toolbar";
export { default as ToolbarButton } from "./components/Toolbar/ToolbarButton";
export * from "./components/Toolbar/types";
export { default as ResizableMediaContainer } from "./extensions/ExtImage/ResizableMediaContainer";
export type { ResizeDimensions, ResizeResult } from "./extensions/ExtImage/ResizableMediaContainer";

// New Exports Phase 2
export { PopupContainer, IconButton, Divider } from "./components/PopupContainer";
export { default as SharedBubbleMenu } from "./components/BubbleMenu/SharedBubbleMenu";
export { default as LinkHoverPopup } from "./components/BubbleMenu/LinkHoverPopup";
export { useHoverPopup } from "./hooks/useHoverPopup";
export { useMarkHoverPopup } from "./hooks/useMarkHoverPopup";

export {
	TIPTAP_COLLAB_DOC_PREFIX,
	TIPTAP_COLLAB_APP_ID,
	TIPTAP_COLLAB_TOKEN,
	TIPTAP_AI_APP_ID,
	TIPTAP_AI_TOKEN,
	USE_JWT_TOKEN_API_ENDPOINT,
	getUrlParam,
	getNodeDisplayName,
	removeEmptyParagraphs,
	getElementOverflowPosition,
	isSelectionValid,
	isTextSelectionValid,
	getSelectionBoundingRect,
	getAvatar,
	fetchCollabToken,
	fetchAiToken,
} from "./utils/tiptap-collab-utils";
export type { OverflowPosition } from "./utils/tiptap-collab-utils";
