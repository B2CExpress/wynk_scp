import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('tb_store_category')
@Index('ix_tb_store_category_tenant_category', ['tenantId', 'categoryId'])
@Index('ix_tb_store_category_tenant_store', ['tenantId', 'storeId'])
export class StoreCategory {
  @PrimaryColumn({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @PrimaryColumn({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;
}
