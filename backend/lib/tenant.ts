import { headers } from 'next/headers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Tenant = {
  id: string
  slug: string
  name: string
  host: string
  logo_url: string | null
  theme: Record<string, string> // ex: { primary: '#00408f', font: 'Roboto' }
  status: 'active' | 'inactive'
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------
// Placeholder: troque por seu client real (pg, postgres.js, Prisma, etc.)
// A query é intencionalmente simples — cache Redis virá em SPEC separada.

async function queryTenantByField(
  field: 'host' | 'slug' | 'id',
  value: string,
): Promise<Tenant | null> {
  // TODO: substituir pelo client de banco do projeto
  // Exemplo com postgres.js:
  //   const [row] = await sql`
  //     SELECT id, slug, name, host, logo_url, theme, status
  //     FROM tenants
  //     WHERE ${sql(field)} = ${value}
  //     LIMIT 1
  //   `
  //   return row ?? null
  throw new Error(
    `queryTenantByField: client de banco não configurado. ` +
    `Implemente com o client escolhido para o projeto.`,
  )
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Resolve tenant pelo host (hostname sem porta).
 * Retorna null se não encontrado ou status != 'active'.
 *
 * Chamado pelo middleware em toda request de produção.
 */
export async function getTenantByHost(hostname: string): Promise<Tenant | null> {
  const tenant = await queryTenantByField('host', hostname)
  if (!tenant || tenant.status !== 'active') return null
  return tenant
}

/**
 * Resolve tenant pelo slug.
 * Usado como fallback em desenvolvimento (header X-Tenant-Slug).
 * Retorna null se não encontrado ou status != 'active'.
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const tenant = await queryTenantByField('slug', slug)
  if (!tenant || tenant.status !== 'active') return null
  return tenant
}

/**
 * Retorna o tenant da request atual em Server Components.
 *
 * Lê x-tenant-id injetado pelo middleware e faz uma query para obter
 * a struct completa. Com Redis (SPEC futura), essa query vai do cache.
 *
 * Lança erro se chamado fora do contexto de request ou se o header
 * estiver ausente (indica que o middleware não rodou — bug de config).
 *
 * @example
 *   // Em qualquer Server Component:
 *   const tenant = await getCurrentTenant()
 *   return <h1>{tenant.name}</h1>
 */
export async function getCurrentTenant(): Promise<Tenant> {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    throw new Error(
      'getCurrentTenant: header x-tenant-id ausente. ' +
      'Verifique se o middleware está configurado corretamente.',
    )
  }

  const tenant = await queryTenantByField('id', tenantId)

  if (!tenant) {
    throw new Error(
      `getCurrentTenant: tenant id="${tenantId}" não encontrado no banco. ` +
      `Inconsistência entre middleware e banco de dados.`,
    )
  }

  return tenant
}