import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tenant — identidade operacional de cada cliente da plataforma (1 shopping = 1 tenant).
 *
 * **Identidade visual NÃO vive aqui.** Branding (cores, logo, fontes, meta) está
 * versionado em `portal/flavors/<flavor_slug>/` (Modelo A — build-time). Ver
 * SPEC-20260503-1505 §Implementação.
 *
 * Convenções de naming alinhadas com wynk_ecommerce: tabela `tb_tenant`,
 * colunas `tenant_<col>` em snake_case, properties TS em camelCase.
 */
@Entity('tb_tenant')
export class Tenant {
  @PrimaryGeneratedColumn('uuid', { name: 'tenant_id' })
  id: string;

  @Column({ name: 'tenant_slug', type: 'varchar', length: 64, unique: true })
  slug: string;

  @Column({ name: 'tenant_host', type: 'varchar', length: 255, unique: true })
  host: string;

  @Column({ name: 'tenant_flavor_slug', type: 'varchar', length: 64 })
  flavorSlug: string;

  @Column({ name: 'tenant_name', type: 'varchar', length: 255 })
  name: string;

  /**
   * Ciclo de vida do shopping. `inactive` é o estado de soft-delete (junto com
   * `deletedAt`). Validado por CHECK constraint `ck_tb_tenant_status`.
   */
  @Column({ name: 'tenant_status', type: 'varchar', length: 20, default: 'trial' })
  status: 'active' | 'trial' | 'inactive' | 'suspended';

  /** Soft-delete: preenchido ao desativar; dados permanecem no banco para auditoria. */
  @Column({ name: 'tenant_deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'tenant_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'tenant_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
