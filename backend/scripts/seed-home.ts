/**
 * Seed da home: popula tb_tenant_hero, tb_popup e tb_tenant_settings
 * para todos os tenants existentes no banco.
 *
 * Idempotente — usa UPSERT (INSERT … ON CONFLICT DO UPDATE) para hero e
 * settings (1:1), e skip-if-exists para popup (1:N mas seed cria só 1).
 *
 * Uso: `npm run seed:home -w backend`
 * Pré-requisito: migration 1746844900000-CreateHomeConfigTables já aplicada.
 */
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { Tenant } from '../src/entities/Tenant';

// -------------------------------------------------------------------------- //
// Helpers de UPSERT via query builder raw                                     //
// -------------------------------------------------------------------------- //

async function upsertHero(tenantId: string, tenantName: string): Promise<void> {
  await AppDataSource.query(
    `
    INSERT INTO scp.tb_tenant_hero (
      tenant_id,
      hero_title,
      hero_subtitle,
      hero_background_image_url,
      hero_cta_text,
      hero_cta_link,
      hero_overlay_color,
      hero_overlay_opacity,
      hero_updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    ON CONFLICT (tenant_id) DO UPDATE SET
      hero_title                 = EXCLUDED.hero_title,
      hero_subtitle              = EXCLUDED.hero_subtitle,
      hero_background_image_url  = EXCLUDED.hero_background_image_url,
      hero_cta_text              = EXCLUDED.hero_cta_text,
      hero_cta_link              = EXCLUDED.hero_cta_link,
      hero_overlay_color         = EXCLUDED.hero_overlay_color,
      hero_overlay_opacity       = EXCLUDED.hero_overlay_opacity,
      hero_updated_at            = NOW()
    `,
    [
      tenantId,
      `Bem-vindo ao ${tenantName}`,
      'Encontre as melhores lojas, promoções e experiências em um só lugar.',
      `https://picsum.photos/seed/${tenantId}-hero/1920/600`,
      'Conheça as lojas',
      '/lojas',
      '#000000',
      0.4,
    ],
  );
  console.log(`[seed:home] hero upsert: ${tenantId}`);
}

async function insertPopupIfAbsent(tenantId: string, tenantName: string): Promise<void> {
  const [{ count }] = await AppDataSource.query(
    `SELECT COUNT(*) AS count FROM scp.tb_popup WHERE tenant_id = $1`,
    [tenantId],
  );

  if (Number(count) > 0) {
    console.log(`[seed:home] popup já existe para tenant ${tenantId} — pulando`);
    return;
  }

  await AppDataSource.query(
    `
    INSERT INTO scp.tb_popup (
      tenant_id,
      popup_title,
      popup_image_url,
      popup_html_content,
      popup_link_url,
      popup_show_after_seconds,
      popup_show_only_once,
      popup_show_on_pages,
      popup_starts_at,
      popup_ends_at,
      popup_is_active,
      popup_created_at,
      popup_updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL, NULL, false, NOW(), NOW())
    `,
    [
      tenantId,
      `Newsletter ${tenantName}`,                           // título interno
      `https://picsum.photos/seed/${tenantId}-popup/600/400`, // imagem placeholder
      null,                                                  // sem html_content
      '/newsletter',                                         // link ao clicar
      3,                                                     // show_after_seconds
      true,                                                  // show_only_once
      'home',                                                // show_on_pages
    ],
  );
  console.log(`[seed:home] popup criado (inativo) para tenant ${tenantId}`);
}

async function upsertSettings(tenantId: string, tenantName: string): Promise<void> {
  await AppDataSource.query(
    `
    INSERT INTO scp.tb_tenant_settings (
      tenant_id,
      settings_footer_about,
      settings_footer_address,
      settings_footer_phone,
      settings_footer_email,
      settings_social_facebook,
      settings_social_instagram,
      settings_social_youtube,
      settings_social_tiktok,
      settings_google_analytics_id,
      settings_google_tag_manager_id,
      settings_facebook_pixel_id,
      settings_extra_head_html,
      settings_updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    ON CONFLICT (tenant_id) DO UPDATE SET
      settings_footer_about           = EXCLUDED.settings_footer_about,
      settings_footer_address         = EXCLUDED.settings_footer_address,
      settings_footer_phone           = EXCLUDED.settings_footer_phone,
      settings_footer_email           = EXCLUDED.settings_footer_email,
      settings_social_facebook        = EXCLUDED.settings_social_facebook,
      settings_social_instagram       = EXCLUDED.settings_social_instagram,
      settings_social_youtube         = EXCLUDED.settings_social_youtube,
      settings_social_tiktok          = EXCLUDED.settings_social_tiktok,
      settings_google_analytics_id    = EXCLUDED.settings_google_analytics_id,
      settings_google_tag_manager_id  = EXCLUDED.settings_google_tag_manager_id,
      settings_facebook_pixel_id      = EXCLUDED.settings_facebook_pixel_id,
      settings_extra_head_html        = EXCLUDED.settings_extra_head_html,
      settings_updated_at             = NOW()
    `,
    [
      tenantId,
      `${tenantName} — o melhor destino de compras e lazer da região.`,
      'Av. Principal, 1000 — Centro',
      '(11) 3000-0000',
      `contato@${tenantName.toLowerCase().replace(/\s+/g, '')}.com.br`,
      `https://facebook.com/${tenantName.toLowerCase().replace(/\s+/g, '')}`,
      `https://instagram.com/${tenantName.toLowerCase().replace(/\s+/g, '')}`,
      null,   // youtube — vazio no seed
      null,   // tiktok  — vazio no seed
      null,   // GA — preencher manualmente depois
      null,   // GTM — preencher manualmente depois
      null,   // Pixel — preencher manualmente depois
      null,   // extra_head_html — somente superadmin
    ],
  );
  console.log(`[seed:home] settings upsert: ${tenantId}`);
}

// -------------------------------------------------------------------------- //
// Main                                                                        //
// -------------------------------------------------------------------------- //

async function main(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const tenants = await AppDataSource.getRepository(Tenant).find();

    if (tenants.length === 0) {
      console.warn('[seed:home] Nenhum tenant encontrado — rode `npm run seed` primeiro.');
      return;
    }

    for (const tenant of tenants) {
      console.log(`\n[seed:home] processando tenant: ${tenant.slug} (${tenant.id})`);
      await upsertHero(tenant.id, tenant.name);
      await insertPopupIfAbsent(tenant.id, tenant.name);
      await upsertSettings(tenant.id, tenant.name);
    }

    console.log(`\n[seed:home] concluído — ${tenants.length} tenant(s) processado(s).`);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err: unknown) => {
  console.error('[seed:home] erro:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
