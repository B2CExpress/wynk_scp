'use server';

import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { resolveTenantByHost } from '@/lib/tenant/resolve';
import { escapeXml, toRfc822 } from '@/lib/xml';
import { loadTheme } from '@/lib/theme/load';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';
const CACHE_TTL_SECONDS = 3600;

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
}

async function fetchPublishedNews(host: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/events?limit=50`, {
      headers: { 'X-Forwarded-Host': host },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data)
      ? data.map((item: Record<string, string>) => ({
          id: item.id,
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          publishedAt: item.publishedAt,
        }))
      : [];
  } catch {
    return [];
  }
}

function buildRssXml(tenant: Record<string, string>, baseUrl: string, items: NewsItem[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0">\n';
  xml += '  <channel>\n';
  xml += `    <title>${escapeXml(tenant.name || 'Notícias')}</title>\n`;
  xml += `    <link>${escapeXml(baseUrl)}</link>\n`;
  xml += `    <description>${escapeXml(tenant.metaDescription || 'Notícias')}</description>\n`;
  xml += '    <language>pt-br</language>\n';

  for (const item of items) {
    const link = `${baseUrl}/eventos/${item.slug}`;
    const pubDate = item.publishedAt
      ? toRfc822(new Date(item.publishedAt))
      : new Date().toUTCString();

    xml += '    <item>\n';
    xml += `      <title>${escapeXml(item.title)}</title>\n`;
    xml += `      <link>${escapeXml(link)}</link>\n`;
    xml += `      <description>${escapeXml(item.summary)}</description>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <guid isPermaLink="true">${escapeXml(link)}</guid>\n`;
    xml += '    </item>\n';
  }

  xml += '  </channel>\n';
  xml += '</rss>';
  return xml;
}

async function getCachedRss(host: string, tenantId: string, flavorSlug: string): Promise<string> {
  return unstable_cache(
    async () => {
      const baseUrl = `https://${host}`;
      const theme = await loadTheme(flavorSlug);
      const news = await fetchPublishedNews(host);
      return buildRssXml(
        { name: theme.meta.title, metaDescription: theme.meta.description },
        baseUrl,
        news,
      );
    },
    [`rss-news-${tenantId}`],
    {
      revalidate: CACHE_TTL_SECONDS,
      tags: [`rss:news:${tenantId}`],
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

    const xml = await getCachedRss(host, tenant.id, tenant.flavorSlug);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('rss error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
