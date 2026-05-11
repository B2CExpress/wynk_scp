import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';

/**
 * Identidade operacional do tenant ativo na request corrente.
 * Populada pelo middleware `tenantContextMiddleware` e consumida por
 * subscribers TypeORM, helpers de query e qualquer service que precise saber
 * de qual tenant é o trabalho.
 */
export interface TenantContext {
  tenantId: string;
  slug: string;
  flavorSlug: string;
}

const storage = new AsyncLocalStorage<TenantContext>();

/**
 * Retorna o contexto do tenant na request atual, ou `undefined` se a request
 * está fora do escopo de um tenant (ex.: health check, login antes de resolver host).
 */
export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

/**
 * Versão estrita: lança se não houver contexto. Usar quando o caller assume
 * que está dentro de uma request multitenant.
 */
export function requireTenantContext(): TenantContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error('No tenant context available — request fora do escopo multitenant');
  }
  return ctx;
}

/**
 * Roda `fn` com o `ctx` populado no AsyncLocalStorage. Útil em testes,
 * scripts e workers que não passam pelo middleware Express.
 */
export function runWithTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/**
 * Middleware Express que popula o AsyncLocalStorage com o `TenantContext` da
 * request. Espera que algum middleware anterior (ex.: `resolveTenantByHost`,
 * a vir na fase 3) tenha anexado `req.tenant` com a identidade resolvida.
 *
 * Sem `req.tenant` populado, segue sem contexto — controllers que precisam
 * de tenant devem usar `requireTenantContext()` e falhar explicitamente.
 */
export function tenantContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const tenant = (req as Request & { tenant?: TenantContext }).tenant;
  if (!tenant) {
    return next();
  }
  storage.run(tenant, () => next());
}
