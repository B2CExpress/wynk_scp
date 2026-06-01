// Removed direct `next` type dependency to avoid missing module during repair

import Hero from "../components/Hero";
import BannerCarousel from "../components/BannerCarousel";
import Section from "../components/Section";
import PromotionGrid from "../components/PromotionGrid";
import EventGrid from "../components/EventGrid";
import NewsGrid from "../components/NewsGrid";
import StoreGrid from "../components/StoreGrid";

import {
  fetchHero,
  fetchActiveBanners,
  fetchFeaturedStores,
  fetchActivePromotions,
  fetchUpcomingEvents,
  fetchLatestNews,
} from "../lib/home";

import { getCurrentTenant } from "../lib/tenant";

export const revalidate = 60;

export async function generateMetadata(): Promise<any> {
  const tenant = await getCurrentTenant();
  const hero = await fetchHero(tenant.id);

  return {
    title: tenant.meta_title || tenant.name,
    description: tenant.meta_description,

    openGraph: {
      title: tenant.meta_title || tenant.name,
      description: tenant.meta_description,
      images: hero?.background_image_url
        ? [hero.background_image_url]
        : [],
    },
  };
}

export default async function HomePage() {
  const tenant = await getCurrentTenant();

  const [
    hero,
    banners,
    featuredStores,
    activePromotions,
    upcomingEvents,
    latestNews,
  ] = await Promise.all([
    fetchHero(tenant.id),
    fetchActiveBanners(tenant.id),
    fetchFeaturedStores(tenant.id, 8),
    fetchActivePromotions(tenant.id, 6),
    fetchUpcomingEvents(tenant.id, 3),
    fetchLatestNews(tenant.id, 3),
  ]);

  return (
    <main>
      {hero && <Hero hero={hero} />}

      {banners.length > 0 && (
        <BannerCarousel banners={banners} />
      )}

      {featuredStores.length > 0 && (
        <Section
          title="Lojas em Destaque"
          href="/lojas?featured=true"
        >
          <StoreGrid
            stores={featuredStores}
            columns={4}
          />
        </Section>
      )}

      {activePromotions.length > 0 && (
        <Section
          title="Promoções"
          href="/promocoes"
          accent
        >
          <PromotionGrid
            items={activePromotions}
          />
        </Section>
      )}

      {upcomingEvents.length > 0 && (
        <Section
          title="Próximos Eventos"
          href="/eventos"
        >
          <EventGrid
            events={upcomingEvents}
          />
        </Section>
      )}

      {latestNews.length > 0 && (
        <Section
          title="Últimas Notícias"
          href="/noticias"
        >
          <NewsGrid
            news={latestNews}
          />
        </Section>
      )}
    </main>
  );
}