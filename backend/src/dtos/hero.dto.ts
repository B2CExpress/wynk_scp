/**
 * DTO do hero — validação manual campo-a-campo (padrão do repo, sem Zod).
 * Body externo em snake_case; resposta em camelCase (`HeroResponse`).
 */

export interface HeroInput {
  title: string;
  subtitle: string | null;
  background_image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  overlay_color: string;
  overlay_opacity: number;
}

export interface HeroResponse {
  title: string;
  subtitle: string | null;
  backgroundImageUrl: string;
  ctaText: string | null;
  ctaLink: string | null;
  overlayColor: string;
  overlayOpacity: number;
}

export interface HeroValidationError {
  field: string;
  message: string;
}

/** Resposta do GET quando o tenant ainda não configurou o hero (nunca 404). */
export const HERO_DEFAULTS: HeroResponse = {
  title: '',
  subtitle: null,
  backgroundImageUrl: '',
  ctaText: null,
  ctaLink: null,
  overlayColor: '#000000',
  overlayOpacity: 0.4,
};

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** `cta_link` aceita URL absoluta OU path interno (`/...`). */
function isValidLink(value: string): boolean {
  return value.startsWith('/') || isValidUrl(value);
}

export function parseHeroInput(input: Record<string, unknown>): Partial<HeroInput> {
  const output: Partial<HeroInput> = {};

  if (typeof input.title === 'string') output.title = input.title.trim();

  if (input.subtitle === null) {
    output.subtitle = null;
  } else if (typeof input.subtitle === 'string') {
    output.subtitle = input.subtitle.trim() === '' ? null : input.subtitle.trim();
  }

  if (typeof input.background_image_url === 'string') {
    output.background_image_url = input.background_image_url.trim();
  }

  if (input.cta_text === null) {
    output.cta_text = null;
  } else if (typeof input.cta_text === 'string') {
    output.cta_text = input.cta_text.trim() === '' ? null : input.cta_text.trim();
  }

  if (input.cta_link === null) {
    output.cta_link = null;
  } else if (typeof input.cta_link === 'string') {
    output.cta_link = input.cta_link.trim() === '' ? null : input.cta_link.trim();
  }

  if (input.overlay_color === undefined || input.overlay_color === null) {
    output.overlay_color = '#000000';
  } else if (typeof input.overlay_color === 'string') {
    output.overlay_color = input.overlay_color.trim();
  }

  if (input.overlay_opacity === undefined || input.overlay_opacity === null) {
    output.overlay_opacity = 0.4;
  } else {
    output.overlay_opacity = Number(input.overlay_opacity);
  }

  return output;
}

export function validateHeroInput(input: Partial<HeroInput>): HeroValidationError[] {
  const errors: HeroValidationError[] = [];

  if (typeof input.title !== 'string' || input.title.length < 1 || input.title.length > 300) {
    errors.push({
      field: 'title',
      message: 'Title is required and must be at most 300 characters',
    });
  }

  if (input.subtitle !== undefined && input.subtitle !== null) {
    if (input.subtitle.length > 500) {
      errors.push({ field: 'subtitle', message: 'Subtitle must be at most 500 characters' });
    }
  }

  if (
    typeof input.background_image_url !== 'string' ||
    input.background_image_url === '' ||
    !isValidUrl(input.background_image_url)
  ) {
    errors.push({
      field: 'background_image_url',
      message: 'background_image_url is required and must be a valid URL',
    });
  }

  if (input.cta_text !== undefined && input.cta_text !== null) {
    if (input.cta_text.length > 50) {
      errors.push({ field: 'cta_text', message: 'cta_text must be at most 50 characters' });
    }
  }

  if (input.cta_link !== undefined && input.cta_link !== null) {
    if (!isValidLink(input.cta_link)) {
      errors.push({
        field: 'cta_link',
        message: 'cta_link must be an absolute URL or an internal path (starting with /)',
      });
    }
  }

  if (input.overlay_color !== undefined) {
    if (typeof input.overlay_color !== 'string' || !HEX_COLOR_REGEX.test(input.overlay_color)) {
      errors.push({ field: 'overlay_color', message: 'overlay_color must match #RRGGBB' });
    }
  }

  if (input.overlay_opacity !== undefined) {
    if (
      typeof input.overlay_opacity !== 'number' ||
      Number.isNaN(input.overlay_opacity) ||
      input.overlay_opacity < 0 ||
      input.overlay_opacity > 1
    ) {
      errors.push({
        field: 'overlay_opacity',
        message: 'overlay_opacity must be a number between 0 and 1',
      });
    }
  }

  return errors;
}
