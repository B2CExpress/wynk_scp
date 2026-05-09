import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * RefreshToken — entrada por sessão ativa de um user.
 *
 * Refresh é **rotativo**: cada `POST /auth/refresh` revoga (set `revokedAt`)
 * o token usado e emite um novo. Reapresentar refresh já revogado → 401
 * + revoga **toda a cadeia do user** (heurística de "leaked token").
 *
 * `tokenHash` guarda SHA-256 hex (64 chars) do token plain (que vai no cookie).
 * Nunca armazenamos o token em plaintext — comprometimento do DB não vaza
 * sessões.
 */
@Entity('tb_refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid', { name: 'token_id' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Index('uq_tb_refresh_token_hash', { unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ name: 'token_expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'token_revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ name: 'token_created_at', type: 'timestamptz' })
  createdAt: Date;
}
