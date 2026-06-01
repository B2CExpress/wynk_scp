// MOCK — dados fixos. NÃO há domínio de "serviços" no backend (sem entity nem
// rota); este recurso é inteiramente fictício, só para a página existir no portal.
// Quando/se um domínio real surgir, remodelar conforme o contrato. Não usar em produção.

export interface PublicService {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string | null;
  floor: string;
}

const SERVICES: PublicService[] = [
  {
    id: 'sv1',
    name: 'Fraldário',
    slug: 'fraldario',
    description: 'Espaço para troca e amamentação, com estrutura completa para os pais.',
    phone: '+551130000001',
    floor: 'Piso 2',
  },
  {
    id: 'sv2',
    name: 'Caixas eletrônicos',
    slug: 'caixas-eletronicos',
    description: 'Terminais dos principais bancos disponíveis 24h.',
    phone: null,
    floor: 'Piso 1',
  },
  {
    id: 'sv3',
    name: 'Achados e perdidos',
    slug: 'achados-e-perdidos',
    description: 'Registre e recupere objetos perdidos no balcão de atendimento.',
    phone: '+551130000003',
    floor: 'Piso Térreo',
  },
];

export async function fetchServices(_host: string): Promise<PublicService[]> {
  return SERVICES;
}

export async function fetchServiceDetail(_host: string, slug: string): Promise<PublicService> {
  const service = SERVICES.find((item) => item.slug === slug);
  if (!service) {
    throw new Error('not_found');
  }
  return service;
}
