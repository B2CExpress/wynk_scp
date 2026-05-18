# Memory — SPEC-20260512-1601

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-12 16:01

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-12 16:01 (sessão #1)
**Onde tô:** A SPEC ativa já documenta a mudança entregue no cache Redis de tenant; features vivas também foram alinhadas.
**Próximo passo:** revisar a SPEC com o dev, fazer commit e arquivar quando houver smoke de Docker em ambiente compatível.
**Última decisão:** deixar a SPEC em `active` porque ainda falta commit final/smoke externo, apesar dos testes locais verdes.
**Bloqueio atual:** `docker` indisponível neste host.
**Se retomar, ler:** `state.md` inteiro, com foco nas entradas `[decisão]` e `[tentativa]`.

---

## Contexto ativo

### O que está sendo feito AGORA

Esta SPEC existe para capturar uma mudança de infraestrutura/camada de serviço que já foi implementada antes da documentação formal. O foco não é escrever código novo, e sim deixar rastro explícito do que foi alterado no `TenantResolverService`, em `config/index.ts`, `config/redis.ts`, `backend/.env.example` e `docker-compose.yml`, além de sincronizar as features `tenant-resolution` e `infra-base`.

### Hipóteses em jogo

- **A mudança técnica está pronta para arquivo após commit** (status: confirmada). 2026-05-12 16:01
- **O único blocker real desta sessão é a ausência de Docker no host** (status: confirmada). 2026-05-12 16:01

### Decisões recentes que importam pra continuar

- [2026-05-12 16:01] A SPEC fica em `active` até existir commit final e smoke com Docker fora deste host.
- [2026-05-12 16:01] As features tocadas foram atualizadas agora, em vez de esperar o arquivamento, porque houve mudança arquitetural real no estado atual.

### Respostas-chave do usuário

- [2026-05-12 16:01] Usuário: "Coloque na documentação o que foi feito, uma SPEC"
  Contexto: após a implementação do hardening do cache Redis de tenant.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-12 16:01] Tentei subir `docker compose up -d postgres redis`. Falhou porque `docker` não existe no PATH deste host. Ver state para detalhe completo.

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260512-1601-tenant-cache-hardening/main.md` (novo)
- `docs/active/SPEC-20260512-1601-tenant-cache-hardening/state.md` (novo)
- `docs/active/SPEC-20260512-1601-tenant-cache-hardening/memory.md` (novo)
- `docs/features/tenant-resolution.md` (atualizado)
- `docs/features/infra-base.md` (atualizado)

### Onde parei exatamente

A documentação da mudança já está escrita e alinhada com o código. Falta apenas a etapa operacional fora deste host: commit final e smoke com Docker, para então mover a SPEC para `archive/` e converter as linhas de `Em execução` das features em `Concluídas`.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-12 16:01 | ~30min | ativação | SPEC criada para documentar o hardening do cache Redis de tenant e alinhar as features vivas |
