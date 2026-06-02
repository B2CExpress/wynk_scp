import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Hero principal da home — config **única por tenant** (1 linha por tenant,
 * garantido por índice unique em `tenant_id`). Diferente de `Banner` (lista).
 */
@Entity('tb_hero')
@Index('ux_tb_hero_tenant', ['tenantId'], { unique: true })
export class Hero {
  @PrimaryGeneratedColumn('uuid', { name: 'hero_id' })
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'hero_title', type: 'varchar', length: 300 })
  title: string;

  @Column({ name: 'hero_subtitle', type: 'varchar', length: 500, nullable: true })
  subtitle: string | null;

  @Column({ name: 'hero_background_image_url', type: 'text' })
  backgroundImageUrl: string;

  @Column({ name: 'hero_cta_text', type: 'varchar', length: 50, nullable: true })
  ctaText: string | null;

  @Column({ name: 'hero_cta_link', type: 'text', nullable: true })
  ctaLink: string | null;

  @Column({ name: 'hero_overlay_color', type: 'varchar', length: 7, default: '#000000' })
  overlayColor: string;

  // `numeric` evita jitter de float (0.4 não é exato em float64). TypeORM
  // devolve numeric como string — o transformer converte pra number nas duas pontas.
  @Column({
    name: 'hero_overlay_opacity',
    type: 'numeric',
    precision: 4,
    scale: 2,
    default: 0.4,
    transformer: {
      to: (value: number): number => value,
      from: (value: string | null): number => (value === null ? 0.4 : parseFloat(value)),
    },
  })
  overlayOpacity: number;

  @CreateDateColumn({ name: 'hero_created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'hero_updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
