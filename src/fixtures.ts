import { test as base } from '@playwright/test';
import { MailpitClient } from './client';
import type { Message, MessagesSummary } from './types';

/** Configuration options for the mailpit fixture (set via playwright.config.ts `use` block). */
export interface MailpitFixtureOptions {
  /** Mailpit base URL. Default: "http://localhost:8025". */
  mailpitUrl: string;
  /** Basic auth credentials as "username:password". */
  mailpitBasicAuth: string | undefined;
  /** Custom headers for Mailpit API requests. */
  mailpitHeaders: Record<string, string>;
  /** Request timeout in ms. Default: 10000. */
  mailpitTimeout: number;
  /** Whether to delete all messages before each test. Default: false. */
  mailpitDeleteAllOnStart: boolean;
}

/** Options for waitForEmail. */
export interface WaitForEmailOptions {
  /** Mailpit search query (e.g., 'to:user@example.com subject:"Welcome"'). */
  query: string;
  /** Timeout in ms. Default: 30000. */
  timeout?: number;
  /** Poll interval in ms. Default: 500. */
  interval?: number;
  /** Minimum number of messages to wait for. Default: 1. */
  count?: number;
}

/** Options for waitForEmails. */
export interface WaitForEmailsOptions {
  /** Mailpit search query. */
  query: string;
  /** Number of messages to wait for. */
  count: number;
  /** Timeout in ms. Default: 30000. */
  timeout?: number;
  /** Poll interval in ms. Default: 500. */
  interval?: number;
}

/** Fixtures provided to tests. */
export interface MailpitFixture {
  /** The underlying MailpitClient instance for full API access. */
  mailpit: MailpitClient;
  /** Wait for an email matching the search query. Returns the first matching full message. */
  waitForEmail: (options: WaitForEmailOptions) => Promise<Message>;
  /** Wait for multiple emails matching the search query. Returns the summary when count is met. */
  waitForEmails: (options: WaitForEmailsOptions) => Promise<MessagesSummary>;
  /** Get the latest email, optionally filtered by search query. Does not poll. */
  getLatestEmail: (query?: string) => Promise<Message>;
  /** Delete all messages in Mailpit. */
  deleteAllEmails: () => Promise<void>;
  /** Search for emails matching the query. */
  searchEmails: (
    query: string,
    options?: { start?: number; limit?: number },
  ) => Promise<MessagesSummary>;
  /** Get a specific email by ID. */
  getEmail: (id: string) => Promise<Message>;
}

export const test = base.extend<MailpitFixture & MailpitFixtureOptions>({
  mailpitUrl: ['http://localhost:8025', { option: true }],
  mailpitBasicAuth: [undefined, { option: true }],
  mailpitHeaders: [{}, { option: true }],
  mailpitTimeout: [10_000, { option: true }],
  mailpitDeleteAllOnStart: [false, { option: true }],

  mailpit: async (
    { mailpitUrl, mailpitBasicAuth, mailpitHeaders, mailpitTimeout, mailpitDeleteAllOnStart },
    use,
  ) => {
    const client = new MailpitClient({
      url: mailpitUrl,
      basicAuth: mailpitBasicAuth,
      headers: mailpitHeaders,
      timeout: mailpitTimeout,
    });
    if (mailpitDeleteAllOnStart) {
      await client.deleteAllMessages();
    }
    await use(client);
  },

  waitForEmail: async ({ mailpit }, use) => {
    await use(async (options: WaitForEmailOptions) => {
      const { query, timeout = 30_000, interval = 500, count = 1 } = options;
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        const result = await mailpit.searchMessages(query);
        if (result.messages_count >= count && result.messages.length > 0) {
          return mailpit.getMessage(result.messages[0].ID);
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      throw new Error(`Timed out waiting for email matching "${query}" after ${timeout}ms`);
    });
  },

  waitForEmails: async ({ mailpit }, use) => {
    await use(async (options: WaitForEmailsOptions) => {
      const { query, count, timeout = 30_000, interval = 500 } = options;
      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        const result = await mailpit.searchMessages(query);
        if (result.messages_count >= count) {
          return result;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      throw new Error(
        `Timed out waiting for ${count} emails matching "${query}" after ${timeout}ms`,
      );
    });
  },

  getLatestEmail: async ({ mailpit }, use) => {
    await use(async (query?: string) => {
      if (query) {
        const result = await mailpit.searchMessages(query, 0, 1);
        if (result.messages.length === 0) {
          throw new Error(`No emails found matching "${query}"`);
        }
        return mailpit.getMessage(result.messages[0].ID);
      }
      return mailpit.getLatestMessage();
    });
  },

  deleteAllEmails: async ({ mailpit }, use) => {
    await use(async () => {
      await mailpit.deleteAllMessages();
    });
  },

  searchEmails: async ({ mailpit }, use) => {
    await use(async (query: string, options?: { start?: number; limit?: number }) => {
      return mailpit.searchMessages(query, options?.start, options?.limit);
    });
  },

  getEmail: async ({ mailpit }, use) => {
    await use(async (id: string) => {
      return mailpit.getMessage(id);
    });
  },
});

export { expect } from '@playwright/test';
