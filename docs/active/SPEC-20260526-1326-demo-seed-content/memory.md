# Memory — SPEC-20260526-1326

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-26 13:26

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-26 13:26 (sessão #1)
**Onde tô:** SPEC criada e ativa. Próximo bloco é o código (`seed-demo.ts` + script no package.json).
**Próximo passo:** implementar `backend/scripts/seed-demo.ts` com dataset inline e CLI flag `--tenant`.
**Última decisão:** target = só `local-dev` por enquanto, imagens via picsum, dataset hardcoded.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** state.md → "Fatos confirmados" + `main.md` "Implementação" e "Dataset".

---

## Contexto ativo

### O que está sendo feito AGORA

Preencher o gap entre `seed.ts` (que só cria tenants/admins) e a demo de hoje. O dev precisa abrir o backoffice e o portal e ver dados realistas sem cadastrar nada manualmente. A intervenção fica isolada num script secundário `seed-demo.ts` para não pesar o seed canônico — quem só quer tenants segue rodando `npm run seed`.

### Hipóteses em jogo

- **Imagens placeholder via `picsum.photos/seed/<slug>` rendem visualmente bem o suficiente para demo** (status: testando — validar no portal após primeiro run).
- **Dataset fixo de 4 categorias + 8 lojas + 3 promos + 3 notícias é o ponto certo de "bem simples"** (status: confirmado pelo usuário em prompt original).

### Decisões recentes que importam pra continuar

- [2026-05-26 13:26] Branch nova `feature/demo-seed-content` saindo da branch atual (opção a) — escolha do usuário, garante acesso à entity `News` que só existe na branch SQU-50.
- [2026-05-26 13:26] Feature vinculada: `infra-base` (devex/tooling, sem ownership das entidades populadas).
- [2026-05-26 13:26] Script bloqueia execução em `production` (`config.nodeEnv === 'production'` → throw); demo é exclusivamente DX local.
- [2026-05-26 13:26] Idempotência: lookup por `(tenantId, slug)` para top-level; `StoreCategory` é delete+reinsert por loja (junction, custo trivial).

### Respostas-chave do usuário

- [2026-05-26 13:26] Usuário: "Sim, preciso um seed para uma demo que tenho que rodar hoje. Podemos criar uma nova spec para isso, bem simples"
  Contexto: depois de eu informar que o `seed.ts` atual só cria tenants/admins e não popula stores/categorias/promos/news. Define o tom: simples, dataset enxuto, sem features extras.
- [2026-05-26 13:26] Usuário: "a"
  Contexto: escolha entre (a) branch nova saindo da atual ou (b) tackar a SPEC na branch SQU-50. Opção (a) reforça isolamento de escopos no histórico.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda)_

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260526-1326-demo-seed-content/{main,state,memory}.md` (criando)
- `docs/features/infra-base.md` (a atualizar — adicionar "Em execução")
- `backend/scripts/seed-demo.ts` (a criar)
- `backend/package.json` (a atualizar — npm script)

### Onde parei exatamente

SPEC + state + memory escritos. Próxima ação concreta: atualizar `infra-base.md` (R.11 — linha em "Em execução") e em seguida implementar `seed-demo.ts`.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-26 13:26 | em curso | ativação | Criar SPEC + implementar seed de demo idempotente |
