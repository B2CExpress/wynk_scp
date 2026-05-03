# SPEC-20260503-1506: Módulo de Lojas

**Status:** draft
**Criada:** 2026-05-03 15:06
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** lojas, categorias, busca, filtros, admin
**Features:** lojas, categorias-lojas, busca
**Branch:** feature/modulo-lojas (quando ativa)
**Depende de:** SPEC-20260503-1505 (base multitenant)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 2 — usuário em 2026-05-03 15:05
**Resumo:** Implementa o módulo de Lojas ponta-a-ponta — admin (CRUD, multi-categoria, upload de imagens, destaque), API isolada por tenant, frontend com listagem, filtros e busca.

## Objetivo

Permitir que cada tenant gerencie seu catálogo de lojas e que visitantes consigam descobri-las via listagem, filtros por categoria e busca textual.

## Escopo

**DENTRO:**
- Schema `lojas` (tenant_id, nome, slug, descrição, imagens[], horário, contato, categorias[], destaque) e `categorias_lojas` (tenant_id, nome, ícone, ordem)
- Admin: CRUD de lojas com upload múltiplo de imagens, seleção de N categorias, flag "destaque na home"
- Admin: CRUD de categorias com ícone e reordenação drag-and-drop
- API REST/Server Actions: list/get/create/update/delete com isolamento de tenant
- Frontend público: `/lojas` (listagem com filtros + busca), `/lojas/[slug]` (detalhe)
- Cache Redis para listagens (TTL 5 min, chave inclui `tenant_id` + filtros — §9)
- Upload de imagens vai pra CDN com path `cdn.plataforma.com/{tenant-id}/lojas/...` (§9)

**FORA:**
- Promoções vinculadas a lojas (Fase 3)
- Eventos em lojas (Fase 3)
- Editor de imagens / crop avançado
- Lojas multi-shopping (cada tenant é independente — sem catálogo compartilhado)

## Implementação

- Reusa o helper `db/withTenant` da Fase 1 — todas as queries automaticamente escopadas
- Multi-categoria via tabela join `lojas_categorias(loja_id, categoria_id)`
- Busca: full-text Postgres (`tsvector` em `nome + descrição`) escopado por `tenant_id`
- Filtros via querystring (`?categoria=X&busca=Y`); URLs SEO-friendly
- Admin usa o mesmo sistema de auth/permissões da Fase 1 (perfil Tenant Admin ou Editor — ver §7.1)
- Reordenação de categorias persiste `ordem int` (não usar timestamps)

## Critério de aceite

- [ ] Tenant Admin consegue criar/editar/desativar lojas via admin
- [ ] Editor consegue editar conteúdo de loja (mas não criar/desativar — validar permissão)
- [ ] Upload múltiplo de imagens funciona, imagens vão pra CDN com path correto por tenant
- [ ] `/lojas` lista lojas do tenant correto (testar com 2 tenants — não há vazamento)
- [ ] Filtro por categoria funciona, busca textual retorna resultados relevantes
- [ ] Cache Redis hit em listagens repetidas; invalidado ao salvar loja
- [ ] `/lojas/[slug]` retorna 404 se slug for de outro tenant
- [ ] **Features tocadas (lojas, categorias-lojas, busca) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
