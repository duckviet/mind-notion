"use client";

import React, { useState } from "react";
import { Check, Copy, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  useUpdateNote,
  getGetNoteQueryKey,
} from "@/shared/services/generated/api";

interface ShareNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  isPublic: boolean;
  title: string;
}

export function ShareNoteModal({
  isOpen,
  onClose,
  noteId,
  isPublic,
  title,
}: ShareNoteModalProps) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote({
    mutation: {
      onSuccess: () => {
        // Invalidate note query to refresh data
        queryClient.invalidateQueries({ queryKey: getGetNoteQueryKey(noteId) });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      },
      onError: (error) => {
        toast.error("Failed to update share settings");
        console.error(error);
      },
    },
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/note/${noteId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = (checked: boolean) => {
    updateNote({
      noteId,
      data: {
        id: noteId,
        is_public: checked,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay />
      <DialogContent className="sm:max-w-md z-100 bg-accent  border border-border">
        <DialogHeader>
          <DialogTitle>Share to Web</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Header section with icon and description */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full ${isPublic ? " -50 text-text-primary" : " -50 text-text-primary"}`}
            >
              {isPublic ? (
                <Globe className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="public-access-switch"
                  className="text-base font-medium"
                >
                  Public Access
                </Label>
                <Switch
                  id="public-access-switch"
                  className="border border-border"
                  checked={isPublic}
                  onCheckedChange={handleTogglePublic}
                  disabled={isUpdating}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? "Anyone with the link can view this note."
                  : "Only you can access this note."}
              </p>
            </div>
          </div>

          {/* Link section (only valid if public) */}
          {isPublic && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Public Link
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={publicUrl}
                  className="bg-muted/50 font-mono text-sm h-10 select-all"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0 h-10 w-10"
                  onClick={handleCopy}
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy link</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button className="hover:bg-foreground/40" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
