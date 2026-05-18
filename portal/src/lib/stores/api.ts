import 'server-only';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

export interface PublicStoreCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PublicStoreListItem {
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

export interface PublicStoreListResponse {
  data: PublicStoreListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PublicStoreDetail extends PublicStoreListItem {
  tenantId: string;
  description: string | null;
  externalUrl: string | null;
  openingHours: Record<string, unknown> | null;
  status: string;
  categories: PublicStoreCategory[];
}

async function fetchFromBackend<T>(
  host: string,
  pathname: string,
  query?: URLSearchParams,
): Promise<T> {
  const url = `${BACKEND_URL}${pathname}${query && query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, {
    headers: { 'X-Forwarded-Host': host },
    cache: 'no-store',
  });

  if (response.status === 404) {
    throw new Error('not_found');
  }
  if (!response.ok) {
    throw new Error(`backend_request_failed:${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchStoreCategories(host: string): Promise<PublicStoreCategory[]> {
  const response = await fetchFromBackend<{ data: PublicStoreCategory[] }>(
    host,
    '/api/v1/store-categories',
  );
  return response.data;
}

export async function fetchStores(
  host: string,
  filters: {
    search?: string;
    category?: string;
    featured?: boolean;
    isRestaurant?: boolean;
    page?: number;
    limit?: number;
  },
): Promise<PublicStoreListResponse> {
  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.category) query.set('category', filters.category);
  if (filters.featured !== undefined) query.set('featured', String(filters.featured));
  if (filters.isRestaurant !== undefined) query.set('is_restaurant', String(filters.isRestaurant));
  if (filters.page) query.set('page', String(filters.page));
  if (filters.limit) query.set('limit', String(filters.limit));

  return fetchFromBackend<PublicStoreListResponse>(host, '/api/v1/stores', query);
}

export async function fetchStoreDetail(host: string, slug: string): Promise<PublicStoreDetail> {
  return fetchFromBackend<PublicStoreDetail>(host, `/api/v1/stores/${encodeURIComponent(slug)}`);
}
