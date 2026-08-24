"use client";

import { toast as toastOriginal, Toaster as ToasterOriginal, type ToastT } from "sonner";

export type { ToastT };

export const Toaster = ToasterOriginal;
export const toast = toastOriginal;
export const useToast = () => toastOriginal;
