import { test, expect } from './fixtures';

test.describe('Messages', () => {
  test('sends and lists messages', async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com', Name: 'Sender' },
      To: [{ Email: 'recipient@example.com', Name: 'Recipient' }],
      Subject: 'List Test',
      Text: 'Hello from list test',
    });

    const result = await mailpit.getMessages();
    expect(result.messages.length).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeGreaterThanOrEqual(1);

    const msg = result.messages.find((m) => m.Subject === 'List Test');
    expect(msg).toBeDefined();
    expect(msg!.From.Address).toBe('sender@example.com');
    expect(msg!.To[0].Address).toBe('recipient@example.com');
  });

  test('gets a message by ID', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Get By ID',
      Text: 'Body text',
      HTML: '<p>Body HTML</p>',
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.ID).toBe(sent.ID);
    expect(msg.Subject).toBe('Get By ID');
    expect(msg.Text).toContain('Body text');
    expect(msg.HTML).toContain('<p>Body HTML</p>');
  });

  test('gets the latest message', async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'First Message',
      Text: 'first',
    });

    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Latest Message',
      Text: 'latest',
    });

    const latest = await mailpit.getLatestMessage();
    expect(latest.Subject).toBe('Latest Message');
  });

  test('gets message headers', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Headers Test',
      Text: 'body',
    });

    const headers = await mailpit.getMessageHeaders(sent.ID);
    expect(headers['Subject']).toBeDefined();
    expect(headers['Subject'][0]).toBe('Headers Test');
  });

  test('gets raw message source', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Raw Test',
      Text: 'raw body',
    });

    const raw = await mailpit.getRawMessage(sent.ID);
    expect(raw).toContain('Subject: Raw Test');
    expect(raw).toContain('raw body');
  });

  test('deletes specific messages', async ({ mailpit }) => {
    const sent1 = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Keep This',
      Text: 'keep',
    });

    const sent2 = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Delete This',
      Text: 'delete',
    });

    await mailpit.deleteMessages([sent2.ID]);

    const result = await mailpit.getMessages();
    expect(result.messages.some((m) => m.ID === sent1.ID)).toBe(true);
    expect(result.messages.some((m) => m.ID === sent2.ID)).toBe(false);
  });

  test('deletes all messages', async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'To Delete',
      Text: 'body',
    });

    await mailpit.deleteAllMessages();

    const result = await mailpit.getMessages();
    expect(result.total).toBe(0);
    expect(result.messages.length).toBe(0);
  });

  test('sets read status', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Read Status Test',
      Text: 'body',
    });

    await mailpit.setReadStatus({ IDs: [sent.ID], Read: true });

    // Read status is only available on message summaries (list endpoint)
    const result = await mailpit.getMessages();
    const msg = result.messages.find((m) => m.ID === sent.ID);
    expect(msg).toBeDefined();
    expect(msg!.Read).toBe(true);
  });

  test('gets app information', async ({ mailpit }) => {
    const info = await mailpit.getAppInformation();
    expect(info.Version).toBeDefined();
    expect(typeof info.Messages).toBe('number');
    expect(typeof info.Unread).toBe('number');
    expect(info.RuntimeStats).toBeDefined();
  });

  test('supports pagination', async ({ mailpit }) => {
    for (let i = 0; i < 5; i++) {
      await mailpit.sendMessage({
        From: { Email: 'sender@example.com' },
        To: [{ Email: 'recipient@example.com' }],
        Subject: `Pagination ${i}`,
        Text: `body ${i}`,
      });
    }

    const page1 = await mailpit.getMessages(0, 2);
    expect(page1.messages.length).toBe(2);
    expect(page1.total).toBe(5);

    const page2 = await mailpit.getMessages(2, 2);
    expect(page2.messages.length).toBe(2);

    const page3 = await mailpit.getMessages(4, 2);
    expect(page3.messages.length).toBe(1);
  });
});
