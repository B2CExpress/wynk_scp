import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_category')
@Index('uq_tb_category_tenant_slug', ['tenantId', 'slug'], { unique: true })
export class Category {
  @PrimaryGeneratedColumn('uuid', { name: 'category_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'category_slug', type: 'varchar', length: 140 })
  slug: string;

  @Column({ name: 'category_name', type: 'varchar', length: 120 })
  name: string;

  @CreateDateColumn({ name: 'category_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'category_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
