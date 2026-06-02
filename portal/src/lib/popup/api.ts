// MOCK — dados fixos. Modelado no shape serializado do endpoint público
// `GET /api/v1/popups/active` do backend (camelCase). Trocar `fetchActivePopup`
// pela chamada real (mesma assinatura, `_host`) quando integrado. Não usar em
// produção.

export interface PublicPopup {
  id: string;
  tenantId: string;
  title: string;
  imageUrl: string | null;
  htmlContent: string | null;
  linkUrl: string | null;
  showAfterSeconds: number;
  showOnlyOnce: boolean;
  showOnPages: 'home' | 'all';
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const MOCK_ACTIVE_POPUP: PublicPopup = {
  id: 'pop-8492',
  tenantId: 'tenant-shopping-xyz',
  title: 'Campanha de Namorados 2026 🎁',
  imageUrl: 'https://picsum.photos/seed/popup1/600/400',
  htmlContent:
    '<p>Participe do nosso sorteio! A cada R$ 200 em compras, concorra a uma viagem inesquecível.</p>',
  linkUrl: 'https://seusite.com/campanha-namorados',
  showAfterSeconds: 3,
  showOnlyOnce: true,
  showOnPages: 'all',
  startsAt: '2026-06-01T00:00:00.000Z',
  endsAt: '2026-06-15T23:59:59.000Z',
  isActive: true,
};

export async function fetchActivePopup(_host: string): Promise<PublicPopup | null> {
  if (!MOCK_ACTIVE_POPUP.isActive) {
    return null;
  }

  const now = new Date();
  const start = new Date(MOCK_ACTIVE_POPUP.startsAt);
  const end = new Date(MOCK_ACTIVE_POPUP.endsAt);

  if (now >= start && now <= end) {
    return MOCK_ACTIVE_POPUP;
  }

  return null;
}
