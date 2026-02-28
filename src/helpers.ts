/** Options for building a Mailpit search query string. */
export interface SearchQueryOptions {
  to?: string;
  from?: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  subject?: string;
  messageId?: string;
  /** Search across From, To, Cc, Bcc, Reply-To. */
  addressed?: string;
  is?: ('read' | 'unread' | 'tagged')[];
  has?: ('attachment' | 'inline')[];
  tag?: string;
  /** Date filter: before yyyy/mm/dd. */
  before?: string;
  /** Date filter: after yyyy/mm/dd. */
  after?: string;
  /** Size filter, e.g. "2M", "500K". */
  larger?: string;
  /** Size filter, e.g. "2M", "500K". */
  smaller?: string;
  /** Free text search terms. */
  text?: string;
}

function quoteIfNeeded(value: string): string {
  return value.includes(' ') ? `"${value}"` : value;
}

/**
 * Build a Mailpit search query string from structured options.
 *
 * @example
 * buildSearchQuery({ to: 'user@example.com', subject: 'Welcome Email' })
 * // Returns: 'to:user@example.com subject:"Welcome Email"'
 */
export function buildSearchQuery(options: SearchQueryOptions): string {
  const parts: string[] = [];

  if (options.to) parts.push(`to:${quoteIfNeeded(options.to)}`);
  if (options.from) parts.push(`from:${quoteIfNeeded(options.from)}`);
  if (options.cc) parts.push(`cc:${quoteIfNeeded(options.cc)}`);
  if (options.bcc) parts.push(`bcc:${quoteIfNeeded(options.bcc)}`);
  if (options.replyTo) parts.push(`reply-to:${quoteIfNeeded(options.replyTo)}`);
  if (options.subject) parts.push(`subject:${quoteIfNeeded(options.subject)}`);
  if (options.messageId) parts.push(`message-id:${options.messageId}`);
  if (options.addressed) parts.push(`addressed:${quoteIfNeeded(options.addressed)}`);
  if (options.is) {
    for (const flag of options.is) {
      parts.push(`is:${flag}`);
    }
  }
  if (options.has) {
    for (const flag of options.has) {
      parts.push(`has:${flag}`);
    }
  }
  if (options.tag) parts.push(`tag:${quoteIfNeeded(options.tag)}`);
  if (options.before) parts.push(`before:${options.before}`);
  if (options.after) parts.push(`after:${options.after}`);
  if (options.larger) parts.push(`larger:${options.larger}`);
  if (options.smaller) parts.push(`smaller:${options.smaller}`);
  if (options.text) parts.push(options.text);

  return parts.join(' ');
}
