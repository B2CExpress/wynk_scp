/**
 * Seed reproduzível: lê `seeds/tenants.json` (fonte canônica, na raiz do repo)
 * e garante que cada tenant existe no DB + tem 1 admin com senha bcrypt.
 *
 * Idempotente: pode rodar quantas vezes for. Atualiza host/flavorSlug/name
 * se mudaram; preserva senha existente do admin (não sobrescreve em re-run).
 *
 * Email do admin: `admin@<tenant_host>`.
 * Senha: env `SEED_ADMIN_PASSWORD` (obrigatória em production; fallback
 * `admin123` em dev pra DX — registra warn).
 *
 * Uso: `npm run seed -w backend` (após `npm run db:setup -w backend`).
 */
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppDataSource } from '../src/config/database';
import { config } from '../src/config';
import { Tenant } from '../src/entities/Tenant';
import { User } from '../src/entities/User';
import { hashPassword } from '../src/utils/passwords';

interface TenantSeed {
  slug: string;
  host: string;
  flavorSlug: string;
  name: string;
}

const SEED_FILE = resolve(__dirname, '../../seeds/tenants.json');

function resolveAdminPassword(): string {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;
  if (config.nodeEnv === 'production') {
    throw new Error('SEED_ADMIN_PASSWORD é obrigatório em production');
  }
  console.warn('[seed] SEED_ADMIN_PASSWORD não setada — usando fallback dev "admin123"');
  return 'admin123';
}

async function upsertTenant(seed: TenantSeed): Promise<Tenant> {
  const tenantRepo = AppDataSource.getRepository(Tenant);
  const existing = await tenantRepo.findOne({ where: { slug: seed.slug } });

  if (!existing) {
    const created = await tenantRepo.save(
      tenantRepo.create({
        slug: seed.slug,
        host: seed.host,
        flavorSlug: seed.flavorSlug,
        name: seed.name,
      }),
    );
    console.log(`[seed] tenant criado: ${created.slug} (${created.id})`);
    return created;
  }

  const drift: string[] = [];
  if (existing.host !== seed.host) {
    drift.push(`host: ${existing.host} → ${seed.host}`);
    existing.host = seed.host;
  }
  if (existing.flavorSlug !== seed.flavorSlug) {
    drift.push(`flavorSlug: ${existing.flavorSlug} → ${seed.flavorSlug}`);
    existing.flavorSlug = seed.flavorSlug;
  }
  if (existing.name !== seed.name) {
    drift.push(`name: ${existing.name} → ${seed.name}`);
    existing.name = seed.name;
  }
  if (drift.length > 0) {
    await tenantRepo.save(existing);
    console.log(`[seed] tenant atualizado: ${existing.slug} (${drift.join(', ')})`);
  } else {
    console.log(`[seed] tenant já alinhado: ${existing.slug}`);
  }
  return existing;
}

async function upsertAdmin(tenant: Tenant, password: string): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const email = `admin@${tenant.host}`;
  const existing = await userRepo.findOne({
    where: { tenantId: tenant.id, email },
  });

  if (existing) {
    console.log(`[seed] admin já presente: ${email} (senha preservada)`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const created = await userRepo.save(
    userRepo.create({
      tenantId: tenant.id,
      email,
      passwordHash,
      name: `Admin ${tenant.name}`,
      role: 'tenant_admin',
    }),
  );
  console.log(`[seed] admin criado: ${created.email}`);
}

async function main(): Promise<void> {
  const raw = readFileSync(SEED_FILE, 'utf8');
  const seeds = JSON.parse(raw) as TenantSeed[];
  if (!Array.isArray(seeds) || seeds.length === 0) {
    throw new Error(`[seed] ${SEED_FILE} está vazio ou inválido`);
  }

  const password = resolveAdminPassword();
  await AppDataSource.initialize();

  try {
    for (const seed of seeds) {
      const tenant = await upsertTenant(seed);
      await upsertAdmin(tenant, password);
    }
    console.log(`[seed] concluído — ${seeds.length} tenant(s) processado(s).`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('[seed] erro:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
