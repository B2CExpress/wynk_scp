
# Validação ponta-a-ponta — Fase 1 Multitenant

**SPEC:** SPEC-20260512-1900-validacao-ponta-a-ponta  
**Data:** 2026-05-12  
**Responsável:** Layssa Suellen  
**Status:** em validação  
**Branch:** feature/validacao-ponta-a-ponta-fase-1  

---

## Objetivo

Validar manualmente que a Fase 1 da plataforma multitenant está pronta para ser considerada concluída.

Esta validação confirma que tenants de teste coexistem na mesma instalação, cada um com domínio, identidade visual, autenticação, cache e isolamento próprios, sem vazamento de dados ou cookies entre tenants.

---

## Ambiente validado

| Item | Valor |
|---|---|
| Sistema operacional | Windows |
| Node | >=22 |
| Banco | PostgreSQL via Docker Compose |
| Cache | Redis via Docker Compose |
| Backend | Express + TypeORM |
| Portal | Next.js |
| Seed de tenants | `seeds/tenants.json` |
| Assets | `portal/public/flavors/` |
| Branch | `feature/validacao-ponta-a-ponta-fase-1` |

---

## Bloqueio atual

Durante a validação local, o Docker Desktop não carregou corretamente.

Erro observado:

```txt
request returned 500 Internal Server Error for API route and version
check if the server supports the requested API version