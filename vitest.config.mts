import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default to node environment for pure function tests
    environment: "node",
    // Use jsdom for React component tests (files matching *.test.tsx or *.spec.tsx)
    environmentMatchGlobs: [
      ["**/*.test.tsx", "jsdom"],
      ["**/*.spec.tsx", "jsdom"],
    ],
    // Setup file for testing library matchers
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});


