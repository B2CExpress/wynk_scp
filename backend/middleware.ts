import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getTenantByHost, getTenantBySlug } from '@/lib/tenant'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const hostname = host.split(':')[0] // remove porta (ex: tenant1.local:3000 → tenant1.local)

  // Fallback de desenvolvimento: aceita header X-Tenant-Slug
  // Útil para Postman/curl sem precisar configurar /etc/hosts
  const devSlug =
    process.env.NODE_ENV === 'development'
      ? request.headers.get('x-tenant-slug')
      : null

  const tenant = devSlug
    ? await getTenantBySlug(devSlug)
    : await getTenantByHost(hostname)

  if (!tenant) {
    // Rewrite (não redirect) para manter a URL original e retornar 404
    const notFoundUrl = new URL('/tenant-not-found', request.url)
    return NextResponse.rewrite(notFoundUrl, { status: 404 })
  }

  // Injeta tenant nos headers para consumo pelos Server Components via getCurrentTenant()
  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenant.id)
  response.headers.set('x-tenant-slug', tenant.slug)
  return response
}

export const config = {
  matcher: [
    /*
     * Executa o middleware em TODAS as rotas, exceto:
     * - _next/static  (arquivos estáticos compilados)
     * - _next/image   (otimização de imagens do Next)
     * - favicon.ico
     * - Arquivos com extensão (imagens, fontes, etc.)
     *
     * Sem esse matcher cada request de asset executa query no banco.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|css|js)$).*)',
  ],
}