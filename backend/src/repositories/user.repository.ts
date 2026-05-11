import type { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User';

/**
 * Wrapper sobre o repository TypeORM da entity User. Expõe apenas as
 * operações usadas pelos services.
 *
 * Operações de leitura usam `(tenantId, email)` como chave: o domínio
 * "user único globalmente" não existe nesta SPEC.
 */
export class UserRepository {
  private readonly repo: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  findByTenantAndEmail(tenantId: string, email: string): Promise<User | null> {
    return this.repo.findOne({ where: { tenantId, email } });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(user: User): Promise<User> {
    return this.repo.save(user);
  }
}
