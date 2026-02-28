import { test, expect } from './fixtures';

test.describe('Tags', () => {
  test('sets and gets tags on messages', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Tag Test',
      Text: 'body',
    });

    await mailpit.setMessageTags(['important', 'follow-up'], [sent.ID]);

    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.Tags).toContain('important');
    expect(msg.Tags).toContain('follow-up');
  });

  test('lists all tags', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Tag List Test',
      Text: 'body',
      Tags: ['tag-a', 'tag-b'],
    });

    // Ensure tags are set
    await mailpit.getMessage(sent.ID);

    const tags = await mailpit.getTags();
    expect(tags).toContain('tag-a');
    expect(tags).toContain('tag-b');
  });

  test('renames a tag', async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Rename Tag Test',
      Text: 'body',
      Tags: ['old-tag'],
    });

    await mailpit.renameTag('old-tag', 'new-tag');

    const tags = await mailpit.getTags();
    expect(tags).not.toContain('old-tag');
    expect(tags).toContain('new-tag');
  });

  test('deletes a tag', async ({ mailpit }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Delete Tag Test',
      Text: 'body',
      Tags: ['to-delete', 'to-keep'],
    });

    await mailpit.deleteTag('to-delete');

    const tags = await mailpit.getTags();
    expect(tags).not.toContain('to-delete');
    expect(tags).toContain('to-keep');

    // Message should still exist
    const msg = await mailpit.getMessage(sent.ID);
    expect(msg.Subject).toBe('Delete Tag Test');
  });

  test('searches by tag', async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Tagged Message',
      Text: 'body',
      Tags: ['searchable'],
    });

    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Untagged Message',
      Text: 'body',
    });

    const result = await mailpit.searchMessages('tag:searchable');
    expect(result.messages_count).toBe(1);
    expect(result.messages[0].Subject).toBe('Tagged Message');
  });
});
