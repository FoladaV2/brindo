import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@content": fileURLToPath(new URL("./content", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Next resolves server-only itself; plain Node needs a stub to import server modules in tests.
      "server-only": fileURLToPath(new URL("./supabase/tests/server-only.stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
