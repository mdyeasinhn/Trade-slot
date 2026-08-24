import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { webcrypto } from "node:crypto";

// `globals: false`, so Testing Library's auto-cleanup hook is not installed.
afterEach(() => {
  cleanup();
});

// jsdom does not always expose `crypto.randomUUID`, which `useSenderId` needs.
if (typeof globalThis.crypto?.randomUUID !== "function") {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
