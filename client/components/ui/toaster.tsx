"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport>
        <Toast>
          <div className="grid gap-1">
            <ToastTitle className="font-semibold">Title</ToastTitle>
            <ToastDescription className="text-muted-foreground">Description</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      </ToastViewport>
    </ToastProvider>
  );
}