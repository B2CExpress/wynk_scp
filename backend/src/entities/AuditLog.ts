import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Tenant } from './Tenant';

/**
 * AuditLog — registro imutável (append-only) de eventos sensíveis.
 *
 * Registra impersonações, criações/remoções de tenants, mudanças de senha, etc.
 * para rastreabilidade e conformidade. Nunca permite UPDATE ou DELETE — apenas INSERT.
 *
 * Convenções de naming: tabela `tb_audit_log`, colunas `audit_<col>`.
 */
@Entity('tb_audit_log')
@Index('idx_tb_audit_log_actor_created', ['actorUserId', 'createdAt'])
@Index('idx_tb_audit_log_tenant_created', ['targetTenantId', 'createdAt'])
@Index('idx_tb_audit_log_event_created', ['eventType', 'createdAt'])
@Index('idx_tb_audit_log_created', ['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid', { name: 'audit_id' })
  id: string;

  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: string;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_user_id' })
  actor: User;

  @Column({ name: 'actor_role', type: 'varchar', length: 15 })
  actorRole: string;

  @Column({ name: 'target_tenant_id', type: 'uuid', nullable: true })
  targetTenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_tenant_id' })
  targetTenant: Tenant | null;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User | null;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
