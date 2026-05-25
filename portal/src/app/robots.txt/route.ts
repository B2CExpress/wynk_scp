'use server';

import { headers } from 'next/headers';
import { unstable_cache } from 'next/cache';
import { resolveTenantByHost } from '@/lib/tenant/resolve';

const CACHE_TTL_SECONDS = 3600;

async function getCachedRobots(host: string, tenantId: string): Promise<string> {
  return unstable_cache(
    async () =>
      `User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://${host}/sitemap.xml
`,
    [`robots-${tenantId}`],
    {
      revalidate: CACHE_TTL_SECONDS,
      tags: [`robots:${tenantId}`],
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

    const robotsTxt = await getCachedRobots(host, tenant.id);

    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('robots error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
