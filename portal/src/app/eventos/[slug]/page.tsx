import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchEventDetail, type PublicEvent } from '../../../lib/events/api';
import styles from '../../content.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

function formatRange(startsAt: string, endsAt: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  };
  return `${new Date(startsAt).toLocaleDateString('pt-BR', opts)} — ${new Date(endsAt).toLocaleDateString('pt-BR', opts)}`;
}

export default async function EventoDetalhe({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get('host') ?? '';

  let event: PublicEvent;
  try {
    event = await fetchEventDetail(host, slug);
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }
    throw error;
  }

  return (
    <div className={styles.page}>
      <Link href="/eventos" className={styles.back}>
        Voltar para eventos
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailCopy}>
          <p className={styles.kicker}>Evento</p>
          <h1>{event.title}</h1>
          <div className={styles.metaRow}>
            <span>{formatRange(event.startsAt, event.endsAt)}</span>
            {event.location ? <span>{event.location}</span> : null}
            {event.ticketInfo ? <span>{event.ticketInfo}</span> : null}
          </div>
          <a className={styles.button} href={`/api/v1/events/${event.slug}/calendar.ics`}>
            Adicionar ao calendário
          </a>
        </div>
        <div className={styles.detailMedia}>
          <Image
            src={`https://picsum.photos/seed/${event.slug}/800/450`}
            alt={event.title}
            fill
            unoptimized
            className={styles.detailImage}
          />
        </div>
      </section>

      <article className={styles.detailBody} dangerouslySetInnerHTML={{ __html: event.body }} />
    </div>
  );
}
