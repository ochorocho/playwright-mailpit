import { test, expect } from './fixtures';

test.describe('Search', () => {
  test.beforeEach(async ({ mailpit }) => {
    await mailpit.sendMessage({
      From: { Email: 'alice@example.com', Name: 'Alice' },
      To: [{ Email: 'bob@example.com', Name: 'Bob' }],
      Subject: 'Meeting Tomorrow',
      Text: 'See you at 10am',
    });

    await mailpit.sendMessage({
      From: { Email: 'charlie@example.com', Name: 'Charlie' },
      To: [{ Email: 'bob@example.com', Name: 'Bob' }],
      Subject: 'Invoice #1234',
      Text: 'Please find attached the invoice',
    });

    await mailpit.sendMessage({
      From: { Email: 'alice@example.com', Name: 'Alice' },
      To: [{ Email: 'dave@example.com', Name: 'Dave' }],
      Subject: 'Project Update',
      Text: 'The project is on track',
    });
  });

  test('searches by recipient', async ({ mailpit }) => {
    const result = await mailpit.searchMessages('to:bob@example.com');
    expect(result.messages_count).toBe(2);
    expect(result.messages.every((m) => m.To.some((t) => t.Address === 'bob@example.com'))).toBe(
      true,
    );
  });

  test('searches by sender', async ({ mailpit }) => {
    const result = await mailpit.searchMessages('from:alice@example.com');
    expect(result.messages_count).toBe(2);
  });

  test('searches by subject', async ({ mailpit }) => {
    const result = await mailpit.searchMessages('subject:Invoice');
    expect(result.messages_count).toBe(1);
    expect(result.messages[0].Subject).toBe('Invoice #1234');
  });

  test('searches with combined filters', async ({ mailpit }) => {
    const result = await mailpit.searchMessages('from:alice@example.com to:bob@example.com');
    expect(result.messages_count).toBe(1);
    expect(result.messages[0].Subject).toBe('Meeting Tomorrow');
  });

  test('returns empty results for no matches', async ({ mailpit }) => {
    const result = await mailpit.searchMessages('to:nobody@example.com');
    expect(result.messages_count).toBe(0);
    expect(result.messages.length).toBe(0);
  });

  test('supports search pagination', async ({ mailpit }) => {
    const result = await mailpit.searchMessages('to:bob@example.com', 0, 1);
    expect(result.messages.length).toBe(1);
    expect(result.messages_count).toBe(2);
  });

  test('deletes messages by search', async ({ mailpit }) => {
    await mailpit.deleteMessagesBySearch('from:charlie@example.com');

    const remaining = await mailpit.getMessages();
    expect(remaining.total).toBe(2);
    expect(remaining.messages.every((m) => m.From.Address !== 'charlie@example.com')).toBe(true);
  });
});
