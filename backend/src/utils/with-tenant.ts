/**
 * TODA query que toca dados de tenant deve usar este helper.
 */
import type {
  SelectQueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder,
  Repository,
  FindOptionsWhere,
  ObjectLiteral,
} from 'typeorm';
import { requireTenantContext } from '../middleware/tenant-context';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertTenantId(tenantId: string): void {
  if (!tenantId || !tenantId.trim()) {
    throw new Error('tenantId obrigatorio em withTenant');
  }

  if (!UUID_V4_REGEX.test(tenantId)) {
    throw new Error('tenantId invalido em withTenant: formato UUID v4 obrigatorio');
  }
}

function ensureTenantColumnOnMetadata(qb: unknown): void {
  const mainAlias = (qb as {
    expressionMap?: {
      mainAlias?: {
        targetName?: string;
        metadata?: {
          findColumnWithPropertyName?: (name: string) => unknown;
          findColumnWithDatabaseName?: (name: string) => unknown;
        };
      };
    };
  }).expressionMap?.mainAlias;

  const metadata = mainAlias?.metadata;
  if (!metadata) {
    return;
  }

  const hasTenantByProperty = Boolean(metadata.findColumnWithPropertyName?.('tenantId'));
  const hasTenantByDbName = Boolean(metadata.findColumnWithDatabaseName?.('tenant_id'));
  if (!hasTenantByProperty && !hasTenantByDbName) {
    throw new Error(
      `Tabela ${mainAlias?.targetName ?? 'desconhecida'} sem tenant_id nao pode usar withTenant`,
    );
  }
}

/**
 * Aplica `WHERE <alias>.tenant_id = :tenantId` a um QueryBuilder, garantindo
 * isolamento de dados por tenant. Le o `tenantId` do `AsyncLocalStorage`
 * via `requireTenantContext()` e falha explicitamente se chamado fora de
 * uma request multitenant.
 *
 * Uso tipico em repositorios:
 *
 * ```ts
 * const stores = await withTenant(
 *   storeRepository.createQueryBuilder('store'),
 * ).getMany();
 * ```
 *
 * Se a tabela nao tem coluna `tenant_id` (ex.: `tb_tenant`), NAO use
 * `withTenant` - a propria PK ja e o `tenant_id`.
 */
export function withTenant<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
): SelectQueryBuilder<T> {
  const ctx = requireTenantContext();
  const alias = qb.alias;
  return qb.andWhere(`${alias}.tenant_id = :__tenantId`, {
    __tenantId: ctx.tenantId,
  });
}

export interface TenantScopedDb {
  tenantId: string;
  /**
   * Aplica escopo de tenant em um SELECT QueryBuilder.
   *
   * @example
   * const scoped = withTenantScope('11111111-1111-4111-8111-111111111111');
   * const qb = scoped.select(repo.createQueryBuilder('store'));
   * const rows = await qb.andWhere('store.store_status = :status', { status: 'active' }).getMany();
   */
  select<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T>;
  /**
   * Injeta `tenantId` em payload de INSERT.
   * Se `tenantId` vier diferente no payload, falha.
   *
   * @example
   * const scoped = withTenantScope('11111111-1111-4111-8111-111111111111');
   * const values = scoped.insertValues({ name: 'Store X' });
   * await repo.insert(values);
   */
  insertValues<T extends Record<string, unknown>>(values: T): T & { tenantId: string };
  /**
   * Aplica escopo de tenant em um UPDATE QueryBuilder.
   *
   * @example
   * const scoped = withTenantScope('11111111-1111-4111-8111-111111111111');
   * await scoped.update(repo.createQueryBuilder('store').update().set({ name: 'Novo' })).execute();
   */
  update<T extends ObjectLiteral>(qb: UpdateQueryBuilder<T>): UpdateQueryBuilder<T>;
  /**
   * Aplica escopo de tenant em um DELETE QueryBuilder.
   *
   * @example
   * const scoped = withTenantScope('11111111-1111-4111-8111-111111111111');
   * await scoped.delete(repo.createQueryBuilder('store').delete()).execute();
   */
  delete<T extends ObjectLiteral>(qb: DeleteQueryBuilder<T>): DeleteQueryBuilder<T>;
  /**
   * Resolve um registro com `tenantId` acoplado ao filtro.
   *
   * @example
   * const scoped = withTenantScope('11111111-1111-4111-8111-111111111111');
   * const store = await scoped.findOne(storeRepo, { slug: 'loja-x' });
   */
  findOne<T extends ObjectLiteral>(
    repo: Repository<T>,
    where: FindOptionsWhere<T>,
  ): Promise<T | null>;
}

/**
 * Escopo explicito por tenant para operacoes de query.
 * Util para scripts e pontos fora de request/AsyncLocalStorage.
 */
export function withTenantScope(tenantId: string): TenantScopedDb {
  assertTenantId(tenantId);

  function addTenantFilter<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T>;
  function addTenantFilter<T extends ObjectLiteral>(qb: UpdateQueryBuilder<T>): UpdateQueryBuilder<T>;
  function addTenantFilter<T extends ObjectLiteral>(qb: DeleteQueryBuilder<T>): DeleteQueryBuilder<T>;
  function addTenantFilter<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T> | UpdateQueryBuilder<T> | DeleteQueryBuilder<T>,
  ) {
    ensureTenantColumnOnMetadata(qb);
    const alias = qb.alias;
    return qb.andWhere(`${alias}.tenant_id = :__tenantId`, {
      __tenantId: tenantId,
    });
  }

  return {
    tenantId,
    select<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
      return addTenantFilter(qb);
    },
    insertValues<T extends Record<string, unknown>>(values: T): T & { tenantId: string } {
      const current = values.tenantId;
      if (typeof current === 'string' && current && current !== tenantId) {
        throw new Error('tenantId do payload diverge do tenant escopado em withTenant');
      }
      return { ...values, tenantId };
    },
    update<T extends ObjectLiteral>(qb: UpdateQueryBuilder<T>): UpdateQueryBuilder<T> {
      return addTenantFilter(qb);
    },
    delete<T extends ObjectLiteral>(qb: DeleteQueryBuilder<T>): DeleteQueryBuilder<T> {
      return addTenantFilter(qb);
    },
    findOne<T extends ObjectLiteral>(
      repo: Repository<T>,
      where: FindOptionsWhere<T>,
    ): Promise<T | null> {
      return repo.findOne({
        where: { ...where, tenantId } as FindOptionsWhere<T>,
      });
    },
  };
}
