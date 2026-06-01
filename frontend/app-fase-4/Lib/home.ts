export async function fetchHero(tenantId: string) {
  return {
    id: "hero-1",
    title: "Bem-vindo",
    subtitle: "Subtítulo de exemplo",
    background_image_url: "",
    cta_url: "",
    cta_label: "",
  };
}

export async function fetchActiveBanners(tenantId: string) {
  return [];
}

export async function fetchFeaturedStores(tenantId: string, limit = 8) {
  return [];
}

export async function fetchActivePromotions(tenantId: string, limit = 6) {
  return [];
}

export async function fetchUpcomingEvents(tenantId: string, limit = 3) {
  return [];
}

export async function fetchLatestNews(tenantId: string, limit = 3) {
  return [];
}