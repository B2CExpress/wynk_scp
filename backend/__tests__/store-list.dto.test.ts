import { parseStoreListQuery } from '../src/dtos/store-list.dto';

describe('parseStoreListQuery', () => {
  it('returns defaults when query is empty', () => {
    expect(parseStoreListQuery({})).toEqual({
      category: undefined,
      featured: undefined,
      isRestaurant: undefined,
      search: undefined,
      page: 1,
      limit: 20,
    });
  });

  it('clamps limit > 50 to 50 silently (no 400)', () => {
    expect(parseStoreListQuery({ limit: '100' }).limit).toBe(50);
    expect(parseStoreListQuery({ limit: '999' }).limit).toBe(50);
  });

  it('falls back to defaults on invalid page/limit', () => {
    expect(parseStoreListQuery({ page: '0', limit: '-1' })).toMatchObject({
      page: 1,
      limit: 20,
    });
    expect(parseStoreListQuery({ page: 'abc' }).page).toBe(1);
  });

  it('normalizes search (lowercase + trim) before exposing', () => {
    // Mesmo valor após normalize → mesma chave de cache, mesma query.
    expect(parseStoreListQuery({ search: '  McDonald  ' }).search).toBe('mcdonald');
    expect(parseStoreListQuery({ search: 'MCDONALD' }).search).toBe('mcdonald');
  });

  it('treats empty/whitespace search as undefined', () => {
    expect(parseStoreListQuery({ search: '' }).search).toBeUndefined();
    expect(parseStoreListQuery({ search: '   ' }).search).toBeUndefined();
  });

  it('parses featured/is_restaurant strictly as true/false (case-insensitive)', () => {
    expect(parseStoreListQuery({ featured: 'true' }).featured).toBe(true);
    expect(parseStoreListQuery({ featured: 'FALSE' }).featured).toBe(false);
    // valores inválidos são ignorados — comportamento estrito (não 400)
    expect(parseStoreListQuery({ featured: '1' }).featured).toBeUndefined();
    expect(parseStoreListQuery({ featured: 'yes' }).featured).toBeUndefined();
  });

  it('keeps category as raw string (no normalize) — slug é case-sensitive', () => {
    expect(parseStoreListQuery({ category: 'Restaurantes' }).category).toBe('Restaurantes');
  });
});
