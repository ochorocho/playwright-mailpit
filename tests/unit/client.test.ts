import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MailpitClient, MailpitError } from '../../src/client';

const BASE_URL = 'http://localhost:8025';

function createClient(config?: Partial<ConstructorParameters<typeof MailpitClient>[0]>) {
  return new MailpitClient({ url: BASE_URL, ...config });
}

function mockFetch(response: { status?: number; body?: unknown; text?: string; ok?: boolean }) {
  const status = response.status ?? 200;
  const ok = response.ok ?? (status >= 200 && status < 300);
  const bodyText = response.text ?? JSON.stringify(response.body ?? {});
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    text: () => Promise.resolve(bodyText),
    json: () => Promise.resolve(response.body ?? JSON.parse(bodyText)),
    arrayBuffer: () => Promise.resolve(new TextEncoder().encode(bodyText).buffer),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('MailpitClient', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('strips trailing slashes from URL', () => {
      const fetchMock = mockFetch({ body: {} });
      const client = createClient({ url: 'http://localhost:8025///' });
      client.getAppInformation();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8025/api/v1/info'),
        expect.anything(),
      );
    });

    it('sets basic auth header when provided', () => {
      const fetchMock = mockFetch({ body: {} });
      const client = createClient({ basicAuth: 'user:pass' });
      client.getAppInformation();
      const expectedAuth = `Basic ${Buffer.from('user:pass').toString('base64')}`;
      expect(fetchMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: expectedAuth }),
        }),
      );
    });

    it('includes custom headers', () => {
      const fetchMock = mockFetch({ body: {} });
      const client = createClient({ headers: { 'X-Custom': 'test' } });
      client.getAppInformation();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Custom': 'test' }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('throws MailpitError on non-2xx response', async () => {
      mockFetch({ status: 404, ok: false, text: 'Not found' });
      const client = createClient();
      await expect(client.getMessage('nonexistent')).rejects.toThrow(MailpitError);
      await expect(client.getMessage('nonexistent')).rejects.toMatchObject({
        status: 404,
        body: 'Not found',
      });
    });

    it('throws on 500 server error', async () => {
      mockFetch({ status: 500, ok: false, text: 'Internal server error' });
      const client = createClient();
      await expect(client.getMessages()).rejects.toThrow(MailpitError);
    });
  });

  describe('getAppInformation', () => {
    it('calls GET /api/v1/info', async () => {
      const body = {
        Version: '1.29.2',
        Messages: 42,
        Unread: 5,
        Tags: { inbox: 10 },
        RuntimeStats: { Uptime: 3600, Memory: 1024 },
      };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getAppInformation();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/info`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.Version).toBe('1.29.2');
      expect(result.Messages).toBe(42);
    });
  });

  describe('getWebUIConfiguration', () => {
    it('calls GET /api/v1/webui', async () => {
      const body = { Label: 'Test', ChaosEnabled: false };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getWebUIConfiguration();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/webui`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.Label).toBe('Test');
    });
  });

  describe('getChaosTriggers', () => {
    it('calls GET /api/v1/chaos', async () => {
      const body = {
        Sender: { ErrorCode: 0, Probability: 0 },
        Recipient: { ErrorCode: 0, Probability: 0 },
        Authentication: { ErrorCode: 0, Probability: 0 },
      };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getChaosTriggers();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/chaos`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.Sender.ErrorCode).toBe(0);
    });
  });

  describe('setChaosTriggers', () => {
    it('calls PUT /api/v1/chaos with body', async () => {
      const triggers = {
        Sender: { ErrorCode: 450, Probability: 50 },
        Recipient: { ErrorCode: 0, Probability: 0 },
        Authentication: { ErrorCode: 0, Probability: 0 },
      };
      const fetchMock = mockFetch({ body: triggers });
      const client = createClient();
      await client.setChaosTriggers(triggers);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/chaos`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(triggers),
        }),
      );
    });
  });

  describe('getMessages', () => {
    it('calls GET /api/v1/messages with default pagination', async () => {
      const body = { messages: [], messages_count: 0, total: 0, start: 0, unread: 0, tags: [] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getMessages();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/messages?start=0&limit=50`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.messages).toEqual([]);
    });

    it('passes custom pagination parameters', async () => {
      const body = { messages: [], messages_count: 0, total: 0, start: 10, unread: 0, tags: [] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      await client.getMessages(10, 25);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/messages?start=10&limit=25`,
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('setReadStatus', () => {
    it('calls PUT /api/v1/messages with request body', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.setReadStatus({ IDs: ['id1', 'id2'], Read: true });
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/messages`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ IDs: ['id1', 'id2'], Read: true }),
        }),
      );
    });
  });

  describe('deleteMessages', () => {
    it('calls DELETE /api/v1/messages with IDs', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.deleteMessages(['id1']);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/messages`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ IDs: ['id1'] }),
        }),
      );
    });

    it('sends empty IDs array when called without arguments', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.deleteMessages();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/messages`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ IDs: [] }),
        }),
      );
    });
  });

  describe('deleteAllMessages', () => {
    it('delegates to deleteMessages with no IDs', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.deleteAllMessages();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/messages`,
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ IDs: [] }),
        }),
      );
    });
  });

  describe('searchMessages', () => {
    it('calls GET /api/v1/search with query', async () => {
      const body = { messages: [], messages_count: 0, total: 0, start: 0, unread: 0, tags: [] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      await client.searchMessages('to:user@example.com');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/search?query=to%3Auser%40example.com&start=0&limit=50`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('includes timezone parameter when provided', async () => {
      const body = { messages: [], messages_count: 0, total: 0, start: 0, unread: 0, tags: [] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      await client.searchMessages('subject:test', 0, 50, 'America/New_York');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('tz=America%2FNew_York'),
        expect.anything(),
      );
    });
  });

  describe('deleteMessagesBySearch', () => {
    it('calls DELETE /api/v1/search with query', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.deleteMessagesBySearch('is:read');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/search?query=is%3Aread`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('getMessage', () => {
    it('calls GET /api/v1/message/{ID}', async () => {
      const body = { ID: 'abc123', Subject: 'Test', From: { Name: '', Address: 'a@b.com' } };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getMessage('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.Subject).toBe('Test');
    });

    it('encodes special characters in ID', async () => {
      const fetchMock = mockFetch({ body: { ID: 'a/b+c' } });
      const client = createClient();
      await client.getMessage('a/b+c');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/a%2Fb%2Bc`,
        expect.anything(),
      );
    });
  });

  describe('getLatestMessage', () => {
    it('calls getMessage with "latest"', async () => {
      const body = { ID: 'latest-id', Subject: 'Latest' };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getLatestMessage();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/latest`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.Subject).toBe('Latest');
    });
  });

  describe('getMessageHeaders', () => {
    it('calls GET /api/v1/message/{ID}/headers', async () => {
      const body = { 'Content-Type': ['text/html'], Subject: ['Test'] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.getMessageHeaders('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/headers`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result['Content-Type']).toEqual(['text/html']);
    });
  });

  describe('getRawMessage', () => {
    it('calls GET /api/v1/message/{ID}/raw and returns text', async () => {
      const rawContent = 'From: a@b.com\r\nSubject: Test\r\n\r\nBody';
      const fetchMock = mockFetch({ text: rawContent });
      const client = createClient();
      const result = await client.getRawMessage('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/raw`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toBe(rawContent);
    });
  });

  describe('releaseMessage', () => {
    it('calls POST /api/v1/message/{ID}/release with recipients', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.releaseMessage('abc123', ['user@example.com']);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/release`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ To: ['user@example.com'] }),
        }),
      );
    });
  });

  describe('getAttachment', () => {
    it('calls GET /api/v1/message/{ID}/part/{PartID}', async () => {
      const fetchMock = mockFetch({ text: 'binary-content' });
      const client = createClient();
      const result = await client.getAttachment('msg1', 'part1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/msg1/part/part1`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });

  describe('getAttachmentThumbnail', () => {
    it('calls GET /api/v1/message/{ID}/part/{PartID}/thumb', async () => {
      const fetchMock = mockFetch({ text: 'jpeg-data' });
      const client = createClient();
      await client.getAttachmentThumbnail('msg1', 'part1');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/msg1/part/part1/thumb`,
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('checkHTML', () => {
    it('calls GET /api/v1/message/{ID}/html-check', async () => {
      const body = { Total: { Supported: 80, Partial: 10, Unsupported: 10 }, Warnings: [] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.checkHTML('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/html-check`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.Total.Supported).toBe(80);
    });
  });

  describe('checkLinks', () => {
    it('calls GET /api/v1/message/{ID}/link-check with default follow=false', async () => {
      const body = { Links: [], Errors: 0 };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      await client.checkLinks('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/link-check?follow=false`,
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('passes follow=true when specified', async () => {
      const fetchMock = mockFetch({ body: { Links: [], Errors: 0 } });
      const client = createClient();
      await client.checkLinks('abc123', true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/link-check?follow=true`,
        expect.anything(),
      );
    });
  });

  describe('checkSpamAssassin', () => {
    it('calls GET /api/v1/message/{ID}/sa-check', async () => {
      const body = { IsSpam: false, Score: 1.5, Rules: [] };
      const fetchMock = mockFetch({ body });
      const client = createClient();
      const result = await client.checkSpamAssassin('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/message/abc123/sa-check`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result.IsSpam).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('calls POST /api/v1/send with request body', async () => {
      const sendReq = {
        From: { Email: 'sender@example.com' },
        To: [{ Email: 'recipient@example.com' }],
        Subject: 'Hello',
        Text: 'World',
      };
      const fetchMock = mockFetch({ body: { ID: 'new-id' } });
      const client = createClient();
      const result = await client.sendMessage(sendReq);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/send`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(sendReq),
        }),
      );
      expect(result.ID).toBe('new-id');
    });
  });

  describe('getTags', () => {
    it('calls GET /api/v1/tags', async () => {
      const fetchMock = mockFetch({ body: ['inbox', 'important'] });
      const client = createClient();
      const result = await client.getTags();
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/tags`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(['inbox', 'important']);
    });
  });

  describe('setMessageTags', () => {
    it('calls PUT /api/v1/tags with tags and IDs', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.setMessageTags(['tag1', 'tag2'], ['id1', 'id2']);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/tags`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ Tags: ['tag1', 'tag2'], IDs: ['id1', 'id2'] }),
        }),
      );
    });
  });

  describe('renameTag', () => {
    it('calls PUT /api/v1/tags/{Tag} with new name', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.renameTag('old-name', 'new-name');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/tags/old-name`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ Name: 'new-name' }),
        }),
      );
    });

    it('encodes special characters in tag name', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.renameTag('my tag', 'new tag');
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/api/v1/tags/my%20tag`, expect.anything());
    });
  });

  describe('deleteTag', () => {
    it('calls DELETE /api/v1/tags/{Tag}', async () => {
      const fetchMock = mockFetch({ text: 'ok' });
      const client = createClient();
      await client.deleteTag('unwanted');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/api/v1/tags/unwanted`,
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('getRenderedHTML', () => {
    it('calls GET /view/{ID}.html', async () => {
      const html = '<html><body>Hello</body></html>';
      const fetchMock = mockFetch({ text: html });
      const client = createClient();
      const result = await client.getRenderedHTML('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/view/abc123.html`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toBe(html);
    });

    it('adds embed=1 parameter when embed is true', async () => {
      const fetchMock = mockFetch({ text: '<html></html>' });
      const client = createClient();
      await client.getRenderedHTML('abc123', true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/view/abc123.html?embed=1`,
        expect.anything(),
      );
    });
  });

  describe('getRenderedText', () => {
    it('calls GET /view/{ID}.txt', async () => {
      const text = 'Hello World';
      const fetchMock = mockFetch({ text });
      const client = createClient();
      const result = await client.getRenderedText('abc123');
      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/view/abc123.txt`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toBe(text);
    });
  });
});
