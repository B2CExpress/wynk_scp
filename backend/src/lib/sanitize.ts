import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'u',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'blockquote',
];

const ALLOWED_ATTR_MAP: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
};

const ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

export function sanitizeStoreDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR_MAP,
    allowedSchemesByTag: {
      a: ALLOWED_SCHEMES,
      img: ALLOWED_SCHEMES,
    },
    disallowedTagsMode: 'discard',
  });
}
