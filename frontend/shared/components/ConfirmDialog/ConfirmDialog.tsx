import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button, type buttonVariants } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useModal } from "@/shared/contexts/ModalContext";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: NonNullable<Parameters<typeof buttonVariants>[0]>["variant"];
  isConfirming?: boolean;
  onConfirm: () => Promise<void> | void;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  isConfirming,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const { openModal, closeModal } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loading = useMemo(
    () => isConfirming ?? isSubmitting,
    [isConfirming, isSubmitting]
  );

  useEffect(() => {
    if (!open) return;
    openModal();
    return () => closeModal();
  }, [open, openModal, closeModal]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsSubmitting(false);
    }
    onOpenChange?.(nextOpen);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (error) {
      // Keep dialog open so user can retry when confirm handler fails
      console.error("Confirm dialog action failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm bg-white border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-500 text-white"
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
