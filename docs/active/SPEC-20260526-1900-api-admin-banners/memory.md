# Memory — SPEC-20260526-1900: API Admin Gerenciar Banners

## Contexto

Banners do carrossel da home são a principal peça de comunicação visual. Cada banner tem:
- Versões separadas para desktop e mobile (formatos diferentes)
- Agendamento de exibição (starts_at/ends_at)
- Ativação/desativação sem deletar
- Reordenação rápida para campanhas

## Padrões Alinhados

Este projeto segue os mesmos padrões das SPECs anteriores:

1. **Repositories com `withTenant()`** — Isolamento multitenant em QueryBuilder
2. **Services com Cache Invalidation** — `invalidateByPattern()` em todas as escritas
3. **DTOs com Validações Inline** — Funções `validate*()`, `parse*()` no DTO, sem Zod
4. **Controllers com Tratamento de Erro** — `instanceof` checks para erros específicos
5. **Transações via `dataSource.transaction()`** — Para operações atômicas (reorder)

## Detalhes Técnicos

### XSS Prevention
- `containsJavaScriptProtocol()` bloqueia `javascript:` em `link_url`
- URLs aceitas: `http://`, `https://`, ou paths internos `/...`

### Agendamento
- `starts_at` e `ends_at` são ISO 8601 com timezone obrigatório
- Validação: `ends_at > starts_at` se ambos presentes
- API pública (Fase 4.7) filtra: `is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())`

### Reorder em Transação
- Múltiplas linhas atualizadas atomicamente
- Impede race condition se dois admins reordenam simultaneamente

### Acessibilidade
- `alt_text` é **obrigatório** (5-300 chars) — não é opcional
- Crítico para SEO e conformidade WCAG

## Armadilhas Evitadas

1. ✓ alt_text obrigatório (validação 400 se ausente)
2. ✓ javascript: URLs bloqueadas (XSS)
3. ✓ Reorder em transação (atomicidade)
4. ✓ Cache invalidado em CREATE/UPDATE/DELETE/REORDER/TOGGLE
5. ✓ Isolamento multitenant com `withTenant()` em todos os queries
