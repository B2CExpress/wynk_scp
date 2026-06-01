// MOCK — dados fixos. Modelado no DTO de notícias do backend (que hoje só tem
// API admin; não há endpoint público ainda). Trocar por fetchFromBackend quando
// o backend expor /api/v1/news. Não usar em produção.

export interface PublicNews {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  author: string;
  category: string;
  publishedAt: string;
}

const NEWS: PublicNews[] = [
  {
    id: 'n1',
    title: 'Shopping inaugura nova praça de alimentação',
    slug: 'nova-praca-alimentacao',
    summary: 'Mais de 20 novas operações gastronômicas chegam ao piso 3.',
    body: '<p>A nova praça de alimentação traz opções para todos os gostos, do fast-food à alta gastronomia, com ambiente renovado.</p>',
    coverImageUrl: 'https://picsum.photos/seed/news1/800/450',
    author: 'Redação',
    category: 'Novidades',
    publishedAt: '2026-05-28T12:00:00.000Z',
  },
  {
    id: 'n2',
    title: 'Horário estendido no feriado',
    slug: 'horario-estendido-feriado',
    summary: 'Confira a programação especial de funcionamento.',
    body: '<p>Durante o feriado, o shopping funcionará em horário estendido para melhor atender os visitantes.</p>',
    coverImageUrl: 'https://picsum.photos/seed/news2/800/450',
    author: 'Atendimento',
    category: 'Avisos',
    publishedAt: '2026-05-25T09:30:00.000Z',
  },
  {
    id: 'n3',
    title: 'Estacionamento ganha vagas para carros elétricos',
    slug: 'vagas-carros-eletricos',
    summary: 'Novos pontos de recarga já estão disponíveis no G1.',
    body: '<p>Como parte do compromisso com a sustentabilidade, o estacionamento recebeu pontos de recarga para veículos elétricos.</p>',
    coverImageUrl: 'https://picsum.photos/seed/news3/800/450',
    author: 'Redação',
    category: 'Sustentabilidade',
    publishedAt: '2026-05-20T16:45:00.000Z',
  },
];

export async function fetchNews(_host: string): Promise<PublicNews[]> {
  return NEWS;
}

export async function fetchNewsDetail(_host: string, slug: string): Promise<PublicNews> {
  const article = NEWS.find((item) => item.slug === slug);
  if (!article) {
    throw new Error('not_found');
  }
  return article;
}
