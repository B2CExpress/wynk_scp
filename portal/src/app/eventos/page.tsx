import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchEvents } from '../../lib/events/api';
import styles from '../content.module.css';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function EventosPage() {
  const host = (await headers()).get('host') ?? '';
  const events = await fetchEvents(host);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Programação</p>
        <h1>Eventos</h1>
        <p className={styles.lead}>Shows, feiras e atividades para toda a família no shopping.</p>
      </header>

      {events.length === 0 ? (
        <div className={styles.emptyState}>Nenhum evento programado no momento.</div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => (
            <Link key={event.id} href={`/eventos/${event.slug}`} className={styles.card}>
              <div className={styles.cardMedia}>
                <Image
                  src={`https://picsum.photos/seed/${event.slug}/600/400`}
                  alt={event.title}
                  fill
                  unoptimized
                  className={styles.cardImage}
                />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardMeta}>{formatDate(event.startsAt)}</span>
                <span className={styles.cardTitle}>{event.title}</span>
                <span className={styles.cardExcerpt}>{event.summary}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
