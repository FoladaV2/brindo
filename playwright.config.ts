import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// Runs against a production build. Build first with the styleguide enabled:
//   STYLEGUIDE_ENABLED=true npm run build && npm run test:e2e
export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  timeout: 90_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}/styleguide`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
