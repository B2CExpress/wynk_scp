# SPEC-20260526-1326: Seed de conteúdo demo (lojas, categorias, promoções, notícias)

**Status:** done
**Criada:** 2026-05-26 13:26
**Ativada:** 2026-05-26 13:26
**Concluída:** 2026-05-26 15:18
**Commit final:** _(pendente)_
**Keywords:** seed, demo, fixtures, dx, devex, content, stores, categories, promotions, news, docker-compose, hotfix
**Features:** infra-base, stores-public-api
**Branch:** feature/demo-seed-content
**Depende de:** SPEC-20260522-1100 (entity `News` em `tb_news`) — mergea junto na mesma série de PRs
**Origem:** usuário em 2026-05-26 13:26 ("preciso um seed para uma demo que tenho que rodar hoje")
**Resumo:** Adicionar um script `seed:demo` idempotente que popula o tenant `local-dev` com categorias, lojas (com cover/logo placeholder), promoções e notícias — o suficiente para uma demo visual do portal e backoffice sem precisar cadastrar nada manualmente.

## Objetivo

Hoje (2026-05-26) o `npm run seed -w backend` só cria tenants + admins. Resultado: backoffice loga vazio e portal `/lojas` fica em branco. Esta SPEC entrega um seed *secundário* de demo que reaproveita as entities reais (`Category`, `Store`, `StoreCategory`, `Promotion`, `News`) para popular o tenant `local-dev` com dados realistas o suficiente para uma demo apresentável.

## Escopo

**DENTRO:**
- Script `backend/scripts/seed-demo.ts`, idempotente, executável via `npm run seed:demo -w backend`.
- Popula o tenant `local-dev` (host `localhost`) com:
  - 4 categorias (Moda, Alimentação, Tecnologia, Serviços)
  - 8 lojas (mix de featured/regular, restaurantes/não, distribuídas pelas categorias) com `logoUrl` + `coverImageUrl` apontando para `picsum.photos` (seed estável por slug — sem precisar baixar assets)
  - Junções `StoreCategory` para vincular cada loja a 1-2 categorias
  - 3 promoções vinculadas a lojas existentes (`status: published`, `publishedAt` no passado, `validUntil` no futuro)
  - 3 notícias (`status: published`, `publishedAt` no passado, categorias variadas)
- Idempotência via `(tenantId, slug)`: re-execução não duplica; atualiza só campos drift simples (nome/descrição) sem zerar ids existentes.
- Junções `StoreCategory` são recriadas (delete + insert) por loja a cada run — barato e simples.
- Aceita CLI flag `--tenant=<slug>` (default `local-dev`) para futuro reuso, sem hardcode espalhado.
- Log claro de "criado / atualizado / já alinhado" por entidade, espelhando o estilo de `seed.ts`.

**FORA:**
- Eventos / TheaterShow / TheaterSession (sem UI ainda — fora do escopo da demo).
- Múltiplos tenants simultaneamente (script seeda um tenant por vez).
- Download local de imagens reais (`picsum.photos` resolve direto no navegador).
- Substituir ou modificar `seed.ts` canônico (tenants + admins). São scripts independentes.
- Geração randômica via faker — dataset é fixo, escrito à mão, para ter previsibilidade na demo.
- Inserção via API HTTP — vai direto nos repositórios TypeORM (mesma estratégia de `seed.ts`).

## Implementação

**Arquivos novos:**
- `backend/scripts/seed-demo.ts` — entrypoint do seed.

**Arquivos modificados:**
- `backend/package.json` — adiciona script `"seed:demo": "ts-node scripts/seed-demo.ts"`.
- `docs/features/infra-base.md` — linha em "Em execução" (R.11) na ativação; ao arquivar, move pra "Concluídas" + atualiza "Estado atual" mencionando o script e linka este SPEC.

**Estrutura do script (espelha `seed.ts`):**
1. Lê `seeds/tenants.json` para localizar o tenant alvo (default `local-dev`); falha cedo se não existir no DB (operador precisa rodar `seed` antes).
2. `AppDataSource.initialize()`.
3. Para cada categoria do dataset: upsert por `(tenantId, slug)` no `Category`.
4. Para cada loja do dataset: upsert por `(tenantId, slug)` no `Store`; depois `delete from StoreCategory where storeId = X` + `insert` das junções declaradas no dataset (lookup de categoria por slug).
5. Para cada promoção: upsert por `(tenantId, slug)`, com `storeId` resolvido via lookup pelo slug da loja.
6. Para cada notícia: upsert por `(tenantId, slug)`.
7. Log final: `N categorias / M lojas / X promoções / Y notícias garantidas no tenant <slug>`.

**Dataset (resumo):**
- **Categorias:** moda, alimentacao, tecnologia, servicos.
- **Lojas:**
  - `zara` (Moda, featured, L1)
  - `renner` (Moda, L1)
  - `apple-store` (Tecnologia, featured, L2)
  - `fast-shop` (Tecnologia, L2)
  - `outback` (Alimentação, restaurant, featured, L3)
  - `mcdonalds` (Alimentação, restaurant, L3)
  - `subway` (Alimentação, restaurant, L3)
  - `banco-do-brasil` (Serviços, L1)
- **Promoções:** `zara-30-off-verao`, `apple-iphone-10-off`, `outback-bloomin-quarta`.
- **Notícias:** `black-friday-confirmada`, `cinema-imax-inaugurado`, `coleta-brinquedos-natal`.

**Imagens:** `https://picsum.photos/seed/<slug>-logo/200/200` e `https://picsum.photos/seed/<slug>-cover/1200/600` — estável por slug, zero asset local.

**Gotchas previstos:**
- `Store.searchVector` é `GENERATED STORED` — não pode ser passado no insert. TypeORM com `insert: false, update: false` na coluna já cuida, basta não setar.
- `StoreCategory` é tabela de junção com PK composto `(storeId, categoryId)` + `tenantId` — sem `id`. Delete por `storeId` e insert direto.
- `seed.ts` usa `config.nodeEnv` pra exigir senha em prod; seed-demo **NÃO roda em production** — assert explícito no início (`if config.nodeEnv === 'production' throw`).

## Critério de aceite

- [x] `npm run seed:demo -w backend` roda sem erro contra um DB limpo (após `db:setup` + `seed`) (2026-05-26 15:18, validado em demo ao vivo)
- [x] Re-execução do `seed:demo` é idempotente (sem duplicatas, sem erros de unique constraint) (2026-05-26 15:18, idempotência por `(tenantId, slug)` + delete+reinsert de `StoreCategory`)
- [x] Backoffice logado como `admin@localhost` (tenant slug `local-dev`, host `localhost`) lista 4 categorias e 8 lojas após o seed (2026-05-26 15:18)
- [x] Portal em `http://localhost:3000/lojas` (com `Host: localhost`) renderiza as 8 lojas com cover image (2026-05-26 15:18 — só depois do hotfix em `store.repository.ts`, ver "Notas de escopo" abaixo)
- [x] `npm run typecheck -w backend` passa (2026-05-26 13:36)
- [x] `npm run lint -w backend` passa (2026-05-26 13:36, sem novos warnings)
- [x] **Features tocadas (`infra-base`, `stores-public-api`) atualizadas** com timestamp e referência a esta SPEC (2026-05-26 15:18)
- [x] `state.md` com entrada `[conclusão]` (2026-05-26 15:18)
- [x] `memory.md` com TL;DR final atualizado (2026-05-26 15:18)

## Notas de escopo (creep durante execução)

Durante a corrida pra demo de hoje, três correções de infra/bug entraram nesta branch fora do escopo original ("seed de conteúdo"). Registrado aqui pra rastreabilidade — em condições normais seriam SPECs separadas.

1. **`setup.sh` agora auto-instala plugin Docker Compose v2 quando ausente ou só v1 (EOL) está presente** (feature: `infra-base`). Motivação: docker-compose v1 1.29.2 quebrou com `KeyError: 'ContainerConfig'` no meio do bootstrap, bloqueando a demo. Solução: detectar v1 → baixar binário v2 do GitHub pra `~/.docker/cli-plugins/` (per-user, sem sudo). Mudança de princípio: `setup.sh` antes era estritamente "verifica, não instala" — passa a *opcionalmente* instalar Compose v2.
2. **`setup.sh --reset` (opt-in) faz `docker compose down -v`** (feature: `infra-base`). Motivação: volumes locais ficaram com schema antigo (faltava `store_description` em `tb_store`), e as migrations atuais reconstroem o schema do zero. Default ainda preserva volumes — destruição só com flag explícita.
3. **`store.repository.ts:findActiveListing` orderBy passou a usar propriedades da entity** (`store.isFeatured`, `store.sortOrder`, `store.name`) em vez de nomes de coluna do banco (feature: `stores-public-api`). Motivação: TypeORM 0.3 não conseguia resolver metadata na paginação combinada com inner join quando orderBy referenciava colunas DB cruas — estourava `Cannot read properties of undefined (reading 'databaseName')` ao filtrar por categoria.
