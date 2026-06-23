"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type FormDialogProps = {
  title: string;
  description?: string;
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  submitLabel?: string;
  submitDisabled?: boolean;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function FormDialog({
  title,
  description,
  trigger,
  open,
  onOpenChange,
  children,
  submitLabel = "Save",
  submitDisabled,
  onSubmit,
}: FormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl",
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          {description ? <Dialog.Description className="mt-2 text-sm text-muted-foreground">{description}</Dialog.Description> : null}
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {children}
            <div className="flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={submitDisabled}>
                {submitLabel}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
