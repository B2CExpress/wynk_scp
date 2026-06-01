// MOCK — dados fixos. Modelado no contrato público real (GET /api/v1/promotions;
// o backend ainda não expõe detalhe público — aqui o detalhe é mock). Trocar por
// fetchFromBackend para ligar na API real. Não usar em produção.

export interface PublicPromotion {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  discountLabel: string;
  validFrom: string;
  validUntil: string;
}

const PROMOTIONS: PublicPromotion[] = [
  {
    id: 'p1',
    title: 'Até 50% OFF em moda',
    slug: 'ate-50-off-moda',
    description: '<p>Descontos em lojas selecionadas de moda durante toda a temporada.</p>',
    imageUrl: 'https://picsum.photos/seed/promo1/800/450',
    discountLabel: '50% OFF',
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-07-31T23:59:59.000Z',
  },
  {
    id: 'p2',
    title: 'Combo cinema + pipoca',
    slug: 'combo-cinema-pipoca',
    description: '<p>Ingresso com pipoca grande por um preço especial nas sessões da semana.</p>',
    imageUrl: 'https://picsum.photos/seed/promo2/800/450',
    discountLabel: 'Combo',
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-06-30T23:59:59.000Z',
  },
  {
    id: 'p3',
    title: 'Frete grátis nas eletrônicas',
    slug: 'frete-gratis-eletronicas',
    description: '<p>Compre nas lojas de eletrônicos participantes e receba em casa sem custo.</p>',
    imageUrl: 'https://picsum.photos/seed/promo3/800/450',
    discountLabel: 'Frete grátis',
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-08-15T23:59:59.000Z',
  },
];

export async function fetchPromotions(_host: string): Promise<PublicPromotion[]> {
  return PROMOTIONS;
}

export async function fetchPromotionDetail(_host: string, slug: string): Promise<PublicPromotion> {
  const promotion = PROMOTIONS.find((item) => item.slug === slug);
  if (!promotion) {
    throw new Error('not_found');
  }
  return promotion;
}
