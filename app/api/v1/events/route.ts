import { NextRequest } from "next/server";

import { cached } from "../../../../lib/cache";
import {
  createJsonResponse,
  createListCacheKey,
  createMissingTenantResponse,
  getTenantId,
  parseBooleanParam,
  parsePagination,
  PUBLIC_CACHE_SECONDS,
  type Pagination,
} from "../../../../lib/public-editorial";

type PublicEventItem = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  ticket_info: string | null;
};

type EventsListResponse = {
  data: PublicEventItem[];
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
  const includePast = parseBooleanParam(searchParams.get("include_past"));

  const cacheKey = createListCacheKey("events", tenantId, {
    page: pagination.page,
    limit: pagination.limit,
    include_past: includePast,
  });

  const { data, hit } = await cached(cacheKey, PUBLIC_CACHE_SECONDS, async () =>
    listPublishedEvents({
      tenantId,
      pagination,
      includePast,
    }),
  );

  return createJsonResponse(data, hit);
}

async function listPublishedEvents(params: {
  tenantId: string;
  pagination: Pagination;
  includePast: boolean;
}): Promise<EventsListResponse> {
  void params;

  // TODO: substituir pelo acesso real ao banco com isolamento por tenant.
  // Filtros esperados:
  // - tenant_id = params.tenantId
  // - status = "published"
  // - published_at <= now()
  // - starts_at >= now() por padrao
  // - se includePast=true, remover o filtro de futuros
  // - order by starts_at asc
  return {
    data: [],
    total: 0,
    page: params.pagination.page,
    limit: params.pagination.limit,
  };
}
