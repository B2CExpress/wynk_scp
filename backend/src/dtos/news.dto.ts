export interface CreateNewsInput {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  cover_image_url?: string | null;
  author?: string;
  category?: string;
}

export interface UpdateNewsInput {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  cover_image_url?: string | null;
  author?: string;
  category?: string;
}

export interface PublishNewsInput {
  publish_at?: string;
}

export interface NewsValidationError {
  field: string;
  message: string;
}

export function isValidISO8601(value: string): boolean {
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;
  return iso8601Regex.test(value);
}

export function parseISO8601(value: string): Date | null {
  if (!isValidISO8601(value)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeText(text: string, maxLength?: number): string {
  let sanitized = text.trim();
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateNewsInput(
  input: CreateNewsInput | UpdateNewsInput,
): NewsValidationError[] {
  const errors: NewsValidationError[] = [];

  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    } else if (input.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
    }
  }

  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string' || input.slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'Slug must be a non-empty string' });
    } else if (input.slug.length > 255) {
      errors.push({ field: 'slug', message: 'Slug must not exceed 255 characters' });
    } else if (!/^[a-z0-9-]+$/.test(input.slug)) {
      errors.push({
        field: 'slug',
        message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      });
    }
  }

  if (input.summary !== undefined) {
    if (typeof input.summary !== 'string' || input.summary.trim().length === 0) {
      errors.push({ field: 'summary', message: 'Summary must be a non-empty string' });
    } else if (input.summary.length > 500) {
      errors.push({ field: 'summary', message: 'Summary must not exceed 500 characters' });
    }
  }

  if (input.body !== undefined) {
    if (typeof input.body !== 'string' || input.body.trim().length === 0) {
      errors.push({ field: 'body', message: 'Body must be a non-empty string' });
    } else if (input.body.length > 50000) {
      errors.push({ field: 'body', message: 'Body must not exceed 50000 characters' });
    }
  }

  if (input.cover_image_url !== undefined && input.cover_image_url !== null) {
    if (typeof input.cover_image_url !== 'string') {
      errors.push({ field: 'cover_image_url', message: 'Cover image URL must be a string or null' });
    } else if (!isValidUrl(input.cover_image_url)) {
      errors.push({ field: 'cover_image_url', message: 'Cover image URL must be a valid URL' });
    }
  }

  if (input.author !== undefined) {
    if (typeof input.author !== 'string' || input.author.trim().length === 0) {
      errors.push({ field: 'author', message: 'Author must be a non-empty string' });
    } else if (input.author.length > 100) {
      errors.push({ field: 'author', message: 'Author must not exceed 100 characters' });
    }
  }

  if (input.category !== undefined) {
    if (typeof input.category !== 'string' || input.category.trim().length === 0) {
      errors.push({ field: 'category', message: 'Category must be a non-empty string' });
    } else if (input.category.length > 50) {
      errors.push({ field: 'category', message: 'Category must not exceed 50 characters' });
    }
  }

  return errors;
}

export function validatePublishInput(input: PublishNewsInput): NewsValidationError[] {
  const errors: NewsValidationError[] = [];

  if (input.publish_at !== undefined && input.publish_at !== null) {
    if (typeof input.publish_at !== 'string') {
      errors.push({
        field: 'publish_at',
        message: 'publish_at must be a valid ISO 8601 timestamp',
      });
    } else {
      const publishAt = parseISO8601(input.publish_at);
      if (!publishAt) {
        errors.push({
          field: 'publish_at',
          message: 'publish_at must be a valid ISO 8601 timestamp',
        });
      }
    }
  }

  return errors;
}

export function parseNewsInput(input: Record<string, unknown>): CreateNewsInput {
  return {
    title: typeof input.title === 'string' ? sanitizeText(input.title, 255) : undefined,
    slug: typeof input.slug === 'string' ? sanitizeText(input.slug) : undefined,
    summary: typeof input.summary === 'string' ? sanitizeText(input.summary, 500) : undefined,
    body: typeof input.body === 'string' ? sanitizeText(input.body, 50000) : undefined,
    cover_image_url:
      typeof input.cover_image_url === 'string'
        ? input.cover_image_url
        : input.cover_image_url === null
          ? null
          : undefined,
    author: typeof input.author === 'string' ? sanitizeText(input.author, 100) : undefined,
    category: typeof input.category === 'string' ? sanitizeText(input.category, 50) : undefined,
  };
}

export function parsePublishInput(input: Record<string, unknown>): PublishNewsInput {
  return {
    publish_at: typeof input.publish_at === 'string' ? input.publish_at : undefined,
  };
}
