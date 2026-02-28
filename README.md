# playwright-mailpit

Playwright fixtures for testing emails with [Mailpit](https://mailpit.axllent.org/).

Provides a `mailpit` fixture and convenience helpers (`waitForEmail`, `searchEmails`, etc.) for Playwright tests, plus a standalone `MailpitClient` that works without Playwright.

## Installation

This package is published to the [GitHub npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry). You need to configure the `@ochorocho` scope before installing.

### 1. Authenticate with GitHub Packages

Create a [personal access token](https://github.com/settings/tokens) (classic) with the `read:packages` scope, then log in:

```bash
npm login --scope=@ochorocho --registry=https://npm.pkg.github.com
```

When prompted, enter your GitHub username and use the token as your password.

Alternatively, add the token directly to your project's `.npmrc`:

```
@ochorocho:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

> **Tip:** For CI environments, set the token via the `NODE_AUTH_TOKEN` environment variable instead of hardcoding it:
>
> ```
> @ochorocho:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
> ```

### 2. Install the package

```bash
npm install @ochorocho/playwright-mailpit
```

`@playwright/test` is an optional peer dependency — only required if you use the Playwright fixtures.

## Quick Start

```typescript
// tests/e2e/my-test.spec.ts
import { test, expect } from '@ochorocho/playwright-mailpit';

test('user receives welcome email', async ({ page, mailpit, waitForEmail }) => {
  // Trigger an email via your app
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');

  // Wait for the email to arrive in Mailpit
  const email = await waitForEmail({
    query: 'to:test@example.com subject:Welcome',
    timeout: 10_000,
  });

  expect(email.Subject).toBe('Welcome');
  expect(email.HTML).toContain('Thank you for registering');
});
```

## Configuration

Configure the Mailpit connection in `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    mailpitUrl: 'http://localhost:8025',
    mailpitBasicAuth: undefined, // "user:pass" for basic auth
    mailpitHeaders: {}, // custom headers
    mailpitTimeout: 10_000, // request timeout (ms)
    mailpitDeleteAllOnStart: true, // clear mailbox before each test
  },
});
```

## Fixtures

### `mailpit`

The `MailpitClient` instance with full access to all Mailpit API v1 endpoints:

```typescript
test('example', async ({ mailpit }) => {
  const info = await mailpit.getAppInformation();
  const messages = await mailpit.getMessages();
  const msg = await mailpit.getMessage('some-id');
  await mailpit.sendMessage({
    From: { Email: 'a@b.com' },
    To: [{ Email: 'c@d.com' }],
    Subject: 'Hi',
    Text: 'Hello',
  });
  await mailpit.deleteAllMessages();
  // ... and many more
});
```

### `waitForEmail(options)`

Polls the search endpoint until a matching email arrives. Returns the full `Message` object.

```typescript
const email = await waitForEmail({
  query: 'to:user@example.com', // Mailpit search syntax
  timeout: 30_000, // default: 30s
  interval: 500, // poll interval, default: 500ms
  count: 1, // minimum matches, default: 1
});
```

### `waitForEmails(options)`

Like `waitForEmail` but waits for multiple emails and returns `MessagesSummary`.

```typescript
const result = await waitForEmails({
  query: 'to:user@example.com',
  count: 3,
  timeout: 30_000,
});
```

### `getLatestEmail(query?)`

Get the latest email, optionally filtered. Does not poll.

```typescript
const latest = await getLatestEmail();
const filtered = await getLatestEmail('from:noreply@app.com');
```

### `deleteAllEmails()`

Delete all messages in Mailpit.

### `searchEmails(query, options?)`

Search for emails. Returns `MessagesSummary`.

### `getEmail(id)`

Get a specific email by ID. Returns the full `Message`.

## Standalone Client

Use the client without Playwright:

```typescript
import { MailpitClient } from '@ochorocho/playwright-mailpit/client';

const client = new MailpitClient({ url: 'http://localhost:8025' });
const messages = await client.getMessages();
```

## Search Query Builder

Build search queries programmatically:

```typescript
import { buildSearchQuery } from '@ochorocho/playwright-mailpit';

const query = buildSearchQuery({
  to: 'user@example.com',
  subject: 'Welcome Email',
  is: ['unread'],
  has: ['attachment'],
});
// Returns: 'to:user@example.com subject:"Welcome Email" is:unread has:attachment'
```

## API Coverage

The client covers all Mailpit API v1 endpoints:

| Category    | Methods                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| App         | `getAppInformation()`, `getWebUIConfiguration()`                                                                    |
| Messages    | `getMessages()`, `getMessage()`, `getLatestMessage()`, `deleteMessages()`, `deleteAllMessages()`, `setReadStatus()` |
| Search      | `searchMessages()`, `deleteMessagesBySearch()`                                                                      |
| Send        | `sendMessage()`                                                                                                     |
| Tags        | `getTags()`, `setMessageTags()`, `renameTag()`, `deleteTag()`                                                       |
| Headers     | `getMessageHeaders()`, `getRawMessage()`                                                                            |
| Attachments | `getAttachment()`, `getAttachmentThumbnail()`                                                                       |
| Analysis    | `checkHTML()`, `checkLinks()`, `checkSpamAssassin()`                                                                |
| Release     | `releaseMessage()`                                                                                                  |
| Chaos       | `getChaosTriggers()`, `setChaosTriggers()`                                                                          |
| Views       | `getRenderedHTML()`, `getRenderedText()`                                                                            |

## Development

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Start Mailpit for e2e tests
docker compose up -d

# Run e2e tests
npm run test:e2e

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint
```

## License

MIT
