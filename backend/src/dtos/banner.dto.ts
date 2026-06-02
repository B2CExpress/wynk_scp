export interface CreateBannerInput {
  title?: string;
  image_desktop_url?: string;
  image_mobile_url?: string;
  alt_text?: string;
  link_url?: string | null;
  link_target?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateBannerInput {
  title?: string;
  image_desktop_url?: string;
  image_mobile_url?: string;
  alt_text?: string;
  link_url?: string | null;
  link_target?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface BannerValidationError {
  field: string;
  message: string;
}

export interface BannerReorderInput {
  order: Array<{
    id: string;
    sort_order: number;
  }>;
}

export function isValidISO8601(value: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;
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
  // Aceita http://, https://, ou path interno começando com /
  if (url.startsWith('/')) {
    return /^\/[a-zA-Z0-9\-_/]*$/.test(url);
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function containsJavaScriptProtocol(url: string): boolean {
  const lowerUrl = url.toLowerCase().trim();
  return lowerUrl.startsWith('javascript:');
}

export function validateBannerInput(
  input: CreateBannerInput | UpdateBannerInput,
): BannerValidationError[] {
  const errors: BannerValidationError[] = [];

  // title: required, min 2, max 200
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    } else if (input.title.length < 2) {
      errors.push({ field: 'title', message: 'Title must be at least 2 characters' });
    } else if (input.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
    }
  }

  // image_desktop_url: required, valid URL (http/https)
  if (input.image_desktop_url !== undefined) {
    if (
      typeof input.image_desktop_url !== 'string' ||
      input.image_desktop_url.trim().length === 0
    ) {
      errors.push({ field: 'image_desktop_url', message: 'Desktop image URL is required' });
    } else if (!isValidUrl(input.image_desktop_url)) {
      errors.push({
        field: 'image_desktop_url',
        message: 'Desktop image URL must be a valid HTTP(S) URL',
      });
    }
  }

  // image_mobile_url: required, valid URL (http/https)
  if (input.image_mobile_url !== undefined) {
    if (typeof input.image_mobile_url !== 'string' || input.image_mobile_url.trim().length === 0) {
      errors.push({ field: 'image_mobile_url', message: 'Mobile image URL is required' });
    } else if (!isValidUrl(input.image_mobile_url)) {
      errors.push({
        field: 'image_mobile_url',
        message: 'Mobile image URL must be a valid HTTP(S) URL',
      });
    }
  }

  // alt_text: required, min 5, max 300 (accessibility)
  if (input.alt_text !== undefined) {
    if (typeof input.alt_text !== 'string' || input.alt_text.trim().length === 0) {
      errors.push({ field: 'alt_text', message: 'Alt text is required (accessibility)' });
    } else if (input.alt_text.length < 5) {
      errors.push({ field: 'alt_text', message: 'Alt text must be at least 5 characters' });
    } else if (input.alt_text.length > 300) {
      errors.push({ field: 'alt_text', message: 'Alt text must not exceed 300 characters' });
    }
  }

  // link_url: optional, but if present must be valid URL or path, no javascript:
  if (input.link_url !== undefined && input.link_url !== null) {
    if (typeof input.link_url !== 'string') {
      errors.push({ field: 'link_url', message: 'Link URL must be a string or null' });
    } else if (input.link_url.trim().length > 0) {
      if (containsJavaScriptProtocol(input.link_url)) {
        errors.push({ field: 'link_url', message: 'JavaScript URLs are not allowed' });
      } else if (!isValidUrl(input.link_url)) {
        errors.push({
          field: 'link_url',
          message: 'Link URL must be a valid HTTP(S) URL or internal path',
        });
      }
    }
  }

  // link_target: optional, enum _self | _blank, default _self
  if (input.link_target !== undefined) {
    if (typeof input.link_target !== 'string') {
      errors.push({ field: 'link_target', message: 'Link target must be a string' });
    } else if (!['_self', '_blank'].includes(input.link_target)) {
      errors.push({ field: 'link_target', message: 'Link target must be _self or _blank' });
    }
  }

  // starts_at: optional, ISO 8601 format
  if (input.starts_at !== undefined && input.starts_at !== null) {
    if (typeof input.starts_at !== 'string') {
      errors.push({ field: 'starts_at', message: 'Start time must be a valid ISO 8601 timestamp' });
    } else {
      const startsAt = parseISO8601(input.starts_at);
      if (!startsAt) {
        errors.push({
          field: 'starts_at',
          message: 'Start time must be a valid ISO 8601 timestamp',
        });
      }
    }
  }

  // ends_at: optional, ISO 8601 format, must be > starts_at
  if (input.ends_at !== undefined && input.ends_at !== null) {
    if (typeof input.ends_at !== 'string') {
      errors.push({ field: 'ends_at', message: 'End time must be a valid ISO 8601 timestamp' });
    } else {
      const endsAt = parseISO8601(input.ends_at);
      if (!endsAt) {
        errors.push({ field: 'ends_at', message: 'End time must be a valid ISO 8601 timestamp' });
      }
    }
  }

  // Validate ends_at > starts_at if both present
  if (
    input.starts_at !== undefined &&
    input.starts_at !== null &&
    input.ends_at !== undefined &&
    input.ends_at !== null
  ) {
    const startsAt = parseISO8601(input.starts_at as string);
    const endsAt = parseISO8601(input.ends_at as string);
    if (startsAt && endsAt && endsAt <= startsAt) {
      errors.push({
        field: 'ends_at',
        message: 'End time must be after start time',
      });
    }
  }

  // is_active: optional, boolean, default true
  if (input.is_active !== undefined) {
    if (typeof input.is_active !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean' });
    }
  }

  // sort_order: optional, integer >= 0, default 0
  if (input.sort_order !== undefined) {
    if (typeof input.sort_order !== 'number' || !Number.isInteger(input.sort_order)) {
      errors.push({ field: 'sort_order', message: 'Sort order must be an integer' });
    } else if (input.sort_order < 0) {
      errors.push({ field: 'sort_order', message: 'Sort order must be >= 0' });
    }
  }

  return errors;
}

export function parseBannerInput(input: Record<string, unknown>): CreateBannerInput {
  return {
    title: typeof input.title === 'string' ? sanitizeText(input.title, 200) : undefined,
    image_desktop_url:
      typeof input.image_desktop_url === 'string' ? input.image_desktop_url : undefined,
    image_mobile_url:
      typeof input.image_mobile_url === 'string' ? input.image_mobile_url : undefined,
    alt_text: typeof input.alt_text === 'string' ? sanitizeText(input.alt_text, 300) : undefined,
    link_url:
      typeof input.link_url === 'string'
        ? input.link_url
        : input.link_url === null
          ? null
          : undefined,
    link_target: typeof input.link_target === 'string' ? input.link_target : undefined,
    starts_at:
      typeof input.starts_at === 'string'
        ? input.starts_at
        : input.starts_at === null
          ? null
          : undefined,
    ends_at:
      typeof input.ends_at === 'string' ? input.ends_at : input.ends_at === null ? null : undefined,
    is_active: typeof input.is_active === 'boolean' ? input.is_active : undefined,
    sort_order: typeof input.sort_order === 'number' ? input.sort_order : undefined,
  };
}

export function parseBannerReorderInput(input: Record<string, unknown>): BannerReorderInput | null {
  if (!Array.isArray(input.order)) {
    return null;
  }

  const order = input.order
    .filter((item: any) => typeof item === 'object' && item !== null)
    .map((item: any) => ({
      id: typeof item.id === 'string' ? item.id : null,
      sort_order: typeof item.sort_order === 'number' ? item.sort_order : null,
    }))
    .filter((item: any) => item.id && item.sort_order !== null && item.sort_order >= 0);

  return order.length > 0 ? { order } : null;
}
