# State — SPEC-20260513-0910

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 11:15
**Onde tô:** **2ª expansão de escopo** (3ª revisão da SPEC). Após o dev questionar *"então o setup não roda nada, apenas configura?"*, dividimos a responsabilidade: `setup.sh`/`setup.bat` ficam só com configuração; `run.sh`/`run.bat` cuidam de subir os dev servers. Aceita `backend` (default), `portal`, `backoffice`, `all` (paralelo com logs prefixados via `sed -u` e trap centralizado). `main.md` atualizado (Resumo, Escopo DENTRO, Implementação, Critério de aceite). Scripts criados (`run.sh` modo `0755`, `bash -n` OK; `run.bat` análogo ao `setup.bat`). README atualizado em "Primeira execução" com subseção "Atalho: `./run.sh`" e na "Estrutura do monorepo".
**Próximo passo:** Commit `feat(setup): run.sh e run.bat como atalho para subir dev servers (SPEC-20260513-0910)`. Depois: dev roda `./run.sh` (e/ou `./run.sh all`) pra validar que o backend sobe e responde `GET /health` 200.
**Última decisão:** Dividir responsabilidades em 2 scripts (configurar vs rodar). 2026-05-13 11:00. Motivo: dev server é processo foreground/watch, não cabe num script de configuração; com 3 apps, gerência de processos é melhor isolada no `run.sh`.
**Bloqueio atual:** nenhum (aguardando dev rodar `./run.sh` ou `./run.sh all`).
**Se retomar, ler:** `run.sh` + `run.bat` + seção "Primeira execução" do `README.md` (subseção "Atalho: `./run.sh`") + `main.md` desta SPEC.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição                                                      | Status       | Atualizado       | Commit |
|---|----------------------------------------------------------------|--------------|------------------|--------|
| 1 | Criar estrutura da SPEC (main + state + memory) + atualizar feature `infra-base` (linha "Em execução") | concluído    | 2026-05-13 09:20 | —      |
| 2 | Validação humana do `main.md` por Alioth                       | concluído    | 2026-05-13 09:20 | —      |
| 3 | Escrever `README.md` na raiz                                   | concluído    | 2026-05-13 09:40 | `1cff2da` |
| 4 | Expansão de escopo: `setup.sh` + `setup.bat` + atualizar `main.md` e `README.md` | concluído | 2026-05-13 09:55 | `451a92e` |
| 5 | Fix do `setup.sh`: aceitar `docker-compose` v1 como fallback | concluído | 2026-05-13 10:30 | `aa20692` |
| 6 | **2ª expansão de escopo: `run.sh` + `run.bat` (configurar e rodar = 2 scripts)** | concluído | 2026-05-13 11:15 | (pendente — próximo commit) |
| 7 | Validação humana — Alioth executa `./setup.sh --seed` e depois `./run.sh` (ou `./run.sh all`); confirma backend respondendo `GET /health` 200 | em progresso | 2026-05-13 11:15 | — |
| 8 | Conclusão: marcar critério de aceite, atualizar `features/infra-base.md` (move para "Concluídas" + atualiza "Estado atual"), mover SPEC para `archive/` | pendente | 2026-05-13 11:15 | — |

### Próximos passos

- [x] Alioth valida `main.md` (2026-05-13 09:20 — *"Isso mesmo, manda bala!"*)
- [x] Estrutura inicial da SPEC + linha em `features/infra-base.md` (commit `98c43aa`)
- [x] Escrever `README.md` na raiz (commit `1cff2da`, 2026-05-13 09:40)
- [x] Expansão de escopo: `setup.sh` + `setup.bat` + atualizar `main.md` e `README.md` (2026-05-13 09:55, próximo commit)
- [ ] Commit consolidado: `main.md`, `state.md`, `memory.md`, `setup.sh`, `setup.bat`, `README.md`
- [ ] Validar `./setup.sh` em ambiente limpo (Alioth)
- [ ] Arquivar (R.7 + R.5)

### Bloqueios ativos

_(nenhum — 2026-05-13 09:20)_

---

## Fatos confirmados

- [2026-05-13 09:00] Não existe `README.md` na raiz do repositório. Fonte: `find /home/alatour/repositories/wynk_scp -maxdepth 3 -iname "README*" -not -path "*/node_modules/*"` retornou só `portal/README.md` e `backoffice/README.md`.
- [2026-05-13 09:05] Stack do projeto: Node 22+, npm workspaces, backend Express 4 + TypeORM 0.3, portal Next.js App Router, backoffice Vite+React. Fonte: `package.json` raiz + `backend/package.json` + `docs/CLAUDE.md`.
- [2026-05-13 09:05] Portas Docker expostas no host: Postgres **5435** (mapeia 5432 do container), Redis **6382** (mapeia 6379). Fonte: `docker-compose.yml` linhas 10 e 22.
- [2026-05-13 09:05] Schema dedicado `scp`. Criado por `backend/scripts/ensure-schema.ts` antes de qualquer migration. Fonte: `backend/package.json` script `prepare:schema` + `db:setup`.
- [2026-05-13 09:05] `.env.example` existe em `backend/` e em `portal/`. Fonte: `find -maxdepth 3 -name ".env.example"`.
- [2026-05-13 09:05] Feature `infra-base` documenta 6 gotchas que entram em Troubleshooting do README. Fonte: `docs/features/infra-base.md` seção "Gotchas" (overrides `@types/express`, `safer-buffer` ausente, Jest hoisting, `ensure-schema` antes de migration, `ts-node` na raiz, `baseUrl` deprecated).
- [2026-05-13 09:08] `main` violando R.2 (active não-vazio após `git pull`): `docs/active/SPEC-20260506-1400-stores-public-api/` está presente em `main` após fast-forward de 33 commits. Fonte: `git checkout main && git pull --ff-only` + `ls docs/active/`. **Não é causado por esta SPEC** — apenas registrado.

## Inferências prováveis

- [2026-05-13 09:08] Alioth provavelmente mergeou a SPEC-1400 em `main` por urgência de entrega da API pública. Validar com: perguntar ao Alioth se ele quer abrir SPEC de "limpar `active/` em main" depois. **Não bloqueia esta SPEC.**

## Dúvidas em aberto

_(nenhuma — ambas resolvidas em 2026-05-13 09:20, ver entrada [MARCO] [decisão] no log)_

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-13 09:00 — [ativação]

Usuário pediu SPEC para README de setup local Linux + Windows. Classifiquei como **nova SPEC** (não conecta com SPEC-1400 em andamento). Apresentei plano (escopo, feature vinculada `infra-base`, branch nova `feature/local-env-readme`); usuário aprovou ("Isso mesmo" + "Pode").

Plano inicial:
- Branch nova a partir de `main` (R.2 — SPEC nova = branch nova; também porque escopo é ortogonal à SPEC-1400)
- Vincular à feature existente `infra-base` (cobre `package.json`, `docker-compose.yml`, `backend/scripts/`)
- Slug `local-env-readme` (3 palavras, kebab-case)
- ID `SPEC-20260513-0910-local-env-readme`
- Escopo: doc + WSL2 no Windows; Windows nativo + macOS fora explicitamente.

Arquivos identificados como relevantes para escrever o README:
- `package.json` (raiz) — scripts e workspaces
- `backend/package.json` — scripts de DB/dev/test
- `docker-compose.yml` — portas e versões
- `backend/.env.example` e `portal/.env.example` — env vars
- `docs/features/infra-base.md` — gotchas e estado atual
- `docs/CLAUDE.md` — referência cruzada

## 2026-05-13 09:08 — [descoberta] `docs/active/` não está vazio em `main`

Ao fazer `git checkout main && git pull --ff-only`, fast-forward de 33 commits trouxe a `SPEC-20260506-1400-stores-public-api/` em `docs/active/` para `main`. Isso viola R.2 ("`docs/active/` em `main` é SEMPRE VAZIO").

Não é causado por esta SPEC (preexistente; alguém fez merge de feature branch com SPEC ainda em `active/`). Apenas registrado aqui para auditoria. Avisei o usuário no chat. **Não bloqueia esta SPEC.**

Decidi seguir: a nova branch `feature/local-env-readme` foi criada a partir do `main` atual e portanto carrega a SPEC-1400 dentro de `active/`. Não vou mexer nela (R.8 isolamento entre SPECs).

## 2026-05-13 09:10 — [MARCO] [decisão] Escopo "doc + WSL2 no Windows", sem cross-platform

Considerei 3 alternativas para "subir o ambiente local tanto no Windows como no Linux":

1. **Doc-only com WSL2 no Windows** (escolhida): README puro; Windows recebe instruções de WSL2 e depois reusa o caminho Linux dentro do WSL.
2. **Cross-platform real**: reescrever `docker-compose.yml`/scripts para PowerShell/Bash, line-endings, paths Windows nativos.
3. **Linux-only com nota "use WSL2"**: README só Linux, uma linha mencionando WSL2.

Escolhi (1) porque:
- (2) é uma SPEC de infra inteira; bloqueia onboarding até estabilizar a stack de SPEC-1400.
- (3) é insuficiente — o usuário pediu explicitamente "Windows" passo-a-passo.
- (1) entrega valor agora e deixa porta aberta para (2) se virar dor.

Trade-off: usuários Windows pagam o custo de instalar WSL2 (alguns minutos uma vez), mas o caminho de setup converge com Linux após isso.

Confirmação literal do usuário em 2026-05-13 09:05: *"Isso mesmo"*.

## 2026-05-13 09:10 — [nota] Estrutura da SPEC criada

Pasta `docs/active/SPEC-20260513-0910-local-env-readme/` criada com `main.md`, `state.md`, `memory.md`. Próximo: atualizar `docs/features/infra-base.md` adicionando a SPEC em "Em execução" (R.11). Depois: apresentar `main.md` ao Alioth para validação humana antes de commitar (mitigação R3).

## 2026-05-13 09:20 — [MARCO] [decisão] `main.md` validado pelo Alioth + duas dúvidas em aberto resolvidas

Alioth respondeu: *"Isso mesmo, manda bala!"* — validação humana do contrato (mitigação R3). As duas dúvidas registradas em "Dúvidas em aberto" foram delegadas à IA. Decididas:

**1. macOS no README:** menção curta de 1 linha na seção "Setup" ("não suportado oficialmente ainda — devs nessa plataforma podem abrir SPEC futura ou usar WSL2 indiretamente via Docker Desktop"). Rejeitado: seção dedicada. Motivo: não há dev macOS no projeto declarado; seção dedicada atrai escopo (precisaria validar caminho real). Menção curta sinaliza "estamos cientes, não suportado por enquanto".

**2. Docker no Windows:** **Docker Desktop com integração WSL2** (caminho recomendado no README). Rejeitado: Docker via `apt` dentro do Ubuntu do WSL. Motivo:
- Docker Desktop com integração WSL2 é o caminho oficial documentado pela Docker.
- GUI familiar pra devs Windows + integração transparente (basta `docker compose up` dentro do Ubuntu do WSL).
- `apt` no WSL exige systemd habilitado no WSL (`/etc/wsl.conf` com `[boot] systemd=true`), o que adiciona um passo manual e cobre uma fronteira frágil.
- Trade-off: Docker Desktop tem licença comercial pra empresas grandes (>250 funcionários OU >$10M receita). README menciona isso de forma neutra; quem precisar de alternativa free pode abrir SPEC futura.

Commit: pendente (esta entrada é registrada antes do commit; o commit virá em seguida e referenciará esta SPEC).

## 2026-05-13 09:25 — [nota] Escrita do README iniciada

Próximo arquivo a criar: `README.md` na raiz. Estrutura conforme `main.md`. Conteúdo refletindo literalmente: `package.json` raiz, `backend/package.json`, `docker-compose.yml`, `backend/.env.example`, `portal/.env.example`, e os 6 gotchas de `docs/features/infra-base.md`.

## 2026-05-13 09:32 — [descoberta] Branch remota `origin/feature/local-env-readme` já existe

Ao tentar `git status` antes do primeiro commit, descobri que o `git checkout -b feature/local-env-readme` criou tracking automático para `origin/feature/local-env-readme` (já existia) em vez de partir de `main`. Meu HEAD aterrissou em commit `98c43aa` (autor Alioth Latour, 26 min atrás na timeline da sessão) que **já contém** a pasta `docs/active/SPEC-20260513-0910-local-env-readme/` com `main.md`, `state.md`, `memory.md` e a linha em `docs/features/infra-base.md`.

Confronto: comparei meus `Write` (que pareceram bem-sucedidos) com o commit. Resultado:

- `main.md`: working tree **idêntico** ao commitado (`git diff HEAD` voltou vazio). Aparentemente uma sessão anterior do Claude (com mesmo contexto) gerou byte-a-byte o mesmo conteúdo.
- `state.md` e `memory.md`: meu working tree tem adições incrementais (TL;DR atualizado, dúvidas resolvidas, log com entradas novas) sobre a versão commitada. Não destrutivo — só evolução.
- `features/infra-base.md`: working tree **idêntico** ao commit (linha de "Em execução" já presente).
- `.gitignore`: o commit `98c43aa` adicionou `backend/node_modules`; mantido.

**Decisão:** prosseguir. As mudanças em `state.md`/`memory.md` representam o avanço da sessão atual (validação humana + resolução das 2 dúvidas em aberto). Não há trabalho do Alioth a preservar — o commit anterior também é Claude-generated, só foi assumido com a identidade do dev.

## 2026-05-13 09:40 — [MARCO] [conclusão] `README.md` na raiz escrito

Entregue: `README.md` (~290 linhas) com 9 seções (O que é / Pré-requisitos / Setup Linux / Setup Windows via WSL2 / Primeira execução / Comandos do dia-a-dia / Estrutura do monorepo / Troubleshooting / Saiba mais). Pré-requisitos em tabela única com 5 colunas. Comandos em fences ` ```bash `. Troubleshooting com 8 entradas no formato *Sintoma → Causa → Fix* (cobrindo os 6 gotchas de `features/infra-base.md` + porta Docker em uso + WSL clonado em `/mnt/c/`).

**Decisões pontuais durante a escrita:**
- Tabela única de pré-requisitos (não subseções) → escaneável em uma olhada.
- Setup Linux como caminho dourado; Setup Windows desemboca no Linux dentro do WSL.
- Adicionado item de troubleshooting **#8** (clone em `/mnt/c/` no WSL) — não estava na lista original de gotchas porque é específico do caminho Windows, mas é frequente o suficiente pra preventiva.
- Adicionado item **#7** (conflito de porta Docker) — gotcha implícito pelo design das portas 5435/6382, vale tornar explícito.
- macOS mencionado em 1 parágrafo após a tabela de pré-requisitos, sem seção dedicada (decisão de 09:20).
- Licença comercial do Docker Desktop mencionada de forma neutra na seção de Windows (transparência sobre a escolha).

Commit pendente — virá no próximo step desta sessão.

## 2026-05-13 09:50 — [MARCO] [decisão] Expansão de escopo: `setup.sh` + `setup.bat` adicionados

Usuário pediu (literal): *"Espera, podemos fazer um .sh para linix e um .bat para o windows? Assim o pessoal apenas roda ele"*. Apresentei 3 questões antes de executar: (a) limitação técnica do `.bat` (setup real roda no WSL), (b) escopo declarado "FORA" do `main.md` mencionava "reescrita de scripts/compose para cross-platform" — adição de wrappers novos não é reescrita mas dobra escopo, (c) scripts não vão instalar pré-requisitos.

Recomendei: `setup.sh` completo (idempotente, automatiza passos 2-9 do README) + `setup.bat` magrinho (verifica WSL2 + Docker Desktop, dispara `setup.sh` dentro do WSL via `wsl -e bash -c "cd $(wslpath -u '%CD%') && bash ./setup.sh %*"`), com expansão da SPEC atual em vez de abrir SPEC nova. Usuário respondeu: *"Sim, topo"*.

Decisões pontuais durante a expansão:
- **Não instalar pré-requisitos via script** — verifica e falha com instrução clara. Motivo: `sudo`, NodeSource keys, distros divergentes (apt/dnf/pacman/brew) tornam isso frágil. Trade-off aceito.
- **Idempotência em `.env`**: copia `.env.example` → `.env` só se não existir. Não sobrescreve customização do dev.
- **Espera de healthy** com timeout de 60s: inspeciona `docker inspect --format '{{.State.Health.Status}}' scp_postgres` (e redis), porque `docker compose ps --format` varia entre versões.
- **Cores ANSI condicionais a TTY** (`[ -t 1 ]`) — output limpo quando piped/log.
- **`setup.bat` avisa quando `cwd` está em filesystem do Windows** (regex `[A-Za-z]:`) — reforça gotcha #8 do README; usuário pode prosseguir com `pause` ou cancelar com Ctrl+C.
- **`setup.bat` traduz path via `wslpath -u`** — paths com espaço aceitos pois passamos pelo bash com aspas.
- **Cláusula no FORA do `main.md` ajustada** — de "Reescrita de scripts/compose para cross-platform" para "Reescrita de `docker-compose.yml` ou de scripts em `backend/scripts/`", deixando claro que wrappers NOVOS na raiz são permitidos. Não é mudança de intenção; é precisão.

Arquivos tocados nesta expansão: `main.md` (Resumo, Escopo DENTRO/FORA, Implementação, Critério de aceite), `setup.sh` (novo, `0755`, ~165 linhas, `bash -n` OK), `setup.bat` (novo, ~75 linhas), `README.md` (seção "Setup rápido (atalho)" entre Pré-requisitos e Setup Linux + entrada na Estrutura do monorepo + atualização do Sumário com novo item).

Commit pendente.

## 2026-05-13 10:00 — [tentativa] Primeira execução do `./setup.sh --seed` falhou no check de Docker Compose

Dev rodou `./setup.sh --seed` e o script abortou em "Docker Compose v2 não encontrado". Diagnóstico via `docker --version`, `docker compose version`, `docker-compose --version`:
- Docker 29.1.3 (do pacote `docker.io` do Ubuntu universe, jammy-updates/jammy-security)
- `docker compose` (v2 plugin): **NÃO instalado** — `docker: unknown command: docker compose`
- `docker-compose` (v1, Python standalone): **instalado** v1.29.2 (com warning de `CryptographyDeprecationWarning`)

`/etc/apt/sources.list.d/` sem entrada da Docker — o engine veio do repo do Ubuntu, não do `download.docker.com`. Por isso `apt install docker-compose-plugin` retornou "Unable to locate package".

Sugeri caminho de instalar plugin v2 via binário do GitHub (`mkdir -p ~/.docker/cli-plugins` + `curl -SL .../releases/latest/...`), dev tentou (provavelmente — me passou só o output do `./setup.sh --seed` que continuou falhando).

## 2026-05-13 10:20 — [descoberta] `wynk_ecommerce/backend/run-backend-locally.sh` usa `docker-compose` v1

Dev pediu: *"Da uma olhada no wynk_ecommerce/backend tem um script lá acho que é run-backend.sh"*. Li `/home/alatour/repositories/wynk_ecommerce/backend/run-backend-locally.sh` (186 linhas). Confirmação: o script do e-commerce usa **`docker-compose`** (com hyphen, v1) em todas as chamadas (linhas 77, 78, 85):
```bash
docker-compose down postgres
docker-compose rm -f postgres
docker-compose up -d redis postgres localstack
```

Conclusão: o ambiente do dev funciona perfeitamente com v1 — todo o estilo dele de operação é v1. Forçar v2 no SCP é criar atrito artificial.

## 2026-05-13 10:25 — [MARCO] [decisão] `setup.sh` aceita docker-compose v1 e v2

Proposto ao dev: adaptar `setup.sh` pra detectar `docker compose` v2 ou `docker-compose` v1 e usar o que tiver, com warning quando cair no v1. Dev respondeu: *"Bora de v1, é mais facil"*.

Implementação:
- Variável `COMPOSE` definida via detecção em cascata: `docker compose version` → `COMPOSE="docker compose"`; senão `docker-compose --version` → `COMPOSE="docker-compose"`; senão erro com 3 opções de instalação (plugin v2 via apt, binário do GitHub, v1 legacy).
- `compose_kind` exibido no `[ok]` do prereq check (e.g. "Compose v2 (plugin)" ou "Compose v1 (legacy, EOL desde jul/2023)").
- Warning único após o check quando `COMPOSE="docker-compose"` (não em cada chamada — chato pra log).
- Todas chamadas `docker compose ...` viraram `${COMPOSE} ...` (sem aspas — em v2 o split por espaço é necessário pra virar 2 tokens).
- Mensagem de erro do healthcheck timeout passou de `'docker compose ps'` → `'${COMPOSE} ps'`.
- Mensagem final passou de `docker compose ps` → `${COMPOSE} ps`.

README atualizado:
- Linha do Docker Compose nos Pré-requisitos: passa a citar v2 (preferido) E v1 (fallback EOL).
- Troubleshooting **#9** novo: "`setup.sh` reclama 'Docker Compose não encontrado'" — Causa (Ubuntu `docker.io` + sem `docker-compose-plugin` no universe Jammy) + Fix A (plugin v2 via GitHub binary, recomendado) + Fix B (`apt install docker-compose` v1) + Fix C (trocar pro repo oficial `docker-ce`).

`main.md` não precisou ajuste — a especificação dos scripts em "Implementação" não congelou "exigir v2"; era detalhe de implementação ajustável.

Commit pendente.

## 2026-05-13 11:00 — [MARCO] [decisão] 2ª expansão de escopo: `run.sh` + `run.bat`

Dev questionou: *"Espera, então o setup não roda nada, apenas o configura?"* — confirmei (setup configura, não inicia dev server porque é processo foreground/watch e temos 3 apps). Dev primeiro começou a propor `--backend --backend e --backend` (flags por app, parou no meio) e mudou pra ideia mais clara: *"Espera, ok, vamos manter um setup e podemos colocar um run.sh que tal?"*.

Apresentei interface e trade-offs: default backend; `portal`/`backoffice` individual; `all` em paralelo com logs prefixados (misturado mas explícito); Ctrl+C centralizado. Dev confirmou: *"Sim, pode ser assim, não importa misturar os logs"*.

Implementação:
- `run.sh` (`0755`, ~80 linhas, `bash -n` OK): variável `target` (default `backend`); case com `backend|portal|backoffice` chamando `run_one` (que faz `exec npm run dev -w <app>`); `all` chama `run_all` que faz 3x `npm run dev -w <app> 2>&1 | sed -u "s/^/[<app>] /" &`, guarda PIDs em array, instala trap SIGINT/SIGTERM com cleanup (mata todos os PIDs + wait), e finaliza com `wait`. `sed -u` (unbuffered) garante prefixo em tempo real. `exec` no caso 1-app substitui o shell pelo npm (sinais propagam diretamente).
- `run.bat`: análogo ao `setup.bat`, mais magro (sem warning de `C:\`). Verifica WSL2 + Docker, dispara `wsl -e bash -c "cd $(wslpath -u '%CD%') && bash ./run.sh %*"`.
- `setup.sh` e `setup.bat`: resumo final agora aponta `./run.sh` em vez de listar `npm run dev` diretamente.

README atualizado:
- "Primeira execução" ganhou subseção **"Atalho: `./run.sh`"** antes do bloco manual com 3 terminais.
- "Setup rápido (atalho)" ganhou linha apontando pra "Primeira execução" como próximo passo.
- "Estrutura do monorepo" lista `run.sh` e `run.bat`.

`main.md` atualizado: Origem (registra 2ª expansão), Resumo (4 scripts), Escopo DENTRO (`run.sh`/`run.bat` + subseção do README), Implementação (especificação completa dos 4 scripts), Critério de aceite (checkboxes novos pra `run.sh`/`run.bat`/README e ajuste da validação humana).

Commit pendente.
