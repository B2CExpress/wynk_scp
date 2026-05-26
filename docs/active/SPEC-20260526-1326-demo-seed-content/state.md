# State — SPEC-20260526-1326

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-26 13:26

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-26 13:26
**Onde tô:** ativação — SPEC criada, plano definido, prestes a implementar `seed-demo.ts`.
**Próximo passo:** escrever `backend/scripts/seed-demo.ts` com dataset inline + adicionar `seed:demo` no `backend/package.json`.
**Última decisão:** target inicial é só `local-dev` (host `localhost`); imagens via `picsum.photos` para evitar assets locais.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** entrada `[ativação]` e a seção `Implementação` do `main.md`.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Criar branch + SPEC + atualizar feature | em progresso | 2026-05-26 13:26 | — |
| 2 | Implementar `seed-demo.ts` + npm script | pendente | 2026-05-26 13:26 | — |
| 3 | Validar idempotência + integração com backoffice/portal | pendente | 2026-05-26 13:26 | — |
| 4 | Arquivar SPEC (R.5/R.7) | pendente | 2026-05-26 13:26 | — |

### Próximos passos

- [ ] Criar `backend/scripts/seed-demo.ts` com dataset fixo
- [ ] Adicionar `"seed:demo": "ts-node scripts/seed-demo.ts"` em `backend/package.json`
- [ ] Dev valida visualmente em backoffice + portal contra `local-dev`
- [ ] Marcar critério de aceite e arquivar

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
