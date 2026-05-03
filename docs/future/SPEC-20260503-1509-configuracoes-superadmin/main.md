# SPEC-20260503-1509: Configurações e Superadmin

**Status:** draft
**Criada:** 2026-05-03 15:09
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** configuracoes, superadmin, identidade-visual, dashboard, integracoes
**Features:** configuracoes, superadmin, identidade-visual, dashboard
**Branch:** feature/configuracoes-superadmin (quando ativa)
**Depende de:** SPEC-20260503-1505 (base), SPEC-20260503-1506 (lojas), SPEC-20260503-1507 (editorial), SPEC-20260503-1508 (home)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 5 — usuário em 2026-05-03 15:05
**Resumo:** Fecha o painel admin — dashboard com métricas, módulo de Configurações por tenant (identidade visual, dados, redes, integrações GA/Meta) e perfil Superadmin que gerencia o ciclo de vida dos tenants.

## Objetivo

Permitir que cada tenant se autogerencie completamente (visual, integrações, dados institucionais) e que o Superadmin opere a plataforma (criar/desativar shoppings, monitorar uso).

## Escopo

**DENTRO:**
- **Dashboard tenant** (§7.2): cards de métricas — total de lojas, eventos próximos, notícias publicadas, inscritos newsletter, acessos (via GA Reporting API)
- **Configurações tenant** (§7.2):
  - Identidade visual: cores primária/secundária/accent/text/background, fontes primária/secundária, favicon, logo (upload CDN)
  - Dados do shopping: endereço, telefones, horários
  - Redes sociais: instagram, facebook, tiktok, youtube, etc.
  - Links do app: App Store + Play Store
  - Integrações: GA4 measurement ID, Meta Pixel ID
  - Regras de exibição de pop-up (consumido pela Fase 4)
- **Superadmin** (§7.1):
  - CRUD de tenants (criar shopping novo: slug, host, config inicial)
  - Ativar/desativar tenant
  - Visão consolidada: todos os tenants com últimas métricas
  - Trocar de contexto de tenant (impersonate-style) para suporte
- **Newsletter admin:** lista de inscritos com exportação CSV (§7.2)
- Validação: ao salvar config, invalidar cache Redis do tenant (§9)

**FORA:**
- Faturamento / billing (não está no escopo da plataforma)
- Self-service de provisionamento de tenant (Superadmin cria manualmente)
- Tradução / i18n
- Workflow de aprovação editorial (Editor publica direto)

## Implementação

- Dashboard: queries agregadas com cache curto (1 min). GA via OAuth do tenant ou Service Account compartilhada — decidir na ativação
- Form de identidade visual com preview ao vivo (mostra como ficaria a home com as novas cores antes de salvar)
- Upload de logo/favicon: mesmo helper de CDN da Fase 2
- Superadmin troca de contexto via cookie `impersonate_tenant_id` (auditado em log)
- Configurações persistidas em `tenants` (JSONB pra campos extensíveis)
- Permissões reforçadas: Editor não vê Configurações; Tenant Admin vê tudo do próprio tenant; Superadmin vê tudo
- Exportação CSV de newsletter via endpoint server (não front-end download direto, evitar timeout)

## Critério de aceite

- [ ] Tenant Admin acessa Configurações, altera cor primária, salva → home reflete em <1 min (cache invalida)
- [ ] Upload de favicon funciona, é servido pelo `<head>` do layout raiz
- [ ] Editor recebe 403 ao tentar acessar Configurações
- [ ] Dashboard mostra métricas corretas para o tenant atual (não vaza dados de outro)
- [ ] Superadmin cria novo tenant via form, define host, e site responde naquele host imediatamente
- [ ] Superadmin desativa tenant → site retorna 404/503 customizado naquele host
- [ ] Impersonação por Superadmin é auditada (log com `actor_id`, `target_tenant_id`, timestamp)
- [ ] Exportação CSV de newsletter funciona com >10k inscritos (streaming)
- [ ] **Features tocadas (configuracoes, superadmin, identidade-visual, dashboard) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
