import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Database, RLS and storage tests against the local Supabase stack (`supabase start`).
export default defineConfig({
  resolve: {
    alias: {
      "@content": fileURLToPath(new URL("./content", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./supabase/tests/server-only.stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["supabase/tests/**/*.test.ts"],
    setupFiles: ["supabase/tests/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
