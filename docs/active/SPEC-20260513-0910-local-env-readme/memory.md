# Memory — SPEC-20260513-0910

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 10:30 (sessão #1)
**Onde tô:** Validação humana pegou um problema real: ambiente do dev tem `docker-compose` v1 (Ubuntu universe), sem plugin v2. Confirmei via `wynk_ecommerce/backend/run-backend-locally.sh` que o e-commerce também usa v1 — é o padrão dele. Adaptei `setup.sh` pra aceitar v1 OU v2 (variável `$COMPOSE`, detecção em cascata, warn quando cai no v1). README atualizado em Pré-requisitos (tabela do Compose) e Troubleshooting (entrada #9). Working tree pendente: setup.sh, README.md, state.md, memory.md.
**Próximo passo:** Commit `fix(setup): aceitar docker-compose v1 como fallback (SPEC-20260513-0910)`. Dev re-executa `./setup.sh --seed`.
**Última decisão:** `setup.sh` aceita v1 e v2 (decisão 10:25, dev: *"Bora de v1, é mais facil"*).
**Bloqueio atual:** nenhum.
**Se retomar, ler:** seção de detecção de Compose no `setup.sh` + README "Pré-requisitos" e Troubleshooting #9 + `main.md` desta SPEC.

---

## Contexto ativo

### O que está sendo feito AGORA

Escopo expandido: além do `README.md` (já commitado em `1cff2da`), agora há `setup.sh` (Linux/WSL2, executável) e `setup.bat` (Windows, dispara `setup.sh` no WSL). README ganhou seção "Setup rápido (atalho)" e os scripts entraram na "Estrutura do monorepo". `main.md` foi atualizado em Resumo, Escopo (DENTRO/FORA), Implementação, Critério de aceite. Próximo: commit consolidado e validação humana.

### Hipóteses em jogo

- **Caminho dourado Linux = Ubuntu/Debian** (status: **confirmada** — coerente com WSL2 default + base que devs costumam usar). 2026-05-13 09:20.
- **Docker Desktop com integração WSL2 é o recomendado para Windows** (status: **confirmada** — decisão registrada no log do state.md em 2026-05-13 09:20). Alternativa `apt` no WSL descartada por exigir systemd + fragilidade.

### Decisões recentes que importam pra continuar

- [2026-05-13 10:25] **`setup.sh` aceita docker-compose v1 e v2**. Detecção em cascata: tenta `docker compose version` (v2) → `docker-compose --version` (v1) → erro com 3 opções. Variável `$COMPOSE` usada em todas as chamadas. Warn único quando cai no v1. Motivo: ambiente real do dev usa v1 (alinhado com `wynk_ecommerce`).
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
- [2026-05-13 10:15] Usuário: *"Mas porque está acontecendo isso, já o ecommerce utiliza docker. Da uma olhada no wynk_ecommerce/backend tem um script la acho que é run-backend.sh ou algo assim"*
  Contexto: dev apontando que o e-commerce funciona com Docker no mesmo ambiente — pista crucial pra eu descobrir que o e-commerce usa `docker-compose` v1, não v2.
- [2026-05-13 10:30] Usuário: *"Bora de v1, é mais facil"*
  Contexto: aprovando a recomendação de adaptar `setup.sh` pra aceitar v1 como fallback em vez de forçar instalação do plugin v2.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-13 10:00] **`setup.sh` exigindo `docker compose` v2 estritamente** — falhou no ambiente do dev (Ubuntu 22.04 com `docker.io` + `docker-compose` v1, sem plugin v2 disponível no `apt`). Lição: o stack do dev e do `wynk_ecommerce` usa v1; aceitar ambos é o caminho. Ver decisão de 10:25.

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
