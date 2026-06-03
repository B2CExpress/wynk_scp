/**
 * Seed do superadmin global (SPEC-20260603-1149).
 *
 * Cria (idempotente) um usuário com `role='superadmin'` e `tenantId=null` — o
 * operador da plataforma que provisiona shoppings via `/api/superadmin/tenants`.
 *
 * Credenciais por env:
 *   - SUPERADMIN_EMAIL    (default dev: `super@scp.local`)
 *   - SUPERADMIN_PASSWORD (obrigatória em production; fallback dev `superadmin123!`)
 *
 * Idempotente: se já existe superadmin com o email, preserva a senha (não sobrescreve).
 *
 * Uso: `npm run seed:superadmin -w backend` (após `npm run db:setup -w backend`).
 */
import 'reflect-metadata';
import { IsNull } from 'typeorm';
import { AppDataSource } from '../src/config/database';
import { config } from '../src/config';
import { User } from '../src/entities/User';
import { hashPassword } from '../src/utils/passwords';

function resolveEmail(): string {
  return process.env.SUPERADMIN_EMAIL ?? 'super@scp.local';
}

function resolvePassword(): string {
  const fromEnv = process.env.SUPERADMIN_PASSWORD;
  if (fromEnv) return fromEnv;
  if (config.nodeEnv === 'production') {
    throw new Error('SUPERADMIN_PASSWORD é obrigatório em production');
  }
  console.warn('[seed:superadmin] SUPERADMIN_PASSWORD não setada — usando fallback dev');
  return 'superadmin123!';
}

async function main(): Promise<void> {
  const email = resolveEmail();
  const password = resolvePassword();

  await AppDataSource.initialize();
  try {
    const userRepo = AppDataSource.getRepository(User);
    const existing = await userRepo.findOne({
      where: { email, role: 'superadmin', tenantId: IsNull() },
    });

    if (existing) {
      console.log(`[seed:superadmin] já presente: ${email} (senha preservada)`);
      return;
    }

    const passwordHash = await hashPassword(password);
    const created = await userRepo.save(
      userRepo.create({
        tenantId: null,
        email,
        passwordHash,
        name: 'Superadmin',
        role: 'superadmin',
      }),
    );
    console.log(`[seed:superadmin] criado: ${created.email} (${created.id})`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(
    '[seed:superadmin] erro:',
    err instanceof Error ? (err.stack ?? err.message) : err,
  );
  process.exit(1);
});
