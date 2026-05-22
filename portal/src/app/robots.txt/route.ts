'use server';

import { headers } from 'next/headers';
import { resolveTenantByHost } from '@/lib/tenant/resolve';

export async function GET() {
  try {
    const host = (await headers()).get('host') ?? '';
    const tenant = await resolveTenantByHost(host);

    if (!tenant) {
      return new Response('Not Found', { status: 404 });
    }

    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://${host}/sitemap.xml
`;

    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('robots error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
