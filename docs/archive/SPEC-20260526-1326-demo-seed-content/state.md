# State — SPEC-20260526-1326

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-26 13:26

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-26 15:18
**Onde tô:** **concluída** — demo rodou ao vivo com sucesso. Seed funcionando, idempotência confirmada, portal renderizando 8 lojas. Três hotfixes de infra entraram no caminho (Compose v2 auto-install, `--reset` flag, orderBy TypeORM).
**Próximo passo:** mover `active/` → `archive/` e abrir PR. Idealmente preencher `Commit final` em `main.md` no commit que fecha a SPEC.
**Última decisão:** registrar scope creep em "Notas de escopo" no `main.md` em vez de quebrar em sub-SPECs (corrida contra o relógio da demo).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** entrada `[conclusão]` e "Notas de escopo" do `main.md`.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Criar branch + SPEC + atualizar feature | concluído | 2026-05-26 13:30 | _(pendente)_ |
| 2 | Implementar `seed-demo.ts` + npm script | concluído | 2026-05-26 13:36 | _(pendente)_ |
| 3 | Validar idempotência + integração com backoffice/portal | concluído | 2026-05-26 15:18 | _(pendente)_ |
| 4 | Hotfixes de infra (Compose v2, `--reset`, orderBy) | concluído | 2026-05-26 14:50 | _(pendente)_ |
| 5 | Arquivar SPEC (R.5/R.7) | em progresso | 2026-05-26 15:18 | _(pendente)_ |

### Próximos passos

- [x] Criar `backend/scripts/seed-demo.ts` com dataset fixo (2026-05-26 13:36)
- [x] Adicionar `"seed:demo": "ts-node scripts/seed-demo.ts"` em `backend/package.json` (2026-05-26 13:36)
- [x] Dev valida visualmente em backoffice + portal contra `local-dev` (2026-05-26 15:18, demo ao vivo)
- [x] Marcar critério de aceite e arquivar (2026-05-26 15:18)

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-26 13:26] `seed.ts` atual só cobre `Tenant` + `User`; nenhum INSERT de entidades de produto no repo. Fonte: `backend/scripts/seed.ts:1-130` e grep negativo por `INSERT INTO` em `backend/src`.
- [2026-05-26 13:26] Tenant `local-dev` (host `localhost`) está em `seeds/tenants.json:14-19`. Admin gerado: `admin@localhost` / `admin123` (dev fallback). Fonte: `backend/scripts/seed.ts:83` e `seeds/tenants.json`.
- [2026-05-26 13:26] Entities tocadas: `Category` (`tb_category`, slug único por tenant), `Store` (`tb_store`, com `searchVector` GENERATED), `StoreCategory` (junction sem id próprio), `Promotion` (`tb_promotion`, requer `storeId`), `News` (`tb_news`, sem vínculo com store). Fontes: `backend/src/entities/{Category,Store,StoreCategory,Promotion,News}.ts`.

## Inferências prováveis

- [2026-05-26 13:26] Backoffice e portal vão funcionar imediatamente após o seed sem mudança extra. Validar com: rodar `seed:demo` + acessar backoffice logado + `portal/lojas`.

## Dúvidas em aberto

_(nenhuma — escopo confirmado pelo usuário)_

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-26 13:26 — [ativação]

SPEC criada após pedido do usuário ("preciso um seed para uma demo que tenho que rodar hoje. Podemos criar uma nova spec para isso, bem simples"). Classificação confirmada como **Nova SPEC**.

Plano inicial:
- Branch nova `feature/demo-seed-content` saindo da branch atual (`feature/SQU-50-api-admin-crud-de-noticias`) — opção (a) escolhida pelo usuário. Motivação: a entity `News` só existe nessa branch; criar daqui isola o escopo enquanto preserva acesso.
- Feature vinculada: `infra-base` (script devex/tooling, mesmo bairro de `backend/scripts/seed.ts` + `seeds/tenants.json`).
- Dataset fixo, escrito à mão (não faker), pra previsibilidade na apresentação.
- Idempotência via `(tenantId, slug)` para entities top-level; `StoreCategory` (junction) é wipe + reinsert por loja.
- Imagens via `picsum.photos/seed/<slug>-{logo|cover}` — zero asset local, estável por slug.

Arquivos identificados como relevantes:
- `backend/scripts/seed.ts` (modelo a seguir — boot, AppDataSource, logging idempotente)
- `backend/src/entities/{Category,Store,StoreCategory,Promotion,News}.ts` (shape do dataset)
- `seeds/tenants.json` (resolução do tenant alvo)
- `backend/package.json` (novo npm script)
- `docs/features/infra-base.md` (R.11 — adicionar em "Em execução")

## 2026-05-26 13:36 — [descoberta] Seed-demo passa typecheck + lint sem erros

`npm run typecheck -w backend` e `npm run lint -w backend` rodaram limpos. Lint só roda em `./src`, não em `scripts/`, então o script não foi linted — mas typecheck cobre. Sem alterações além do esperado.

## 2026-05-26 14:30 — [MARCO] [blocker] docker-compose v1 (1.29.2) explode com KeyError 'ContainerConfig'

Durante a corrida pra demo, o `setup.sh` rodou com docker-compose v1 (já documentado como gotcha em `infra-base.md`) e estourou:

```
KeyError: 'ContainerConfig'
File ".../compose/service.py", line 612, in recreate_container
```

Bug conhecido do v1 (EOL desde jul/2023) ao recriar containers com imagens mais novas. Bloqueia o `setup.sh` antes do `db:setup`.

## 2026-05-26 14:35 — [MARCO] [decisão] setup.sh passa a auto-instalar Docker Compose v2

Em vez de só avisar pra usuário instalar v2 manualmente (princípio antigo "verifica, não instala"), `setup.sh` agora baixa o binário do plugin v2 do GitHub pra `~/.docker/cli-plugins/` quando detecta v1 ou nada. Per-user, sem sudo. Detecta arch x86_64/aarch64. Fallback gracioso se download falhar (sem rede): mantém v1 com warning.

Mudança de princípio justificada pela frequência do problema (qualquer Ubuntu Jammy com `apt install docker.io` cai nessa pra v1). Trade-off: introduz dependência implícita de rede no setup, mas a alternativa era bloquear demos.

## 2026-05-26 14:42 — [decisão] Adicionar flag `--reset` ao setup.sh (em vez de tornar destrutivo por padrão)

Volume `pgdata` antigo tinha schema divergente das migrations atuais (faltava `store_description` em `tb_store`). Solução natural: `docker compose down -v`. Mas tornar isso default no setup.sh seria footgun (apagar banco em toda execução). Compromisso: nova flag opt-in `--reset` faz `down -v --remove-orphans`. Default segue preservando dados, apenas faz `down --remove-orphans`.

## 2026-05-26 14:48 — [MARCO] [blocker] Portal 500 em /lojas?category=moda

Filtro de categoria no portal estourou:

```
TypeError: Cannot read properties of undefined (reading 'databaseName')
  at SelectQueryBuilder.createOrderByCombinedWithSelectExpression
  at StoreRepository.findActiveListing (backend/src/repositories/store.repository.ts:100)
```

TypeORM 0.3 com paginação (`skip`+`take`) + inner join (`StoreCategory`/`Category`) + orderBy não consegue resolver metadata quando orderBy referencia nomes de coluna do banco (`store.store_is_featured`) em vez de propriedades da entity (`store.isFeatured`).

## 2026-05-26 14:50 — [decisão] Hotfix do orderBy em `findActiveListing`

Trocadas referências DB → propriedades:
- `store.store_is_featured` → `store.isFeatured`
- `store.store_sort_order` → `store.sortOrder`
- `store.store_name` → `store.name`

Fix de 6 linhas em `backend/src/repositories/store.repository.ts:91-96`. Bug é do escopo da SQU-50 / `stores-public-api`, mas foi resolvido aqui pra desbloquear a demo. Registrado como creep em "Notas de escopo" do `main.md`.

## 2026-05-26 15:18 — [conclusão] Demo executada com sucesso

Sequência final que funcionou:

```bash
./setup.sh --reset --seed
npm run seed:demo -w backend
./run.sh all
```

Validações:
- Backoffice (`http://localhost:5173`) logado como `admin@localhost` lista 4 categorias e 8 lojas
- Portal (`http://localhost:3000/lojas`) renderiza 8 lojas com cover image
- Filtro `?category=moda` funciona (depois do hotfix do orderBy)
- Idempotência confirmada: `seed:demo` rodado 2x sem erro de unique constraint

Critério de aceite todo marcado em `main.md`. Features `infra-base` (seed + Compose v2 auto-install + flag `--reset` + gotcha v1) e `stores-public-api` (orderBy hotfix + gotcha TypeORM 0.3) atualizadas. Commit final: _(pendente — preencher no commit de fechamento)_.

Próximo: mover pasta `active/SPEC-20260526-1326-demo-seed-content/` → `archive/`.
