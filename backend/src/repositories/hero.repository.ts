import type { DataSource, Repository } from 'typeorm';
import { Hero } from '../entities/Hero';
import { withTenant } from '../utils/with-tenant';
import { requireTenantContext } from '../middleware/tenant-context';

export class HeroRepository {
  private readonly heroRepo: Repository<Hero>;

  constructor(dataSource: DataSource) {
    this.heroRepo = dataSource.getRepository(Hero);
  }

  /** A única linha de hero do tenant atual (ou null se não configurou). */
  async findForCurrentTenant(): Promise<Hero | null> {
    return withTenant(this.heroRepo.createQueryBuilder('hero')).getOne();
  }

  /**
   * UPSERT singleton: se o tenant já tem hero, atualiza; senão cria. A
   * unicidade por tenant é garantida pelo índice `ux_tb_hero_tenant`.
   */
  async upsertForCurrentTenant(input: {
    title: string;
    subtitle: string | null;
    backgroundImageUrl: string;
    ctaText: string | null;
    ctaLink: string | null;
    overlayColor: string;
    overlayOpacity: number;
  }): Promise<Hero> {
    const { tenantId } = requireTenantContext();

    const existing = await this.findForCurrentTenant();
    const hero = existing ?? this.heroRepo.create({ tenantId });

    hero.title = input.title;
    hero.subtitle = input.subtitle;
    hero.backgroundImageUrl = input.backgroundImageUrl;
    hero.ctaText = input.ctaText;
    hero.ctaLink = input.ctaLink;
    hero.overlayColor = input.overlayColor;
    hero.overlayOpacity = input.overlayOpacity;

    return this.heroRepo.save(hero);
  }
}
