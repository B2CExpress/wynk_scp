# Memory — SPEC-20260518-1625

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-18 16:25

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-18 16:25 (sessão #1)
**Onde tô:** Ativação — SPEC criada, pronto para iniciar implementação
**Próximo passo:** Criar entidades TypeORM
**Última decisão:** Usar estrutura modular com 3 arquivos por feature (entities, validators, repositories, services, controllers)
**Bloqueio atual:** nenhum
**Se retomar, ler:** Contexto ativo

---

## Contexto ativo

### O que está sendo feito AGORA

Setup de SPEC-driven para eventos e theater shows. Criadas SPEC main/state/memory. Arquitetura segue padrão de isolamento multitenant já validado em SPEC-20260514-2012 (stores). Próxima sessão começa com criação de entidades TypeORM em `backend/src/entities/`.

### Hipóteses em jogo

_(nenhuma)_

### Decisões recentes que importam pra continuar

- [2026-05-18 16:25] Usar Zod pra validators só se já instalado; caso contrário, parser manual em dtos/ (alinhado com store-list.dto.ts)
- [2026-05-18 16:25] Estrutura 3-camada: repositories (DB), services (lógica), controllers (HTTP) — mesmo padrão de stores

### Respostas-chave do usuário

_(nenhuma — ativação)_

### Tentativas que falharam (para NÃO repetir)

_(nenhuma)_

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260518-1625-api-admin-crud-eventos/{main,state,memory}.md` (criados)

### Onde parei exatamente

SPEC criada. Próximo: criar `backend/src/entities/Event.ts`, `TheaterShow.ts`, `TheaterSession.ts`.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-18 16:25 | — | ativação | SPEC-driven criada, pronto para implementação |
