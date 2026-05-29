# Memory — SPEC-20260526-1326

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-26 13:26

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-26 15:18 (sessão #1)
**Onde tô:** SPEC **concluída**. Demo rodou ao vivo, seed populando como esperado. Três hotfixes de infra entraram no caminho: Compose v2 auto-install no setup.sh, flag `--reset` opt-in, e fix do `orderBy` em `store.repository.ts` (TypeORM 0.3 não resolve metadata quando orderBy usa nome de coluna DB com inner join + paginação).
**Próximo passo:** mover `active/` → `archive/`, abrir PR. Preencher `Commit final` em `main.md` no commit de fechamento.
**Última decisão:** registrar os 3 hotfixes em "Notas de escopo" no `main.md` em vez de quebrar em sub-SPECs (corrida contra demo justifica o creep).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** `main.md` → "Notas de escopo" + `state.md` → entradas `[MARCO]` de 14:30 em diante.

---

## Contexto ativo

### O que está sendo feito AGORA

Fechamento da SPEC. Tudo entregue, validado em demo ao vivo. Resta o ritual de arquivamento: critério marcado, features atualizadas (`infra-base` ganha SPEC concluída + decisão de auto-install Compose v2 + gotcha de v1; `stores-public-api` ganha SPEC concluída + gotcha do orderBy TypeORM 0.3), pasta movida pra `archive/`.

### Hipóteses em jogo

- **Imagens placeholder via `picsum.photos/seed/<slug>` rendem visualmente bem** (status: confirmada na demo — lojas renderizaram com cover convincente).
- **Dataset fixo de 4+8+3+3 é o ponto certo** (status: confirmada — preencheu portal e backoffice sem deixar tela vazia, sem virar firehose).
- **Compose v2 auto-install era a coisa certa a fazer** (status: confirmada operacionalmente, mas vale uma SPEC futura de revisão do princípio "verifica, não instala" do `setup.sh` se outros pré-requisitos forem candidatos no futuro).

### Decisões recentes que importam pra continuar

- [2026-05-26 13:26] Branch nova `feature/demo-seed-content` saindo da `feature/SQU-50-api-admin-crud-de-noticias` (opção a do usuário). Mergea em sequência: SQU-50 primeiro, demo-seed depois.
- [2026-05-26 13:26] Feature primária: `infra-base`. Após scope creep, adicionada `stores-public-api`.
- [2026-05-26 14:35] `setup.sh` passa a auto-instalar Compose v2 plugin se ausente ou só v1 presente — mudança de princípio (era "verifica, não instala"). Justificada pelo bug `KeyError 'ContainerConfig'` do v1 que bloqueou a demo.
- [2026-05-26 14:42] Nova flag `--reset` no `setup.sh` faz `compose down -v` (destrutivo, opt-in). Default ainda preserva volumes.
- [2026-05-26 14:50] Hotfix em `store.repository.ts:findActiveListing` — orderBy usa propriedades da entity em vez de nomes de coluna DB. Bug do escopo SQU-50, resolvido aqui pra desbloquear demo.

### Respostas-chave do usuário

- [2026-05-26 13:26] Usuário: "Sim, preciso um seed para uma demo que tenho que rodar hoje. Podemos criar uma nova spec para isso, bem simples"
  Contexto: define o tom — simples, dataset enxuto.
- [2026-05-26 13:26] Usuário: "a"
  Contexto: escolha de branch — (a) nova branch saindo da SQU-50.
- [2026-05-26 14:42] Usuário: "Não, aqui mesmo não da tempo, tenho que apresenttar em 20 minutos o app trodando"
  Contexto: justificativa do scope creep — corrida contra demo, decidido não quebrar em sub-SPECs.
- [2026-05-26 14:45] Usuário: "OK, taca isso no setup.sh"
  Contexto: pediu pra adicionar o `down -v`. Decidi por flag opt-in `--reset` em vez de comportamento default (footgun).
- [2026-05-26 15:18] Usuário: "Deu certo, bora fechar a spec"
  Contexto: validação final, autorização de arquivamento.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-26 14:30] Setup.sh com docker-compose v1 (1.29.2) — quebra com `KeyError 'ContainerConfig'` em qualquer recreate. Não funciona como fallback confiável; auto-install v2 é o caminho.
- [2026-05-26 14:48] `qb.orderBy('store.store_is_featured', 'DESC')` em TypeORM 0.3 com inner join + skip/take — `createOrderByCombinedWithSelectExpression` não acha metadata. Sempre usar propriedade da entity (`store.isFeatured`).

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260526-1326-demo-seed-content/{main,state,memory}.md` (fechando)
- `docs/features/infra-base.md` (a finalizar — move pra Concluídas + decisão + gotcha)
- `docs/features/stores-public-api.md` (a finalizar — Concluídas + gotcha TypeORM)

### Onde parei exatamente

State e memory fechados. Próxima ação: atualizar `infra-base.md` (move SPEC pra "Concluídas", adicionar decisão de auto-install Compose v2, adicionar gotcha) e `stores-public-api.md` (Concluídas + gotcha orderBy TypeORM 0.3). Depois `git mv` da pasta `active/SPEC-...` → `archive/SPEC-...`.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-26 13:26 | ~2h | ativação + conclusão | Criar SPEC, implementar seed, sobreviver à demo com 3 hotfixes de infra, arquivar |
