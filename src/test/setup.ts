import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Testing Library keeps rendered trees mounted between tests unless we clean them up.
// Clearing the DOM after each test prevents state leakage across hook renderings.
afterEach(() => {
  cleanup();
});
