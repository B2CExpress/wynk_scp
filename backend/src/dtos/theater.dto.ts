import { sanitizeRichTextHtml } from '../lib/sanitize';

export interface CreateTheaterShowInput {
  title?: string;
  synopsis?: string;
  duration_minutes?: number | string;
  age_rating?: string;
  ticket_url?: string | null;
}

export interface UpdateTheaterShowInput {
  title?: string;
  synopsis?: string;
  duration_minutes?: number | string;
  age_rating?: string;
  ticket_url?: string | null;
}

export interface CreateTheaterSessionInput {
  starts_at?: string;
  ticket_url?: string | null;
}

export interface UpdateTheaterSessionInput {
  is_sold_out?: boolean;
  starts_at?: string;
  ticket_url?: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

const VALID_AGE_RATINGS = ['L', '10', '12', '14', '16', '18'];

function isValidISO8601WithTimezone(value: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;
  return iso8601Regex.test(value);
}

function parseISO8601(value: string): Date | null {
  if (!isValidISO8601WithTimezone(value)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeText(text: string): string {
  return text.trim();
}

export function validateTheaterShowInput(
  input: CreateTheaterShowInput | UpdateTheaterShowInput,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Title validation
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    } else if (input.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
    }
  }

  // Synopsis validation
  if (input.synopsis !== undefined) {
    if (typeof input.synopsis !== 'string' || input.synopsis.trim().length === 0) {
      errors.push({ field: 'synopsis', message: 'Synopsis must be a non-empty string' });
    }
  }

  // Duration validation
  if (input.duration_minutes !== undefined) {
    const duration =
      typeof input.duration_minutes === 'string'
        ? Number.parseInt(input.duration_minutes, 10)
        : input.duration_minutes;

    if (!Number.isInteger(duration) || duration < 10 || duration > 600) {
      errors.push({
        field: 'duration_minutes',
        message: 'duration_minutes must be an integer between 10 and 600',
      });
    }
  }

  // Age rating validation
  if (input.age_rating !== undefined) {
    if (typeof input.age_rating !== 'string' || !VALID_AGE_RATINGS.includes(input.age_rating)) {
      errors.push({
        field: 'age_rating',
        message: `age_rating must be one of: ${VALID_AGE_RATINGS.join(', ')}`,
      });
    }
  }

  // ticket_url validation
  if (input.ticket_url !== undefined && input.ticket_url !== null) {
    if (typeof input.ticket_url !== 'string' || !isValidUrl(input.ticket_url)) {
      errors.push({ field: 'ticket_url', message: 'ticket_url must be a valid HTTP(S) URL' });
    }
  }

  return errors;
}

export function validateTheaterSessionInput(input: CreateTheaterSessionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // starts_at validation (required for create)
  if (input.starts_at === undefined || typeof input.starts_at !== 'string') {
    errors.push({
      field: 'starts_at',
      message: 'starts_at is required and must be a valid ISO 8601 timestamp with timezone',
    });
    return errors;
  }

  const startsAt = parseISO8601(input.starts_at);
  if (!startsAt) {
    errors.push({
      field: 'starts_at',
      message: 'starts_at must be a valid ISO 8601 timestamp with timezone',
    });
    return errors;
  }

  // Check if starts_at is at least 1 hour in the future
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (startsAt < oneHourFromNow) {
    errors.push({ field: 'starts_at', message: 'starts_at must be at least 1 hour in the future' });
  }

  // ticket_url validation
  if (input.ticket_url !== undefined && input.ticket_url !== null) {
    if (typeof input.ticket_url !== 'string' || !isValidUrl(input.ticket_url)) {
      errors.push({ field: 'ticket_url', message: 'ticket_url must be a valid HTTP(S) URL' });
    }
  }

  return errors;
}

export function validateTheaterSessionUpdate(input: UpdateTheaterSessionInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // is_sold_out validation
  if (input.is_sold_out !== undefined && typeof input.is_sold_out !== 'boolean') {
    errors.push({ field: 'is_sold_out', message: 'is_sold_out must be a boolean' });
  }

  // starts_at validation (optional for update)
  if (input.starts_at !== undefined && typeof input.starts_at === 'string') {
    if (!isValidISO8601WithTimezone(input.starts_at)) {
      errors.push({
        field: 'starts_at',
        message: 'starts_at must be a valid ISO 8601 timestamp with timezone',
      });
    }
  }

  // ticket_url validation
  if (input.ticket_url !== undefined && input.ticket_url !== null) {
    if (typeof input.ticket_url !== 'string' || !isValidUrl(input.ticket_url)) {
      errors.push({ field: 'ticket_url', message: 'ticket_url must be a valid HTTP(S) URL' });
    }
  }

  return errors;
}

export function parseTheaterShowInput(input: Record<string, unknown>): CreateTheaterShowInput {
  return {
    title: typeof input.title === 'string' ? sanitizeText(input.title) : undefined,
    // synopsis é rich text HTML — sanitiza tags/atributos perigosos (XSS) antes de gravar.
    synopsis:
      typeof input.synopsis === 'string' ? sanitizeRichTextHtml(input.synopsis.trim()) : undefined,
    duration_minutes:
      input.duration_minutes !== undefined && input.duration_minutes !== null
        ? (input.duration_minutes as number | string)
        : undefined,
    age_rating: typeof input.age_rating === 'string' ? input.age_rating : undefined,
    ticket_url:
      typeof input.ticket_url === 'string'
        ? input.ticket_url
        : input.ticket_url === null
          ? null
          : undefined,
  };
}

export function parseTheaterSessionInput(
  input: Record<string, unknown>,
): CreateTheaterSessionInput {
  return {
    starts_at: typeof input.starts_at === 'string' ? input.starts_at : undefined,
    ticket_url:
      typeof input.ticket_url === 'string'
        ? input.ticket_url
        : input.ticket_url === null
          ? null
          : undefined,
  };
}
