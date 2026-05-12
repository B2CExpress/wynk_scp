const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const DEFAULT_PAGE = 1;

export interface StoreListQuery {
  category?: string;
  featured?: boolean;
  isRestaurant?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export interface StoreListItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  floor: string | null;
  phone: string | null;
  isRestaurant: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface StoreListResponse {
  data: StoreListItem[];
  total: number;
  page: number;
  limit: number;
}

function parseBoolFlag(raw: unknown): boolean | undefined {
  if (typeof raw !== 'string') return undefined;
  if (raw.toLowerCase() === 'true') return true;
  if (raw.toLowerCase() === 'false') return false;
  return undefined;
}

function parsePositiveInt(raw: unknown, fallback: number, max?: number): number {
  if (typeof raw !== 'string') return fallback;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return max ? Math.min(n, max) : n;
}

function parseSearch(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const normalized = raw.toLowerCase().trim();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Extrai filtros da query string já normalizados e clampados.
 *
 * - `search` é lowercase+trim ANTES de compor cache key (alinhamento entre key e query).
 * - `limit > 50` é silenciosamente clampado para 50 (não retorna 400 — gotcha conhecido).
 * - `page < 1` ou inválido cai para 1.
 * - `featured` e `is_restaurant` aceitam APENAS `'true'`/`'false'` (case-insensitive); valores inválidos são ignorados.
 */
export function parseStoreListQuery(query: Record<string, unknown>): StoreListQuery {
  const category =
    typeof query.category === 'string' && query.category.length > 0 ? query.category : undefined;
  return {
    category,
    featured: parseBoolFlag(query.featured),
    isRestaurant: parseBoolFlag(query.is_restaurant),
    search: parseSearch(query.search),
    page: parsePositiveInt(query.page, DEFAULT_PAGE),
    limit: parsePositiveInt(query.limit, DEFAULT_LIMIT, MAX_LIMIT),
  };
}
