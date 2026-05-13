# Memory — SPEC-20260513-0910

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 09:55 (sessão #1)
**Onde tô:** Escopo expandido com `setup.sh` + `setup.bat`. `main.md`, `README.md`, `setup.sh` (novo, executável), `setup.bat` (novo) prontos. Working tree tem 6 arquivos pendentes de commit (main, state, memory, setup.sh, setup.bat, README).
**Próximo passo:** Commit consolidado `docs(infra-base): setup.sh e setup.bat como atalho de bootstrap local (SPEC-20260513-0910)`. Depois: validação humana — Alioth roda `./setup.sh` em VM/WSL limpo.
**Última decisão:** Scripts não instalam pré-requisitos (só verificam). 2026-05-13 09:50.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** `setup.sh` + `setup.bat` + seção "Setup rápido (atalho)" do `README.md` + `main.md` desta SPEC.

---

## Contexto ativo

### O que está sendo feito AGORA

Escopo expandido: além do `README.md` (já commitado em `1cff2da`), agora há `setup.sh` (Linux/WSL2, executável) e `setup.bat` (Windows, dispara `setup.sh` no WSL). README ganhou seção "Setup rápido (atalho)" e os scripts entraram na "Estrutura do monorepo". `main.md` foi atualizado em Resumo, Escopo (DENTRO/FORA), Implementação, Critério de aceite. Próximo: commit consolidado e validação humana.

### Hipóteses em jogo

- **Caminho dourado Linux = Ubuntu/Debian** (status: **confirmada** — coerente com WSL2 default + base que devs costumam usar). 2026-05-13 09:20.
- **Docker Desktop com integração WSL2 é o recomendado para Windows** (status: **confirmada** — decisão registrada no log do state.md em 2026-05-13 09:20). Alternativa `apt` no WSL descartada por exigir systemd + fragilidade.

### Decisões recentes que importam pra continuar

- [2026-05-13 09:50] **Expansão de escopo aprovada**: SPEC atual agora inclui `setup.sh` + `setup.bat` (não SPEC nova). Cláusula no FORA ajustada para preservar "não reescrever `docker-compose.yml`/`backend/scripts/`" mas permitir wrappers novos.
- [2026-05-13 09:50] Scripts **não instalam pré-requisitos** — só verificam e falham com instrução. Motivo: `sudo` + chaves de repo + distros divergentes = caminho de dor.
- [2026-05-13 09:50] `setup.bat` é wrapper magrinho que delega ao `setup.sh` via `wsl -e bash -c "..."` com `wslpath -u` pra traduzir o cwd.
- [2026-05-13 09:20] Docker no Windows = Docker Desktop com integração WSL2 (não `apt` no WSL).
- [2026-05-13 09:20] macOS no README: menção curta de 1 linha em "Setup", sem seção dedicada.
- [2026-05-13 09:05] Escopo original "doc + WSL2 no Windows", Windows nativo fora.
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
- [2026-05-13 09:45] Usuário: *"Espera, podemos fazer um .sh para linix e um .bat para o windows? Assim o pessoal apenas roda ele"*
  Contexto: pedido de expansão de escopo — automatizar setup via scripts.
- [2026-05-13 09:50] Usuário: *"Sim, topo"*
  Contexto: aprovação da expansão depois de eu apresentar as 3 considerações (limitação técnica do `.bat`, escopo declarado FORA mencionando "scripts cross-platform", pré-requisitos não instaláveis via script) e recomendar a abordagem.

### Tentativas que falharam (para NÃO repetir)

_(nenhuma ainda — sessão #1)_

### Arquivos ativamente sendo tocados

- `README.md` (na raiz — commit `1cff2da` + edição pendente: seção "Setup rápido", item na Estrutura, item no Sumário)
- `setup.sh` (raiz — novo, modo `0755`, ~165 linhas, `bash -n` OK; pendente de commit)
- `setup.bat` (raiz — novo, ~75 linhas; pendente de commit)
- `docs/active/SPEC-20260513-0910-local-env-readme/main.md` (commit `98c43aa` + atualizações pendentes — Resumo, Escopo, Implementação, Critério de aceite)
- `docs/active/SPEC-20260513-0910-local-env-readme/state.md` (com adições pendentes — TL;DR, log, status, próximos passos)
- `docs/active/SPEC-20260513-0910-local-env-readme/memory.md` (este arquivo, com adições pendentes)
- `docs/features/infra-base.md` (linha em "Em execução" já em `98c43aa`; será movida pra "Concluídas" só ao arquivar)

Arquivos lidos como referência (não-modificáveis nesta SPEC):
- `package.json` (raiz)
- `backend/package.json`
- `docker-compose.yml`
- `backend/.env.example`, `portal/.env.example`
- `docs/features/infra-base.md`
- `docs/CLAUDE.md`, `docs/RULES.md`

### Onde parei exatamente

Tudo escrito. Próxima ação concreta: `git add README.md setup.sh setup.bat docs/active/SPEC-20260513-0910-local-env-readme/{main.md,state.md,memory.md}` e `git commit -m "docs(infra-base): setup.sh e setup.bat como atalho de bootstrap local (SPEC-20260513-0910)"`. Depois: pedir ao Alioth pra rodar `./setup.sh` num WSL/VM limpo e validar que `npm run dev -w backend` responde 200 em `/health`.

---

## Histórico de sessões

| # | Início            | Duração | Tipo      | Sumário 1 linha                                                                |
|---|-------------------|---------|-----------|--------------------------------------------------------------------------------|
| 1 | 2026-05-13 09:00  | em curso| ativação  | Criação da SPEC + estrutura (main/state/memory). Validação humana pendente.    |
