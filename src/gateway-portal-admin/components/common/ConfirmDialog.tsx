"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function ConfirmDialog({
  title,
  description,
  trigger,
  confirmLabel = "Confirm",
  onConfirm,
  variant = "default",
}: {
  title: string;
  description?: string;
  trigger: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  variant?: "default" | "destructive";
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl",
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-2 text-sm text-muted-foreground">{description}</Dialog.Description> : null}
          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button
                type="button"
                className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
