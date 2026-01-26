import type * as Y from "yjs";
import type { Editor, Extensions } from "@tiptap/react";
import { generateJSON } from "@tiptap/html";
import { prosemirrorJSONToYXmlFragment } from "y-prosemirror";
import { Schema } from "@tiptap/pm/model";
import { getSchema } from "@tiptap/core";

const PROSEMIRROR_FRAGMENT = "default";

/**
 * Check if a Yjs doc's prosemirror fragment is empty
 */
export const isYDocEmpty = (doc: Y.Doc | null | undefined): boolean => {
  if (!doc) return true;
  const fragment = doc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  return fragment.length === 0;
};

/**
 * Check if editor content is effectively empty (only empty paragraph)
 */
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

/**
 * Hydrate HTML content into a Yjs doc's prosemirror fragment.
 * This should be called BEFORE the editor is created or when the doc is empty.
 */
export const hydrateYDocFromHtml = (
  doc: Y.Doc,
  html: string,
  extensions: Extensions,
): boolean => {
  if (!doc || !html) return false;

  const fragment = doc.getXmlFragment(PROSEMIRROR_FRAGMENT);
  if (fragment.length > 0) return false; // Already has content

  try {
    // Parse HTML to ProseMirror JSON
    const json = generateJSON(html, extensions);

    // Get schema from extensions
    const schema = getSchema(extensions);

    // Convert JSON to ProseMirror Node
    const node = schema.nodeFromJSON(json);

    // Convert to Yjs and apply to fragment
    doc.transact(() => {
      prosemirrorJSONToYXmlFragment(schema, json, fragment);
    });
    console.log("after hydrate", fragment);
    return true;
  } catch (err) {
    console.error("[collab-hydration] Failed to hydrate:", err);
    return false;
  }
};
