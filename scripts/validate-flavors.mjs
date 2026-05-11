#!/usr/bin/env node
// @ts-check
/**
 * Valida que cada tenant declarado em `seeds/tenants.json` tem a pasta
 * `portal/public/flavors/<flavorSlug>/` com os arquivos obrigatórios:
 *   - theme.json (com todos os campos do schema)
 *   - logo.svg
 *   - favicon.ico
 *
 * Também valida o `_default/` (fallback de assets ausentes).
 *
 * Roda no CI antes do build/deploy. Falha (exit 1) se algo está fora.
 *
 * O manifesto `seeds/tenants.json` é a fonte da verdade — alinhado com
 * a SPEC-1505 §Implementação (white-label Modelo A: tudo versionado em git).
 * A tabela `tb_tenant` no banco é populada a partir desse mesmo manifesto
 * via migration de seed (a vir na fase 6).
 */
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const flavorsDir = path.join(repoRoot, 'portal', 'public', 'flavors');
const seedFile = path.join(repoRoot, 'seeds', 'tenants.json');

const REQUIRED_ASSETS = ['theme.json', 'logo.svg', 'favicon.ico'];

const REQUIRED_THEME_KEYS = {
  name: 'string',
  colors: { primary: 'string', secondary: 'string', text: 'string', background: 'string' },
  fonts: { primary: 'string' },
  meta: { title: 'string', description: 'string', ogImage: 'string' },
  social: { instagram: 'nullable', facebook: 'nullable', youtube: 'nullable', tiktok: 'nullable' },
  contact: { phone: 'nullable', email: 'nullable', address: 'nullable' },
};

/** @type {string[]} */
const errors = [];

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {unknown} value
 * @param {string} type
 * @returns {boolean}
 */
function checkType(value, type) {
  if (type === 'string') return typeof value === 'string';
  if (type === 'nullable') return value === null || typeof value === 'string';
  return false;
}

/**
 * @param {Record<string, unknown>} theme
 * @param {string} where
 */
function validateThemeShape(theme, where) {
  for (const [key, expected] of Object.entries(REQUIRED_THEME_KEYS)) {
    const value = theme[key];
    if (typeof expected === 'string') {
      if (!checkType(value, expected)) {
        errors.push(`${where}: campo "${key}" deve ser ${expected}`);
      }
      continue;
    }
    // nested object
    if (!value || typeof value !== 'object') {
      errors.push(`${where}: campo "${key}" deve ser um objeto`);
      continue;
    }
    for (const [subKey, subType] of Object.entries(expected)) {
      const subValue = /** @type {Record<string, unknown>} */ (value)[subKey];
      if (!checkType(subValue, subType)) {
        errors.push(`${where}: campo "${key}.${subKey}" deve ser ${subType}`);
      }
    }
  }
}

/**
 * @param {string} flavorSlug
 */
async function validateFlavor(flavorSlug) {
  const dir = path.join(flavorsDir, flavorSlug);
  if (!(await fileExists(dir))) {
    errors.push(`flavor "${flavorSlug}": pasta ${path.relative(repoRoot, dir)} não existe`);
    return;
  }

  for (const asset of REQUIRED_ASSETS) {
    const file = path.join(dir, asset);
    if (!(await fileExists(file))) {
      errors.push(`flavor "${flavorSlug}": arquivo obrigatório faltando: ${asset}`);
    }
  }

  const themePath = path.join(dir, 'theme.json');
  if (await fileExists(themePath)) {
    try {
      const raw = await readFile(themePath, 'utf-8');
      const parsed = JSON.parse(raw);
      validateThemeShape(parsed, `flavor "${flavorSlug}"/theme.json`);
    } catch (err) {
      errors.push(
        `flavor "${flavorSlug}": theme.json inválido — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

async function main() {
  // _default é fallback, sempre obrigatório
  await validateFlavor('_default');

  const seedRaw = await readFile(seedFile, 'utf-8');
  /** @type {Array<{ slug: string, host: string, flavorSlug: string, name: string }>} */
  const tenants = JSON.parse(seedRaw);

  if (!Array.isArray(tenants)) {
    errors.push(`${path.relative(repoRoot, seedFile)} deve ser um array de tenants`);
  } else {
    for (const tenant of tenants) {
      if (!tenant.flavorSlug) {
        errors.push(`tenant "${tenant.slug ?? '?'}": campo "flavorSlug" é obrigatório`);
        continue;
      }
      await validateFlavor(tenant.flavorSlug);
    }
  }

  if (errors.length > 0) {
    console.error('❌ validate-flavors falhou:');
    for (const err of errors) {
      console.error(`   - ${err}`);
    }
    process.exit(1);
  }

  console.log('✓ validate-flavors: todos os flavors válidos');
}

main().catch((err) => {
  console.error('Erro inesperado:', err);
  process.exit(1);
});
