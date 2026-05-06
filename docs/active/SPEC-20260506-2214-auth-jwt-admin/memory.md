# Memory — SPEC-20260506-2214

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-06 22:14

---

## TL;DR (sobrescrever ao fim de cada sessao)

**Ultima atualizacao:** 2026-05-06 22:14 (sessao #1)
**Onde to:** Contrato (main.md) escrito a partir do ticket SQU-37. Nada implementado. Aguardando confirmacao de stack/Redis com dev.
**Proximo passo:** Confirmar stack do `backend/` (Next.js App Router?) + disponibilidade de Redis. Depois Fase 1 (schema `admin_users` + migration).
**Ultima decisao:** Login global por email; cross-tenant em 2 camadas (header `x-tenant-id` + `domain: undefined` no cookie); 401 generico anti-enumeracao; `is_active=false` → 403.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** main.md (contrato) + esta TL;DR + tabela de fases em state.md.

---

## Contexto ativo

### O que esta sendo feito AGORA

Bootstrap da SPEC: criando os 3 arquivos da pasta `active/SPEC-20260506-2214-auth-jwt-admin/` e os stubs de feature (`auth`, `admin-users`). Ainda nenhum codigo real. O `backend/` esta vazio — o trabalho de implementacao comeca apos confirmar a stack com o dev (provavel Next.js App Router + TS + Drizzle, mas nao confirmado).

### Hipoteses em jogo

- **Stack do `backend/` sera Next.js App Router + TypeScript + Drizzle ORM** (status: testando — inferida pelos paths do ticket `app/api/auth/.../route.ts` e `lib/db/schema.ts`). 2026-05-06 22:14
- **Redis vem da SPEC-1505 antes desta SPEC concluir** (status: testando — alinhamento de ordem com SPEC-1505 §9). 2026-05-06 22:14
- **Header `x-tenant-id` e setado pelo middleware de tenant resolution (SPEC-1505 §6.2)** (status: testando — esta SPEC consome esse header, nao o produz). 2026-05-06 22:14

### Decisoes recentes que importam pra continuar

- [2026-05-06 22:14] **Login GLOBAL por email** (sem escopo de tenant_id na busca). Cross-tenant prevenido em 2 camadas: header `x-tenant-id` deve bater + cookies sao por dominio (`domain: undefined`).
- [2026-05-06 22:14] **Mensagem generica em 401** ("email ou senha incorretos") tanto pra "email nao existe" quanto "senha errada" — anti-enumeracao.
- [2026-05-06 22:14] **`is_active=false` → 403** (nao 401) — distinguir credencial valida porem bloqueada.
- [2026-05-06 22:14] **Refresh token tem `type:'refresh'` no payload** e `verifyToken(token, type)` rejeita troca cruzada com access.
- [2026-05-06 22:14] **bcrypt cost 10** (OWASP 2025 default).

### Respostas-chave do usuario

- [2026-05-06 22:14] Usuario: ticket SQU-37 (verbatim sobre o porque): *"Por que cookie HttpOnly? Nao e acessivel via JavaScript - protege contra XSS roubando o token. Por que access token curto? Limita janela de ataque se vazar. Por que refresh token? Mantem o usuario logado sem precisar relogar a cada 15 min."*
  Contexto: justificativa explicita do trade-off de seguranca/UX que define toda a arquitetura. Importa pra nao abrir excecao depois (ex.: nao trocar pra localStorage por conveniencia, nao esticar access pra >15min).
- [2026-05-06 22:14] Usuario: *"Bora ok"*
  Contexto: aprovou o caminho A — SPEC nova standalone com `Depende de: SPEC-20260503-1505`, criar features `auth` e `admin-users`. Aprovacao geral; as 3 perguntas especificas (cross-tenant, stack do backend/, rate limit Redis vs in-memory) ficaram em "Duvidas em aberto" no state.

### Tentativas que falharam (para NAO repetir)

_nenhuma ainda — sessao 1, so docs._

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260506-2214-auth-jwt-admin/main.md` (criado)
- `docs/active/SPEC-20260506-2214-auth-jwt-admin/state.md` (criado)
- `docs/active/SPEC-20260506-2214-auth-jwt-admin/memory.md` (em edicao — este arquivo)
- `docs/features/auth.md` (a criar)
- `docs/features/admin-users.md` (a criar)

### Onde parei exatamente

Acabando o memory.md. Proximo: criar `docs/features/auth.md` e `docs/features/admin-users.md` (stubs com cabecalho minimo + linha em "Em execucao" apontando pra esta SPEC, conforme R.11). Ainda **nao** comecar codigo no `backend/` — antes preciso da confirmacao do dev sobre stack e Redis.

**Pendente antes de comecar codigo:**
1. Confirmar stack do `backend/` (Next.js App Router?)
2. Confirmar disponibilidade de Redis (SPEC-1505 ja ativada? ou subir local?)
3. Confirmar se `app/api/auth/...` mora no `backend/` ou em outro projeto

---

## Historico de sessoes

| # | Inicio | Duracao | Tipo | Sumario 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-06 22:14 | em curso | ativacao | Bootstrap da SPEC (main + state + memory) + features stub a partir do ticket SQU-37 |
