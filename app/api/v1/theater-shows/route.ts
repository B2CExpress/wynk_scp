import { NextRequest } from "next/server";

import { cached } from "../../../../lib/cache";
import {
  createJsonResponse,
  createListCacheKey,
  createMissingTenantResponse,
  getTenantId,
  parsePagination,
  PUBLIC_CACHE_SECONDS,
  type Pagination,
} from "../../../../lib/public-editorial";

type PublicTheaterShowItem = {
  id: string;
  title: string;
  synopsis: string | null;
  cover_image_url: string | null;
  duration_minutes: number | null;
  age_rating: string | null;
  next_session_at: string | null;
  sessions_count: number;
};

type TheaterShowsListResponse = {
  data: PublicTheaterShowItem[];
  total: number;
  page: number;
  limit: number;
};

export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return createMissingTenantResponse();
  }

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams, {
    page: 1,
    limit: 10,
    maxLimit: 20,
  });

  const cacheKey = createListCacheKey("theater-shows", tenantId, {
    page: pagination.page,
    limit: pagination.limit,
  });

  const { data, hit } = await cached(cacheKey, PUBLIC_CACHE_SECONDS, async () =>
    listPublishedTheaterShows({
      tenantId,
      pagination,
    }),
  );

  return createJsonResponse(data, hit);
}

async function listPublishedTheaterShows(params: {
  tenantId: string;
  pagination: Pagination;
}): Promise<TheaterShowsListResponse> {
  void params;

  // TODO: substituir pelo acesso real ao banco com isolamento por tenant.
  // Filtros esperados:
  // - tenant_id = params.tenantId
  // - status = "published"
  // - published_at <= now()
  // - apenas pecas com sessoes futuras
  // - next_session_at = MIN(starts_at) das sessoes futuras
  // - sessions_count = COUNT(*) das sessoes futuras
  // - order by next_session_at asc
  return {
    data: [],
    total: 0,
    page: params.pagination.page,
    limit: params.pagination.limit,
  };
}
