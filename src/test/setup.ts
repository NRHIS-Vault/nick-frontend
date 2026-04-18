import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library keeps rendered trees mounted between tests unless we clean them up.
// Clearing the DOM after each test prevents state leakage across hook renderings.
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (typeof globalThis.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe() {
      return undefined;
    }

    unobserve() {
      return undefined;
    }

    disconnect() {
      return undefined;
    }
  }

  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}
