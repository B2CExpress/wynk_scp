import Redis from 'ioredis'

// ---------------------------------------------------------------------------
// Singleton Redis
// ---------------------------------------------------------------------------

let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,        // falha rápido — fallback no banco
      enableReadyCheck: false,
      lazyConnect: true,
    })
    _redis.on('error', (err) => {
      // Logamos mas não derrubamos o processo — Redis é cache, não fonte de verdade
      console.error('[cache] Redis error:', err.message)
    })
  }
  return _redis
}

// ---------------------------------------------------------------------------
// cached<T> — wrapper genérico get/set com fallback gracioso
// ---------------------------------------------------------------------------

export interface CacheResult<T> {
  data: T
  hit: boolean
}

/**
 * Tenta ler `key` do Redis. Se miss (ou Redis indisponível), executa `fetchFn`,
 * grava o resultado com TTL e retorna. Redis fora do ar nunca causa erro 500.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<CacheResult<T>> {
  const redis = getRedis()

  // --- tentativa de leitura ---
  try {
    const raw = await redis.get(key)
    if (raw !== null) {
      return { data: JSON.parse(raw) as T, hit: true }
    }
  } catch {
    // Redis indisponível: segue para o banco
  }

  // --- miss: executa query ---
  const data = await fetchFn()

  // --- tenta gravar no cache (falha silenciosa) ---
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds)
  } catch {
    // ignora — degradação graciosa
  }

  return { data, hit: false }
}

// ---------------------------------------------------------------------------
// Invalidação de lojas
// ---------------------------------------------------------------------------

const SCAN_COUNT = 100

/**
 * Remove TODAS as chaves de listagem de lojas de um tenant usando SCAN (não KEYS).
 * Seguro para Redis em produção — não bloqueia o event loop.
 */
export async function invalidateStoresCache(tenantId: string): Promise<void> {
  const redis = getRedis()
  const pattern = `stores:list:${tenantId}:*`

  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', SCAN_COUNT)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (err) {
    console.error('[cache] invalidateStoresCache error:', (err as Error).message)
  }
}

/**
 * Remove a chave de detalhe de uma loja específica.
 */
export async function invalidateStoreDetailCache(tenantId: string, slug: string): Promise<void> {
  const redis = getRedis()
  try {
    await redis.del(`stores:detail:${tenantId}:${slug}`)
  } catch (err) {
    console.error('[cache] invalidateStoreDetailCache error:', (err as Error).message)
  }
}

/**
 * Invalida listagem + detalhe de um tenant.
 * Chamar após qualquer POST/PUT/DELETE de stores ou categories no admin.
 */
export async function invalidateAllStoresCaches(tenantId: string, slug?: string): Promise<void> {
  await Promise.all([
    invalidateStoresCache(tenantId),
    slug ? invalidateStoreDetailCache(tenantId, slug) : Promise.resolve(),
  ])
}

// ---------------------------------------------------------------------------
// Utilitário: monta chave de cache de listagem com params ordenados
// ---------------------------------------------------------------------------

export interface StoreListParams {
  category?: string
  featured?: string
  isRestaurant?: string
  search?: string
  page: number
  limit: number
}

/**
 * Gera chave estável independente da ordem dos query params.
 * Params ordenados alfabeticamente para evitar cache duplicado.
 */
export function buildStoreListCacheKey(tenantId: string, params: StoreListParams): string {
  // Ordenados alfabeticamente: cat, feat, l, p, q, rest
  const parts = [
    `cat=${params.category ?? ''}`,
    `feat=${params.featured ?? ''}`,
    `l=${params.limit}`,
    `p=${params.page}`,
    `q=${params.search ?? ''}`,
    `rest=${params.isRestaurant ?? ''}`,
  ]
  return `stores:list:${tenantId}:${parts.join(':')}`
}

export function buildStoreDetailCacheKey(tenantId: string, slug: string): string {
  return `stores:detail:${tenantId}:${slug}`
}