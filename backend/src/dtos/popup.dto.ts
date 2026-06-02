import { sanitizeRichTextHtml } from '../lib/sanitize';

export interface CreatePopupInput {
  title?: string;
  imageUrl?: string;
  htmlContent?: string;
  linkUrl?: string;
  showAfter_seconds?: number;
  showOnlyOnce?: boolean;
  showOnPages?: string[];
  startsAt?: Date;
  endsAt?: Date;
}

export interface UpdatePopupInput {
  title?: string;
  imageUrl?: string;
  htmlContent?: string;
  linkUrl?: string;
  showAfter_seconds?: number;
  showOnlyOnce?: boolean;
  showOnPages?: string[];
  startsAt?: Date;
  endsAt?: Date;
}

export interface DeletePopupInput {}
export interface ActivatePopupInput {}
export interface DeactivatePopupInput {}

export interface PopupValidationError {
  field: string;
  message: string;
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
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validatePopupInput(input: CreatePopupInput | UpdatePopupInput): PopupValidationError[] {
  const errors: PopupValidationError[] = [];

  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Title must be a non-empty string' });
    } else if (input.title.length > 255) {
      errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
    }
  }

  if (input.imageUrl !== undefined) {
    if (typeof input.imageUrl !== 'string' || !isValidUrl(input.imageUrl)) {
      errors.push({ field: 'imageUrl', message: 'Image URL must be a valid URL string' });
    }
  }

  if (input.htmlContent !== undefined) {
    if (typeof input.htmlContent !== 'string' || input.htmlContent.trim().length === 0) {
      errors.push({ field: 'htmlContent', message: 'HTML content must be a non-empty string' });
    } else if (input.htmlContent.length > 50000) {
      errors.push({ field: 'htmlContent', message: 'HTML content must not exceed 50000 characters' });
    }
  }

  if (input.linkUrl !== undefined) {
    if (typeof input.linkUrl !== 'string' || !isValidUrl(input.linkUrl)) {
      errors.push({ field: 'linkUrl', message: 'Link URL must be a valid URL string' });
    }
  }

  if (input.showAfter_seconds !== undefined) {
    if (typeof input.showAfter_seconds !== 'number' || input.showAfter_seconds < 0) {
      errors.push({ field: 'showAfter_seconds', message: 'Show after seconds must be a positive number' });
    }
  }

  if (input.showOnlyOnce !== undefined) {
    if (typeof input.showOnlyOnce !== 'boolean') {
      errors.push({ field: 'showOnlyOnce', message: 'Show only once must be a boolean value' });
    }
  }

  if (input.showOnPages !== undefined) {
    if (!Array.isArray(input.showOnPages) || input.showOnPages.some(p => typeof p !== 'string' || p.trim().length === 0)) {
      errors.push({ field: 'showOnPages', message: 'Show on pages must be an array of non-empty strings' });
    }
  }

  if (input.startsAt !== undefined) {
    if (!(input.startsAt instanceof Date) || Number.isNaN(input.startsAt.getTime())) {
      errors.push({ field: 'startsAt', message: 'Starts at must be a valid Date object' });
    }
  }

  if (input.endsAt !== undefined) {
    if (!(input.endsAt instanceof Date) || Number.isNaN(input.endsAt.getTime())) {
      errors.push({ field: 'endsAt', message: 'Ends at must be a valid Date object' });
    }
  }

  return errors;
}

export function parsePopupInput(input: Record<string, unknown>): CreatePopupInput {
  return {
    title: typeof input.title === 'string' ? sanitizeText(input.title, 255) : undefined,
    imageUrl: typeof input.imageUrl === 'string' ? input.imageUrl.trim() : undefined,
    
    htmlContent:
      typeof input.htmlContent === 'string'
        ? sanitizeRichTextHtml(input.htmlContent.trim()).substring(0, 50000)
        : undefined,
        
    linkUrl: typeof input.linkUrl === 'string' ? input.linkUrl.trim() : undefined,
    
    showAfter_seconds: 
      typeof input.showAfter_seconds === 'number' 
        ? input.showAfter_seconds 
        : typeof input.showAfter_seconds === 'string' 
          ? parseInt(input.showAfter_seconds, 10) 
          : undefined,
          
    showOnlyOnce: 
      typeof input.showOnlyOnce === 'boolean' 
        ? input.showOnlyOnce 
        : typeof input.showOnlyOnce === 'string' 
          ? input.showOnlyOnce === 'true' 
          : undefined,
          
    showOnPages: 
      Array.isArray(input.showOnPages) 
        ? input.showOnPages.map(p => String(p).trim()).filter(p => p.length > 0) 
        : undefined,
        
    startsAt: typeof input.startsAt === 'string' ? (parseISO8601(input.startsAt) ?? undefined) : undefined,
    endsAt: typeof input.endsAt === 'string' ? (parseISO8601(input.endsAt) ?? undefined) : undefined,
  };
}