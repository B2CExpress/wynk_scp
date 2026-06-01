import type { DataSource } from 'typeorm';
import type Redis from 'ioredis';
import { invalidateByPattern } from '../utils/cache';
import { logger as defaultLogger } from '../utils/logger';

export interface PublishScheduledResult {
  events: number;
  shows: number;
  news: number;
}

type Logger = typeof defaultLogger;

/**
 * Publica eventos, theater shows e notícias agendados cuja `published_at`
 * já passou.
 *
 * Roda cross-tenant (sem AsyncLocalStorage de tenant) com UPDATE ... RETURNING
 * e invalida cache por tenant afetado.
 *
 * Falhas são logadas mas não propagam — cron não pode derrubar o processo.
 *
 * Coexiste com o endpoint `POST /api/cron/publish-scheduled` (em
 * `CronController.publishScheduledNews`) que faz o mesmo só pra news via
 * cron externo (Vercel / cron-job.org). Loop interno é defesa em
 * profundidade: se o cron externo cair, nada para de publicar.
 */
export async function publishScheduled(
  ds: DataSource,
  redis: Redis,
  log: Logger = defaultLogger,
): Promise<PublishScheduledResult> {
  let events = 0;
  let shows = 0;
  let news = 0;

  try {
    const rows: Array<{ tenant_id: string }> = await ds.query(
      `UPDATE tb_event
         SET event_status = 'published',
             event_published_at = COALESCE(event_published_at, NOW())
       WHERE event_status = 'scheduled'
         AND event_published_at <= NOW()
       RETURNING tenant_id`,
    );
    events = rows.length;
    const tenants = new Set(rows.map((r) => r.tenant_id));
    for (const tid of tenants) {
      await invalidateByPattern(redis, `events:list:${tid}:*`);
      await invalidateByPattern(redis, `events:detail:${tid}:*`);
    }
  } catch (err) {
    log.error('publish-scheduled events failed', {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const rows: Array<{ tenant_id: string }> = await ds.query(
      `UPDATE tb_theater_show
         SET show_status = 'published',
             show_published_at = COALESCE(show_published_at, NOW())
       WHERE show_status = 'scheduled'
         AND show_published_at <= NOW()
       RETURNING tenant_id`,
    );
    shows = rows.length;
    const tenants = new Set(rows.map((r) => r.tenant_id));
    for (const tid of tenants) {
      await invalidateByPattern(redis, `shows:list:${tid}:*`);
      await invalidateByPattern(redis, `shows:detail:${tid}:*`);
    }
  } catch (err) {
    log.error('publish-scheduled shows failed', {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    const rows: Array<{ tenant_id: string }> = await ds.query(
      `UPDATE tb_news
         SET news_status = 'published',
             news_published_at = COALESCE(news_published_at, NOW())
       WHERE news_status = 'scheduled'
         AND news_published_at <= NOW()
       RETURNING tenant_id`,
    );
    news = rows.length;
    const tenants = new Set(rows.map((r) => r.tenant_id));
    for (const tid of tenants) {
      await invalidateByPattern(redis, `news:list:${tid}:*`);
      await invalidateByPattern(redis, `news:detail:${tid}:*`);
    }
  } catch (err) {
    log.error('publish-scheduled news failed', {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  if (events || shows || news) {
    log.info('publish-scheduled run', { events, shows, news });
  }

  return { events, shows, news };
}

/**
 * Inicia o loop do cron (default a cada 60s). `unref()` para não bloquear
 * shutdown.
 */
export function startPublishScheduledLoop(
  ds: DataSource,
  redis: Redis,
  intervalMs = 60_000,
  log: Logger = defaultLogger,
): NodeJS.Timeout {
  const handle = setInterval(() => {
    publishScheduled(ds, redis, log).catch((err) => {
      log.error('publish-scheduled loop crashed', {
        message: err instanceof Error ? err.message : String(err),
      });
    });
  }, intervalMs);
  handle.unref();
  return handle;
}
