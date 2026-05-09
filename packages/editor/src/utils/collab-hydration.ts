import type * as Y from "yjs";
import type { Editor, Extensions } from "@tiptap/react";
import { generateJSON } from "@tiptap/html";
import {
  prosemirrorJSONToYXmlFragment,
  yXmlFragmentToProsemirrorJSON,
} from "y-prosemirror";
import { getSchema } from "@tiptap/core";

const PROSEMIRROR_FRAGMENT = "default";

export const isYDocEmpty = (doc: Y.Doc | null | undefined): boolean => {
  if (!doc) return true;
  const fragment = doc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  if (fragment.length === 0) return true;

  try {
    const json = yXmlFragmentToProsemirrorJSON(fragment) as {
      content?: Array<{
        type?: string;
        content?: unknown[];
      }>;
    };

    if (!json.content || json.content.length === 0) return true;
    if (json.content.length === 1) {
      const node = json.content[0];
      if (
        node.type === "paragraph" &&
        (!node.content || node.content.length === 0)
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
};

export const isEditorContentEmpty = (editor: Editor | null): boolean => {
  if (!editor) return true;
  const json = editor.getJSON();
  if (!json.content || json.content.length === 0) return true;
  if (json.content.length === 1) {
    const node = json.content[0];
    if (
      node.type === "paragraph" &&
      (!node.content || node.content.length === 0)
    ) {
      return true;
    }
  }
  return false;
};

export const hydrateYDocFromHtml = (
  doc: Y.Doc,
  html: string,
  extensions: Extensions,
): boolean => {
  if (!doc || !html) return false;

  const fragment = doc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  if (!isYDocEmpty(doc)) return false;

  try {
    const json = generateJSON(html, extensions);
    const schema = getSchema(extensions);

    doc.transact(() => {
      if (fragment.length > 0) {
        fragment.delete(0, fragment.length);
      }
      prosemirrorJSONToYXmlFragment(schema, json, fragment);
    });
    return true;
  } catch (err) {
    console.error("[collab-hydration] Failed to hydrate:", err);
    return false;
  }
};