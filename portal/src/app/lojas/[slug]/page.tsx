import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { fetchStoreDetail } from '../../../lib/stores/api';
import { loadTheme } from '../../../lib/theme/load';
import { resolveTenantByHost } from '../../../lib/tenant/resolve';
import styles from '../stores.module.css';

interface StoreDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { slug } = await params;
  const host = (await headers()).get('host') ?? '';
  const tenant = await resolveTenantByHost(host);
  const theme = await loadTheme(tenant?.flavorSlug ?? '_default');

  try {
    const store = await fetchStoreDetail(host, slug);

    return (
      <div className={styles.page}>
        <div className={styles.detailBack}>
          <Link href="/lojas">Voltar para todas as lojas</Link>
        </div>

        <section className={styles.detailHero}>
          <div className={styles.detailCopy}>
            <p className={styles.kicker}>Loja do {theme.name}</p>
            <h1>{store.name}</h1>
            <div className={styles.detailMeta}>
              <span>{store.isRestaurant ? 'Restaurante' : 'Loja'}</span>
              <span>{store.floor ? `Piso ${store.floor}` : 'Consulte localizacao no shopping'}</span>
              <span>{store.phone ?? 'Telefone sob consulta'}</span>
            </div>
            {store.categories.length > 0 ? (
              <div className={styles.tagRow}>
                {store.categories.map((category) => (
                  <span key={category.id} className={styles.tag}>
                    {category.name}
                  </span>
                ))}
              </div>
            ) : null}
            {store.externalUrl ? (
              <a className={styles.button} href={store.externalUrl} target="_blank" rel="noreferrer">
                Abrir site oficial
              </a>
            ) : null}
          </div>
          <div className={styles.detailMedia}>
            {store.coverImageUrl ? (
              <Image
                src={store.coverImageUrl}
                alt={store.name}
                fill
                unoptimized
                className={styles.detailImage}
              />
            ) : (
              <div className={styles.cardFallback} />
            )}
          </div>
        </section>

        <section className={styles.detailGrid}>
          <article className={styles.detailCard}>
            <h2>Sobre a loja</h2>
            {store.description ? (
              <div dangerouslySetInnerHTML={{ __html: store.description }} />
            ) : (
              <p>Esta loja ainda nao publicou uma descricao detalhada.</p>
            )}
          </article>

          <aside className={styles.detailSidebar}>
            <div className={styles.detailInfoCard}>
              <h3>Informacoes rapidas</h3>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{store.status}</dd>
                </div>
                <div>
                  <dt>Destaque</dt>
                  <dd>{store.isFeatured ? 'Sim' : 'Nao'}</dd>
                </div>
                <div>
                  <dt>Telefone</dt>
                  <dd>{store.phone ?? 'Nao informado'}</dd>
                </div>
                <div>
                  <dt>Local</dt>
                  <dd>{store.floor ?? 'Nao informado'}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.detailInfoCard}>
              <h3>Horario</h3>
              {store.openingHours ? (
                <pre className={styles.hoursBlock}>{JSON.stringify(store.openingHours, null, 2)}</pre>
              ) : (
                <p>Horario ainda nao informado.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'not_found') {
      notFound();
    }

    throw error;
  }
}
