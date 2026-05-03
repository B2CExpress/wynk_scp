# SPEC-20260503-1508: Home e componentes globais

**Status:** draft
**Criada:** 2026-05-03 15:08
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** home, hero, banners, popup, newsletter, footer, lgpd
**Features:** home, banners, popup, newsletter, footer
**Branch:** feature/home-componentes-globais (quando ativa)
**Depende de:** SPEC-20260503-1505 (base), SPEC-20260503-1506 (lojas em destaque), SPEC-20260503-1507 (notícias/eventos/promoções em destaque)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 4 — usuário em 2026-05-03 15:05
**Resumo:** Monta a home pública e os componentes globais (hero rotativo, seções de destaque agregando lojas/notícias/eventos/promoções, pop-up programável, newsletter LGPD-compliant, footer dinâmico).

## Objetivo

Entregar a página inicial e a "casca" do site público — onde o conteúdo das fases anteriores é vitrine — e os componentes que aparecem em qualquer rota (header, footer, pop-up, modal de newsletter).

## Escopo

**DENTRO:**
- **Hero/Banners:** schema (tenant_id, tipo=hero|popup, titulo, imagem_desktop, imagem_mobile, link, exibir_de, exibir_ate, ordem, ativo) — §7.2 banners
- **Home sections:** lojas em destaque (flag da Fase 2), próximos eventos, últimas notícias, promoções vigentes — agregadas em layout configurável
- **Pop-up:** mesmo schema de banner com `tipo=popup` — exibido conforme regras (1x por sessão / N vezes / sempre — config no admin Fase 5)
- **Newsletter:** schema `newsletter_inscritos(tenant_id, email, opt_in_em, opt_in_ip, status, opt_out_em)`; modal/seção com checkbox explícito; double opt-in opcional; rate limit reforçado (§10)
- **Footer dinâmico:** redes sociais, links de app stores, contatos — tudo da config do tenant (Fase 5)
- LGPD: registro de consentimento (timestamp + IP), endpoint `POST /newsletter/cancelar`, anonimização sob solicitação (§10)
- ISR 60s na home (§9)

**FORA:**
- Editor visual da home (drag-drop de seções) — config inicial por código/seed
- A/B testing de hero
- Personalização da home por usuário logado
- Exportação CSV de inscritos (Fase 5 — admin)

## Implementação

- Componentes globais (`<Header>`, `<Footer>`, `<PopupModal>`, `<NewsletterModal>`) consomem a `tenantConfig` injetada no layout raiz (Fase 1)
- Home agrega via Server Components — uma única round-trip ao banco (queries paralelas)
- Pop-up: lógica client-side (cookie/localStorage por tenant) decide se mostra; config vem do server
- Newsletter: endpoint POST com rate limit por IP+tenant (Redis token bucket); validação de email; respond 200 mesmo se já inscrito (anti-enumeration)
- Footer puxa da config do tenant — adicionar campos novos = atualizar schema `tenants` + form de configurações na Fase 5

## Critério de aceite

- [ ] Home renderiza hero rotativo com banners ativos do tenant (respeitando `exibir_de/exibir_ate`)
- [ ] Seções de home mostram conteúdo correto e atualizado quando ISR revalida
- [ ] Pop-up aparece 1x por sessão (testar reload — não reaparece; nova aba — reaparece)
- [ ] Inscrição em newsletter exige checkbox marcado; consentimento (timestamp+IP) gravado
- [ ] Cancelamento de inscrição via link funciona, status vira `unsubscribed`
- [ ] Rate limit de newsletter bloqueia >5 tentativas/min do mesmo IP
- [ ] Footer reflete config do tenant (mudar redes sociais via SQL → footer atualiza após cache expirar)
- [ ] Lighthouse ≥ 90 em performance da home (com ISR servindo)
- [ ] **Features tocadas (home, banners, popup, newsletter, footer) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
