import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * User — operador do backoffice (Tenant Admin / Editor / outros papéis).
 *
 * Pertence sempre a um tenant (FK obrigatória, sem superadmin global nesta SPEC).
 * Email é único por tenant — o mesmo email pode existir em tenants diferentes
 * (intencional: operador que trabalha em 2 shoppings tem 2 contas).
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

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

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
