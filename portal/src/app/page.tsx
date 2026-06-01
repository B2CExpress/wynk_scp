import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchHero, fetchBanners, fetchFeaturedStores } from '../lib/home/api';
import { fetchPromotions } from '../lib/promotions/api';
import { fetchEvents } from '../lib/events/api';
import { fetchNews } from '../lib/news/api';
import BannerCarousel from './_components/BannerCarousel';
import home from './home.module.css';
import content from './content.module.css';

export default async function Home() {
  const host = (await headers()).get('host') ?? '';

  const [hero, banners, stores, promotions, events, news] = await Promise.all([
    fetchHero(host),
    fetchBanners(host),
    fetchFeaturedStores(host, 8),
    fetchPromotions(host),
    fetchEvents(host),
    fetchNews(host),
  ]);

  return (
    <div className={home.home}>
      <section className={home.hero}>
        <Image
          src={hero.backgroundImageUrl}
          alt=""
          fill
          unoptimized
          priority
          className={home.heroImage}
        />
        <div className={home.heroOverlay} />
        <div className={home.heroContent}>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <Link href={hero.ctaUrl} className={home.heroCta}>
            {hero.ctaLabel}
          </Link>
        </div>
      </section>

      <BannerCarousel banners={banners} />

      <section className={home.section}>
        <div className={home.sectionHeader}>
          <h2>Lojas em destaque</h2>
          <Link href="/lojas" className={home.sectionLink}>
            Ver todas →
          </Link>
        </div>
        <div className={home.storeGrid}>
          {stores.map((store) => (
            <Link key={store.id} href={`/lojas/${store.slug}`} className={home.storeCard}>
              <span className={home.storeAvatar}>{store.name.slice(0, 1)}</span>
              <strong>{store.name}</strong>
              <span className={home.storeCategory}>{store.category}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${home.section} ${home.sectionAccent}`}>
        <div className={home.sectionHeader}>
          <h2>Promoções</h2>
          <Link href="/promocoes" className={home.sectionLink}>
            Ver todas →
          </Link>
        </div>
        <div className={content.grid}>
          {promotions.map((promotion) => (
            <Link key={promotion.id} href={`/promocoes/${promotion.slug}`} className={content.card}>
              <div className={content.cardMedia}>
                <Image
                  src={promotion.imageUrl ?? `https://picsum.photos/seed/${promotion.slug}/600/400`}
                  alt={promotion.title}
                  fill
                  unoptimized
                  className={content.cardImage}
                />
                <span className={content.cardBadge}>{promotion.discountLabel}</span>
              </div>
              <div className={content.cardBody}>
                <span className={content.cardTitle}>{promotion.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={home.section}>
        <div className={home.sectionHeader}>
          <h2>Próximos eventos</h2>
          <Link href="/eventos" className={home.sectionLink}>
            Ver todos →
          </Link>
        </div>
        <div className={content.grid}>
          {events.map((event) => (
            <Link key={event.id} href={`/eventos/${event.slug}`} className={content.card}>
              <div className={content.cardMedia}>
                <Image
                  src={`https://picsum.photos/seed/${event.slug}/600/400`}
                  alt={event.title}
                  fill
                  unoptimized
                  className={content.cardImage}
                />
              </div>
              <div className={content.cardBody}>
                <span className={content.cardTitle}>{event.title}</span>
                <span className={content.cardExcerpt}>{event.summary}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${home.section} ${home.sectionAccent}`}>
        <div className={home.sectionHeader}>
          <h2>Últimas notícias</h2>
          <Link href="/noticias" className={home.sectionLink}>
            Ver todas →
          </Link>
        </div>
        <div className={content.grid}>
          {news.map((article) => (
            <Link key={article.id} href={`/noticias/${article.slug}`} className={content.card}>
              <div className={content.cardMedia}>
                <Image
                  src={
                    article.coverImageUrl ?? `https://picsum.photos/seed/${article.slug}/600/400`
                  }
                  alt={article.title}
                  fill
                  unoptimized
                  className={content.cardImage}
                />
              </div>
              <div className={content.cardBody}>
                <span className={content.cardTitle}>{article.title}</span>
                <span className={content.cardExcerpt}>{article.summary}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
