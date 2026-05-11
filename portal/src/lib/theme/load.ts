import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Theme } from './types';

/**
 * Carrega o `theme.json` de um flavor a partir do filesystem (server-side).
 * Cai pra `_default/theme.json` se o flavor pedido não existir.
 *
 * IMPORTANTE: usa `process.cwd()` que aponta pra raiz do package `portal/` em
 * tempo de execução do Next. Os flavors vivem em `portal/public/flavors/`,
 * por isso o path inicia com `public/`.
 *
 * Usar somente em Server Components / Route Handlers / Server Actions.
 */
export async function loadTheme(flavorSlug: string): Promise<Theme> {
  const baseDir = path.join(process.cwd(), 'public', 'flavors');
  try {
    const raw = await readFile(path.join(baseDir, flavorSlug, 'theme.json'), 'utf-8');
    return JSON.parse(raw) as Theme;
  } catch {
    const fallback = await readFile(path.join(baseDir, '_default', 'theme.json'), 'utf-8');
    return JSON.parse(fallback) as Theme;
  }
}

/**
 * Retorna URLs absolutas (relativas à raiz HTTP) dos assets do flavor.
 * Logo e favicon caem pra `_default/` se ausentes na pasta do tenant.
 */
export function flavorAssets(flavorSlug: string): {
  logo: string;
  favicon: string;
  ogImage: string;
} {
  return {
    logo: `/flavors/${flavorSlug}/logo.svg`,
    favicon: `/flavors/${flavorSlug}/favicon.ico`,
    ogImage: `/flavors/${flavorSlug}/og-image.jpg`,
  };
}
