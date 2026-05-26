import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_event')
@Index('uq_tb_event_tenant_slug', ['tenantId', 'slug'], { unique: true })
@Index('ix_tb_event_tenant_starts', ['tenantId', 'startsAt'])
@Index('ix_tb_event_tenant_status_published', ['tenantId', 'status', 'publishedAt'])
export class Event {
  @PrimaryGeneratedColumn('uuid', { name: 'event_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'event_title', type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'event_slug', type: 'varchar', length: 250 })
  slug: string;

  @Column({ name: 'event_summary', type: 'varchar', length: 500 })
  summary: string;

  @Column({ name: 'event_body', type: 'text' })
  body: string;

  @Column({ name: 'event_starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'event_ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({ name: 'event_location', type: 'varchar', length: 300, nullable: true })
  location: string | null;

  @Column({ name: 'event_ticket_info', type: 'text', nullable: true })
  ticketInfo: string | null;

  @Column({ name: 'event_status', type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'event_published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'event_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'event_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
