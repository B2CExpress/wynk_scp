/**
 * Garante que o schema da plataforma existe no Postgres antes de rodar migrations.
 *
 * Sem isso, a primeira migration trava porque o TypeORM tenta criar a tabela
 * `migrations` (de tracking) dentro de `scp.migrations` — mas `scp` ainda
 * não existe. Padrão equivalente ao `prepare:schema` do wynk_ecommerce.
 */
import { Client } from 'pg';
import { config } from '../src/config';

async function main(): Promise<void> {
  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.database,
  });

  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${config.database.schema}"`);
    console.log(`[ensure-schema] schema "${config.database.schema}" pronto.`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error('[ensure-schema] erro:', err instanceof Error ? err.message : err);
  process.exit(1);
});
