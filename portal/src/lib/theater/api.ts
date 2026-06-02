// MOCK — dados fixos. Modelado nas entities TheaterShow/TheaterSession do backend
// (que hoje só tem API admin; o mock acrescenta `slug`, que a entity não tem, para
// rotear por slug no portal). Trocar por fetchFromBackend quando houver API pública.
// Não usar em produção.

export interface PublicShowSession {
  id: string;
  startsAt: string;
  ticketUrl: string | null;
  isSoldOut: boolean;
}

export interface PublicShow {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  durationMinutes: number;
  ageRating: string;
  imageUrl: string | null;
  sessions: PublicShowSession[];
}

const SHOWS: PublicShow[] = [
  {
    id: 't1',
    title: 'A Comédia dos Erros',
    slug: 'a-comedia-dos-erros',
    synopsis: 'Clássico de Shakespeare em uma montagem moderna e divertida.',
    durationMinutes: 90,
    ageRating: '12',
    imageUrl: 'https://picsum.photos/seed/teatro1/800/450',
    sessions: [
      {
        id: 's1',
        startsAt: '2026-06-18T20:00:00.000Z',
        ticketUrl: 'https://example.com/t/s1',
        isSoldOut: false,
      },
      {
        id: 's2',
        startsAt: '2026-06-19T20:00:00.000Z',
        ticketUrl: 'https://example.com/t/s2',
        isSoldOut: true,
      },
    ],
  },
  {
    id: 't2',
    title: 'O Pequeno Príncipe — Musical',
    slug: 'o-pequeno-principe-musical',
    synopsis: 'Espetáculo musical para toda a família, baseado no clássico de Saint-Exupéry.',
    durationMinutes: 70,
    ageRating: 'Livre',
    imageUrl: 'https://picsum.photos/seed/teatro2/800/450',
    sessions: [
      {
        id: 's3',
        startsAt: '2026-06-22T16:00:00.000Z',
        ticketUrl: 'https://example.com/t/s3',
        isSoldOut: false,
      },
    ],
  },
];

export async function fetchShows(_host: string): Promise<PublicShow[]> {
  return SHOWS;
}

export async function fetchShowDetail(_host: string, slug: string): Promise<PublicShow> {
  const show = SHOWS.find((item) => item.slug === slug);
  if (!show) {
    throw new Error('not_found');
  }
  return show;
}
