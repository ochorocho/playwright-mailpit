import { test, expect } from './fixtures';

test.describe('Attachments', () => {
  test('sends and retrieves an attachment', async ({ mailpit }) => {
    const content = Buffer.from('Hello, this is a test file.').toString('base64');

    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Attachment Test',
      Text: 'See attached file',
      Attachments: [
        {
          Filename: 'test.txt',
          Content: content,
          ContentType: 'text/plain',
        },
      ],
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.Attachments.length).toBe(1);
    expect(msg.Attachments[0].FileName).toBe('test.txt');
    expect(msg.Attachments[0].ContentType).toContain('text/plain');
    expect(msg.Attachments[0].Size).toBeGreaterThan(0);

    // Retrieve the actual attachment content
    const attachment = await mailpit.getAttachment(sent.ID, msg.Attachments[0].PartID);
    expect(Buffer.isBuffer(attachment)).toBe(true);
    expect(attachment.toString('utf-8')).toBe('Hello, this is a test file.');
  });

  test('sends email with multiple attachments', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Multiple Attachments',
      Text: 'Multiple files attached',
      Attachments: [
        {
          Filename: 'file1.txt',
          Content: Buffer.from('Content of file 1').toString('base64'),
          ContentType: 'text/plain',
        },
        {
          Filename: 'file2.txt',
          Content: Buffer.from('Content of file 2').toString('base64'),
          ContentType: 'text/plain',
        },
      ],
    });

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.Attachments.length).toBe(2);

    const filenames = msg.Attachments.map((a) => a.FileName).sort();
    expect(filenames).toEqual(['file1.txt', 'file2.txt']);
  });

  test('attachment has metadata', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Attachment Metadata Test',
      Text: 'body',
      Attachments: [
        {
          Filename: 'data.txt',
          Content: Buffer.from('attachment metadata test data').toString('base64'),
          ContentType: 'text/plain',
        },
      ],
    });

    const msg = await mailpit.getMessage(sent.ID);
    const attachment = msg.Attachments[0];
    expect(attachment.PartID).toBeDefined();
    expect(attachment.FileName).toBe('data.txt');
    expect(attachment.ContentType).toContain('text/plain');
    expect(attachment.Size).toBeGreaterThan(0);
  });

  test('searches for messages with attachments', async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'With Attachment',
      Text: 'has file',
      Attachments: [
        {
          Filename: 'file.txt',
          Content: Buffer.from('data').toString('base64'),
          ContentType: 'text/plain',
        },
      ],
    });

    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Without Attachment',
      Text: 'no file',
    });

    const result = await mailpit.searchMessages('has:attachment');
    expect(result.messages_count).toBe(1);
    expect(result.messages[0].Subject).toBe('With Attachment');
  });
});
