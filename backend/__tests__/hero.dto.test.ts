import { parseHeroInput, validateHeroInput, HERO_DEFAULTS } from '../src/dtos/hero.dto';
import type { HeroInput } from '../src/dtos/hero.dto';

describe('parseHeroInput', () => {
  it('applies defaults for overlay fields', () => {
    const parsed = parseHeroInput({ title: 'X', background_image_url: 'https://cdn/x.jpg' });
    expect(parsed.overlay_color).toBe('#000000');
    expect(parsed.overlay_opacity).toBe(0.4);
  });

  it('trims strings and coerces opacity to number', () => {
    const parsed = parseHeroInput({
      title: '  Bem-vindo  ',
      background_image_url: 'https://cdn/x.jpg',
      overlay_opacity: '0.6',
    });
    expect(parsed.title).toBe('Bem-vindo');
    expect(parsed.overlay_opacity).toBe(0.6);
  });

  it('normalizes empty optional strings to null', () => {
    const parsed = parseHeroInput({ subtitle: '   ', cta_text: '', cta_link: null });
    expect(parsed.subtitle).toBeNull();
    expect(parsed.cta_text).toBeNull();
    expect(parsed.cta_link).toBeNull();
  });
});

describe('validateHeroInput', () => {
  const base: Partial<HeroInput> = {
    title: 'Bem-vindo ao Shopping',
    background_image_url: 'https://cdn/hero.jpg',
    overlay_color: '#000000',
    overlay_opacity: 0.4,
  };

  it('returns no errors for a valid payload', () => {
    expect(validateHeroInput(base)).toEqual([]);
  });

  it('requires title (≤300)', () => {
    expect(validateHeroInput({ ...base, title: undefined }).some((e) => e.field === 'title')).toBe(
      true,
    );
    expect(
      validateHeroInput({ ...base, title: 'a'.repeat(301) }).some((e) => e.field === 'title'),
    ).toBe(true);
  });

  it('requires a valid background_image_url', () => {
    expect(
      validateHeroInput({ ...base, background_image_url: '' }).some(
        (e) => e.field === 'background_image_url',
      ),
    ).toBe(true);
    expect(
      validateHeroInput({ ...base, background_image_url: 'not-a-url' }).some(
        (e) => e.field === 'background_image_url',
      ),
    ).toBe(true);
  });

  it('rejects subtitle > 500 and cta_text > 50', () => {
    expect(
      validateHeroInput({ ...base, subtitle: 'a'.repeat(501) }).some((e) => e.field === 'subtitle'),
    ).toBe(true);
    expect(
      validateHeroInput({ ...base, cta_text: 'a'.repeat(51) }).some((e) => e.field === 'cta_text'),
    ).toBe(true);
  });

  it('accepts cta_link as absolute URL or internal path, rejects garbage', () => {
    expect(validateHeroInput({ ...base, cta_link: 'https://x.com/promo' })).toEqual([]);
    expect(validateHeroInput({ ...base, cta_link: '/promocoes' })).toEqual([]);
    expect(
      validateHeroInput({ ...base, cta_link: 'promo-sem-barra' }).some(
        (e) => e.field === 'cta_link',
      ),
    ).toBe(true);
  });

  it('rejects overlay_color outside #RRGGBB', () => {
    expect(
      validateHeroInput({ ...base, overlay_color: '#ZZZZZZ' }).some(
        (e) => e.field === 'overlay_color',
      ),
    ).toBe(true);
    expect(
      validateHeroInput({ ...base, overlay_color: '#fff' }).some(
        (e) => e.field === 'overlay_color',
      ),
    ).toBe(true);
  });

  it('rejects overlay_opacity outside [0,1]', () => {
    expect(
      validateHeroInput({ ...base, overlay_opacity: 2.5 }).some(
        (e) => e.field === 'overlay_opacity',
      ),
    ).toBe(true);
    expect(
      validateHeroInput({ ...base, overlay_opacity: -0.1 }).some(
        (e) => e.field === 'overlay_opacity',
      ),
    ).toBe(true);
  });
});

describe('HERO_DEFAULTS', () => {
  it('has overlay defaults and empty required fields', () => {
    expect(HERO_DEFAULTS.overlayColor).toBe('#000000');
    expect(HERO_DEFAULTS.overlayOpacity).toBe(0.4);
    expect(HERO_DEFAULTS.title).toBe('');
  });
});
