import Image from 'next/image';
import { headers } from 'next/headers';
import { resolveTenantByHost } from '../lib/tenant/resolve';
import { loadTheme, flavorAssets } from '../lib/theme/load';
import styles from './page.module.css';

/**
 * Homepage temporária — apenas para validar visualmente o pipeline de
 * white-label durante a fase 4 da SPEC-1505.
 *
 * Mostra: logo do flavor, nome do tenant, cores aplicadas via CSS vars,
 * meta carregadas. Sai assim que tivermos design real (fase futura).
 */
export default async function Home() {
  const host = (await headers()).get('host') ?? '';
  const tenant = await resolveTenantByHost(host);
  const flavorSlug = tenant?.flavorSlug ?? '_default';
  const theme = await loadTheme(flavorSlug);
  const assets = flavorAssets(flavorSlug);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          src={assets.logo}
          alt={`Logo ${theme.name}`}
          width={240}
          height={60}
          priority
          unoptimized
        />
        <div className={styles.intro}>
          <h1>{theme.name}</h1>
          <p>{theme.meta.description}</p>
        </div>
        <dl className={styles.tokens}>
          <dt>flavor_slug</dt>
          <dd>
            <code>{flavorSlug}</code>
          </dd>
          <dt>primary</dt>
          <dd>
            <span
              className={styles.swatch}
              style={{ backgroundColor: theme.colors.primary }}
              aria-hidden
            />
            <code>{theme.colors.primary}</code>
          </dd>
          <dt>secondary</dt>
          <dd>
            <span
              className={styles.swatch}
              style={{ backgroundColor: theme.colors.secondary }}
              aria-hidden
            />
            <code>{theme.colors.secondary}</code>
          </dd>
          <dt>font</dt>
          <dd>
            <code>{theme.fonts.primary}</code>
          </dd>
        </dl>
      </main>
    </div>
  );
}
