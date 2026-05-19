export interface CreatePromotionInput {
  store_id?: string;
  title?: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  discount_label?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface UpdatePromotionInput {
  store_id?: string;
  title?: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  discount_label?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface PromotionValidationError {
  field: string;
  message: string;
}

function isValidISO8601WithTimezone(value: string): boolean {
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

function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function sanitizeText(text: string, maxLength?: number): string {
  let sanitized = text.trim();
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

function sanitizeHTML(html: string): string {
  return html.trim();
}

export function validatePromotionInput(
  input: CreatePromotionInput | UpdatePromotionInput,
  isCreate: boolean = false,
): PromotionValidationError[] {
  const errors: PromotionValidationError[] = [];

  // store_id validation (required on create, optional on update)
  if (isCreate) {
    if (!input.store_id) {
      errors.push({ field: 'store_id', message: 'store_id is required' });
    } else if (typeof input.store_id !== 'string' || !isValidUUID(input.store_id)) {
      errors.push({ field: 'store_id', message: 'store_id must be a valid UUID' });
    }
  } else if (input.store_id !== undefined) {
    if (typeof input.store_id !== 'string' || !isValidUUID(input.store_id)) {
      errors.push({ field: 'store_id', message: 'store_id must be a valid UUID' });
    }
  }

  // title validation (if provided)
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'title must be a non-empty string' });
    } else if (input.title.length > 200) {
      errors.push({ field: 'title', message: 'title must not exceed 200 characters' });
    }
  }

  // slug validation (optional on create if title present, optional on update)
  if (input.slug !== undefined) {
    if (typeof input.slug !== 'string' || input.slug.trim().length === 0) {
      errors.push({ field: 'slug', message: 'slug must be a non-empty string' });
    } else if (input.slug.length > 250) {
      errors.push({ field: 'slug', message: 'slug must not exceed 250 characters' });
    }
  }

  // description validation (if provided)
  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'description must be a non-empty string' });
    }
  }

  // image_url validation (optional)
  if (input.image_url !== undefined && input.image_url !== null) {
    if (typeof input.image_url !== 'string' || input.image_url.trim().length === 0) {
      errors.push({ field: 'image_url', message: 'image_url must be a non-empty string or null' });
    }
  }

  // discount_label validation (if provided)
  if (input.discount_label !== undefined) {
    if (typeof input.discount_label !== 'string' || input.discount_label.trim().length === 0) {
      errors.push({ field: 'discount_label', message: 'discount_label must be a non-empty string' });
    } else if (input.discount_label.length > 50) {
      errors.push({ field: 'discount_label', message: 'discount_label must not exceed 50 characters' });
    }
  }

  // valid_from validation (if provided)
  if (input.valid_from !== undefined) {
    if (typeof input.valid_from !== 'string') {
      errors.push({ field: 'valid_from', message: 'valid_from must be a valid ISO 8601 timestamp with timezone' });
    } else {
      const validFrom = parseISO8601(input.valid_from);
      if (!validFrom) {
        errors.push({ field: 'valid_from', message: 'valid_from must be a valid ISO 8601 timestamp with timezone' });
      } else {
        // Check if within 2 years in future
        const now = new Date();
        const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
        if (validFrom > twoYearsFromNow) {
          errors.push({ field: 'valid_from', message: 'valid_from must be within 2 years in the future' });
        }
      }
    }
  }

  // valid_until validation (if provided)
  if (input.valid_until !== undefined) {
    if (typeof input.valid_until !== 'string') {
      errors.push({ field: 'valid_until', message: 'valid_until must be a valid ISO 8601 timestamp with timezone' });
    } else {
      const validUntil = parseISO8601(input.valid_until);
      if (!validUntil) {
        errors.push({ field: 'valid_until', message: 'valid_until must be a valid ISO 8601 timestamp with timezone' });
      } else {
        // Check if within 2 years in future
        const now = new Date();
        const twoYearsFromNow = new Date(now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000);
        if (validUntil > twoYearsFromNow) {
          errors.push({ field: 'valid_until', message: 'valid_until must be within 2 years in the future' });
        }
      }
    }
  }

  // Cross-field validation: valid_until > valid_from (only if both provided)
  if (input.valid_from !== undefined && input.valid_until !== undefined) {
    const validFrom = parseISO8601(input.valid_from);
    const validUntil = parseISO8601(input.valid_until);
    if (validFrom && validUntil && validUntil <= validFrom) {
      errors.push({ field: 'valid_until', message: 'valid_until must be greater than valid_from' });
    }
  }

  return errors;
}

export function parsePromotionInput(input: Record<string, unknown>): CreatePromotionInput {
  return {
    store_id: typeof input.store_id === 'string' ? input.store_id : undefined,
    title: typeof input.title === 'string' ? sanitizeText(input.title) : undefined,
    slug: typeof input.slug === 'string' ? sanitizeText(input.slug) : undefined,
    description:
      typeof input.description === 'string' ? sanitizeHTML(input.description) : undefined,
    image_url:
      typeof input.image_url === 'string'
        ? sanitizeText(input.image_url)
        : input.image_url === null
          ? null
          : undefined,
    discount_label:
      typeof input.discount_label === 'string'
        ? sanitizeText(input.discount_label)
        : undefined,
    valid_from: typeof input.valid_from === 'string' ? input.valid_from : undefined,
    valid_until: typeof input.valid_until === 'string' ? input.valid_until : undefined,
  };
}
