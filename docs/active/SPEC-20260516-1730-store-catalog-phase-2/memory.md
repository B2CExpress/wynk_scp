# Memory - SPEC-20260516-1730-store-catalog-phase-2

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-16 17:30

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-16 23:38
**Onde tô:** Fase concluída localmente
**Próximo passo:** Abrir PR, revisar e arquivar a SPEC após merge
**Última decisão:** Manter upload como stub por metadata nesta fase e concentrar o fechamento em integração ponta a ponta
**Bloqueio atual:** nenhum
**Se retomar, ler:** `state.md` desta SPEC

---

## Contexto ativo

### O que está sendo feito AGORA

Fase concluída: a base de stores agora virou um catálogo utilizável de ponta a ponta com backend, portal público e backoffice mínimo operando o backend real.

### Decisões recentes que importam

- [2026-05-16 17:30] A SPEC descartada de 2026-05-03 continua descartada; o caminho correto é complementar a base atual com uma SPEC nova e menor.
- [2026-05-16 17:30] Upload fica como stub de metadata (`file_name`, `mime_type`, `size`) convertida em URL fake no backend.
- [2026-05-16 17:30] Backoffice vai usar cookies `httpOnly` já existentes e mandar `X-Forwarded-Host` explicitamente para requests admin.
- [2026-05-16 23:38] Categorias ganharam CRUD admin separado com `sortOrder` e reorder explícito.
- [2026-05-16 23:38] Busca pública de lojas usa full-text do Postgres com índice GIN e fallback de `ILIKE`.
- [2026-05-16 23:38] O portal foi implementado em SSR (`/lojas` e `/lojas/[slug]`) e o backoffice Vite saiu do boilerplate para uma UI operacional mínima.
- [2026-05-16 23:38] Typecheck passou em `backend/`, `portal/` e `backoffice/`; testes do backend passaram com `11` suítes e `75` testes.

### Onde parei exatamente

Parei com a implementação encerrada e validada. O próximo passo não é técnico de código, e sim operacional: commit/PR e arquivamento da SPEC após merge.
