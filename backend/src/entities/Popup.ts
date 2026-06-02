import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_popup')
@Index('ix_tb_popup_tenant_active_schedule', ['tenantId', 'isActive', 'startsAt', 'endsAt'])
export class Popup {
  @PrimaryGeneratedColumn('uuid', { name: 'popup_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'popup_title', type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'popup_image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'popup_html_content', type: 'text', nullable: true })
  htmlContent: string | null;

  @Column({ name: 'popup_link_url', type: 'text', nullable: true })
  linkUrl: string | null;

  @Column({ name: 'popup_show_after_seconds', type: 'integer', default: 3 })
  showAfterSeconds: number;

  @Column({ name: 'popup_show_only_once', type: 'boolean', default: true })
  showOnlyOnce: boolean;

  @Column({ name: 'popup_show_on_pages', type: 'varchar', length: 10, default: 'home' })
  showOnPages: 'home' | 'all';

  @Column({ name: 'popup_starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'popup_ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({ name: 'popup_is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'popup_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'popup_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
