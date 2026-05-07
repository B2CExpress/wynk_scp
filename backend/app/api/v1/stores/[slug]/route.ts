import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// ATENÇÃO: ajuste estes imports ao schema real quando ele existir.
// ---------------------------------------------------------------------------
import { db } from '@/lib/db'
import { stores, categories, storeCategories } from '@/lib/schema'

import { buildStoreDetailCacheKey, cached } from '@/lib/cache'

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const CACHE_TTL = 300   // 5 minutos

// ---------------------------------------------------------------------------
// Tipos de resposta
// ---------------------------------------------------------------------------

interface StoreCategory {
  slug: string
  name: string
}

interface OpeningHoursDay {
  open: string
  close: string
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

interface StoreDetailResponse {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  external_url: string | null
  floor: string | null
  phone: string | null
  opening_hours: Partial<Record<DayKey, OpeningHoursDay>> | null
  is_restaurant: boolean
  categories: StoreCategory[]
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse> {
  // 1. Tenant obrigatório (injetado pelo middleware)
  const tenantId = request.headers.get('x-tenant-id')
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing x-tenant-id header' }, { status: 400 })
  }

  const { slug } = params

  // 2. Cache
  const cacheKey = buildStoreDetailCacheKey(tenantId, slug)

  const { data: result, hit } = await cached<StoreDetailResponse | null>(
    cacheKey,
    CACHE_TTL,
    () => fetchStoreDetail(tenantId, slug),
  )

  // 3. 404 se não encontrado (ou de outro tenant, ou inativo)
  if (!result) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  return NextResponse.json(result, {
    status: 200,
    headers: cacheHeaders(hit),
  })
}

// ---------------------------------------------------------------------------
// Lógica de query
// ---------------------------------------------------------------------------

async function fetchStoreDetail(
  tenantId: string,
  slug: string,
): Promise<StoreDetailResponse | null> {
  // Busca loja filtrando por tenant + slug + status active
  // Isso garante 404 para: slug inexistente, slug de outro tenant, loja inativa
  const [store] = await db
    .select({
      id: stores.id,
      name: stores.name,
      slug: stores.slug,
      description: stores.description,
      logo_url: stores.logoUrl,
      cover_image_url: stores.coverImageUrl,
      external_url: stores.externalUrl,
      floor: stores.floor,
      phone: stores.phone,
      opening_hours: stores.openingHours,
      is_restaurant: stores.isRestaurant,
    })
    .from(stores)
    .where(and(
      eq(stores.tenantId, tenantId),
      eq(stores.slug, slug),
      eq(stores.status, 'active'),
    ))
    .limit(1)

  if (!store) return null

  // Busca categorias com isolamento por tenant
  const cats = await db
    .select({
      slug: categories.slug,
      name: categories.name,
    })
    .from(storeCategories)
    .innerJoin(categories, eq(storeCategories.categoryId, categories.id))
    .where(and(
      eq(storeCategories.storeId, store.id),
      eq(storeCategories.tenantId, tenantId),   // isolamento por tenant
    ))

  return {
    ...store,
    categories: cats,
  }
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