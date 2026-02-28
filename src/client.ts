import type {
  AppInformation,
  ChaosTriggers,
  DeleteMessagesRequest,
  HTMLCheckResponse,
  LinkCheckResponse,
  Message,
  MessageHeaders,
  MessagesSummary,
  ReleaseMessageRequest,
  RenameTagRequest,
  SendRequest,
  SendResponse,
  SetReadStatusRequest,
  SetTagsRequest,
  SpamAssassinResponse,
  WebUIConfiguration,
} from './types';

/** Configuration for creating a MailpitClient instance. */
export interface MailpitClientConfig {
  /** Base URL of the Mailpit instance (e.g., "http://localhost:8025"). */
  url: string;
  /** Basic auth credentials as "username:password". */
  basicAuth?: string;
  /** Custom headers to include in every request. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 10000). */
  timeout?: number;
}

/** Error thrown when a Mailpit API request fails. */
export class MailpitError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'MailpitError';
  }
}

/** HTTP client for the Mailpit REST API v1. */
export class MailpitClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeout: number;

  constructor(config: MailpitClientConfig) {
    this.baseUrl = config.url.replace(/\/+$/, '');
    this.timeout = config.timeout ?? 10_000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...config.headers,
    };
    if (config.basicAuth) {
      this.defaultHeaders['Authorization'] =
        `Basic ${Buffer.from(config.basicAuth).toString('base64')}`;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      params?: Record<string, string>;
      responseType?: 'json' | 'text' | 'buffer';
    },
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: this.defaultHeaders,
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new MailpitError(
          `Mailpit API error: ${method} ${path} returned ${response.status}`,
          response.status,
          body,
        );
      }

      const responseType = options?.responseType ?? 'json';
      if (responseType === 'text') {
        return (await response.text()) as T;
      }
      if (responseType === 'buffer') {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer) as T;
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // --- Application ---

  /** Get basic runtime information and message totals. */
  async getAppInformation(): Promise<AppInformation> {
    return this.request('GET', '/api/v1/info');
  }

  /** Get web UI configuration settings. */
  async getWebUIConfiguration(): Promise<WebUIConfiguration> {
    return this.request('GET', '/api/v1/webui');
  }

  // --- Chaos ---

  /** Get current Chaos triggers configuration. */
  async getChaosTriggers(): Promise<ChaosTriggers> {
    return this.request('GET', '/api/v1/chaos');
  }

  /** Set Chaos triggers configuration. */
  async setChaosTriggers(triggers: ChaosTriggers): Promise<ChaosTriggers> {
    return this.request('PUT', '/api/v1/chaos', { body: triggers });
  }

  // --- Messages ---

  /** List messages from newest to oldest. */
  async getMessages(start = 0, limit = 50): Promise<MessagesSummary> {
    return this.request('GET', '/api/v1/messages', {
      params: { start: String(start), limit: String(limit) },
    });
  }

  /** Set read status for messages. */
  async setReadStatus(request: SetReadStatusRequest): Promise<void> {
    await this.request<string>('PUT', '/api/v1/messages', {
      body: request,
      responseType: 'text',
    });
  }

  /** Delete messages by IDs. If no IDs are provided, all messages are deleted. */
  async deleteMessages(ids?: string[]): Promise<void> {
    const body: DeleteMessagesRequest = { IDs: ids ?? [] };
    await this.request<string>('DELETE', '/api/v1/messages', {
      body,
      responseType: 'text',
    });
  }

  /** Delete all messages. */
  async deleteAllMessages(): Promise<void> {
    return this.deleteMessages();
  }

  // --- Search ---

  /** Search messages with Mailpit query syntax. */
  async searchMessages(
    query: string,
    start = 0,
    limit = 50,
    tz?: string,
  ): Promise<MessagesSummary> {
    const params: Record<string, string> = {
      query,
      start: String(start),
      limit: String(limit),
    };
    if (tz) params.tz = tz;
    return this.request('GET', '/api/v1/search', { params });
  }

  /** Delete messages matching a search query. */
  async deleteMessagesBySearch(query: string, tz?: string): Promise<void> {
    const params: Record<string, string> = { query };
    if (tz) params.tz = tz;
    await this.request<string>('DELETE', '/api/v1/search', {
      params,
      responseType: 'text',
    });
  }

  // --- Individual Messages ---

  /** Get full message details by ID. Also accepts "latest". */
  async getMessage(id: string): Promise<Message> {
    return this.request('GET', `/api/v1/message/${encodeURIComponent(id)}`);
  }

  /** Get the latest (most recent) message. */
  async getLatestMessage(): Promise<Message> {
    return this.getMessage('latest');
  }

  /** Get message headers as key-value pairs. */
  async getMessageHeaders(id: string): Promise<MessageHeaders> {
    return this.request('GET', `/api/v1/message/${encodeURIComponent(id)}/headers`);
  }

  /** Get the raw email source. */
  async getRawMessage(id: string): Promise<string> {
    return this.request('GET', `/api/v1/message/${encodeURIComponent(id)}/raw`, {
      responseType: 'text',
    });
  }

  /** Release (relay) a message via configured SMTP server. */
  async releaseMessage(id: string, to: string[]): Promise<void> {
    const body: ReleaseMessageRequest = { To: to };
    await this.request<string>('POST', `/api/v1/message/${encodeURIComponent(id)}/release`, {
      body,
      responseType: 'text',
    });
  }

  // --- Attachments ---

  /** Get an attachment's binary content. */
  async getAttachment(messageId: string, partId: string): Promise<Buffer> {
    return this.request(
      'GET',
      `/api/v1/message/${encodeURIComponent(messageId)}/part/${encodeURIComponent(partId)}`,
      { responseType: 'buffer' },
    );
  }

  /** Get a 180x120 JPEG thumbnail of an image attachment. */
  async getAttachmentThumbnail(messageId: string, partId: string): Promise<Buffer> {
    return this.request(
      'GET',
      `/api/v1/message/${encodeURIComponent(messageId)}/part/${encodeURIComponent(partId)}/thumb`,
      { responseType: 'buffer' },
    );
  }

  // --- Message Analysis ---

  /** Get HTML compatibility check results. */
  async checkHTML(id: string): Promise<HTMLCheckResponse> {
    return this.request('GET', `/api/v1/message/${encodeURIComponent(id)}/html-check`);
  }

  /** Get link check results. */
  async checkLinks(id: string, follow = false): Promise<LinkCheckResponse> {
    return this.request('GET', `/api/v1/message/${encodeURIComponent(id)}/link-check`, {
      params: { follow: String(follow) },
    });
  }

  /** Get SpamAssassin check results (requires SpamAssassin to be enabled). */
  async checkSpamAssassin(id: string): Promise<SpamAssassinResponse> {
    return this.request('GET', `/api/v1/message/${encodeURIComponent(id)}/sa-check`);
  }

  // --- Sending ---

  /** Send a message via the Mailpit HTTP API. */
  async sendMessage(request: SendRequest): Promise<SendResponse> {
    return this.request('POST', '/api/v1/send', { body: request });
  }

  // --- Tags ---

  /** Get all unique message tags. */
  async getTags(): Promise<string[]> {
    return this.request('GET', '/api/v1/tags');
  }

  /** Set tags on messages. */
  async setMessageTags(tags: string[], ids: string[]): Promise<void> {
    const body: SetTagsRequest = { Tags: tags, IDs: ids };
    await this.request<string>('PUT', '/api/v1/tags', { body, responseType: 'text' });
  }

  /** Rename an existing tag. */
  async renameTag(tag: string, newName: string): Promise<void> {
    const body: RenameTagRequest = { Name: newName };
    await this.request<string>('PUT', `/api/v1/tags/${encodeURIComponent(tag)}`, {
      body,
      responseType: 'text',
    });
  }

  /** Delete a tag (removes from messages, does not delete messages). */
  async deleteTag(tag: string): Promise<void> {
    await this.request<string>('DELETE', `/api/v1/tags/${encodeURIComponent(tag)}`, {
      responseType: 'text',
    });
  }

  // --- Rendered Views ---

  /** Get rendered HTML of a message. */
  async getRenderedHTML(id: string, embed = false): Promise<string> {
    const params: Record<string, string> = {};
    if (embed) params.embed = '1';
    return this.request('GET', `/view/${encodeURIComponent(id)}.html`, {
      params,
      responseType: 'text',
    });
  }

  /** Get rendered plain text of a message. */
  async getRenderedText(id: string): Promise<string> {
    return this.request('GET', `/view/${encodeURIComponent(id)}.txt`, {
      responseType: 'text',
    });
  }
}
