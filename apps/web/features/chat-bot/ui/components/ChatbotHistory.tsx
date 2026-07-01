import {
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
  Search,
  Lightbulb,
  List,
  Layers,
  MessageSquare,
  Send,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/shared/utils/cn";
import type { ChatbotConversation } from "../../model/use-chatbot";
import { MindNotionAi } from "@/shared/assets";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ModalProvider } from "@/shared/contexts/ModalContext";
import { ChatbotComposer } from "./ChatbotComposer";

type ChatbotListViewProps = {
  conversations: ChatbotConversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  onNew: () => void;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
  onClose: () => void;
  onStartChat: (prompt: string) => void;
  onPinNote?: (note: { id: string; title: string; content?: string; type?: "note" | "folder" }) => void;
};

const SUGGESTIONS = [
  {
    text: "note này nói về gì?",
    icon: Search,
    colorClass: "text-[#3b82f6] bg-blue-50 dark:bg-blue-950/30",
  },
  {
    text: "Why is Redis so fast?",
    icon: Lightbulb,
    colorClass: "text-[#eab308] bg-yellow-50 dark:bg-yellow-950/30",
  },
  {
    text: "liệt kê ra thêm các thuật toán DSA ...",
    icon: List,
    colorClass: "text-[#10b981] bg-green-50 dark:bg-green-950/30",
  },
  {
    text: "có những architecture nổi tiếng nà...",
    icon: Layers,
    colorClass: "text-[#8b5cf6] bg-purple-50 dark:bg-purple-950/30",
  },
];

export function ChatbotListView({
  conversations,
  activeConversationId,
  isLoading,
  isStreaming,
  onNew,
  onSelect,
  onRename,
  onDelete,
  onClose,
  onStartChat,
  onPinNote,
}: ChatbotListViewProps) {
  const [inputValue, setInputValue] = useState("");

  // Rename Modal State
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Delete Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRenameSubmit = async () => {
    if (!renameTargetId || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      await onRename(renameTargetId, renameValue.trim());
      setRenameTargetId(null);
      setRenameValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onStartChat(trimmed);
    setInputValue("");
  };

  return (
    <ModalProvider>
      <div className="h-full flex flex-col bg-sidebar">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border/60 shrink-0">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl border border-sidebar-border/50 bg-surface">
            <MindNotionAi className="rounded-lg dark:text-white" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-tight">
              Maind
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 font-normal">
              Trợ lý ghi chú của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onNew}
            disabled={isStreaming}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-text-muted hover:text-text-primary transition-all disabled:opacity-50 cursor-pointer"
            title="New Chat"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-text-muted hover:text-text-primary transition-all cursor-pointer"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Visual Identity Mascot */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center select-none relative group transition-transform duration-300 hover:scale-105">
              <MindNotionAi className="rounded-lg text-text-primary size-10" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary leading-tight">
                Hỏi Maind về ghi chú
              </h3>
              <p className="text-xs text-text-muted mt-0.5 font-normal">
                Hỏi bất kỳ điều gì hoặc chọn các gợi ý bên dưới
              </p>
            </div>
          </div>

          {/* Section: Suggestions */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold tracking-wider text-text-muted/80 uppercase px-1">
              Gợi ý cho bạn
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {SUGGESTIONS.map((suggestion, idx) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onStartChat(suggestion.text)}
                    disabled={isStreaming}
                    className="flex items-center gap-3 w-full rounded-2xl border border-border/30 bg-surface-50/30 p-3 text-left transition-all hover:bg-surface-50/80 hover:border-border/60 hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", suggestion.colorClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-text-primary leading-tight line-clamp-2">
                      {suggestion.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Recent Chats */}
          {conversations.length > 0 && (
            <div className="space-y-2.5 pb-2">
              <p className="text-[11px] font-bold tracking-wider text-text-muted/80 uppercase px-1">
                Hội thoại gần đây
              </p>
              <div className="space-y-2">
                {isLoading && (
                  <p className="px-2 py-1 text-xs text-text-muted">Loading…</p>
                )}
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-2xl border border-border/30 bg-surface-50/30 p-2.5 cursor-pointer transition-all hover:bg-surface-50/80 hover:border-border/60",
                        isActive && "bg-surface-50 border-border/60",
                      )}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-text-muted">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelect(conversation.id)}
                        disabled={isStreaming}
                        className="min-w-0 flex-1 truncate text-left text-xs font-medium text-text-primary disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        title={conversation.title}
                      >
                        {conversation.title}
                      </button>

                      <button
                        type="button"
                        title="Rename"
                        onClick={() => {
                          setRenameTargetId(conversation.id);
                          setRenameValue(conversation.title);
                        }}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted opacity-0 hover:bg-background group-hover:opacity-100 hover:text-text-primary transition-all cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        onClick={() => {
                          setDeleteTargetId(conversation.id);
                        }}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted opacity-0 hover:bg-background group-hover:opacity-100 hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <ChatbotComposer
          quickPrompts={[]}
          inputValue={inputValue}
          setInputValue={setInputValue}
          isStreaming={isStreaming}
          streamError={null}
          pendingConsent={null}
          isSubmittingConsent={false}
          hasActivePinnedNote={false}
          onSend={async () => handleSend()}
          onApproveConsent={() => {}}
          onDenyConsent={() => {}}
          onPinNote={onPinNote}
        />

        {/* Rename Dialog */}
        <Dialog
          open={!!renameTargetId}
          onOpenChange={(open) => {
            if (!open) {
              setRenameTargetId(null);
              setRenameValue("");
            }
          }}
        >
          <DialogContent className="border border-border bg-surface-elevated sm:max-w-100">
            <DialogHeader>
              <DialogTitle>Đổi tên cuộc hội thoại</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label
                  htmlFor="chat-name"
                  className="text-sm font-medium text-text-primary"
                >
                  Tên mới
                </label>
                <Input
                  id="chat-name"
                  type="text"
                  placeholder="Nhập tên mới cho cuộc hội thoại"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && renameValue.trim()) {
                      await handleRenameSubmit();
                    }
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:ring-2 focus:ring-ring/20 bg-background"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTargetId(null)}>
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleRenameSubmit}
                disabled={!renameValue.trim() || isRenaming}
              >
                {isRenaming ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <ConfirmDialog
          open={!!deleteTargetId}
          onOpenChange={(open) => !open && setDeleteTargetId(null)}
          onConfirm={handleDeleteConfirm}
          title="Xóa cuộc hội thoại"
          description="Bạn có chắc chắn muốn xóa cuộc hội thoại này? Thao tác này không thể hoàn tác."
          confirmLabel={isDeleting ? "Đang xóa..." : "Xóa"}
          cancelLabel="Hủy"
          isConfirming={isDeleting}
          confirmVariant="destructive"
        />
      </div>
    </ModalProvider>
  );
}

export { ChatbotListView as ChatbotHistory };
