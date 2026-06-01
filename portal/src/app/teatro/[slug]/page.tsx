import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchShowDetail, type PublicShow } from '../../../lib/theater/api';
import styles from '../../content.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function TeatroDetalhe({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get('host') ?? '';

  let show: PublicShow;
  try {
    show = await fetchShowDetail(host, slug);
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }
    throw error;
  }

  return (
    <div className={styles.page}>
      <Link href="/teatro" className={styles.back}>
        Voltar para teatro
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailCopy}>
          <p className={styles.kicker}>Espetáculo</p>
          <h1>{show.title}</h1>
          <div className={styles.metaRow}>
            <span>{show.durationMinutes} min</span>
            <span>Classificação: {show.ageRating}</span>
          </div>
          <p className={styles.detailBody}>{show.synopsis}</p>

          <h2 style={{ marginTop: '1.5rem' }}>Sessões</h2>
          <div className={styles.sessions}>
            {show.sessions.map((session) => (
              <div key={session.id} className={styles.sessionRow}>
                <span>{formatDateTime(session.startsAt)}</span>
                {session.isSoldOut ? (
                  <span className={styles.soldOut}>Esgotado</span>
                ) : session.ticketUrl ? (
                  <a
                    className={styles.button}
                    style={{ marginTop: 0 }}
                    href={session.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Comprar ingresso
                  </a>
                ) : (
                  <span>Em breve</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.detailMedia}>
          <Image
            src={show.imageUrl ?? `https://picsum.photos/seed/${show.slug}/800/450`}
            alt={show.title}
            fill
            unoptimized
            className={styles.detailImage}
          />
        </div>
      </section>
    </div>
  );
}
