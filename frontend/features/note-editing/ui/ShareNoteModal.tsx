"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, Globe, Lock, RefreshCw } from "lucide-react";
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
  getPublicEditSettings,
  updatePublicEditSettings,
  rotatePublicEditToken,
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
  const [editCopied, setEditCopied] = useState(false);
  const [publicEditEnabled, setPublicEditEnabled] = useState(false);
  const [publicEditToken, setPublicEditToken] = useState("");
  const [isLoadingPublicEdit, setIsLoadingPublicEdit] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote({
    mutation: {
      onSuccess: () => {
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
  const editUrl = `${origin}/note/${noteId}/edit?token=${publicEditToken}`;

  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingPublicEdit(true);
    getPublicEditSettings(noteId)
      .then((res) => {
        setPublicEditEnabled(res.enabled);
        setPublicEditToken(res.token);
      })
      .catch(() => {
        toast.error("Failed to load public edit settings");
      })
      .finally(() => {
        setIsLoadingPublicEdit(false);
      });
  }, [isOpen, noteId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEdit = () => {
    navigator.clipboard.writeText(editUrl);
    setEditCopied(true);
    toast.success("Edit link copied to clipboard");
    setTimeout(() => setEditCopied(false), 2000);
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

  const handleTogglePublicEdit = async (checked: boolean) => {
    setIsLoadingPublicEdit(true);
    try {
      const res = await updatePublicEditSettings(noteId, { enabled: checked });
      setPublicEditEnabled(res.enabled);
      setPublicEditToken(res.token);
    } catch (error) {
      toast.error("Failed to update public edit settings");
      console.error(error);
    } finally {
      setIsLoadingPublicEdit(false);
    }
  };

  const handleRotateToken = async () => {
    setIsLoadingPublicEdit(true);
    try {
      const res = await rotatePublicEditToken(noteId);
      setPublicEditEnabled(res.enabled);
      setPublicEditToken(res.token);
      toast.success("Edit link regenerated");
    } catch (error) {
      toast.error("Failed to rotate edit token");
      console.error(error);
    } finally {
      setIsLoadingPublicEdit(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay />
      <DialogContent className="sm:max-w-md bg-surface border border-border z-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 " />
            Share to Web
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Public Access Section */}
          <div className="rounded-lg border border-border bg-accent/50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label
                  htmlFor="public-access-switch"
                  className="text-sm font-medium"
                >
                  Public Access
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone with the link can view"
                    : "Only you can access"}
                </p>
              </div>
              <Switch
                id="public-access-switch"
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isUpdating}
              />
            </div>

            {/* Public Link */}
            {isPublic && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <Label className="text-xs text-muted-foreground">
                  Public Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={publicUrl}
                    className=" font-mono text-xs h-9 select-all"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0 h-9 w-9"
                    onClick={handleCopy}
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Public Edit Section */}
          <div className="rounded-lg border border-border bg-accent/50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Public Edit</Label>
                <p className="text-xs text-muted-foreground">
                  {publicEditEnabled
                    ? "Anyone with edit link can collaborate"
                    : "Only you can edit"}
                </p>
              </div>
              <Switch
                checked={publicEditEnabled}
                onCheckedChange={handleTogglePublicEdit}
                disabled={isLoadingPublicEdit}
              />
            </div>

            {/* Edit Link */}
            {publicEditEnabled && publicEditToken && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Edit Link
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleRotateToken}
                    disabled={isLoadingPublicEdit}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={editUrl}
                    className=" font-mono text-xs h-9 select-all"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0 h-9 w-9"
                    onClick={handleCopyEdit}
                    title="Copy edit link"
                  >
                    {editCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
