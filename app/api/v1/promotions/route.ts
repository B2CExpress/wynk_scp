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

type PromotionStoreSummary = {
  slug: string;
  name: string;
  logo_url: string | null;
};

type PublicPromotionItem = {
  id: string;
  title: string;
  discount_label: string | null;
  image_url: string | null;
  valid_until: string;
  store: PromotionStoreSummary | null;
};

type PromotionsListResponse = {
  data: PublicPromotionItem[];
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
  const storeId = normalizeOptionalString(searchParams.get("store_id"));

  const cacheKey = createListCacheKey("promotions", tenantId, {
    page: pagination.page,
    limit: pagination.limit,
    store_id: storeId,
  });

  const { data, hit } = await cached(cacheKey, PUBLIC_CACHE_SECONDS, async () =>
    listPublishedPromotions({
      tenantId,
      pagination,
      storeId,
    }),
  );

  return createJsonResponse(data, hit);
}

async function listPublishedPromotions(params: {
  tenantId: string;
  pagination: Pagination;
  storeId?: string;
}): Promise<PromotionsListResponse> {
  void params;

  // TODO: substituir pelo acesso real ao banco com isolamento por tenant.
  // Filtros esperados:
  // - tenant_id = params.tenantId
  // - status = "published"
  // - published_at <= now()
  // - valid_until >= now()
  // - join com stores para slug, name e logo_url
  // - store_id = params.storeId quando informado
  return {
    data: [],
    total: 0,
    page: params.pagination.page,
    limit: params.pagination.limit,
  };
}
