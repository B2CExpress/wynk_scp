import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { resolveTenantByHost } from '../lib/tenant/resolve';
import { loadTheme, flavorAssets } from '../lib/theme/load';
import './globals.css';

/**
 * Como o tenant ativo só é conhecido em request-time, geramos o `<title>`,
 * `<meta>` e `<link rel="icon">` dinamicamente em `generateMetadata`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') ?? '';
  const tenant = await resolveTenantByHost(host);
  const theme = await loadTheme(tenant?.flavorSlug ?? '_default');
  const assets = flavorAssets(tenant?.flavorSlug ?? '_default');

  return {
    title: theme.meta.title,
    description: theme.meta.description,
    icons: { icon: assets.favicon },
    openGraph: {
      title: theme.meta.title,
      description: theme.meta.description,
      images: [assets.ogImage],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get('host') ?? '';
  const tenant = await resolveTenantByHost(host);

  if (!tenant) {
    // Host não corresponde a nenhum tenant cadastrado.
    notFound();
  }

  const theme = await loadTheme(tenant.flavorSlug);
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    theme.fonts.primary,
  )}:wght@400;600;700&display=swap`;

  // CSS variables aplicadas no <html> propagam pra toda árvore via cascade.
  // Componentes consomem com `var(--color-primary)` em CSS Modules.
  const cssVars = {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-text': theme.colors.text,
    '--color-background': theme.colors.background,
    '--font-primary': `"${theme.fonts.primary}", system-ui, sans-serif`,
  } as CSSProperties;

  return (
    <html lang="pt-BR" style={cssVars}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontHref} />
      </head>
      <body>{children}</body>
    </html>
  );
}
