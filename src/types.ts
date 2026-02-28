/** Email address with optional display name. */
export interface Address {
  Name: string;
  Address: string;
}

/** Message summary returned in list/search endpoints. */
export interface MessageSummary {
  ID: string;
  MessageID: string;
  From: Address;
  To: Address[];
  Cc: Address[];
  Bcc: Address[];
  ReplyTo: Address[];
  Subject: string;
  Created: string;
  Size: number;
  Read: boolean;
  Tags: string[];
  Username: string;
  Snippet: string;
  /** Attachment count (number in summary, not full attachment objects). */
  Attachments: number;
}

/** File attachment metadata. */
export interface Attachment {
  PartID: string;
  FileName: string;
  ContentType: string;
  ContentID: string;
  Size: number;
  Checksums: {
    MD5: string;
    SHA1: string;
    SHA256: string;
  };
}

/** List-Unsubscribe header details. */
export interface ListUnsubscribe {
  Header: string;
  HeaderPost: string;
  Links: string[];
  Errors: string;
}

/** Full message returned by getMessage endpoint. */
export interface Message {
  ID: string;
  MessageID: string;
  From: Address;
  To: Address[];
  Cc: Address[];
  Bcc: Address[];
  ReplyTo: Address[];
  Subject: string;
  Date: string;
  Size: number;
  Read: boolean;
  Tags: string[];
  Text: string;
  HTML: string;
  Attachments: Attachment[];
  Inline: Attachment[];
  ReturnPath: string;
  ListUnsubscribe: ListUnsubscribe;
}

/** Paginated message list response. */
export interface MessagesSummary {
  messages: MessageSummary[];
  messages_count: number;
  messages_unread: number;
  start: number;
  total: number;
  unread: number;
  tags: string[];
}

/** Server runtime statistics. */
export interface RuntimeStats {
  Uptime: number;
  Memory: number;
  SMTPAccepted: number;
  SMTPAcceptedSize: number;
  SMTPRejected: number;
  SMTPIgnored: number;
  MessagesDeleted: number;
}

/** Application information returned by GET /api/v1/info. */
export interface AppInformation {
  Version: string;
  LatestVersion: string;
  Database: string;
  DatabaseSize: number;
  Messages: number;
  Unread: number;
  Tags: Record<string, number>;
  RuntimeStats: RuntimeStats;
}

/** Message relay configuration. */
export interface MessageRelayConfig {
  Enabled: boolean;
  SMTPServer: string;
  AllowedRecipients: string;
  BlockedRecipients: string;
  OverrideFrom: string;
  ReturnPath: string;
  PreserveMessageIDs: boolean;
}

/** Web UI configuration returned by GET /api/v1/webui. */
export interface WebUIConfiguration {
  Label: string;
  ChaosEnabled: boolean;
  SpamAssassin: boolean;
  DuplicatesIgnored: boolean;
  HideDeleteAllButton: boolean;
  MessageRelay: MessageRelayConfig;
}

/** Request body for PUT /api/v1/messages (set read status). */
export interface SetReadStatusRequest {
  IDs: string[];
  Read: boolean;
  Search?: string;
}

/** Request body for DELETE /api/v1/messages. */
export interface DeleteMessagesRequest {
  IDs: string[];
}

/** Request body for POST /api/v1/message/{ID}/release. */
export interface ReleaseMessageRequest {
  To: string[];
}

/** Request body for PUT /api/v1/tags. */
export interface SetTagsRequest {
  Tags: string[];
  IDs: string[];
}

/** Request body for PUT /api/v1/tags/{Tag}. */
export interface RenameTagRequest {
  Name: string;
}

/** Email recipient for send requests. */
export interface SendRecipient {
  Email: string;
  Name?: string;
}

/** Attachment for send requests. */
export interface SendAttachment {
  Filename: string;
  /** Base64-encoded file content. */
  Content: string;
  ContentType?: string;
  ContentID?: string;
}

/** Request body for POST /api/v1/send. */
export interface SendRequest {
  From: SendRecipient;
  To: SendRecipient[];
  Cc?: SendRecipient[];
  /** BCC recipients (plain email address strings). */
  Bcc?: string[];
  ReplyTo?: SendRecipient[];
  Subject?: string;
  Text?: string;
  HTML?: string;
  Headers?: Record<string, string>;
  Tags?: string[];
  Attachments?: SendAttachment[];
}

/** Response from POST /api/v1/send. */
export interface SendResponse {
  ID: string;
}

/** Message headers as key-value pairs (values are arrays). */
export type MessageHeaders = Record<string, string[]>;

/** Chaos trigger configuration. */
export interface ChaosTrigger {
  ErrorCode: number;
  Probability: number;
}

/** Chaos triggers configuration. */
export interface ChaosTriggers {
  Sender: ChaosTrigger;
  Recipient: ChaosTrigger;
  Authentication: ChaosTrigger;
}

/** HTML check result for a specific email client. */
export interface HTMLCheckResult {
  Family: string;
  Platform: string;
  Version: string;
  Name: string;
  Support: string;
  NoteNumber: string;
}

/** HTML check score. */
export interface HTMLCheckScore {
  Supported: number;
  Partial: number;
  Unsupported: number;
}

/** HTML check warning for a specific feature. */
export interface HTMLCheckWarning {
  Slug: string;
  Title: string;
  Category: string;
  Description: string;
  Keywords: string;
  Tags: string[];
  URL: string;
  Score: HTMLCheckScore;
  Results: HTMLCheckResult[];
  NotesByNumber: Record<string, string>;
}

/** HTML check total scores. */
export interface HTMLCheckTotal {
  Nodes: number;
  Tests: number;
  Supported: number;
  Partial: number;
  Unsupported: number;
}

/** Response from GET /api/v1/message/{ID}/html-check. */
export interface HTMLCheckResponse {
  Total: HTMLCheckTotal;
  Warnings: HTMLCheckWarning[];
  Platforms: Record<string, unknown>;
}

/** Link check result. */
export interface Link {
  URL: string;
  StatusCode: number;
  Status: string;
}

/** Response from GET /api/v1/message/{ID}/link-check. */
export interface LinkCheckResponse {
  Links: Link[];
  Errors: number;
}

/** SpamAssassin rule. */
export interface SpamAssassinRule {
  Name: string;
  Description: string;
  Score: number;
}

/** Response from GET /api/v1/message/{ID}/sa-check. */
export interface SpamAssassinResponse {
  IsSpam: boolean;
  Score: number;
  Rules: SpamAssassinRule[];
  Error: string;
}
