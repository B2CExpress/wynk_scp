# SPEC-20260513-0910: README de setup local (Linux + Windows via WSL2)

**Status:** active
**Criada:** 2026-05-13 09:10
**Ativada:** 2026-05-13 09:10
**Concluída:** —
**Commit final:** —
**Keywords:** readme, onboarding, setup, local, docker, wsl2, prerequisites, troubleshooting, monorepo
**Features:** infra-base
**Branch:** feature/local-env-readme
**Depende de:** —
**Origem:** usuário em 2026-05-13 09:00 — *"Precisamos criar um spec para subir o ambiente local tanto no windows como no linux, num readme bem passo a passo explicando o que é cada coisa como se baixa e para que serve."* **Escopo expandido em 2026-05-13 09:50** após pedido do usuário ("podemos fazer um .sh para linux e um .bat para o windows? Assim o pessoal apenas roda ele") — README continua sendo entrega principal; somam-se `setup.sh` (idempotente, Linux/WSL2) e `setup.bat` (wrapper Windows que dispara o `setup.sh` dentro do WSL).
**Resumo:** Entregar um `README.md` na raiz do repositório com passo-a-passo de setup local em Linux nativo e Windows (via WSL2), explicando cada pré-requisito (o que é, pra que serve, como instalar) e os comandos de bootstrap do monorepo (Docker, schema dedicado `scp`, migrations, seed, dev server). Acompanha dois scripts de atalho — `setup.sh` (Linux/WSL2) e `setup.bat` (Windows, delega ao WSL) — que automatizam os passos 2-9 do Setup Linux de forma idempotente, sem instalar pré-requisitos (só verificam). Reflete fielmente o estado atual do projeto e não altera `docker-compose.yml` nem `backend/scripts/`.

## Objetivo

Reduzir atrito de onboarding documentando o setup local do monorepo `wynk-scp` numa única porta de entrada. Hoje **não existe README de setup raiz** — devs novos precisam reconstruir o fluxo lendo `package.json`, `docker-compose.yml`, `backend/scripts/`, gotchas dispersos em `docs/features/infra-base.md` e referências indiretas em `docs/CLAUDE.md`. Esta SPEC entrega um documento didático, copiável e auditável, cobrindo Linux nativo (caso primário) e Windows via WSL2 (caminho recomendado para Windows — nativo fica explicitamente fora).

## Escopo

**DENTRO:**
- Criação de `README.md` na raiz do repositório.
- Seção "O que é" (parágrafo curto: plataforma multitenant para shoppings; aponta para `docs/CLAUDE.md` e `docs/RULES.md`).
- Seção "Pré-requisitos" cobrindo: **Node.js 22+**, **npm 10+** (vem com Node), **Git**, **Docker + Docker Compose**, **WSL2 + Ubuntu** (apenas Windows). Para cada item: *o que é / pra que serve / versão mínima / como instalar (link oficial)*.
- Seção "Setup Linux (Ubuntu/Debian)" — passo-a-passo do zero: `git clone` → `npm install` (raiz) → `cp .env.example .env` (backend + portal) → `docker compose up -d` → `npm run db:setup -w backend` → `npm run seed -w backend` → `npm run dev -w backend`.
- Seção "Setup Windows (via WSL2)" — instalação do WSL2 + distro Ubuntu, depois aponta para "Setup Linux" rodando **dentro** do WSL (instalando Node, Docker e Git no Linux do WSL, não no Windows).
- Seção "Primeira execução" — comandos exatos para subir `backend`, `portal` e `backoffice`; portas esperadas e como confirmar que tudo subiu.
- Seção "Comandos do dia-a-dia" — tabela com scripts já existentes em `package.json` raiz (`lint`, `typecheck`, `test`, `format`, `format:check`, `validate:flavors`) e `backend/package.json` (`dev`, `build`, `migration:run`, `migration:revert`, `migration:create`, `prepare:schema`, `db:setup`, `seed`).
- Seção "Estrutura do monorepo" — 1 linha por pasta-raiz (`backend/`, `portal/`, `backoffice/`, `docs/`, `seeds/`, `scripts/`).
- Seção "Troubleshooting" — FAQ no formato *Sintoma → Causa → Fix*, cobrindo os gotchas já documentados em `docs/features/infra-base.md`.
- Seção "Saiba mais" com links para `docs/CLAUDE.md`, `docs/RULES.md`, `docs/features/`.
- **Seção "Setup rápido (atalho)"** apresentando os scripts `setup.sh` e `setup.bat` antes do passo-a-passo manual.
- **`setup.sh`** na raiz (modo `0755`): bash idempotente que automatiza os passos 2-9 do Setup Linux. Verifica pré-requisitos (Node 22+, npm, Docker engine + Compose v2 + daemon ativo), aceita flag `--seed` opcional para popular tenants. Falha cedo com mensagem clara e código de saída ≠ 0 quando algo falta.
- **`setup.bat`** na raiz: wrapper Windows que verifica WSL2 + Docker Desktop, alerta se o `cwd` está em `C:\…` (gotcha do filesystem do Windows × WSL), e dispara `wsl -e bash -c "cd <wslpath> && ./setup.sh <args>"` repassando argumentos.

**FORA:**
- **Windows nativo** (sem WSL2) — atrito desproporcional: `docker-compose.yml`, `backend/scripts/*.ts` e fluxo do TypeORM CLI foram pensados em Linux. Decisão registrada na seção de Troubleshooting/contexto do README como "use WSL2".
- **Reescrita de `docker-compose.yml` ou de scripts em `backend/scripts/` para cross-platform** — `setup.sh` e `setup.bat` na raiz são **wrappers novos**, não modificam scripts existentes; uma reescrita real continua sendo tema de SPEC futura de infra se um dev demandar.
- **Instalar pré-requisitos automaticamente** (Node, npm, Docker, Git) via `setup.sh`/`setup.bat` — só verificamos e imprimimos instrução; instalar exige `sudo`, chaves de repositório (NodeSource), diferenças entre distros (apt/dnf/pacman/brew). Trade-off: usuário precisa instalar pré-requisitos manualmente seguindo o README; ganho: scripts simples, sem `sudo`, sem heurística de distro.
- **macOS** — não há dev declarado nessa plataforma hoje. `setup.sh` provavelmente funciona em macOS (bash + Docker Desktop), mas não é testado nem garantido nesta SPEC. Pode ser confirmado em SPEC futura sem ruptura.
- **CI/CD** — já documentado em `.github/workflows/ci.yml` e `docs/features/infra-base.md`. README pode mencionar de passagem mas não detalha.
- **Deployment / produção** — fora do escopo de "ambiente local".
- **Documentação por feature** — vive em `docs/features/*.md`. README só linka.
- **Tutorial de Docker/Node/Git/Postgres/Redis** — README aponta para docs oficiais; não ensina conceitos.
- **Modificações em código** (`backend/`, `portal/`, `backoffice/`), `docker-compose.yml`, `package.json`, `backend/scripts/`, `.env.example` — README **reflete** o estado atual; não corrige nem altera.
- **README dos subprojetos** (`portal/README.md`, `backoffice/README.md`) — default do Next/Vite; ortogonais.

## Implementação

**Arquivo único entregue:** `README.md` na raiz do repositório (não existe hoje — confirmado por `find -maxdepth 3 -iname "README*"`: só os de `portal/` e `backoffice/`).

**Esqueleto do README:**

```
# wynk-scp — Plataforma multitenant para shoppings

## O que é
<parágrafo curto: monorepo Node 22+ com backend Express+TypeORM, portal Next.js, backoffice Vite+React; Postgres+Redis via Docker; aponta para docs/CLAUDE.md>

## Pré-requisitos
<tabela ou subseções: Node 22+, npm 10+, Git, Docker, Docker Compose, WSL2 (Windows)>

## Setup
### Linux (Ubuntu/Debian — caminho dourado)
<passo-a-passo numerado, comandos copiáveis>

### Windows (via WSL2)
<instalação WSL2 + Ubuntu, depois aponta para Setup Linux>

## Primeira execução
<comandos exatos para subir backend, portal, backoffice; URLs esperadas>

## Comandos do dia-a-dia
<tabela: comando, o que faz, onde rodar>

## Estrutura do monorepo
<lista de pastas-raiz com 1 linha cada>

## Troubleshooting
<FAQ: gotchas conhecidos>

## Saiba mais
<links: docs/CLAUDE.md, docs/RULES.md, docs/features/>
```

**Fontes de verdade a refletir literalmente** (sem inventar valores):
- Versões + portas: `docker-compose.yml` (Postgres 15-alpine, porta host **5435**; Redis 7-alpine, porta host **6382**). Justificativa: evita conflito com `wynk_ecommerce` (5434/6381).
- Engines: `package.json` raiz (`"node": ">=22"`).
- Scripts: `package.json` raiz (workspaces) + `backend/package.json` (`dev`, `db:setup`, `prepare:schema`, `migration:run/revert/create/show`, `seed`, `test`, `lint`, `typecheck`, `build`, `start`, `typeorm`).
- Workspaces: `backend`, `portal`, `backoffice` (do `package.json` raiz).
- Variáveis de ambiente: `backend/.env.example` e `portal/.env.example` (instrução: `cp .env.example .env` em cada um).
- Schema: dedicado `scp` (mencionado em `docs/CLAUDE.md` e `docs/features/infra-base.md`). Criado automaticamente por `npm run prepare:schema -w backend`.
- Gotchas: extraídos literalmente de `docs/features/infra-base.md` seção "Gotchas":
  1. `@types/express 5.x` invadindo via transitive (`npm ls @types/express` mostra conflito; `overrides` no `package.json` raiz já corrige; se editar `node_modules`/`package-lock.json`, apagar e `npm install` de novo).
  2. `safer-buffer` ausente após overrides (já listado como dep direta do backend; sintoma: Jest reclama em test run).
  3. Jest + npm workspaces hoisting (`moduleDirectories` já configurado em `backend/jest.config.js`).
  4. TypeORM CLI tenta criar tabela `migrations` antes do schema existir → travamento se schema `scp` não existir (use `npm run db:setup -w backend`, **não** `migration:run` direto na primeira vez).
  5. `ts-node` precisa estar na raiz, não só no backend (já está em `devDependencies` da raiz).
  6. `baseUrl` deprecated em TS recente; paths exigem prefixo `./` (informativo — afeta quem for criar `tsconfig` novo).

**Convenções de escrita:**
- Comandos copiáveis em blocos com fence ` ```bash ` (ou `powershell` apenas para a parte de "ativar WSL2" no Windows).
- Cada pré-requisito tem 4 campos: **O que é** / **Pra que serve no projeto** / **Versão mínima** / **Como instalar** (link oficial).
- Setup Linux usa **Ubuntu** como caminho dourado (alinha com o que devs estão usando; `apt` é a referência). Outras distros entram como nota curta (links pra docs oficiais do Docker e do Node em Fedora/Arch).
- Troubleshooting usa formato fixo *Sintoma → Causa → Fix* para escaneabilidade.
- Português (alinha com o resto da doc do projeto: `RULES.md`, `CLAUDE.md`, features).
- Sem emojis (alinha com tom imperativo do `RULES.md`).

**O que NÃO mexer:**
- `docker-compose.yml`, `package.json`s, `backend/scripts/`, `backend/src/`, `.env.example`s, `portal/README.md`, `backoffice/README.md`.
- `docs/RULES.md`, `docs/CLAUDE.md`, `docs/INDEX.md` (este último é gerado pelo CI).

**Especificação dos scripts:**

`setup.sh` (raiz, modo `0755`):
- Shebang `#!/usr/bin/env bash`; `set -euo pipefail`.
- Verifica que está sendo executado na raiz do repo (`package.json` com `"name": "wynk-scp"`).
- Verifica pré-requisitos com mensagens claras de falha (sem tentar instalar): `node` (`>=22`), `npm`, `git`, `docker` (com `docker info` para checar daemon), `docker compose version`.
- Roda `npm install`.
- Para `backend` e `portal`: copia `.env.example` → `.env` apenas se `.env` não existir (idempotência).
- Roda `docker compose up -d`.
- Aguarda até 60s pelos containers `scp_postgres` e `scp_redis` ficarem `healthy` (via `docker compose ps`).
- Roda `npm run db:setup -w backend`.
- Roda `npm run seed -w backend` somente se receber flag `--seed` ou `--with-seed`. Caso contrário, imprime nota orientando o comando manual.
- Imprime resumo final com os comandos `npm run dev -w <app>` para os 3 workspaces.
- Saída colorida básica (ANSI: `[ok]` verde, `[erro]` vermelho, `[aviso]` amarelo) usando `printf`; sem emojis.

`setup.bat` (raiz):
- `@echo off` + `setlocal enabledelayedexpansion`.
- Verifica `wsl --status`; se falhar, imprime instrução para `wsl --install` no PowerShell admin e sai com `errorlevel 1`.
- Verifica `docker version`; se falhar, imprime instrução para instalar Docker Desktop com integração WSL2 e sai.
- Avisa se `cwd` começa com `C:` (filesystem do Windows) — perda de performance e risco de inotify quebrar. Pede `pause` para o usuário confirmar (ou Ctrl+C).
- Dispara o `setup.sh` dentro do WSL: `wsl -e bash -c "cd $(wslpath -u '%CD%') && bash ./setup.sh %*"` (repassa argumentos como `--seed`).
- Propaga `errorlevel` do `setup.sh`.
- No fim, imprime instrução para abrir o terminal Ubuntu e rodar `npm run dev -w backend`.

**Único arquivo de feature atualizado:** `docs/features/infra-base.md` (R.11 na ativação: linha em "Em execução"; R.7 na conclusão: move para "Concluídas", atualiza "Estado atual" mencionando que onboarding agora tem porta de entrada documentada **e atalho automatizado**).

## Critério de aceite

- [x] `README.md` criado na raiz com todas as seções listadas em "Escopo > DENTRO" (2026-05-13 09:40, commit `1cff2da`)
- [x] Pré-requisitos cobrem Node 22+, npm 10+, Git, Docker, Docker Compose, WSL2 (Windows) — cada um com *o que é / pra que serve / versão mínima / como instalar (link oficial)* (2026-05-13 09:40, commit `1cff2da`)
- [x] Setup Linux: comandos batem 1:1 com scripts existentes em `package.json` raiz e `backend/package.json` (2026-05-13 09:40, commit `1cff2da`)
- [x] Setup Windows: instruções de WSL2 + Ubuntu levam ao mesmo ponto que Setup Linux dentro do WSL (2026-05-13 09:40, commit `1cff2da`)
- [x] Portas explícitas: **5435** (Postgres) e **6382** (Redis), com justificativa de não-conflito com `wynk_ecommerce` (2026-05-13 09:40, commit `1cff2da`)
- [x] Troubleshooting cobre os 6 gotchas de `docs/features/infra-base.md` no formato *Sintoma → Causa → Fix*, **acrescido de 2 entradas** (conflito de porta Docker, clone em `/mnt/c/` no WSL) — total 8 (2026-05-13 09:40, commit `1cff2da`)
- [x] Bloco "Comandos do dia-a-dia" lista todos os scripts esperados (2026-05-13 09:40, commit `1cff2da`)
- [x] Links presentes para `docs/CLAUDE.md`, `docs/RULES.md`, `docs/features/` (2026-05-13 09:40, commit `1cff2da`)
- [ ] **`setup.sh`** criado na raiz, modo `0755`, idempotente, verifica pré-requisitos, executa passos 2-9 do Setup Linux, aceita `--seed`
- [ ] **`setup.bat`** criado na raiz, verifica WSL2 + Docker Desktop, dispara `setup.sh` dentro do WSL com translação de path via `wslpath`
- [ ] README.md atualizado com seção "Setup rápido (atalho)" antes do passo-a-passo manual
- [ ] Validação humana — Alioth executa `./setup.sh` em ambiente limpo (Linux ou WSL Ubuntu) e vê `npm run dev -w backend` aceitar `GET /health` com 200; opcionalmente roda `setup.bat` em Windows e confirma handoff para WSL
- [ ] Sem alterações fora de: `README.md`, `setup.sh`, `setup.bat`, `docs/features/infra-base.md` (linha de SPEC), `docs/active/SPEC-20260513-0910-local-env-readme/` (esta SPEC)
- [ ] **Features tocadas (`infra-base`) atualizadas** com timestamp e referência a esta SPEC (R.7)
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
