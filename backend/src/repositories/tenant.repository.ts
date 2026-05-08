import type { DataSource, Repository } from 'typeorm';
import { Tenant } from '../entities/Tenant';

/**
 * Wrapper sobre o repository TypeORM da entity Tenant. Expõe apenas as
 * operações usadas pelos services — evita vazar a interface ampla do
 * `Repository<Tenant>` pra fora.
 *
 * NÃO usar `withTenant()` aqui: a tabela `tb_tenant` em si é o catálogo
 * de tenants e não tem coluna `tenant_id` separada.
 */
export class TenantRepository {
  private readonly repo: Repository<Tenant>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Tenant);
  }

  findByHost(host: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { host } });
  }

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { slug } });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { id } });
  }
}
