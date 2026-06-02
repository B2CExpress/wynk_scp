import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchServices } from '../../lib/services/api';
import styles from '../content.module.css';

export default async function ServicosPage() {
  const host = (await headers()).get('host') ?? '';
  const services = await fetchServices(host);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.kicker}>Comodidade</p>
        <h1>Serviços</h1>
        <p className={styles.lead}>Tudo o que você precisa durante a sua visita ao shopping.</p>
      </header>

      {services.length === 0 ? (
        <div className={styles.emptyState}>Nenhum serviço cadastrado no momento.</div>
      ) : (
        <div className={styles.grid}>
          {services.map((service) => (
            <Link key={service.id} href={`/servicos/${service.slug}`} className={styles.card}>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{service.name}</span>
                <span className={styles.cardExcerpt}>{service.description}</span>
                <span className={styles.cardMeta}>{service.floor}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
