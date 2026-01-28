import { Extension } from "@tiptap/core";

export interface AIOptions {
  /**
   * Callback function khi kích hoạt AI
   */
  onOpenAI: (selection: string, range: { from: number; to: number }) => void;
  /**
   * Các thuộc tính HTML tùy chỉnh (nếu cần)
   */
  HTMLAttributes: Record<string, any>;
}

// Khai báo module để hỗ trợ IntelliSense cho editor.commands
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ai: {
      /**
       * Mở giao diện AI với vùng văn bản đang chọn
       */
      openAI: () => ReturnType;
    };
  }
}

export const ExtAI = Extension.create<AIOptions>({
  name: "ai",

  addOptions() {
    return {
      onOpenAI: () => {},
      HTMLAttributes: {},
    };
  },

  addCommands() {
    return {
      openAI:
        () =>
        ({ state, editor }) => {
          const { selection, doc } = state;
          const { from, to } = selection;

          // Lấy text trong vùng chọn, nếu không có selection thì text sẽ trống
          const selectedText = doc.textBetween(from, to, " ");

          // Thực thi callback được truyền từ bên ngoài qua options
          if (this.options.onOpenAI) {
            this.options.onOpenAI(selectedText, { from, to });
            return true;
          }

          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Sử dụng alias command đã định nghĩa trong addCommands
      "Mod-j": () => this.editor.commands.openAI(),
    };
  },

  // Nếu bạn không xử lý logic phức tạp ở tầng thấp,
  // có thể lược bỏ addProseMirrorPlugins để code gọn hơn giống như ExtSplitView
});

export default ExtAI;
