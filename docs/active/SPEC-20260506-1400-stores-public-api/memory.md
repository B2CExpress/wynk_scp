# Memory — SPEC-20260506-1400

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 13:45 (sessão #2)
**Onde tô:** Re-bootstrap concluído. **Descoberta crítica:** branch entrega só LISTAGEM, mas SPEC declara listagem+detalhe — commit `759eca5` removeu `[slug]/route.ts` sem ajustar contrato.
**Próximo passo:** Pedir decisão ao dev sobre escopo: (a) revert do trecho de remoção em `759eca5` para reaplicar detalhe, OU (b) re-escopar SPEC para listagem-only (atualizar `main.md`+`feature.md`+critério de aceite).
**Última decisão:** Re-bootstrap da estrutura SPEC veio antes de qualquer correção de código (destrava `audit-docs.sh`). Falso-archive `SPEC-route-stories` deletado por R.5 (correção de erro em minutos).
**Bloqueio atual:** (1) Decisão de escopo. (2) Imports `@/lib/db` e `@/lib/schema` são placeholders — depende de outra SPEC entregar base do `backend/`.
**Se retomar, ler:** `state.md` entradas `[refactor]` em 2026-05-08 11:06 e `[MARCO] [descoberta]` em 2026-05-08 13:45.

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão de revisão da PR #3 ("feat: implement public API endpoints for stores with Redis caching"). A revisão identificou problemas de processo (estrutura SPEC inteiramente fora do lugar) e de código (duplicação entre os 2 route.ts, wildcards SQL não escapados, cache key não normalizada, invalidação não cobre rename de slug, sem testes).

**Twist descoberto durante o re-bootstrap:** commit `759eca5` removeu o endpoint detalhe e moveu o `main.md` mal-posicionado para um falso-archive. Branch atual entrega só listagem, mas a SPEC declara os 2 endpoints. Decisão de escopo pendente.

A sessão atual focou em **corrigir a estrutura SPEC** primeiro — sem isso, `audit-docs.sh` bloqueia o merge. Correções de código + decisão de escopo vêm em sessão seguinte.

### Hipóteses em jogo

- **PR depende de SPEC-20260503-1505-base-plataforma-multitenant** (status: testando). Schema Drizzle (`@/lib/db`, `@/lib/schema`) e bootstrap do `backend/` (package.json, tsconfig) provavelmente vêm de lá. Validar com dev.
- **Middleware que injeta `x-tenant-id` não está nesta SPEC** (status: testando). Header é assumido pelos handlers; alguma SPEC paralela ou futura entrega o middleware. Validar com dev.
- **Endpoint detalhe foi removido por decisão de escopo intencional** (status: testando). Mensagem do commit `759eca5` chama o detalhe de "deprecated" — sugere que dev decidiu adiar para SPEC futura. Mas sem registro formal, não dá para confirmar. Validar com dev.

### Decisões recentes que importam pra continuar

- [2026-05-08 13:35] Falso-archive `docs/archive/SPEC-route-stories/` deletado em vez de mantido com nota — foi nunca-válido (ID inválido, sem state/memory). R.5 permite "correção de erro em minutos".
- [2026-05-08 13:35] Critério de aceite expandido com 6 itens novos derivados da review: escape de wildcards, normalização da cache key, slug-rename na invalidação, extração de helpers, schema real, testes mínimos.
- [2026-05-08 13:35] Não foi adicionada dependência formal (`Depende de:`) à SPEC-1505 sem confirmar com dev — preservou §R.8 (não ler future/ por iniciativa).
- [2026-05-08 13:45] `main.md` da SPEC NÃO foi alterado para refletir a remoção do detalhe (escopo divergente registrado em "Dúvidas em aberto" do `state.md`). Decisão de escopo é responsabilidade do dev — IA não re-escopa contrato sem confirmação.

### Respostas-chave do usuário

- [2026-05-08 13:30] Usuário: *"Sim, essa é a ideia mesmo, fazer essas correções"*
  Contexto: confirmação do plano de re-bootstrap apresentado (criar 4 arquivos novos, remover 2 caminhos errados, opção (a) de deletar o falso-archive).

- [2026-05-08 13:25] Usuário: *"Porque o main.md esta em backend/app/api/v1/stores/main.md?"*
  Contexto: usuário identificou o erro de processo sem precisar de explicação técnica adicional — sinal de que ele conhece o RULES.md a fundo.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-06 ~14:00] Autor da PR colocou `main.md` em `backend/app/api/v1/stores/main.md` e criou `docs/archive/SPEC-route-stories/` sem timestamp no ID. Falhou por desconhecimento do RULES.md (provavelmente não leu Nível 0). Lição: contributors externos precisam ser direcionados ao `docs/CLAUDE.md` antes de abrir PR.

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260506-1400-stores-public-api/main.md` (criado nesta sessão)
- `docs/active/SPEC-20260506-1400-stores-public-api/state.md` (criado nesta sessão)
- `docs/active/SPEC-20260506-1400-stores-public-api/memory.md` (criado nesta sessão — este arquivo)
- `docs/features/stores-public-api.md` (a criar)
- `backend/app/api/v1/stores/main.md` (a remover)
- `docs/archive/SPEC-route-stories/` (a remover)

Em sessão futura (correções de código):
- `backend/app/api/v1/stores/route.ts`
- `backend/app/api/v1/stores/[slug]/route.ts`
- `backend/lib/cache.ts`
- `backend/lib/api-helpers.ts` (a criar — para helpers extraídos)
- testes (caminho a definir)

### Onde parei exatamente

Acabei de criar `state.md` e `memory.md`. Próximas ações nesta sessão:
1. Criar `docs/features/stores-public-api.md`
2. Deletar `backend/app/api/v1/stores/main.md`
3. Deletar `docs/archive/SPEC-route-stories/`
4. Mostrar diff completo ao dev antes de commitar

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-06 14:00 | ~4h | ativação | Implementação inicial das rotas + cache.ts (commit `96b5a33`); estrutura SPEC ficou no lugar errado |
| 2 | 2026-05-08 13:25 | em andamento | continuidade | Review da PR #3 + re-bootstrap da estrutura SPEC para conformidade com RULES v2 |
