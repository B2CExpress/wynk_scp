import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_store')
@Index('uq_tb_store_tenant_slug', ['tenantId', 'slug'], { unique: true })
@Index('ix_tb_store_tenant_status_sort', ['tenantId', 'status', 'sortOrder'])
@Index('ix_tb_store_tenant_search', ['tenantId', 'searchVector'])
export class Store {
  @PrimaryGeneratedColumn('uuid', { name: 'store_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'store_name', type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'store_description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'store_slug', type: 'varchar', length: 140 })
  slug: string;

  @Column({
    name: 'store_search_vector',
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `
      setweight(to_tsvector('portuguese', coalesce(store_name, '')), 'A') || 
      setweight(to_tsvector('portuguese', coalesce(store_description, '')), 'B')
    `,
    nullable: false,
    select: false,
    insert: false,
    update: false,
  })
  searchVector: string;

  @Column({ name: 'store_logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'store_cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'store_floor', type: 'varchar', length: 40, nullable: true })
  floor: string | null;

  @Column({ name: 'store_phone', type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ name: 'store_is_restaurant', type: 'boolean', default: false })
  isRestaurant: boolean;

  @Column({ name: 'store_is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'store_status', type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ name: 'store_sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'store_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'store_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
