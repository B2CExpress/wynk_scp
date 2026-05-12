# SPEC-20260503-1506: Módulo de Lojas

**Status:** discarded
**Criada:** 2026-05-03 15:06
**Ativada:** —
**Concluída:** —
**Descartada:** 2026-05-12 12:42
**Commit final:** —
**Keywords:** lojas, categorias, busca, filtros, admin
**Features:** lojas, categorias-lojas, busca
**Branch:** feature/modulo-lojas (quando ativa)
**Depende de:** SPEC-20260503-1505 (base multitenant)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 2 — usuário em 2026-05-03 15:05
**Resumo:** Implementa o módulo de Lojas ponta-a-ponta — admin (CRUD, multi-categoria, upload de imagens, destaque), API isolada por tenant, frontend com listagem, filtros e busca.

> **DESCARTADA em 2026-05-12 12:42.** Ver seção [Justificativa de descarte](#justificativa-de-descarte) ao final.

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

## Justificativa de descarte

**Descartada em 2026-05-12 12:42** durante a sessão de re-escopo #2 da SPEC-20260506-1400-stores-public-api. Resposta do dev: *"Então manda bala"* (autorização explícita após análise apresentada na sessão).

### Motivo técnico

1. **Stack obsoleta.** O `main.md` foi escrito em 2026-05-03, antes da SPEC-20260503-1505 fixar a stack final (Express 4 + TypeORM 0.3). Referencia helper `db/withTenant` genérico (não existe), schema `lojas` (não usa naming `tb_<entity>` adotado pela 1505), "Server Actions" e rotas frontend `/lojas/[slug]` (Next.js). Atualizar exigiria reescrever o documento todo.

2. **Escopo monstro — viola §9 do RULES.md.** Declara em UMA SPEC: schema de lojas, schema de categorias com ícone+reordenação, admin CRUD de ambos, upload múltiplo de imagens + CDN com path por tenant, frontend público de listagem, frontend público de detalhe, cache Redis, full-text search (tsvector), e permissões Tenant Admin/Editor. RULES.md §9 recomenda quebrar SPEC quando escopo ultrapassa ~3 sessões — esta tem ~6+ SPECs reais dentro.

3. **Sobreposição com SPECs já existentes/ativas:**
   - **Schema mínimo de lojas + listagem pública com cache** → entregue por SPEC-20260506-1400 (re-escopada em 2026-05-12 12:42 para absorver schema após este descarte ser planejado).
   - **Detalhe `/api/v1/stores/[slug]`** → já existe SPEC-20260508-1400-stores-public-detail em `docs/future/` com escopo focado (404 unificado, invalidação por rename, etc.).
   - **Frontend público** (`/lojas` listagem + detalhe) → responsabilidade do `portal/` Next.js, não do backend. Escopo confuso no contrato original.
   - **Admin CRUD, upload+CDN, permissões** → cada um merece SPEC própria com escopo focado.

### O que herdar quando o módulo de lojas crescer

Quando admin/upload/etc. virarem prioridade, criar SPECs focadas (cada uma 1 entrega) **herdando o schema mínimo** que a SPEC-20260506-1400 entrega: `tb_store`, `tb_category`, `tb_store_category` (campos enxutos para listagem pública). Colunas avançadas (`descrição`, `imagens[]`, `horário`, `contato`) serão ALTER TABLE nas SPECs futuras quando exigidas pelo admin/UX correspondente — não especular schema agora.

Decisões de produto que ficaram registradas aqui e podem reaproveitar nas SPECs futuras de admin:
- Multi-categoria via tabela join (já materializado em `tb_store_category` na SPEC-20260506-1400)
- Filtros via querystring com URLs SEO-friendly
- Reordenação via `int` (não timestamp) — para categorias na SPEC futura de admin de categorias
- Upload pra CDN com path `cdn.plataforma.com/{tenant-id}/lojas/...`
- Cache Redis com chave incluindo `tenant_id` + filtros (já materializado na SPEC-20260506-1400)
- Permissões Tenant Admin / Editor para o admin de lojas

### Permanente ou temporário?

**Permanente.** Quebrar em SPECs menores e focadas é o caminho. Não vamos "reativar" este documento — quando o trabalho de admin/upload começar, será via SPECs novas com IDs próprios.
