import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchShows } from '../../lib/theater/api';
import styles from '../content.module.css';

export default async function TeatroPage() {
  const host = (await headers()).get('host') ?? '';
  const shows = await fetchShows(host);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Cultura</p>
        <h1>Teatro</h1>
        <p className={styles.lead}>Espetáculos e sessões no teatro do shopping.</p>
      </header>

      {shows.length === 0 ? (
        <div className={styles.emptyState}>Nenhum espetáculo em cartaz no momento.</div>
      ) : (
        <div className={styles.grid}>
          {shows.map((show) => (
            <Link key={show.id} href={`/teatro/${show.slug}`} className={styles.card}>
              <div className={styles.cardMedia}>
                <Image
                  src={show.imageUrl ?? `https://picsum.photos/seed/${show.slug}/600/400`}
                  alt={show.title}
                  fill
                  unoptimized
                  className={styles.cardImage}
                />
                <span className={styles.cardBadge}>{show.ageRating}</span>
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{show.title}</span>
                <span className={styles.cardExcerpt}>{show.synopsis}</span>
                <span className={styles.cardMeta}>
                  {show.durationMinutes} min · {show.sessions.length} sessão(ões)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
