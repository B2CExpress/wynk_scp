import type { Metadata } from 'next';
import './globals.css';

import { getCurrentTenant } from '@/lib/tenant';

type RootLayoutProps = {
  children: React.ReactNode;
};

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();

  return {
    title: tenant.meta_title || tenant.name,
    description: tenant.meta_description || `Portal oficial do ${tenant.name}`,
    icons: {
      icon: tenant.favicon_url || '/favicon.ico',
    },
  };
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const tenant = await getCurrentTenant();

  const style = {
    '--color-primary': tenant.primary_color || '#000000',

    '--color-secondary': tenant.secondary_color || '#444444',

    '--color-accent': tenant.accent_color || '#F5F5F5',

    '--color-text': tenant.text_color || '#1A1A1A',

    '--color-background': tenant.background_color || '#FFFFFF',

    '--font-primary': tenant.font_primary || 'system-ui, sans-serif',

    '--font-secondary': tenant.font_secondary || 'serif',
  } as React.CSSProperties;

  return (
    <html lang="pt-BR">
      <body style={style}>{children}</body>
    </html>
  );
}
