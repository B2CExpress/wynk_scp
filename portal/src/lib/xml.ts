/**
 * XML entity escaping. Order matters: & must be first.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Convert Date to RFC 822 format for RSS: "Wed, 22 May 2026 10:00:00 +0000"
 */
export function toRfc822(date: Date): string {
  return date.toUTCString();
}

/**
 * Convert Date to ISO 8601 for sitemap lastmod: "2026-05-22"
 */
export function toIso8601Date(date: Date): string {
  return date.toISOString().split('T')[0];
}
