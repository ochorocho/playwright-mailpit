export { MailpitClient, MailpitError } from './client';
export type { MailpitClientConfig } from './client';

export { test, expect } from './fixtures';
export type {
  MailpitFixture,
  MailpitFixtureOptions,
  WaitForEmailOptions,
  WaitForEmailsOptions,
} from './fixtures';

export { buildSearchQuery } from './helpers';
export type { SearchQueryOptions } from './helpers';

export type {
  Address,
  AppInformation,
  Attachment,
  ChaosTrigger,
  ChaosTriggers,
  DeleteMessagesRequest,
  HTMLCheckResponse,
  HTMLCheckResult,
  HTMLCheckScore,
  HTMLCheckTotal,
  HTMLCheckWarning,
  Link,
  LinkCheckResponse,
  ListUnsubscribe,
  Message,
  MessageHeaders,
  MessageRelayConfig,
  MessageSummary,
  MessagesSummary,
  ReleaseMessageRequest,
  RenameTagRequest,
  RuntimeStats,
  SendAttachment,
  SendRecipient,
  SendRequest,
  SendResponse,
  SetReadStatusRequest,
  SetTagsRequest,
  SpamAssassinResponse,
  SpamAssassinRule,
  WebUIConfiguration,
} from './types';
