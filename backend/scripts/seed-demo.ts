/**
 * Seed de demo: popula um tenant com conteúdo realista para demonstrações
 * (categorias, lojas, promoções, notícias) sem precisar cadastrar nada via UI.
 *
 * Idempotente: lookup por `(tenantId, slug)` para entidades top-level;
 * `tb_store_category` é wipe + reinsert por loja (junction sem id próprio).
 * Re-execução só altera nome/descrição se mudaram no dataset; ids preservados.
 *
 * Imagens: `picsum.photos/seed/<slug>-{logo|cover}` — estável por slug, zero
 * asset local.
 *
 * Uso:
 *   npm run seed:demo -w backend                  # tenant default `local-dev`
 *   npm run seed:demo -w backend -- --tenant=shopping-x
 *
 * Pré-requisitos: `npm run db:setup -w backend` + `npm run seed -w backend`
 * (precisa do tenant alvo já existindo em `tb_tenant`).
 *
 * Bloqueio: NÃO roda em `NODE_ENV=production` (assert no boot).
 */
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { config } from '../src/config';
import { Tenant } from '../src/entities/Tenant';
import { Category } from '../src/entities/Category';
import { Store } from '../src/entities/Store';
import { StoreCategory } from '../src/entities/StoreCategory';
import { Promotion } from '../src/entities/Promotion';
import { News } from '../src/entities/News';

interface CategorySeed {
  slug: string;
  name: string;
  sortOrder: number;
}

interface StoreSeed {
  slug: string;
  name: string;
  description: string;
  floor: string;
  phone: string;
  externalUrl: string | null;
  openingHours: Record<string, string>;
  isRestaurant: boolean;
  isFeatured: boolean;
  sortOrder: number;
  categorySlugs: string[];
}

interface PromotionSeed {
  slug: string;
  storeSlug: string;
  title: string;
  description: string;
  discountLabel: string;
  validFromOffsetDays: number;
  validUntilOffsetDays: number;
  publishedAtOffsetDays: number;
}

interface NewsSeed {
  slug: string;
  title: string;
  summary: string;
  body: string;
  author: string;
  category: string;
  publishedAtOffsetDays: number;
}

const CATEGORIES: CategorySeed[] = [
  { slug: 'moda', name: 'Moda', sortOrder: 0 },
  { slug: 'alimentacao', name: 'Alimentação', sortOrder: 1 },
  { slug: 'tecnologia', name: 'Tecnologia', sortOrder: 2 },
  { slug: 'servicos', name: 'Serviços', sortOrder: 3 },
];

const STORES: StoreSeed[] = [
  {
    slug: 'zara',
    name: 'Zara',
    description: '<p>Coleções de moda casual e elegante para todas as estações.</p>',
    floor: 'L1',
    phone: '(11) 4002-8001',
    externalUrl: 'https://www.zara.com',
    openingHours: { 'seg-sab': '10h-22h', dom: '12h-20h' },
    isRestaurant: false,
    isFeatured: true,
    sortOrder: 0,
    categorySlugs: ['moda'],
  },
  {
    slug: 'renner',
    name: 'Renner',
    description:
      '<p>Moda feminina, masculina, infantil, casa e beleza com bom custo-benefício.</p>',
    floor: 'L1',
    phone: '(11) 4002-8002',
    externalUrl: 'https://www.lojasrenner.com.br',
    openingHours: { 'seg-sab': '10h-22h', dom: '12h-20h' },
    isRestaurant: false,
    isFeatured: false,
    sortOrder: 1,
    categorySlugs: ['moda'],
  },
  {
    slug: 'apple-store',
    name: 'Apple Store',
    description: '<p>Produtos Apple, atendimento especializado e Genius Bar.</p>',
    floor: 'L2',
    phone: '(11) 4002-8003',
    externalUrl: 'https://www.apple.com/br',
    openingHours: { 'seg-sab': '10h-22h', dom: '12h-20h' },
    isRestaurant: false,
    isFeatured: true,
    sortOrder: 2,
    categorySlugs: ['tecnologia'],
  },
  {
    slug: 'fast-shop',
    name: 'Fast Shop',
    description: '<p>Eletrônicos, eletrodomésticos e tecnologia das principais marcas.</p>',
    floor: 'L2',
    phone: '(11) 4002-8004',
    externalUrl: 'https://www.fastshop.com.br',
    openingHours: { 'seg-sab': '10h-22h', dom: '12h-20h' },
    isRestaurant: false,
    isFeatured: false,
    sortOrder: 3,
    categorySlugs: ['tecnologia'],
  },
  {
    slug: 'outback',
    name: 'Outback Steakhouse',
    description:
      "<p>Steakhouse australiano com cortes nobres, drinks e o famoso Bloomin' Onion.</p>",
    floor: 'L3',
    phone: '(11) 4002-8005',
    externalUrl: 'https://www.outback.com.br',
    openingHours: { 'seg-qui': '12h-23h', 'sex-sab': '12h-00h', dom: '12h-22h' },
    isRestaurant: true,
    isFeatured: true,
    sortOrder: 4,
    categorySlugs: ['alimentacao'],
  },
  {
    slug: 'mcdonalds',
    name: "McDonald's",
    description: '<p>Hambúrgueres, McLanche Feliz, sobremesas e McCafé.</p>',
    floor: 'L3',
    phone: '(11) 4002-8006',
    externalUrl: 'https://www.mcdonalds.com.br',
    openingHours: { 'seg-dom': '10h-00h' },
    isRestaurant: true,
    isFeatured: false,
    sortOrder: 5,
    categorySlugs: ['alimentacao'],
  },
  {
    slug: 'subway',
    name: 'Subway',
    description: '<p>Sanduíches montados na hora com pães frescos e ingredientes selecionados.</p>',
    floor: 'L3',
    phone: '(11) 4002-8007',
    externalUrl: 'https://www.subway.com/pt-br',
    openingHours: { 'seg-dom': '10h-22h' },
    isRestaurant: true,
    isFeatured: false,
    sortOrder: 6,
    categorySlugs: ['alimentacao'],
  },
  {
    slug: 'banco-do-brasil',
    name: 'Banco do Brasil',
    description: '<p>Agência completa com caixas eletrônicos 24h e atendimento PJ/PF.</p>',
    floor: 'L1',
    phone: '(11) 4002-8008',
    externalUrl: 'https://www.bb.com.br',
    openingHours: { 'seg-sex': '10h-16h' },
    isRestaurant: false,
    isFeatured: false,
    sortOrder: 7,
    categorySlugs: ['servicos'],
  },
];

const PROMOTIONS: PromotionSeed[] = [
  {
    slug: 'zara-30-off-verao',
    storeSlug: 'zara',
    title: '30% off na coleção de verão',
    description:
      '<p>Vestidos, camisas e calçados leves com desconto até o fim do mês. Estoque limitado.</p>',
    discountLabel: '30% OFF',
    validFromOffsetDays: -3,
    validUntilOffsetDays: 14,
    publishedAtOffsetDays: -2,
  },
  {
    slug: 'apple-iphone-10-off',
    storeSlug: 'apple-store',
    title: 'iPhone à vista com 10% off',
    description:
      '<p>Desconto exclusivo para pagamento à vista nas linhas iPhone 14 e 15. Consulte modelos elegíveis.</p>',
    discountLabel: '10% à vista',
    validFromOffsetDays: -1,
    validUntilOffsetDays: 7,
    publishedAtOffsetDays: -1,
  },
  {
    slug: 'outback-bloomin-quarta',
    storeSlug: 'outback',
    title: "Bloomin' Onion grátis às quartas",
    description:
      "<p>Toda quarta-feira, peça um prato principal e ganhe o Bloomin' Onion clássico de cortesia.</p>",
    discountLabel: 'Cortesia',
    validFromOffsetDays: -7,
    validUntilOffsetDays: 30,
    publishedAtOffsetDays: -5,
  },
];

const NEWS: NewsSeed[] = [
  {
    slug: 'black-friday-confirmada',
    title: 'Black Friday confirmada com horário estendido',
    summary:
      'Shopping abrirá das 8h às 02h na sexta com promoções relâmpago e shows na praça central.',
    body:
      '<p>A edição deste ano da Black Friday traz horário estendido das 8h às 02h. Mais de 80% das lojas participam com descontos a partir de 40%, incluindo categorias de moda, eletrônicos e gastronomia.</p>' +
      '<p>A praça central recebe shows ao vivo a partir das 20h e um food truck com cardápio especial. Estacionamento será gratuito após as 22h para clientes com nota fiscal acima de R$ 200.</p>',
    author: 'Comunicação Shopping',
    category: 'Eventos',
    publishedAtOffsetDays: -3,
  },
  {
    slug: 'cinema-imax-inaugurado',
    title: 'Novo cinema IMAX é inaugurado no piso L3',
    summary:
      'Sala de 320 lugares com tela 1.43:1 e som certificado abre com pré-estreia exclusiva.',
    body:
      '<p>O novo cinema IMAX começou a operar nesta semana no piso L3, com 320 lugares, tela 1.43:1 e sistema de som certificado IMAX 12 canais. A primeira sessão recebeu convidados em pré-estreia.</p>' +
      '<p>A programação regular já está disponível com sessões diárias a partir das 13h. Clientes do programa de fidelidade têm 20% de desconto em ingressos comprados pelo app.</p>',
    author: 'Redação',
    category: 'Lazer',
    publishedAtOffsetDays: -10,
  },
  {
    slug: 'coleta-brinquedos-natal',
    title: 'Campanha de coleta de brinquedos para o Natal',
    summary:
      'Pontos de coleta estarão espalhados pelo shopping até 20 de dezembro em parceria com ONGs locais.',
    body:
      '<p>Até 20 de dezembro, o shopping recebe doações de brinquedos novos ou seminovos em bom estado nos pontos de coleta do piso L1 (entrada principal) e L2 (próximo à praça de alimentação).</p>' +
      '<p>As doações são destinadas a três ONGs parceiras que atendem mais de 800 crianças em comunidades vizinhas. Quem participar concorre a um vale-compras de R$ 1.000.</p>',
    author: 'Comunicação Shopping',
    category: 'Responsabilidade Social',
    publishedAtOffsetDays: -15,
  },
];

interface CliArgs {
  tenantSlug: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let tenantSlug = 'local-dev';
  for (const arg of args) {
    if (arg.startsWith('--tenant=')) {
      tenantSlug = arg.slice('--tenant='.length);
    }
  }
  if (!tenantSlug) {
    throw new Error('--tenant não pode ser vazio');
  }
  return { tenantSlug };
}

function logoUrl(slug: string): string {
  return `https://picsum.photos/seed/${slug}-logo/200/200`;
}

function coverUrl(slug: string): string {
  return `https://picsum.photos/seed/${slug}-cover/1200/600`;
}

function daysFromNow(offset: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

async function seedCategories(tenantId: string): Promise<Map<string, Category>> {
  const repo = AppDataSource.getRepository(Category);
  const bySlug = new Map<string, Category>();

  for (const seed of CATEGORIES) {
    const existing = await repo.findOne({ where: { tenantId, slug: seed.slug } });
    if (!existing) {
      const created = await repo.save(
        repo.create({
          tenantId,
          slug: seed.slug,
          name: seed.name,
          sortOrder: seed.sortOrder,
        }),
      );
      console.log(`[seed:demo] categoria criada: ${created.slug}`);
      bySlug.set(seed.slug, created);
      continue;
    }

    const drift: string[] = [];
    if (existing.name !== seed.name) {
      drift.push(`name: ${existing.name} → ${seed.name}`);
      existing.name = seed.name;
    }
    if (existing.sortOrder !== seed.sortOrder) {
      drift.push(`sortOrder: ${existing.sortOrder} → ${seed.sortOrder}`);
      existing.sortOrder = seed.sortOrder;
    }
    if (drift.length > 0) {
      await repo.save(existing);
      console.log(`[seed:demo] categoria atualizada: ${existing.slug} (${drift.join(', ')})`);
    } else {
      console.log(`[seed:demo] categoria já alinhada: ${existing.slug}`);
    }
    bySlug.set(seed.slug, existing);
  }

  return bySlug;
}

async function seedStores(
  tenantId: string,
  categoriesBySlug: Map<string, Category>,
): Promise<Map<string, Store>> {
  const storeRepo = AppDataSource.getRepository(Store);
  const linkRepo = AppDataSource.getRepository(StoreCategory);
  const bySlug = new Map<string, Store>();

  for (const seed of STORES) {
    let store = await storeRepo.findOne({ where: { tenantId, slug: seed.slug } });

    if (!store) {
      store = await storeRepo.save(
        storeRepo.create({
          tenantId,
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
          logoUrl: logoUrl(seed.slug),
          coverImageUrl: coverUrl(seed.slug),
          floor: seed.floor,
          phone: seed.phone,
          externalUrl: seed.externalUrl,
          openingHours: seed.openingHours,
          isRestaurant: seed.isRestaurant,
          isFeatured: seed.isFeatured,
          status: 'active',
          sortOrder: seed.sortOrder,
        }),
      );
      console.log(`[seed:demo] loja criada: ${store.slug}`);
    } else {
      const drift: string[] = [];
      if (store.name !== seed.name) {
        drift.push('name');
        store.name = seed.name;
      }
      if (store.description !== seed.description) {
        drift.push('description');
        store.description = seed.description;
      }
      const expectedLogo = logoUrl(seed.slug);
      if (store.logoUrl !== expectedLogo) {
        drift.push('logoUrl');
        store.logoUrl = expectedLogo;
      }
      const expectedCover = coverUrl(seed.slug);
      if (store.coverImageUrl !== expectedCover) {
        drift.push('coverImageUrl');
        store.coverImageUrl = expectedCover;
      }
      if (store.floor !== seed.floor) {
        drift.push('floor');
        store.floor = seed.floor;
      }
      if (store.phone !== seed.phone) {
        drift.push('phone');
        store.phone = seed.phone;
      }
      if (store.externalUrl !== seed.externalUrl) {
        drift.push('externalUrl');
        store.externalUrl = seed.externalUrl;
      }
      if (store.isRestaurant !== seed.isRestaurant) {
        drift.push('isRestaurant');
        store.isRestaurant = seed.isRestaurant;
      }
      if (store.isFeatured !== seed.isFeatured) {
        drift.push('isFeatured');
        store.isFeatured = seed.isFeatured;
      }
      if (store.sortOrder !== seed.sortOrder) {
        drift.push('sortOrder');
        store.sortOrder = seed.sortOrder;
      }
      if (drift.length > 0) {
        store.openingHours = seed.openingHours;
        await storeRepo.save(store);
        console.log(`[seed:demo] loja atualizada: ${store.slug} (${drift.join(', ')})`);
      } else {
        console.log(`[seed:demo] loja já alinhada: ${store.slug}`);
      }
    }

    await linkRepo.delete({ storeId: store.id });
    for (const categorySlug of seed.categorySlugs) {
      const category = categoriesBySlug.get(categorySlug);
      if (!category) {
        throw new Error(
          `[seed:demo] categoria '${categorySlug}' referenciada por '${seed.slug}' não existe no dataset`,
        );
      }
      await linkRepo.save(
        linkRepo.create({
          tenantId,
          storeId: store.id,
          categoryId: category.id,
        }),
      );
    }

    bySlug.set(seed.slug, store);
  }

  return bySlug;
}

async function seedPromotions(tenantId: string, storesBySlug: Map<string, Store>): Promise<void> {
  const repo = AppDataSource.getRepository(Promotion);

  for (const seed of PROMOTIONS) {
    const store = storesBySlug.get(seed.storeSlug);
    if (!store) {
      throw new Error(
        `[seed:demo] promoção '${seed.slug}' aponta para loja '${seed.storeSlug}' que não existe`,
      );
    }

    const validFrom = daysFromNow(seed.validFromOffsetDays);
    const validUntil = daysFromNow(seed.validUntilOffsetDays);
    const publishedAt = daysFromNow(seed.publishedAtOffsetDays);
    const imageUrl = `https://picsum.photos/seed/${seed.slug}/1200/600`;

    const existing = await repo.findOne({ where: { tenantId, slug: seed.slug } });
    if (!existing) {
      const created = await repo.save(
        repo.create({
          tenantId,
          storeId: store.id,
          slug: seed.slug,
          title: seed.title,
          description: seed.description,
          imageUrl,
          discountLabel: seed.discountLabel,
          validFrom,
          validUntil,
          status: 'published',
          publishedAt,
        }),
      );
      console.log(`[seed:demo] promoção criada: ${created.slug}`);
      continue;
    }

    const drift: string[] = [];
    if (existing.title !== seed.title) {
      drift.push('title');
      existing.title = seed.title;
    }
    if (existing.description !== seed.description) {
      drift.push('description');
      existing.description = seed.description;
    }
    if (existing.discountLabel !== seed.discountLabel) {
      drift.push('discountLabel');
      existing.discountLabel = seed.discountLabel;
    }
    if (existing.storeId !== store.id) {
      drift.push('storeId');
      existing.storeId = store.id;
    }
    if (existing.status !== 'published') {
      drift.push('status');
      existing.status = 'published';
    }
    if (drift.length > 0) {
      existing.imageUrl = imageUrl;
      existing.validFrom = validFrom;
      existing.validUntil = validUntil;
      existing.publishedAt = publishedAt;
      await repo.save(existing);
      console.log(`[seed:demo] promoção atualizada: ${existing.slug} (${drift.join(', ')})`);
    } else {
      console.log(`[seed:demo] promoção já alinhada: ${existing.slug}`);
    }
  }
}

async function seedNews(tenantId: string): Promise<void> {
  const repo = AppDataSource.getRepository(News);

  for (const seed of NEWS) {
    const publishedAt = daysFromNow(seed.publishedAtOffsetDays);
    const coverImageUrl = `https://picsum.photos/seed/${seed.slug}/1200/600`;

    const existing = await repo.findOne({ where: { tenantId, slug: seed.slug } });
    if (!existing) {
      const created = await repo.save(
        repo.create({
          tenantId,
          slug: seed.slug,
          title: seed.title,
          summary: seed.summary,
          body: seed.body,
          coverImageUrl,
          author: seed.author,
          category: seed.category,
          status: 'published',
          publishedAt,
        }),
      );
      console.log(`[seed:demo] notícia criada: ${created.slug}`);
      continue;
    }

    const drift: string[] = [];
    if (existing.title !== seed.title) {
      drift.push('title');
      existing.title = seed.title;
    }
    if (existing.summary !== seed.summary) {
      drift.push('summary');
      existing.summary = seed.summary;
    }
    if (existing.body !== seed.body) {
      drift.push('body');
      existing.body = seed.body;
    }
    if (existing.author !== seed.author) {
      drift.push('author');
      existing.author = seed.author;
    }
    if (existing.category !== seed.category) {
      drift.push('category');
      existing.category = seed.category;
    }
    if (existing.status !== 'published') {
      drift.push('status');
      existing.status = 'published';
    }
    if (drift.length > 0) {
      existing.coverImageUrl = coverImageUrl;
      existing.publishedAt = publishedAt;
      await repo.save(existing);
      console.log(`[seed:demo] notícia atualizada: ${existing.slug} (${drift.join(', ')})`);
    } else {
      console.log(`[seed:demo] notícia já alinhada: ${existing.slug}`);
    }
  }
}

async function main(): Promise<void> {
  if (config.nodeEnv === 'production') {
    throw new Error('[seed:demo] proibido rodar em production — script é exclusivamente DX local');
  }

  const { tenantSlug } = parseArgs();

  await AppDataSource.initialize();
  try {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { slug: tenantSlug } });
    if (!tenant) {
      throw new Error(
        `[seed:demo] tenant '${tenantSlug}' não encontrado. Rode \`npm run seed -w backend\` primeiro.`,
      );
    }

    console.log(`[seed:demo] alvo: tenant ${tenant.slug} (${tenant.id})`);

    const categoriesBySlug = await seedCategories(tenant.id);
    const storesBySlug = await seedStores(tenant.id, categoriesBySlug);
    await seedPromotions(tenant.id, storesBySlug);
    await seedNews(tenant.id);

    console.log(
      `[seed:demo] concluído — ${CATEGORIES.length} categorias / ${STORES.length} lojas / ${PROMOTIONS.length} promoções / ${NEWS.length} notícias garantidas no tenant ${tenant.slug}.`,
    );
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('[seed:demo] erro:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
