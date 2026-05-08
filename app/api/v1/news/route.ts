import { NextRequest } from "next/server";

import { cached } from "../../../../lib/cache";
import {
  createJsonResponse,
  createListCacheKey,
  createMissingTenantResponse,
  getTenantId,
  normalizeOptionalString,
  parsePagination,
  PUBLIC_CACHE_SECONDS,
  type Pagination,
} from "../../../../lib/public-editorial";

type PublicNewsItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image_url: string | null;
  category: string | null;
  published_at: string;
};

type NewsListResponse = {
  data: PublicNewsItem[];
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
  const category = normalizeOptionalString(searchParams.get("category"));

  const cacheKey = createListCacheKey("news", tenantId, {
    page: pagination.page,
    limit: pagination.limit,
    category,
  });

  const { data, hit } = await cached(cacheKey, PUBLIC_CACHE_SECONDS, async () =>
    listPublishedNews({
      tenantId,
      pagination,
      category,
    }),
  );

  return createJsonResponse(data, hit);
}

async function listPublishedNews(params: {
  tenantId: string;
  pagination: Pagination;
  category?: string;
}): Promise<NewsListResponse> {
  void params;

  // TODO: substituir pelo acesso real ao banco com isolamento por tenant.
  // Filtros esperados:
  // - tenant_id = params.tenantId
  // - status = "published"
  // - published_at <= now()
  // - category = params.category (quando informado)
  // - order by published_at desc
  // - limit/offset via params.pagination
  return {
    data: [],
    total: 0,
    page: params.pagination.page,
    limit: params.pagination.limit,
  };
}
