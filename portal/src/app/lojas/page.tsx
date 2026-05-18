import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import { fetchStoreCategories, fetchStores } from '../../lib/stores/api';
import { loadTheme } from '../../lib/theme/load';
import { resolveTenantByHost } from '../../lib/tenant/resolve';
import styles from './stores.module.css';

interface StoresPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    featured?: string;
    restaurant?: string;
    page?: string;
  }>;
}

export default async function StoresPage({ searchParams }: StoresPageProps) {
  const params = await searchParams;
  const host = (await headers()).get('host') ?? '';
  const tenant = await resolveTenantByHost(host);
  const theme = await loadTheme(tenant?.flavorSlug ?? '_default');

  const currentPage = Math.max(1, Number(params.page ?? '1') || 1);
  const selectedCategory = params.category?.trim() || undefined;
  const search = params.search?.trim() || undefined;
  const featured = params.featured === 'true' ? true : undefined;
  const restaurant = params.restaurant === 'true' ? true : undefined;

  const [categories, stores] = await Promise.all([
    fetchStoreCategories(host),
    fetchStores(host, {
      search,
      category: selectedCategory,
      featured,
      isRestaurant: restaurant,
      page: currentPage,
      limit: 12,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(stores.total / stores.limit));
  const hasFilters = Boolean(search || selectedCategory || featured || restaurant);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.kicker}>Catalogo do shopping</p>
          <h1>Lojas para descobrir no seu ritmo.</h1>
          <p className={styles.lead}>
            Explore marcas, restaurantes e servicos do {theme.name} com busca textual, filtros
            rapidos e paginas de detalhe preparadas para cada tenant.
          </p>
        </div>
        <div className={styles.heroPanel}>
          <span>Tenant ativo</span>
          <strong>{theme.name}</strong>
          <small>{stores.total} lojas publicadas</small>
        </div>
      </section>

      <section className={styles.filtersSection}>
        <form className={styles.filters} action="/lojas">
          <input
            className={styles.search}
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Buscar por nome ou descricao"
          />
          <select className={styles.select} name="category" defaultValue={selectedCategory ?? ''}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={featured === true}
            />
            <span>So destaques</span>
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              name="restaurant"
              value="true"
              defaultChecked={restaurant === true}
            />
            <span>Restaurantes</span>
          </label>
          <button className={styles.button} type="submit">
            Filtrar
          </button>
          {hasFilters ? (
            <Link className={styles.clear} href="/lojas">
              Limpar
            </Link>
          ) : null}
        </form>
      </section>

      <section className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <h2>Resultado da busca</h2>
          <span>
            Pagina {stores.page} de {totalPages}
          </span>
        </div>

        {stores.data.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Nenhuma loja encontrada.</h3>
            <p>Tente ajustar os filtros ou buscar com menos palavras.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {stores.data.map((store) => (
              <Link key={store.id} href={`/lojas/${store.slug}`} className={styles.card}>
                <div className={styles.cardMedia}>
                  {store.coverImageUrl ? (
                    <Image
                      src={store.coverImageUrl}
                      alt={store.name}
                      fill
                      unoptimized
                      className={styles.cardImage}
                    />
                  ) : (
                    <div className={styles.cardFallback} />
                  )}
                  {store.isFeatured ? <span className={styles.badge}>Destaque</span> : null}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitleRow}>
                    {store.logoUrl ? (
                      <Image
                        src={store.logoUrl}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized
                        className={styles.logo}
                      />
                    ) : (
                      <span className={styles.logoPlaceholder} aria-hidden>
                        {store.name.slice(0, 1)}
                      </span>
                    )}
                    <div>
                      <h3>{store.name}</h3>
                      <p>{store.floor ? `Piso ${store.floor}` : 'Localizacao no shopping'}</p>
                    </div>
                  </div>
                  <div className={styles.metaRow}>
                    <span>{store.isRestaurant ? 'Restaurante' : 'Loja'}</span>
                    <span>{store.phone ?? 'Consulte no detalhe'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className={styles.pagination}>
            <Link
              className={styles.pageLink}
              href={`/lojas?${buildPageQuery(params, Math.max(1, currentPage - 1))}`}
              aria-disabled={currentPage === 1}
            >
              Anterior
            </Link>
            <span>{currentPage}</span>
            <Link
              className={styles.pageLink}
              href={`/lojas?${buildPageQuery(params, Math.min(totalPages, currentPage + 1))}`}
              aria-disabled={currentPage === totalPages}
            >
              Proxima
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function buildPageQuery(
  params: { search?: string; category?: string; featured?: string; restaurant?: string },
  page: number,
) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  if (params.featured) query.set('featured', params.featured);
  if (params.restaurant) query.set('restaurant', params.restaurant);
  query.set('page', String(page));
  return query.toString();
}
