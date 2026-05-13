# Memory — SPEC-20260513-0910

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 09:10 (sessão #1)
**Onde tô:** SPEC criada e estruturada. `main.md` aguardando validação humana do Alioth antes de qualquer escrita do README ou commit.
**Próximo passo:** Alioth valida `main.md`. Após OK: atualizar `features/infra-base.md` (linha em "Em execução"), commitar estrutura inicial, então escrever `README.md` na raiz.
**Última decisão:** Escopo "doc + WSL2 no Windows" — Windows nativo e macOS deliberadamente fora. Confirmado pelo usuário 2026-05-13 09:05.
**Bloqueio atual:** Validação humana do `main.md` pendente.
**Se retomar, ler:** `main.md` desta SPEC + `docs/features/infra-base.md` (seção Gotchas + Estado atual) + `package.json` raiz + `backend/package.json` + `docker-compose.yml`.

---

## Contexto ativo

### O que está sendo feito AGORA

Estruturando a SPEC `SPEC-20260513-0910-local-env-readme` na branch nova `feature/local-env-readme` (criada a partir de `main`). Já criei a pasta e os 3 arquivos. Próximo movimento: atualizar `docs/features/infra-base.md` (R.11) e apresentar `main.md` ao Alioth para validação humana (mitigação R3).

O README em si **ainda não foi escrito** — esta sessão é só de planejamento, contrato e validação.

### Hipóteses em jogo

- **Caminho dourado Linux = Ubuntu/Debian** (status: testando). Razão: alinha com WSL2 + base que devs costumam ter. Validar com Alioth na revisão do `main.md`.
- **Docker Desktop com integração WSL2 é o recomendado para Windows** (status: testando). Alternativa: instalar Docker nativo dentro do Ubuntu do WSL via `apt`. Resolver na revisão do `main.md`.

### Decisões recentes que importam pra continuar

- [2026-05-13 09:05] Escopo "doc + WSL2 no Windows", Windows nativo fora. (Trade-off: usuários Windows precisam instalar WSL2; ganho: nada de cross-platform em scripts agora.)
- [2026-05-13 09:05] Feature vinculada: `infra-base` (não criar feature nova — README de setup é parte natural de infra).
- [2026-05-13 09:08] Branch nova a partir de `main`, apesar de `main` estar com `active/` violando R.2 (SPEC-1400 mergeada). Esta violação é preexistente; não é meu escopo consertar.

### Respostas-chave do usuário

- [2026-05-13 09:00] Usuário: *"Precisamos criar um spec para subir o ambiente local tanto no windows como no linux, num readme bem passo a passo explicando o que é cada coisa como se baixa e para que serve. Pode ser?"*
  Contexto: pedido inicial.
- [2026-05-13 09:05] Usuário: *"Isso mesmo"*
  Contexto: confirmando escopo "doc + WSL2 no Windows" (vs cross-platform real). Decisão R3 ancorada nesta linha.
- [2026-05-13 09:09] Usuário: *"Pode"*
  Contexto: autorização para trocar de branch (`feature/SQU-43-api-publica` → `main` → `feature/local-env-readme`) e criar a SPEC.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda — sessão #1)_

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260513-0910-local-env-readme/main.md` (criado, aguardando validação humana)
- `docs/active/SPEC-20260513-0910-local-env-readme/state.md` (criado)
- `docs/active/SPEC-20260513-0910-local-env-readme/memory.md` (este arquivo)
- `docs/features/infra-base.md` (a tocar — adicionar linha em "Em execução")
- `README.md` (na raiz — A CRIAR depois da validação)

Arquivos lidos como referência (não-modificáveis nesta SPEC):
- `package.json` (raiz)
- `backend/package.json`
- `docker-compose.yml`
- `backend/.env.example`, `portal/.env.example`
- `docs/features/infra-base.md`
- `docs/CLAUDE.md`, `docs/RULES.md`

### Onde parei exatamente

Acabei de criar os 3 arquivos da SPEC (`main.md`, `state.md`, `memory.md`). Próxima ação concreta: atualizar `docs/features/infra-base.md` adicionando linha na seção "Em execução" referenciando esta SPEC + branch, e apresentar o `main.md` ao Alioth para validação humana ANTES de qualquer `git commit`.

---

## Histórico de sessões

| # | Início            | Duração | Tipo      | Sumário 1 linha                                                                |
|---|-------------------|---------|-----------|--------------------------------------------------------------------------------|
| 1 | 2026-05-13 09:00  | em curso| ativação  | Criação da SPEC + estrutura (main/state/memory). Validação humana pendente.    |
