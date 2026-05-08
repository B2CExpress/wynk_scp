import { NextRequest } from "next/server";

import { cached } from "../../../../lib/cache";
import {
  createJsonResponse,
  createListCacheKey,
  createMissingTenantResponse,
  getTenantId,
  normalizeOptionalString,
  PUBLIC_CACHE_SECONDS,
} from "../../../../lib/public-editorial";

type PublicServiceItem = {
  id: string;
  title: string;
  slug: string;
  icon_url: string | null;
  category: string | null;
  location: string | null;
};

type ServicesListResponse = {
  data: PublicServiceItem[];
};

export async function GET(request: NextRequest) {
  const tenantId = getTenantId(request);
  if (!tenantId) {
    return createMissingTenantResponse();
  }

  const { searchParams } = new URL(request.url);
  const category = normalizeOptionalString(searchParams.get("category"));

  const cacheKey = createListCacheKey("services", tenantId, {
    category,
  });

  const { data, hit } = await cached(cacheKey, PUBLIC_CACHE_SECONDS, async () =>
    listActiveServices({
      tenantId,
      category,
    }),
  );

  return createJsonResponse(data, hit);
}

async function listActiveServices(params: {
  tenantId: string;
  category?: string;
}): Promise<ServicesListResponse> {
  void params;

  // TODO: substituir pelo acesso real ao banco com isolamento por tenant.
  // Filtros esperados:
  // - tenant_id = params.tenantId
  // - status = "active"
  // - category = params.category quando informado
  // - order by sort_order asc
  return {
    data: [],
  };
}
