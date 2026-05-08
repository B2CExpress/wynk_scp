import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const PUBLIC_CACHE_SECONDS = 300;

export type Pagination = {
  page: number;
  limit: number;
  offset: number;
};

export function getTenantId(request: NextRequest): string | null {
  const tenantId = request.headers.get("x-tenant-id")?.trim();
  return tenantId ? tenantId : null;
}

export function createMissingTenantResponse(): NextResponse {
  return createJsonResponse(
    {
      error: "Missing x-tenant-id header.",
    },
    false,
    400,
  );
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
): Pagination {
  const page = clampInteger(searchParams.get("page"), defaults.page ?? 1, 1);
  const limit = clampInteger(
    searchParams.get("limit"),
    defaults.limit ?? 10,
    1,
    defaults.maxLimit ?? 20,
  );

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function parseBooleanParam(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return value === "true" || value === "1";
}

export function normalizeOptionalString(value: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function createListCacheKey(
  type: string,
  tenantId: string,
  filters: Record<string, unknown>,
): string {
  const filtersHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(filters))
    .digest("hex");

  return `${type}:list:${tenantId}:${filtersHash}`;
}

export function createJsonResponse(
  payload: unknown,
  hit: boolean,
  status = 200,
): NextResponse {
  const response = NextResponse.json(payload, { status });
  response.headers.set(
    "Cache-Control",
    `public, max-age=${PUBLIC_CACHE_SECONDS}, s-maxage=${PUBLIC_CACHE_SECONDS}`,
  );
  response.headers.set("Vary", "x-tenant-id");
  response.headers.set("X-Cache", hit ? "HIT" : "MISS");
  return response;
}

function clampInteger(
  value: string | null,
  fallback: number,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const parsed = Number.parseInt(value ?? "", 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}
