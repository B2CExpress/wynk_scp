import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_theater_session')
@Index('ix_tb_theater_session_show_starts', ['showId', 'startsAt'])
@Index('ix_tb_theater_session_tenant_starts', ['tenantId', 'startsAt'])
export class TheaterSession {
  @PrimaryGeneratedColumn('uuid', { name: 'session_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'show_id', type: 'uuid' })
  showId: string;

  @Column({ name: 'session_starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'session_ticket_url', type: 'text', nullable: true })
  ticketUrl: string | null;

  @Column({ name: 'session_is_sold_out', type: 'boolean', default: false })
  isSoldOut: boolean;

  @CreateDateColumn({ name: 'session_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'session_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
