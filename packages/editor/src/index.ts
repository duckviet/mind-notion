export { useActiveMark } from "./hooks/useActiveMark";
export { useBubbleMenuVisibility } from "./hooks/useBubbleMenuVisibility";
export { useEditorLifecycle } from "./hooks/useEditorLifecycle";
export { useEditorMarkRange } from "./hooks/useEditorMarkRange";
export { useEditorSync } from "./hooks/useEditorSync";
export type { EditorSyncOptions } from "./hooks/useEditorSync";

export { default as ExtHeading } from "./extensions/ExtHeading";
export { default as ExtHighLight } from "./extensions/ExtHighLight";
export { default as ExtBlockQuote } from "./extensions/ExtQuote";
export { default as ExtListKit } from "./extensions/ExtListKit";
export { default as ExtMathematics } from "./extensions/ExtMathematics";
export { default as ExtTaskListKit } from "./extensions/ExtTaskList";
export { default as ExtTableKit } from "./extensions/ExtTable";
export { default as ExtAutoResize } from "./extensions/ExtAutoResize/ExtAutoResize";
export { migrateMathStrings } from "./extensions/ExtMathematics";

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