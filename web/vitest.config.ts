import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    // Handles React JSX transform for test files (React Compiler is a build-time
    // optimisation handled by Next.js — not needed in the test environment)
    react(),
  ],
  resolve: {
    // Resolves @/* path aliases from tsconfig.json natively
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Run the jest-dom matchers setup before each test file
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
    // Exclude Next.js build output and node_modules
    exclude: ["node_modules", ".next", "**/*.e2e.*"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/tests/**",
        "src/**/*.d.ts",
        // Next.js specific files that are not worth unit testing
        "src/app/layout.tsx",
        "src/app/globals.css",
      ],
    },
  },
});
