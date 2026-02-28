import { describe, expect, it } from 'vitest';
import { buildSearchQuery } from '../../src/helpers';

describe('buildSearchQuery', () => {
  it('returns empty string for empty options', () => {
    expect(buildSearchQuery({})).toBe('');
  });

  it('builds to: filter', () => {
    expect(buildSearchQuery({ to: 'user@example.com' })).toBe('to:user@example.com');
  });

  it('builds from: filter', () => {
    expect(buildSearchQuery({ from: 'sender@example.com' })).toBe('from:sender@example.com');
  });

  it('builds cc: filter', () => {
    expect(buildSearchQuery({ cc: 'cc@example.com' })).toBe('cc:cc@example.com');
  });

  it('builds bcc: filter', () => {
    expect(buildSearchQuery({ bcc: 'bcc@example.com' })).toBe('bcc:bcc@example.com');
  });

  it('builds reply-to: filter', () => {
    expect(buildSearchQuery({ replyTo: 'reply@example.com' })).toBe('reply-to:reply@example.com');
  });

  it('builds subject: filter', () => {
    expect(buildSearchQuery({ subject: 'Test' })).toBe('subject:Test');
  });

  it('quotes values containing spaces', () => {
    expect(buildSearchQuery({ subject: 'Welcome Email' })).toBe('subject:"Welcome Email"');
  });

  it('builds message-id: filter', () => {
    expect(buildSearchQuery({ messageId: 'abc123@example.com' })).toBe(
      'message-id:abc123@example.com',
    );
  });

  it('builds addressed: filter', () => {
    expect(buildSearchQuery({ addressed: 'user@example.com' })).toBe('addressed:user@example.com');
  });

  it('builds is: filters', () => {
    expect(buildSearchQuery({ is: ['read', 'tagged'] })).toBe('is:read is:tagged');
  });

  it('builds has: filters', () => {
    expect(buildSearchQuery({ has: ['attachment'] })).toBe('has:attachment');
  });

  it('builds tag: filter', () => {
    expect(buildSearchQuery({ tag: 'important' })).toBe('tag:important');
  });

  it('quotes tag with spaces', () => {
    expect(buildSearchQuery({ tag: 'my tag' })).toBe('tag:"my tag"');
  });

  it('builds before: filter', () => {
    expect(buildSearchQuery({ before: '2024/04/01' })).toBe('before:2024/04/01');
  });

  it('builds after: filter', () => {
    expect(buildSearchQuery({ after: '2024/01/01' })).toBe('after:2024/01/01');
  });

  it('builds larger: filter', () => {
    expect(buildSearchQuery({ larger: '2M' })).toBe('larger:2M');
  });

  it('builds smaller: filter', () => {
    expect(buildSearchQuery({ smaller: '500K' })).toBe('smaller:500K');
  });

  it('builds text search', () => {
    expect(buildSearchQuery({ text: 'hello world' })).toBe('hello world');
  });

  it('combines multiple filters', () => {
    const result = buildSearchQuery({
      to: 'user@example.com',
      subject: 'Welcome',
      is: ['unread'],
      has: ['attachment'],
    });
    expect(result).toBe('to:user@example.com subject:Welcome is:unread has:attachment');
  });

  it('combines all filter types', () => {
    const result = buildSearchQuery({
      from: 'sender@test.com',
      to: 'recipient@test.com',
      subject: 'Test Subject',
      tag: 'inbox',
      is: ['unread'],
      before: '2024/12/31',
      after: '2024/01/01',
      text: 'keyword',
    });
    expect(result).toContain('from:sender@test.com');
    expect(result).toContain('to:recipient@test.com');
    expect(result).toContain('subject:"Test Subject"');
    expect(result).toContain('tag:inbox');
    expect(result).toContain('is:unread');
    expect(result).toContain('before:2024/12/31');
    expect(result).toContain('after:2024/01/01');
    expect(result).toContain('keyword');
  });
});
