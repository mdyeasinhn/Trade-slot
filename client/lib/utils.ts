import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSenderId(): string {
  return `web-${crypto.randomUUID()}`;
}

export function getOrCreateSenderId(): string {
  if (typeof window === "undefined") return generateSenderId();
  let senderId = localStorage.getItem("tradeslot_sender_id");
  if (!senderId) {
    senderId = generateSenderId();
    localStorage.setItem("tradeslot_sender_id", senderId);
  }
  return senderId;
}