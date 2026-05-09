import 'server-only';

/**
 * Identidade pública do tenant retornada pelo backend `/tenant/resolve`.
 * Espelha o response shape declarado em
 * `backend/src/controllers/tenant.controller.ts:getTenantResolve`.
 */
export interface ResolvedTenant {
  id: string;
  slug: string;
  flavorSlug: string;
}

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

/**
 * Resolve o tenant pelo `host` HTTP via backend.
 *
 * O backend já cacheia o resultado em Redis (TTL 10 min — SPEC-1505), então
 * a chamada fetch aqui é barata em cache hit. Mantemos `cache: 'no-store'`
 * pra evitar que o Next data cache crie uma camada extra de cache (e atraso
 * a invalidação quando a config do tenant mudar no banco).
 *
 * Lança em caso de erro de rede ou 5xx; retorna `null` em 404.
 * Caller decide UX (`notFound()` do Next ou fallback pro `_default`).
 */
export async function resolveTenantByHost(host: string): Promise<ResolvedTenant | null> {
  const url = `${BACKEND_URL}/tenant/resolve`;
  // Node fetch (undici) reescreve o `Host` header a partir da URL, então o
  // host do tenant viaja em `X-Forwarded-Host`. O backend roda com
  // `app.set('trust proxy', true)`, então `req.hostname` reflete esse header.
  const res = await fetch(url, {
    headers: { 'X-Forwarded-Host': host },
    cache: 'no-store',
  });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`tenant resolve failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as ResolvedTenant;
}
