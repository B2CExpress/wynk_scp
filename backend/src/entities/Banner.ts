import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_banner')
@Index('ix_tb_banner_tenant_sort', ['tenantId', 'sortOrder'])
@Index('ix_tb_banner_tenant_active_schedule', ['tenantId', 'isActive', 'startsAt', 'endsAt'])
export class Banner {
  @PrimaryGeneratedColumn('uuid', { name: 'banner_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'banner_title', type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'banner_image_desktop_url', type: 'text' })
  imageDesktopUrl: string;

  @Column({ name: 'banner_image_mobile_url', type: 'text' })
  imageMobileUrl: string;

  @Column({ name: 'banner_alt_text', type: 'varchar', length: 300 })
  altText: string;

  @Column({ name: 'banner_link_url', type: 'text', nullable: true })
  linkUrl: string | null;

  @Column({ name: 'banner_link_target', type: 'varchar', length: 20, default: '_self' })
  linkTarget: string;

  @Column({ name: 'banner_starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'banner_ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'banner_is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'banner_sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'banner_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'banner_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
