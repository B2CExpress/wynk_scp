import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchPromotionDetail, type PublicPromotion } from '../../../lib/promotions/api';
import Countdown from '../../_components/Countdown';
import styles from '../../content.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PromocaoDetalhe({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get('host') ?? '';

  let promotion: PublicPromotion;
  try {
    promotion = await fetchPromotionDetail(host, slug);
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }
    throw error;
  }

  return (
    <div className={styles.page}>
      <Link href="/promocoes" className={styles.back}>
        Voltar para promoções
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailCopy}>
          <p className={styles.kicker}>{promotion.discountLabel}</p>
          <h1>{promotion.title}</h1>
          <div
            className={styles.detailBody}
            dangerouslySetInnerHTML={{ __html: promotion.description }}
          />
          <div className={styles.infoCard}>
            <h3>A promoção termina em</h3>
            <div style={{ marginTop: '0.75rem' }}>
              <Countdown targetDate={promotion.validUntil} />
            </div>
          </div>
        </div>
        <div className={styles.detailMedia}>
          <Image
            src={promotion.imageUrl ?? `https://picsum.photos/seed/${promotion.slug}/800/450`}
            alt={promotion.title}
            fill
            unoptimized
            className={styles.detailImage}
          />
        </div>
      </section>
    </div>
  );
}
