export interface CreateEventInput {
  title?: string;
  summary?: string;
  body?: string;
  starts_at?: string;
  ends_at?: string;
  location?: string | null;
  ticket_info?: string | null;
}

export interface UpdateEventInput {
  title?: string;
  summary?: string;
  body?: string;
  starts_at?: string;
  ends_at?: string;
  location?: string | null;
  ticket_info?: string | null;
}

export interface EventValidationError {
  field: string;
  message: string;
}

function isValidISO8601WithTimezone(value: string): boolean {
  // ISO 8601 with timezone: 2026-06-15T19:00:00-03:00 or with Z
  const iso8601Regex =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;
  return iso8601Regex.test(value);
}

function parseISO8601(value: string): Date | null {
  if (!isValidISO8601WithTimezone(value)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeText(text: string, maxLength?: number): string {
  // Remove leading/trailing whitespace
  let sanitized = text.trim();
  // Limit length if specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

export function validateEventInput(input: CreateEventInput | UpdateEventInput): EventValidationError[] {
  const errors: EventValidationError[] = [];

  // Title validation (if provided)
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    } else if (input.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must not exceed 200 characters' });
    }
  }

  // Summary validation (if provided)
  if (input.summary !== undefined) {
    if (typeof input.summary !== 'string' || input.summary.trim().length === 0) {
      errors.push({ field: 'summary', message: 'Summary must be a non-empty string' });
    } else if (input.summary.length > 500) {
      errors.push({ field: 'summary', message: 'Summary must not exceed 500 characters' });
    }
  }

  // Body validation (if provided)
  if (input.body !== undefined) {
    if (typeof input.body !== 'string' || input.body.trim().length === 0) {
      errors.push({ field: 'body', message: 'Body must be a non-empty string' });
    }
  }

  // starts_at validation (if provided)
  if (input.starts_at !== undefined) {
    if (typeof input.starts_at !== 'string') {
      errors.push({ field: 'starts_at', message: 'starts_at must be a valid ISO 8601 timestamp with timezone' });
    } else {
      const startsAt = parseISO8601(input.starts_at);
      if (!startsAt) {
        errors.push({ field: 'starts_at', message: 'starts_at must be a valid ISO 8601 timestamp with timezone' });
      } else {
        // Check if within 5 years in future
        const now = new Date();
        const fiveYearsFromNow = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);
        if (startsAt < now || startsAt > fiveYearsFromNow) {
          errors.push({ field: 'starts_at', message: 'starts_at must be between now and 5 years in the future' });
        }
      }
    }
  }

  // ends_at validation (if provided)
  if (input.ends_at !== undefined) {
    if (typeof input.ends_at !== 'string') {
      errors.push({ field: 'ends_at', message: 'ends_at must be a valid ISO 8601 timestamp with timezone' });
    } else {
      const endsAt = parseISO8601(input.ends_at);
      if (!endsAt) {
        errors.push({ field: 'ends_at', message: 'ends_at must be a valid ISO 8601 timestamp with timezone' });
      }
    }
  }

  // Cross-field validation: ends_at >= starts_at
  if (input.starts_at !== undefined && input.ends_at !== undefined) {
    const startsAt = parseISO8601(input.starts_at);
    const endsAt = parseISO8601(input.ends_at);
    if (startsAt && endsAt && endsAt < startsAt) {
      errors.push({ field: 'ends_at', message: 'ends_at must be greater than or equal to starts_at' });
    }
  }

  // location validation (if provided)
  if (input.location !== undefined && input.location !== null) {
    if (typeof input.location !== 'string' || input.location.trim().length === 0) {
      errors.push({ field: 'location', message: 'location must be a non-empty string or null' });
    } else if (input.location.length > 300) {
      errors.push({ field: 'location', message: 'location must not exceed 300 characters' });
    }
  }

  // ticket_info validation (if provided)
  if (input.ticket_info !== undefined && input.ticket_info !== null) {
    if (typeof input.ticket_info !== 'string' || input.ticket_info.trim().length === 0) {
      errors.push({ field: 'ticket_info', message: 'ticket_info must be a non-empty string or null' });
    }
  }

  return errors;
}

export function parseEventInput(input: Record<string, unknown>): CreateEventInput {
  return {
    title: typeof input.title === 'string' ? sanitizeText(input.title) : undefined,
    summary: typeof input.summary === 'string' ? sanitizeText(input.summary) : undefined,
    body: typeof input.body === 'string' ? sanitizeText(input.body) : undefined,
    starts_at: typeof input.starts_at === 'string' ? input.starts_at : undefined,
    ends_at: typeof input.ends_at === 'string' ? input.ends_at : undefined,
    location:
      typeof input.location === 'string' ? sanitizeText(input.location) : input.location === null ? null : undefined,
    ticket_info:
      typeof input.ticket_info === 'string'
        ? sanitizeText(input.ticket_info)
        : input.ticket_info === null
          ? null
          : undefined,
  };
}
