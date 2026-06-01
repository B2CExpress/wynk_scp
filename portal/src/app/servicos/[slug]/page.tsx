import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchServiceDetail, type PublicService } from '../../../lib/services/api';
import styles from '../../content.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ServicoDetalhe({ params }: Props) {
  const { slug } = await params;
  const host = (await headers()).get('host') ?? '';

  let service: PublicService;
  try {
    service = await fetchServiceDetail(host, slug);
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }
    throw error;
  }

  return (
    <div className={styles.page}>
      <Link href="/servicos" className={styles.back}>
        Voltar para serviços
      </Link>

      <section className={styles.detailHero}>
        <div className={styles.detailCopy}>
          <p className={styles.kicker}>Serviço</p>
          <h1>{service.name}</h1>
          <div className={styles.metaRow}>
            <span>{service.floor}</span>
          </div>
          <p className={styles.detailBody}>{service.description}</p>
          {service.phone ? (
            <a className={styles.button} href={`tel:${service.phone}`}>
              {service.phone}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
