import { test, expect } from './fixtures';

test.describe('Fixture Helpers', () => {
  test('waitForEmail polls until email arrives', async ({ mailpit, waitForEmail }) => {
    // Send email first, then wait for it
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'waiter@example.com' }],
      Subject: 'Waited Email',
      Text: 'This email was waited for',
    });

    const email = await waitForEmail({
      query: 'to:waiter@example.com subject:Waited',
      timeout: 5_000,
    });

    expect(email.Subject).toBe('Waited Email');
    expect(email.Text).toContain('This email was waited for');
    // waitForEmail returns full Message, not summary
    expect(email.HTML).toBeDefined();
  });

  test('waitForEmail throws on timeout', async ({ waitForEmail }) => {
    await expect(
      waitForEmail({
        query: 'to:nonexistent@example.com',
        timeout: 1_000,
        interval: 200,
      }),
    ).rejects.toThrow('Timed out');
  });

  test('waitForEmails waits for multiple emails', async ({ mailpit, waitForEmails }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'multi@example.com' }],
      Subject: 'Multi 1',
      Text: 'first',
    });

    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'multi@example.com' }],
      Subject: 'Multi 2',
      Text: 'second',
    });

    const result = await waitForEmails({
      query: 'to:multi@example.com',
      count: 2,
      timeout: 5_000,
    });

    expect(result.messages_count).toBeGreaterThanOrEqual(2);
  });

  test('getLatestEmail returns the most recent email', async ({ mailpit, getLatestEmail }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Older Email',
      Text: 'older',
    });

    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Newest Email',
      Text: 'newest',
    });

    const latest = await getLatestEmail();
    expect(latest.Subject).toBe('Newest Email');
  });

  test('getLatestEmail with search query', async ({ mailpit, getLatestEmail }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'specific@example.com' }],
      Subject: 'Specific Latest',
      Text: 'body',
    });

    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'other@example.com' }],
      Subject: 'Other Latest',
      Text: 'body',
    });

    const latest = await getLatestEmail('to:specific@example.com');
    expect(latest.Subject).toBe('Specific Latest');
  });

  test('getLatestEmail throws when no emails match', async ({ getLatestEmail }) => {
    await expect(getLatestEmail('to:nonexistent@example.com')).rejects.toThrow('No emails found');
  });

  test('deleteAllEmails removes everything', async ({ mailpit, deleteAllEmails }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'To Remove',
      Text: 'body',
    });

    await deleteAllEmails();

    const result = await mailpit.getMessages();
    expect(result.total).toBe(0);
  });

  test('searchEmails returns matching results', async ({ mailpit, searchEmails }) => {
    await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'searchtest@example.com' }],
      Subject: 'Search Helper Test',
      Text: 'body',
    });

    const result = await searchEmails('to:searchtest@example.com');
    expect(result.messages_count).toBe(1);
    expect(result.messages[0].Subject).toBe('Search Helper Test');
  });

  test('getEmail returns full message by ID', async ({ mailpit, getEmail }) => {
    const sent = await mailpit.sendMessage({
      From: { Email: 'sender@example.com' },
      To: [{ Email: 'recipient@example.com' }],
      Subject: 'Get Email Test',
      Text: 'full message body',
      HTML: '<p>full message body</p>',
    });

    const email = await getEmail(sent.ID);
    expect(email.ID).toBe(sent.ID);
    expect(email.Subject).toBe('Get Email Test');
    expect(email.Text).toContain('full message body');
    expect(email.HTML).toContain('<p>full message body</p>');
  });
});
