import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ilike, inArray, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// ATENÇÃO: ajuste estes imports ao schema real quando ele existir.
// Placeholders baseados na convenção Drizzle (camelCase → snake_case no banco).
// ---------------------------------------------------------------------------
import { db } from '@/lib/db'
import { stores, categories, storeCategories } from '@/lib/schema'

import {
  buildStoreListCacheKey,
  cached,
  type StoreListParams,
} from '@/lib/cache'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CACHE_TTL = 300          // 5 minutos
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

// ---------------------------------------------------------------------------
// Tipos de resposta
// ---------------------------------------------------------------------------

interface StoreCategory {
  slug: string
  name: string
}

interface StoreListItem {
  id: string
  name: string
  slug: string
  logo_url: string | null
  cover_image_url: string | null
  floor: string | null
  phone: string | null
  is_restaurant: boolean
  categories: StoreCategory[]
}

interface StoreListResponse {
  data: StoreListItem[]
  total: number
  page: number
  limit: number
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Tenant obrigatório (injetado pelo middleware)
  const tenantId = request.headers.get('x-tenant-id')
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing x-tenant-id header' }, { status: 400 })
  }

  // 2. Query params
  const { searchParams } = request.nextUrl
  const rawLimit = parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10)

  const params: StoreListParams = {
    category: searchParams.get('category') ?? undefined,
    featured: searchParams.get('featured') ?? undefined,
    isRestaurant: searchParams.get('is_restaurant') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    page: Math.max(1, isNaN(rawPage) ? 1 : rawPage),
    limit: Math.min(MAX_LIMIT, Math.max(1, isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit)),
  }

  // 3. Cache
  const cacheKey = buildStoreListCacheKey(tenantId, params)

  const { data: result, hit } = await cached<StoreListResponse>(
    cacheKey,
    CACHE_TTL,
    () => fetchStores(tenantId, params),
  )

  // 4. Response com headers de cache
  return NextResponse.json(result, {
    status: 200,
    headers: cacheHeaders(hit),
  })
}

// ---------------------------------------------------------------------------
// Lógica de query
// ---------------------------------------------------------------------------

async function fetchStores(tenantId: string, params: StoreListParams): Promise<StoreListResponse> {
  const { category, featured, isRestaurant, search, page, limit } = params
  const offset = (page - 1) * limit

  // --- Condições base ---
  const conditions = [
    eq(stores.tenantId, tenantId),
    eq(stores.status, 'active'),
  ]

  if (featured === 'true') {
    conditions.push(eq(stores.isFeatured, true))
  }
  if (isRestaurant === 'true') {
    conditions.push(eq(stores.isRestaurant, true))
  }
  if (isRestaurant === 'false') {
    conditions.push(eq(stores.isRestaurant, false))
  }
  if (search) {
    conditions.push(ilike(stores.name, `%${search}%`))
  }

  // --- Filtro por categoria via subquery ---
  // JOIN garante que só categorias do mesmo tenant entram
  if (category) {
    const storeIdsWithCategory = db
      .select({ id: storeCategories.storeId })
      .from(storeCategories)
      .innerJoin(categories, eq(storeCategories.categoryId, categories.id))
      .where(and(
        eq(categories.slug, category),
        eq(storeCategories.tenantId, tenantId),
      ))
    conditions.push(inArray(stores.id, storeIdsWithCategory))
  }

  const where = and(...conditions)

  // --- Count total (sem limit/offset) ---
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(stores)
    .where(where)

  // --- Listagem paginada ---
  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      logo_url: stores.logoUrl,
      cover_image_url: stores.coverImageUrl,
      floor: stores.floor,
      phone: stores.phone,
      is_restaurant: stores.isRestaurant,
    })
    .from(stores)
    .where(where)
    .orderBy(stores.sortOrder, stores.name)
    .limit(limit)
    .offset(offset)

  // --- Categorias dos resultados (query separada, agrupada em memória) ---
  const data = await attachCategories(rows, tenantId)

  return { data, total, page, limit }
}

// ---------------------------------------------------------------------------
// Busca categorias para um conjunto de stores e agrupa por storeId
// ---------------------------------------------------------------------------

async function attachCategories(
  rows: Omit<StoreListItem, 'categories'>[],
  tenantId: string,
): Promise<StoreListItem[]> {
  if (rows.length === 0) return []

  const storeIds = rows.map((r) => r.id)

  const cats = await db
    .select({
      storeId: storeCategories.storeId,
      slug: categories.slug,
      name: categories.name,
    })
    .from(storeCategories)
    .innerJoin(categories, eq(storeCategories.categoryId, categories.id))
    .where(and(
      inArray(storeCategories.storeId, storeIds),
      eq(storeCategories.tenantId, tenantId),   // isolamento por tenant
    ))

  // Agrupa categorias por storeId
  const catsByStore = cats.reduce<Record<string, StoreCategory[]>>((acc, cat) => {
    if (!acc[cat.storeId]) acc[cat.storeId] = []
    acc[cat.storeId].push({ slug: cat.slug, name: cat.name })
    return acc
  }, {})

  return rows.map((row) => ({
    ...row,
    categories: catsByStore[row.id] ?? [],
  }))
}

// ---------------------------------------------------------------------------
// Headers de cache
// ---------------------------------------------------------------------------

function cacheHeaders(hit: boolean): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=300, s-maxage=300',
    'Vary': 'x-tenant-id',
    'X-Cache': hit ? 'HIT' : 'MISS',
  }
}