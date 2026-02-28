import { defineConfig } from '@playwright/test';

const mailpitUrl = process.env.MAILPIT_URL ?? 'http://localhost:8026';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    mailpitUrl,
    mailpitDeleteAllOnStart: true,
  } as Record<string, unknown>,
  // In CI, Mailpit runs as a GitHub Actions service — no need for webServer.
  // Locally, docker compose starts Mailpit on the configured port.
  ...(process.env.CI
    ? {}
    : {
        webServer: {
          command: 'docker compose up mailpit',
          url: mailpitUrl,
          reuseExistingServer: true,
          timeout: 30_000,
        },
      }),
});
