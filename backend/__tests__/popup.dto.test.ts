import { parsePopupInput, validatePopupInput } from '../src/dtos/popup.dto';
import type { PopupDTO } from '../src/dtos/popup.dto';

const VALID_START = '2026-06-01T00:00:00-03:00';
const VALID_END = '2026-06-30T23:59:59-03:00';

describe('parsePopupInput', () => {
  it('applies defaults for optional fields', () => {
    const parsed = parsePopupInput({ title: 'X', image_url: 'https://cdn/x.jpg' });
    expect(parsed.show_after_seconds).toBe(3);
    expect(parsed.show_only_once).toBe(true);
    expect(parsed.show_on_pages).toBe('home');
  });

  it('trims title and coerces numeric/boolean inputs', () => {
    const parsed = parsePopupInput({
      title: '  Inauguração  ',
      show_after_seconds: '5',
      show_only_once: 'false',
      show_on_pages: 'all',
    });
    expect(parsed.title).toBe('Inauguração');
    expect(parsed.show_after_seconds).toBe(5);
    expect(parsed.show_only_once).toBe(false);
    expect(parsed.show_on_pages).toBe('all');
  });

  it('sanitizes and truncates html_content to 5000 chars', () => {
    const parsed = parsePopupInput({ html_content: '<script>alert(1)</script><p>ok</p>' });
    expect(parsed.html_content).not.toContain('<script>');
    const long = parsePopupInput({ html_content: '<p>' + 'a'.repeat(6000) + '</p>' });
    expect((long.html_content ?? '').length).toBeLessThanOrEqual(5000);
  });

  it('keeps image_url null when explicitly null', () => {
    const parsed = parsePopupInput({ image_url: null });
    expect(parsed.image_url).toBeNull();
  });
});

describe('validatePopupInput (create)', () => {
  const base: Partial<PopupDTO> = {
    title: 'Campanha',
    image_url: 'https://cdn/x.jpg',
    show_after_seconds: 5,
    show_on_pages: 'home',
    starts_at: VALID_START,
    ends_at: VALID_END,
  };

  it('returns no errors for a valid payload', () => {
    expect(validatePopupInput(base)).toEqual([]);
  });

  it('rejects title shorter than 2 or longer than 200', () => {
    expect(validatePopupInput({ ...base, title: 'a' }).some((e) => e.field === 'title')).toBe(true);
    expect(
      validatePopupInput({ ...base, title: 'a'.repeat(201) }).some((e) => e.field === 'title'),
    ).toBe(true);
  });

  it('rejects an invalid image_url', () => {
    expect(
      validatePopupInput({ ...base, image_url: 'not-a-url' }).some((e) => e.field === 'image_url'),
    ).toBe(true);
  });

  it('requires at least one of image_url or html_content', () => {
    const errors = validatePopupInput({ ...base, image_url: null, html_content: null });
    expect(errors.some((e) => e.field === 'image_url')).toBe(true);
  });

  it('accepts html_content alone (no image)', () => {
    expect(validatePopupInput({ ...base, image_url: null, html_content: '<p>oi</p>' })).toEqual([]);
  });

  it('rejects html_content longer than 5000', () => {
    const errors = validatePopupInput({ ...base, html_content: 'a'.repeat(5001) });
    expect(errors.some((e) => e.field === 'html_content')).toBe(true);
  });

  it('rejects show_after_seconds out of [0, 60]', () => {
    expect(
      validatePopupInput({ ...base, show_after_seconds: -1 }).some(
        (e) => e.field === 'show_after_seconds',
      ),
    ).toBe(true);
    expect(
      validatePopupInput({ ...base, show_after_seconds: 61 }).some(
        (e) => e.field === 'show_after_seconds',
      ),
    ).toBe(true);
  });

  it('rejects show_on_pages outside the enum', () => {
    expect(
      validatePopupInput({ ...base, show_on_pages: 'checkout' as never }).some(
        (e) => e.field === 'show_on_pages',
      ),
    ).toBe(true);
  });

  it('rejects non-ISO8601 dates', () => {
    expect(
      validatePopupInput({ ...base, starts_at: '01/06/2026' }).some((e) => e.field === 'starts_at'),
    ).toBe(true);
  });

  it('rejects ends_at <= starts_at', () => {
    const errors = validatePopupInput({ ...base, starts_at: VALID_END, ends_at: VALID_START });
    expect(errors.some((e) => e.field === 'ends_at')).toBe(true);
  });
});

describe('validatePopupInput (update)', () => {
  it('does not require title/dates when omitted', () => {
    expect(validatePopupInput({ show_after_seconds: 10, html_content: '<p>x</p>' }, true)).toEqual(
      [],
    );
  });

  it('still validates fields that are provided', () => {
    expect(
      validatePopupInput({ show_after_seconds: 999, html_content: '<p>x</p>' }, true).some(
        (e) => e.field === 'show_after_seconds',
      ),
    ).toBe(true);
  });
});
