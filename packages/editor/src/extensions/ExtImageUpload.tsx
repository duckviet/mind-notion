import { Extension } from "@tiptap/core";
import { EditorView } from "@tiptap/pm/view";
import { Plugin } from "@tiptap/pm/state";

interface ImageUploadOptions {
  uploadFn: (file: File) => Promise<string>;
  onUploadStart?: (file: File) => void;
  onUploadSuccess?: (file: File, url: string) => void;
  onUploadError?: (file: File, error: unknown) => void;
}

const ExtImageUpload = Extension.create<ImageUploadOptions>({
  name: "imageUpload",

  addOptions() {
    return {
      uploadFn: async () => "",
    };
  },

  addProseMirrorPlugins() {
    const { uploadFn, onUploadStart, onUploadSuccess, onUploadError } = this.options;

    const handleImageAction = async (view: EditorView, file: File) => {
      onUploadStart?.(file);

      try {
        const url = await uploadFn(file);

        const { schema, tr } = view.state;
        const type = schema.nodes.image;

        if (!type) return;

        const node = type.create({ src: url, alt: file.name });
        view.dispatch(tr.replaceSelectionWith(node).scrollIntoView());
        onUploadSuccess?.(file, url);
      } catch (error) {
        onUploadError?.(file, error);
      }
    };

    return [
      new Plugin({
        props: {
          handleDrop(view, event) {
            const files = Array.from(event.dataTransfer?.files ?? []);
            const imageFile = files.find((f) => f.type.startsWith("image/"));

            if (imageFile) {
              event.preventDefault();
              handleImageAction(view, imageFile);
              return true;
            }
            return false;
          },
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items ?? []);
            const imageItem = items.find((i) => i.type.startsWith("image/"));
            const file = imageItem?.getAsFile();

            if (file) {
              event.preventDefault();
              handleImageAction(view, file);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default ExtImageUpload;
