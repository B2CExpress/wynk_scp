import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_theater_show')
@Index('ix_tb_theater_show_tenant_status_published', ['tenantId', 'status', 'publishedAt'])
export class TheaterShow {
  @PrimaryGeneratedColumn('uuid', { name: 'show_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'show_title', type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'show_synopsis', type: 'text' })
  synopsis: string;

  @Column({ name: 'show_duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'show_age_rating', type: 'varchar', length: 2 })
  ageRating: string;

  @Column({ name: 'show_ticket_url', type: 'text', nullable: true })
  ticketUrl: string | null;

  @Column({ name: 'show_status', type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'show_published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'show_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'show_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
