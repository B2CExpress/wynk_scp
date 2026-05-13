# Memory — SPEC-20260513-0910

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 09:40 (sessão #1)
**Onde tô:** `README.md` escrito na raiz com 9 seções e 8 entradas de troubleshooting. Working tree tem: `README.md` (novo), `state.md` + `memory.md` (modificados). Branch local aterrissou em commit `98c43aa` (idêntico estruturalmente; uma sessão anterior gerou o mesmo conteúdo). **Pendente:** commit único consolidando tudo. Depois: validação humana do Alioth executando o passo-a-passo.
**Próximo passo:** Commit `docs(infra-base): README.md de setup local na raiz (SPEC-20260513-0910)` incluindo `README.md`, `state.md`, `memory.md`. Não pushar (CLAUDE.md global proíbe push sem pedido explícito).
**Última decisão:** Troubleshooting com 8 entradas (não 6) — adicionei conflito de porta Docker e clone em `/mnt/c/` no WSL como entradas extras (frequentes o suficiente pra preventiva).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** `README.md` recém-criado + `main.md` desta SPEC + `docs/features/infra-base.md`.

---

## Contexto ativo

### O que está sendo feito AGORA

`README.md` escrito na raiz. Próximo passo concreto: commit único `docs(infra-base): README.md de setup local na raiz (SPEC-20260513-0910)` incluindo `README.md`, `state.md`, `memory.md`. Sem push (regra global). Após commit: apresentar pro Alioth com instrução de executar o passo-a-passo do README em ambiente limpo.

### Hipóteses em jogo

- **Caminho dourado Linux = Ubuntu/Debian** (status: **confirmada** — coerente com WSL2 default + base que devs costumam usar). 2026-05-13 09:20.
- **Docker Desktop com integração WSL2 é o recomendado para Windows** (status: **confirmada** — decisão registrada no log do state.md em 2026-05-13 09:20). Alternativa `apt` no WSL descartada por exigir systemd + fragilidade.

### Decisões recentes que importam pra continuar

- [2026-05-13 09:20] Docker no Windows = Docker Desktop com integração WSL2 (não `apt` no WSL).
- [2026-05-13 09:20] macOS no README: menção curta de 1 linha em "Setup", sem seção dedicada.
- [2026-05-13 09:05] Escopo "doc + WSL2 no Windows", Windows nativo fora.
- [2026-05-13 09:05] Feature vinculada: `infra-base` (não criar feature nova).
- [2026-05-13 09:08] Branch nova a partir de `main`, apesar de `main` estar com `active/` violando R.2 (SPEC-1400 mergeada — preexistente, não meu escopo).

### Respostas-chave do usuário

- [2026-05-13 09:00] Usuário: *"Precisamos criar um spec para subir o ambiente local tanto no windows como no linux, num readme bem passo a passo explicando o que é cada coisa como se baixa e para que serve. Pode ser?"*
  Contexto: pedido inicial.
- [2026-05-13 09:05] Usuário: *"Isso mesmo"*
  Contexto: confirmando escopo "doc + WSL2 no Windows" (vs cross-platform real). Decisão R3 ancorada nesta linha.
- [2026-05-13 09:09] Usuário: *"Pode"*
  Contexto: autorização para trocar de branch (`feature/SQU-43-api-publica` → `main` → `feature/local-env-readme`) e criar a SPEC.
- [2026-05-13 09:20] Usuário: *"Isso mesmo, manda bala!"*
  Contexto: validação humana do `main.md` (mitigação R3) + delegação à IA das 2 dúvidas em aberto (macOS, Docker no Windows).

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda — sessão #1)_

### Arquivos ativamente sendo tocados

- `README.md` (na raiz — **criado** em 2026-05-13 09:40, ~290 linhas)
- `docs/active/SPEC-20260513-0910-local-env-readme/main.md` (commitado em `98c43aa`, sem alterações pendentes)
- `docs/active/SPEC-20260513-0910-local-env-readme/state.md` (com adições pendentes — TL;DR, log, status)
- `docs/active/SPEC-20260513-0910-local-env-readme/memory.md` (este arquivo, com adições pendentes)
- `docs/features/infra-base.md` (linha em "Em execução" já no commit `98c43aa`; será movida pra "Concluídas" só ao arquivar)

Arquivos lidos como referência (não-modificáveis nesta SPEC):
- `package.json` (raiz)
- `backend/package.json`
- `docker-compose.yml`
- `backend/.env.example`, `portal/.env.example`
- `docs/features/infra-base.md`
- `docs/CLAUDE.md`, `docs/RULES.md`

### Onde parei exatamente

`README.md` escrito na raiz (~290 linhas, 9 seções, 8 entradas de troubleshooting). State/memory atualizados em memória mas ainda não commitados. Próxima ação concreta: rodar `git add README.md state.md memory.md` (caminhos completos) e `git commit` com mensagem `docs(infra-base): README.md de setup local na raiz (SPEC-20260513-0910)`. Depois: pedir ao Alioth pra executar o passo-a-passo do README em ambiente limpo (VM/container/WSL).

---

## Histórico de sessões

| # | Início            | Duração | Tipo      | Sumário 1 linha                                                                |
|---|-------------------|---------|-----------|--------------------------------------------------------------------------------|
| 1 | 2026-05-13 09:00  | em curso| ativação  | Criação da SPEC + estrutura (main/state/memory). Validação humana pendente.    |
