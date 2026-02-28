import { test, expect } from './fixtures';

test.describe('Send', () => {
  test('sends a plain text email', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com', Name: 'Sender Name' },
      To: [{ Email: 'recipient@example.com', Name: 'Recipient Name' }],
      Subject: 'Plain Text Email',
      Text: 'This is a plain text email body.',
    });

    expect(sent.ID).toBeDefined();

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.From.Address).toBe('sender@example.com');
    expect(msg.From.Name).toBe('Sender Name');
    expect(msg.To[0].Address).toBe('recipient@example.com');
    expect(msg.Subject).toBe('Plain Text Email');
    expect(msg.Text).toContain('This is a plain text email body.');
  });

  test('sends an HTML email', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'HTML Email',
      HTML: '<h1>Hello</h1><p>This is an HTML email.</p>',
      Text: 'Hello - This is an HTML email.',
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.HTML).toContain('<h1>Hello</h1>');
    expect(msg.Text).toContain('Hello');
  });

  test('sends email with CC and BCC', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'to@example.com' }],
      Cc: [{ Email: 'cc@example.com', Name: 'CC User' }],
      Bcc: ['bcc@example.com'],
      Subject: 'CC/BCC Test',
      Text: 'Testing CC and BCC',
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.Cc.length).toBeGreaterThanOrEqual(1);
    expect(msg.Cc[0].Address).toBe('cc@example.com');
    expect(msg.Bcc.length).toBeGreaterThanOrEqual(1);
    expect(msg.Bcc[0].Address).toBe('bcc@example.com');
  });

  test('sends email with custom headers', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Custom Headers',
      Text: 'body',
      Headers: { 'X-Custom-Header': 'custom-value' },
    });

    const headers = await mailpit.getMessageHeaders(sent.ID);
    expect(headers['X-Custom-Header']).toBeDefined();
    expect(headers['X-Custom-Header'][0]).toBe('custom-value');
  });

  test('sends email with tags', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Tagged Email',
      Text: 'body',
      Tags: ['important', 'newsletter'],
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.Tags).toContain('important');
    expect(msg.Tags).toContain('newsletter');
  });

  test('sends email with multiple recipients', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [
        { Email: 'user1@example.com', Name: 'User One' },
        { Email: 'user2@example.com', Name: 'User Two' },
      ],
      Subject: 'Multiple Recipients',
      Text: 'Hello everyone',
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.To.length).toBe(2);
    expect(msg.To[0].Address).toBe('user1@example.com');
    expect(msg.To[1].Address).toBe('user2@example.com');
  });

  test('sends email with reply-to', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      ReplyTo: [{ Email: 'replyto@example.com', Name: 'Reply Here' }],
      Subject: 'Reply-To Test',
      Text: 'body',
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.ReplyTo.length).toBeGreaterThanOrEqual(1);
    expect(msg.ReplyTo[0].Address).toBe('replyto@example.com');
  });
});
