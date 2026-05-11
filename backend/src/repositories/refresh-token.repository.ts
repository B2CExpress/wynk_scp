import type { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../entities/RefreshToken';

/**
 * Wrapper sobre o repository TypeORM da entity RefreshToken.
 *
 * Lookup principal é por `tokenHash` (chega plaintext do cookie, hashamos antes de
 * consultar — DB nunca vê o plain). `findValidByHash` aplica também filtro de
 * `revokedAt is null` e `expiresAt > now()` — caller não precisa repetir.
 */
export class RefreshTokenRepository {
  private readonly repo: Repository<RefreshToken>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(RefreshToken);
  }

  /**
   * Busca um token NÃO revogado e NÃO expirado pelo hash. Retorna `null`
   * se token não existe, está revogado, ou expirou — chamador trata como inválido.
   */
  async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo
      .createQueryBuilder('t')
      .where('t.tokenHash = :tokenHash', { tokenHash })
      .andWhere('t.revokedAt IS NULL')
      .andWhere('t.expiresAt > now()')
      .getOne();
  }

  /**
   * Busca por hash sem aplicar filtros — usado no flow de detecção de
   * reuso (recebemos refresh já revogado → invalidamos toda a cadeia).
   */
  findAnyByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  save(token: RefreshToken): Promise<RefreshToken> {
    return this.repo.save(token);
  }

  /** Revoga o token específico (rotação normal). */
  async revoke(tokenId: string): Promise<void> {
    await this.repo.update({ id: tokenId }, { revokedAt: new Date() });
  }

  /** Revoga TODOS os tokens ativos de um user (logout-all / detecção de reuso). */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('token_revoked_at IS NULL')
      .execute();
  }
}
