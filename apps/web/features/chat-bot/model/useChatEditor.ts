import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions/placeholder";
import { useEditorSync } from "@/shared/hooks/useEditorSync";
import { useEditorLifecycle } from "@/shared/hooks/useEditorLifecycle";

export function useChatEditor({
  content = "",
  onUpdate,
  editable = true,
}: {
  content?: string;
  onUpdate?: (content: string) => void;
  editable?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type a message..." }),
    ],
    content,
    immediatelyRender: false,
  });

  useEditorLifecycle(editor, { editable });
  useEditorSync(editor, { content, onUpdate, debounceMs: 150 });

  return editor;
}
