// MOCK — dados fixos da home (hero, banners, lojas em destaque). As seções de
// promoções/eventos/notícias reutilizam as libs de cada recurso. Trocar por
// fetchFromBackend quando houver API real. Não usar em produção.

export interface HomeHero {
  title: string;
  subtitle: string;
  backgroundImageUrl: string;
  ctaUrl: string;
  ctaLabel: string;
}

export interface HomeBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

export interface FeaturedStore {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export async function fetchHero(_host: string): Promise<HomeHero> {
  return {
    title: 'Bem-vindo ao Shopping',
    subtitle: 'Lojas, gastronomia, cinema e eventos em um só lugar',
    backgroundImageUrl: 'https://picsum.photos/seed/hero/1600/600',
    ctaUrl: '/lojas',
    ctaLabel: 'Ver lojas',
  };
}

export async function fetchBanners(_host: string): Promise<HomeBanner[]> {
  return [
    {
      id: 'b1',
      title: 'Liquidação de inverno',
      imageUrl: 'https://picsum.photos/seed/banner1/1600/500',
      linkUrl: '/promocoes',
    },
    {
      id: 'b2',
      title: 'Novas lojas',
      imageUrl: 'https://picsum.photos/seed/banner2/1600/500',
      linkUrl: '/lojas',
    },
    {
      id: 'b3',
      title: 'Programação de teatro',
      imageUrl: 'https://picsum.photos/seed/banner3/1600/500',
      linkUrl: '/teatro',
    },
  ];
}

export async function fetchFeaturedStores(_host: string, limit = 8): Promise<FeaturedStore[]> {
  const stores: FeaturedStore[] = [
    { id: 's1', name: 'Renner', slug: 'renner', category: 'Moda' },
    { id: 's2', name: 'Riachuelo', slug: 'riachuelo', category: 'Moda' },
    { id: 's3', name: 'Fast Shop', slug: 'fast-shop', category: 'Eletrônicos' },
    { id: 's4', name: 'Livraria Cultura', slug: 'livraria-cultura', category: 'Livros' },
    { id: 's5', name: 'Outback', slug: 'outback', category: 'Restaurantes' },
    { id: 's6', name: 'Boticário', slug: 'boticario', category: 'Beleza' },
    { id: 's7', name: 'Centauro', slug: 'centauro', category: 'Esportes' },
    { id: 's8', name: 'Apple Store', slug: 'apple-store', category: 'Eletrônicos' },
  ];
  return stores.slice(0, limit);
}
