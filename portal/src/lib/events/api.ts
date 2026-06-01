// MOCK — dados fixos para o portal renderizar sem depender do backend.
// Modelado no contrato público real (GET /api/v1/events + /:slug). Para ligar
// na API real, trocar o corpo destas funções por fetchFromBackend (ver
// lib/stores/api.ts). Não usar em produção.

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  ticketInfo: string | null;
}

const EVENTS: PublicEvent[] = [
  {
    id: 'e1',
    title: 'Encontro de food trucks',
    slug: 'encontro-food-trucks',
    summary: 'Os melhores food trucks da cidade reunidos por um fim de semana.',
    body: '<p>Um fim de semana dedicado à gastronomia de rua, com food trucks selecionados, música ao vivo e área kids.</p>',
    startsAt: '2026-06-15T18:00:00.000Z',
    endsAt: '2026-06-16T22:00:00.000Z',
    location: 'Praça de Eventos',
    ticketInfo: 'Entrada gratuita',
  },
  {
    id: 'e2',
    title: 'Sessão de contação de histórias',
    slug: 'contacao-historias',
    summary: 'Tarde infantil de contação de histórias, com entrada gratuita.',
    body: '<p>Atividade voltada ao público infantil, com contadores de histórias e oficinas criativas.</p>',
    startsAt: '2026-06-20T15:00:00.000Z',
    endsAt: '2026-06-20T17:00:00.000Z',
    location: 'Piso 2 — Espaço Kids',
    ticketInfo: 'Entrada gratuita',
  },
  {
    id: 'e3',
    title: 'Show acústico ao vivo',
    slug: 'show-acustico',
    summary: 'Música ao vivo no coração do shopping, aberto ao público.',
    body: '<p>Apresentação acústica na praça central, com repertório da MPB ao pop.</p>',
    startsAt: '2026-06-28T20:00:00.000Z',
    endsAt: '2026-06-28T22:00:00.000Z',
    location: 'Praça Central',
    ticketInfo: null,
  },
];

export async function fetchEvents(_host: string): Promise<PublicEvent[]> {
  return EVENTS;
}

export async function fetchEventDetail(_host: string, slug: string): Promise<PublicEvent> {
  const event = EVENTS.find((item) => item.slug === slug);
  if (!event) {
    throw new Error('not_found');
  }
  return event;
}
