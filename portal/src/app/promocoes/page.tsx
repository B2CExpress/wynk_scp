import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchPromotions } from '../../lib/promotions/api';
import styles from '../content.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function PromocoesPage() {
  const host = (await headers()).get('host') ?? '';
  const promotions = await fetchPromotions(host);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Ofertas</p>
        <h1>Promoções</h1>
        <p className={styles.lead}>Descontos e vantagens nas lojas do shopping.</p>
      </header>

      {promotions.length === 0 ? (
        <div className={styles.emptyState}>Nenhuma promoção ativa no momento.</div>
      ) : (
        <div className={styles.grid}>
          {promotions.map((promotion) => (
            <Link key={promotion.id} href={`/promocoes/${promotion.slug}`} className={styles.card}>
              <div className={styles.cardMedia}>
                <Image
                  src={promotion.imageUrl ?? `https://picsum.photos/seed/${promotion.slug}/600/400`}
                  alt={promotion.title}
                  fill
                  unoptimized
                  className={styles.cardImage}
                />
                <span className={styles.cardBadge}>{promotion.discountLabel}</span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{promotion.title}</span>
                <span className={styles.cardMeta}>
                  Válida até {formatDate(promotion.validUntil)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
