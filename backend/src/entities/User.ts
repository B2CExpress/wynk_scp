import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * User — operador do backoffice (Tenant Admin / Editor / Superadmin / outros papéis).
 *
 * Em geral pertence a um tenant. **Exceção:** o papel `superadmin` é global e tem
 * `tenantId = null` (não pertence a nenhum shopping) — introduzido por
 * SPEC-20260603-1149. Email é único por tenant (`uq_tb_user_tenant_email`); entre
 * superadmins, a unicidade é garantida pelo índice parcial `uq_tb_user_superadmin_email`
 * (`WHERE tenant_id IS NULL`), porque NULL não colide no índice composto.
 *
 * `userPasswordHash` armazena hash bcrypt — nunca a senha em texto plano.
 *
 * Convenções de naming: tabela `tb_user`, colunas `user_<col>`.
 */
@Entity('tb_user')
@Index('uq_tb_user_tenant_email', ['tenantId', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  id: string;

  /** `null` apenas para o papel `superadmin` (global, sem tenant). */
  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null;

  @Column({ name: 'user_email', type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'user_password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'user_name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'user_role', type: 'varchar', length: 50, default: 'tenant_admin' })
  role: string;

  @CreateDateColumn({ name: 'user_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'user_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
