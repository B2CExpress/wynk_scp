'use server';

import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { resolveTenantByHost } from '@/lib/tenant/resolve';
import { escapeXml, toIso8601Date } from '@/lib/xml';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';
const CACHE_TTL_SECONDS = 3600;

interface PublicEntity {
  id: string;
  slug: string;
  updatedAt: string;
}

async function fetchPublicStores(host: string): Promise<PublicEntity[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/stores`, {
      headers: { 'X-Forwarded-Host': host },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.stores) ? data.stores : [];
  } catch {
    return [];
  }
}

async function fetchPublicEvents(host: string): Promise<PublicEntity[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/events`, {
      headers: { 'X-Forwarded-Host': host },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchPublicPromotions(host: string): Promise<PublicEntity[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/promotions`, {
      headers: { 'X-Forwarded-Host': host },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function buildSitemapXml(baseUrl: string, entities: Record<string, PublicEntity[]>): string {
  const staticRoutes = ['', 'lojas', 'noticias', 'eventos', 'teatro', 'promocoes', 'servicos'];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static routes
  for (const route of staticRoutes) {
    const loc = route ? `${baseUrl}/${route}` : baseUrl;
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(loc)}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }

  // Dynamic routes. Theater shows e services ficam de fora desta versão:
  // TheaterShow não tem coluna `slug` (SPEC follow-up registrada) e o domínio
  // Services nem entity tem ainda.
  const categories = [
    { key: 'stores', path: 'lojas', priority: '0.7' },
    { key: 'events', path: 'eventos', priority: '0.7' },
    { key: 'promotions', path: 'promocoes', priority: '0.6' },
  ];

  for (const category of categories) {
    const items = entities[category.key] || [];
    for (const item of items) {
      const loc = `${baseUrl}/${category.path}/${item.slug}`;
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(loc)}</loc>\n`;
      xml += `    <lastmod>${toIso8601Date(new Date(item.updatedAt))}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${category.priority}</priority>\n`;
      xml += '  </url>\n';
    }
  }

  xml += '</urlset>';
  return xml;
}

/**
 * Wrapper cacheado por tenant (`tenant:resolve:{host}` → tenant_id). Tag
 * `sitemap:{tenant_id}` permite invalidação manual via `revalidateTag` se
 * algum publish/archive precisar.
 */
async function getCachedSitemap(host: string, tenantId: string): Promise<string> {
  return unstable_cache(
    async () => {
      const baseUrl = `https://${host}`;
      const [stores, events, promotions] = await Promise.all([
        fetchPublicStores(host),
        fetchPublicEvents(host),
        fetchPublicPromotions(host),
      ]);
      return buildSitemapXml(baseUrl, { stores, events, promotions });
    },
    [`sitemap-xml-${tenantId}`],
    {
      revalidate: CACHE_TTL_SECONDS,
      tags: [`sitemap:${tenantId}`],
    },
  )();
}

export async function GET() {
  try {
    const host = (await headers()).get('host') ?? '';
    const tenant = await resolveTenantByHost(host);

    if (!tenant) {
      return new Response('Not Found', { status: 404 });
    }

    const xml = await getCachedSitemap(host, tenant.id);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('sitemap error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
