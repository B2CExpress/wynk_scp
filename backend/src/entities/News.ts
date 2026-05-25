import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tb_news')
@Index('uq_tb_news_tenant_slug', ['tenantId', 'slug'], { unique: true })
@Index('ix_tb_news_tenant_status', ['tenantId', 'status'])
@Index('ix_tb_news_tenant_published', ['tenantId', 'publishedAt'])
@Index('ix_tb_news_status_published', ['status', 'publishedAt'])
export class News {
  @PrimaryGeneratedColumn('uuid', { name: 'news_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'news_title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'news_slug', type: 'varchar', length: 255 })
  slug: string;

  @Column({ name: 'news_summary', type: 'varchar', length: 500 })
  summary: string;

  @Column({ name: 'news_body', type: 'text' })
  body: string;

  @Column({ name: 'news_cover_image_url', type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'news_author', type: 'varchar', length: 100 })
  author: string;

  @Column({ name: 'news_category', type: 'varchar', length: 50 })
  category: string;

  @Column({ name: 'news_status', type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'news_published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'news_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'news_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
