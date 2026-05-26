import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_promotion')
@Index('uq_tb_promotion_tenant_slug', ['tenantId', 'slug'], { unique: true })
@Index('ix_tb_promotion_tenant_store', ['tenantId', 'storeId'])
@Index('ix_tb_promotion_tenant_status_published', ['tenantId', 'status', 'publishedAt'])
@Index('ix_tb_promotion_tenant_valid_until', ['tenantId', 'validUntil'])
export class Promotion {
  @PrimaryGeneratedColumn('uuid', { name: 'promotion_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @Column({ name: 'promotion_title', type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'promotion_slug', type: 'varchar', length: 250 })
  slug: string;

  @Column({ name: 'promotion_description', type: 'text' })
  description: string;

  @Column({ name: 'promotion_image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'promotion_discount_label', type: 'varchar', length: 50 })
  discountLabel: string;

  @Column({ name: 'promotion_valid_from', type: 'timestamptz' })
  validFrom: Date;

  @Column({ name: 'promotion_valid_until', type: 'timestamptz' })
  validUntil: Date;

  @Column({ name: 'promotion_status', type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'promotion_published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'promotion_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'promotion_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
