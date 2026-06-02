import { sanitizeRichTextHtml } from '../lib/sanitize';

export interface PopupDTO {
  title: string;
  image_url: string | null;
  html_content: string | null;
  link_url?: string;
  show_after_seconds: number;
  show_only_once: boolean;
  show_on_pages: 'home' | 'all';
  starts_at: string;
  ends_at: string;
}

export interface PopupValidationError {
  field: string;
  message: string;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidISO8601(value: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)$/;
  if (!iso8601Regex.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function parsePopupInput(input: Record<string, unknown>): Partial<PopupDTO> {
  const output: Partial<PopupDTO> = {};

  if (typeof input.title === 'string') output.title = input.title.trim();

  if (input.image_url === null) {
    output.image_url = null;
  } else if (typeof input.image_url === 'string') {
    output.image_url = input.image_url.trim();
  }

  if (input.html_content === null) {
    output.html_content = null;
  } else if (typeof input.html_content === 'string') {
    output.html_content = sanitizeRichTextHtml(input.html_content.trim()).substring(0, 5000);
  }

  if (typeof input.link_url === 'string') output.link_url = input.link_url.trim();

  if (input.show_after_seconds === undefined || input.show_after_seconds === null) {
    output.show_after_seconds = 3;
  } else {
    output.show_after_seconds = Number(input.show_after_seconds);
  }

  if (input.show_only_once === undefined || input.show_only_once === null) {
    output.show_only_once = true;
  } else {
    output.show_only_once = String(input.show_only_once) === 'true';
  }

  if (input.show_on_pages === undefined || input.show_on_pages === null) {
    output.show_on_pages = 'home';
  } else if (input.show_on_pages === 'home' || input.show_on_pages === 'all') {
    output.show_on_pages = input.show_on_pages;
  }

  if (typeof input.starts_at === 'string') output.starts_at = input.starts_at.trim();
  if (typeof input.ends_at === 'string') output.ends_at = input.ends_at.trim();

  return output;
}

export function validatePopupInput(
  input: Partial<PopupDTO>,
  isUpdate = false,
): PopupValidationError[] {
  const errors: PopupValidationError[] = [];

  if (!isUpdate || input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.length < 2 || input.title.length > 200) {
      errors.push({ field: 'title', message: 'Title must be between 2 and 200 characters long' });
    }
  }

  if (input.image_url !== undefined && input.image_url !== null) {
    if (!isValidUrl(input.image_url)) {
      errors.push({ field: 'image_url', message: 'Image URL must be a valid URL string' });
    }
  }

  if (input.html_content !== undefined && input.html_content !== null) {
    if (input.html_content.length > 5000) {
      errors.push({
        field: 'html_content',
        message: 'HTML content must not exceed 5000 characters',
      });
    }
  }

  const hasImg =
    input.image_url !== undefined && input.image_url !== null && input.image_url !== '';
  const hasHtml =
    input.html_content !== undefined && input.html_content !== null && input.html_content !== '';
  if (!hasImg && !hasHtml) {
    errors.push({
      field: 'image_url',
      message: 'At least one field (image_url or html_content) must be provided',
    });
  }

  if (input.show_after_seconds !== undefined) {
    if (
      !Number.isInteger(input.show_after_seconds) ||
      input.show_after_seconds < 0 ||
      input.show_after_seconds > 60
    ) {
      errors.push({
        field: 'show_after_seconds',
        message: 'Show after seconds must be an integer between 0 and 60',
      });
    }
  }

  if (input.show_on_pages !== undefined) {
    if (input.show_on_pages !== 'home' && input.show_on_pages !== 'all') {
      errors.push({
        field: 'show_on_pages',
        message: 'Show on pages must be either "home" or "all"',
      });
    }
  }

  let validStarts = false;
  let validEnds = false;

  if (!isUpdate || input.starts_at !== undefined) {
    if (!input.starts_at || !isValidISO8601(input.starts_at)) {
      errors.push({ field: 'starts_at', message: 'Starts at must be a valid ISO 8601 string' });
    } else {
      validStarts = true;
    }
  }

  if (!isUpdate || input.ends_at !== undefined) {
    if (!input.ends_at || !isValidISO8601(input.ends_at)) {
      errors.push({ field: 'ends_at', message: 'Ends at must be a valid ISO 8601 string' });
    } else {
      validEnds = true;
    }
  }

  if (validStarts && validEnds && input.starts_at && input.ends_at) {
    if (new Date(input.ends_at) <= new Date(input.starts_at)) {
      errors.push({
        field: 'ends_at',
        message: 'Ends at date must be strictly greater than starts at date',
      });
    }
  }

  return errors;
}
