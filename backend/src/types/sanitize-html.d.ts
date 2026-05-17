declare module 'sanitize-html' {
  interface SanitizeHtmlOptions {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemesByTag?: Record<string, string[]>;
    disallowedTagsMode?: 'discard' | 'completelyDiscard' | 'escape' | 'recursiveEscape';
  }

  export default function sanitizeHtml(
    dirty: string,
    options?: SanitizeHtmlOptions,
  ): string;
}
