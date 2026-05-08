import type { Request, Response } from 'express';

/**
 * Handler de `GET /tenant/resolve`. O middleware
 * `resolveTenantByHostMiddleware` (anterior no pipeline) já populou
 * `req.tenant` ou cortou o request com 404. Aqui só serializamos a
 * identidade pública do tenant.
 *
 * Resposta: `{ id, slug, flavorSlug }` — apenas o necessário pro portal
 * Next.js carregar o flavor correto. NÃO vaza `createdAt`/`updatedAt`
 * nem outros campos internos.
 */
export function getTenantResolve(req: Request, res: Response): void {
  const tenant = req.tenant;
  if (!tenant) {
    // Não deveria acontecer — middleware anterior teria respondido 404.
    res.status(500).json({ error: 'tenant_context_missing' });
    return;
  }
  res.json({
    id: tenant.tenantId,
    slug: tenant.slug,
    flavorSlug: tenant.flavorSlug,
  });
}
