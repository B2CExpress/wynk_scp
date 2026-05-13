# State — SPEC-20260513-0910

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 19:45 (sessão #1, encerramento)
**Onde tô:** **SPEC concluída e arquivada.** Validação humana e-2-e OK (portal renderizando em `http://localhost:3000`). Todos os critérios de aceite marcados. Features atualizadas conforme R.7 (`infra-base` ganhou SPEC nas Concluídas + "Onboarding e atalhos de dev" no Estado atual + 2 gotchas novos; `theme-system` ganhou 1 gotcha do `notFound() in root layout`). Pasta movida pra `archive/`.
**Próximo passo:** _(nenhum — SPEC concluída)_
**Última decisão:** Arquivar SPEC. 2026-05-13 19:45. Pendências não-bloqueantes registradas: bug do `notFound()` (gotcha em `theme-system`, fix em SPEC futura), `setup.bat`/`run.bat` não validados em Windows real (SPEC futura).
**Bloqueio atual:** _(nenhum — concluída)_
**Se retomar, ler:** _(SPEC arquivada; se algo da entrega quebrar, abrir SPEC nova de fix referenciando esta)_

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
| 6 | 2ª expansão de escopo: `run.sh` + `run.bat` (configurar e rodar = 2 scripts) | concluído | 2026-05-13 11:15 | `bbeff4f` |
| 7 | Cadastrar tenant `localhost` em `seeds/tenants.json` (DX local) | concluído | 2026-05-13 19:00 | `dfc32e4` |
| 8 | Flag `--seed` opt-in no `run.sh` + fix das portas no README (3001/3000) | concluído | 2026-05-13 19:30 | `c38d60a` |
| 9 | Validação humana — Alioth rodou `./setup.sh --seed` + `./run.sh backend` + portal manual; renderizou em `http://localhost:3000` | concluído | 2026-05-13 19:15 | — (sem commit de código; validação humana) |
| 10 | Conclusão: critério de aceite marcado, `features/infra-base.md` atualizada (R.7), `features/theme-system.md` recebeu 1 gotcha, SPEC movida pra `archive/` | concluído | 2026-05-13 19:45 | (próximo commit) |

### Próximos passos

- [x] Alioth valida `main.md` (2026-05-13 09:20 — *"Isso mesmo, manda bala!"*)
- [x] Estrutura inicial da SPEC + linha em `features/infra-base.md` (commit `98c43aa`)
- [x] Escrever `README.md` na raiz (commit `1cff2da`, 2026-05-13 09:40)
- [x] Expansão de escopo: `setup.sh` + `setup.bat` + atualizar `main.md` e `README.md` (commit `451a92e`)
- [x] Fix v1 fallback no `setup.sh` (commit `aa20692`)
- [x] Expansão `run.sh`/`run.bat` (commit `bbeff4f`)
- [x] Cadastro `localhost` no seed (commit `dfc32e4`)
- [x] Flag `--seed` + fix de portas (commit `c38d60a`)
- [x] Validação humana e-2-e (2026-05-13 19:15)
- [x] Arquivamento (R.7 + R.5) — este commit

### Bloqueios ativos

_(nenhum — SPEC concluída em 2026-05-13 19:45)_

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

## 2026-05-13 18:50 — [descoberta] Portal sobe mas 404 em `/tenant/resolve` + bug `notFound() in root layout`

Dev rodou `./setup.sh --seed` e `./run.sh backend` sem reportar erro de setup — bom sinal pra validação humana. Subiu também `npm run dev -w portal` (manualmente, não via `./run.sh portal`) e acessou `http://localhost:3000`.

Comportamento observado:
1. Backend respondeu `GET /tenant/resolve` com **404** (2x, talvez de favicon retry + page request). Esperado: `seeds/tenants.json` só tinha `shopping-x.local`; `localhost` não estava cadastrado. Backend tem `app.set('trust proxy', true)` + middleware usa `req.hostname` (sem porta), então procurou `host = 'localhost'` no banco → não achou.
2. Portal (`portal/src/app/layout.tsx:37`) chamou `notFound()` quando o tenant retornou null. Next App Router disparou: `Error: notFound() is not allowed to use in root layout`. **Bug real do código existente**, fora do escopo desta SPEC (é da feature `theme-system` ou portal-side da `tenant-resolution`).

## 2026-05-13 19:00 — [decisão] Adicionar tenant `localhost` ao seed (DX em dev)

Dev pediu: *"Enfia ele no seed"*. Em vez do workaround com `/etc/hosts` (`127.0.0.1 shopping-x.local`), cadastrar um tenant pra `host=localhost` diretamente — caminho mais limpo pra DX local.

Editei `seeds/tenants.json` adicionando entrada:
```json
{
  "slug": "local-dev",
  "host": "localhost",
  "flavorSlug": "shopping-x",
  "name": "Localhost (dev)"
}
```

Decisões pontuais:
- **Slug `local-dev`** (não `localhost`) — slug é identificador único do tenant; usar literal `localhost` confunde com o `host`. `local-dev` é nome humano-legível pro tenant de desenvolvimento local.
- **`flavorSlug: shopping-x`** — reusa o flavor já existente pra dev ver UI com cores reais (roxo/amarelo) em vez do `_default` (cinza/branco). Não cria flavor novo.
- **Não é mudança de feature `tenant-resolution`** — é dado de seed (`seeds/tenants.json`) que faz parte da feature `infra-base` (arquivo listado em `features/infra-base.md` "Arquivos principais"). Cabe nesta SPEC.

`seed.ts` é idempotente (upsert por `slug`): re-rodar `npm run seed -w backend` cria o novo tenant sem mexer no `shopping-x`. Cache Redis (`tenant:resolve:localhost`) não tem entrada pra invalidar (`null` não é cacheado pelo `TenantResolverService.resolveByHost`).

**Bug do `notFound() in root layout` permanece** — só não dispara enquanto o tenant resolve. Será uma SPEC futura da feature `theme-system` (ou tenant-resolution no portal-side). Registrado pra o usuário decidir.

Commit pendente até dev confirmar que portal renderiza em `http://localhost:3000`.

## 2026-05-13 19:15 — [MARCO] [unblock] Portal renderiza em `http://localhost:3000`

Dev confirmou: *"Agora foi, acho que era o seed, eu tinha rodado ele somente no momento do setup"*. Pipeline validado end-to-end:

1. `./setup.sh --seed` rodou sem erro (com `docker-compose` v1 detectado, warn de EOL)
2. `./run.sh backend` subiu backend em `:3001` (config default)
3. `npm run dev -w portal` (rodado manualmente em outro terminal, não via `./run.sh portal`) subiu portal em `:3000`
4. Browser `http://localhost:3000` → portal → `X-Forwarded-Host: localhost` → backend resolve via banco → portal renderiza homepage com flavor `shopping-x` (cores roxo/amarelo)

Banco confirmado:
```
 tenant_slug |   tenant_host
-------------+------------------
 shopping-x  | shopping-x.local
 local-dev   | localhost
```

Lição: o seed é separado do setup nessa SPEC. Quando alterar `seeds/tenants.json`, **rodar `npm run seed -w backend` explicitamente** (ou re-executar `./setup.sh --seed`). Eu deveria ter avisado isso explicitamente quando editei o JSON; em vez disso falei "rode npm run seed -w backend" mas sem destacar que era passo obrigatório.

### Pendências não-bloqueantes registradas

- **Bug `notFound() in root layout`** em `portal/src/app/layout.tsx:37` — fora desta SPEC; sugerir registrar como gotcha em `docs/features/theme-system.md` ou abrir SPEC nova de fix.
- **Portas invertidas no README** — eu escrevi backend=3000 e portal=3001; correto é backend=**3001** e portal=**3000**. Faço `fix(docs): correção das portas no README` rápido.
- **`setup.bat`/`run.bat`** não validados — sem dev Windows; permanecem como "validados por inspeção, não por execução".

Próximos passos pra arquivar a SPEC:
1. (sugerido) Commit `fix(docs): correção das portas no README + setup.sh`
2. (sugerido) Registrar bug do `notFound()` em `docs/features/theme-system.md` como gotcha
3. Marcar critério de aceite em `main.md`
4. Atualizar `features/infra-base.md` (R.7): mover pra "Concluídas", atualizar "Estado atual"
5. Mover pasta `active/` → `archive/`

## 2026-05-13 19:30 — [MARCO] [decisão] `run.sh` ganha flag `--seed` (opt-in, só pra backend/all)

Dev pediu: *"Acho que podemos tambem rodar o seed no run.sh... o que achas?"*. Apresentei 3 opções (sempre rodar / opt-in via flag / auto-detect via mtime do JSON) com trade-offs:
- **Sempre rodar**: zero cognitive, mas +3-5s a cada start (~2-3min/dia em dev ativo), acoplamento maior (seed quebrar bloqueia backend).
- **Opt-in via flag `--seed`**: zero custo no caso comum, explícito, copyable.
- **Auto-detect via mtime**: melhor dos dois mundos, mas overengineering pra ganho marginal por enquanto.

Dev respondeu uma observação importante: *"Mass tem que rodar apenas se repassamos o backend"* — `--seed` só faz sentido quando o target inclui backend (`backend` ou `all`); `--seed portal` não tem efeito real (o portal só consulta o backend que JÁ está rodando em outro terminal). Considerei warn-and-ignore vs erro, escolhi erro com mensagem explicativa pra evitar confusão de "rodei --seed e não fez nada".

Depois dev questionou *"O que acontece se rodamos sempre o seed?"*, apresentei custos concretos, e ele fechou: *"overengineering por agora"* — confirmando opt-in com flag.

Implementação:
- `run.sh` ganhou parser de argumentos em loop (`for arg in "$@"; do case "${arg}" in ... esac done`) que aceita ordem livre entre target e `--seed`. Sentinela `target=""` + default no fim (`target="${target:-backend}"`).
- Múltiplos targets passados (`./run.sh backend portal`) viram erro com mensagem.
- Argumento desconhecido vira erro.
- `--seed` antes do case de execução: se `do_seed=true`, switch por target — `backend|all` roda `npm run seed -w backend` em foreground; outros viram erro com instrução clara.
- `usage()` atualizado pra documentar `--seed`.

`README.md`:
- Seção "Primeira execução > Atalho: `./run.sh`" agora documenta `--seed backend` / `--seed all` com nota sobre rejeição.
- **Portas corrigidas** em todo o README: backend `:3001` (PORT default em `.env.example`), portal `:3000` (Next default). Bug que eu introduzi em `1cff2da` (inverti os dois).
- Bloco manual de `npm run dev -w <app>` também corrigido pra apontar as portas certas.
- "Como confirmar que tudo subiu" — `curl :3001/health` e portal em `:3000`.
- Troubleshooting entrada **#9 nova**: "Editei `seeds/tenants.json` mas o backend continua retornando 404 pro novo tenant" → causa (seed não roda sozinho) + Fix A (`npm run seed -w backend`) + Fix B (`./run.sh --seed backend`). Antiga #9 ("Compose não encontrado") renumerada pra **#10**.

`setup.sh`:
- Mensagem final pós-setup atualizada: portas corretas (backend `:3001`, portal `:3000`) + linha nova mencionando `./run.sh --seed backend` como atalho ao editar `seeds/tenants.json`.

`main.md`:
- Especificação de `run.sh` atualizada documentando `--seed`, parser de argumentos, restrição a backend/all.
- Critério de aceite ganhou 3 novos itens (`run.sh --seed`, `seeds/tenants.json` com `localhost`, fix de portas).

Commit pendente único consolidando: `seeds/tenants.json`, `run.sh`, `README.md`, `setup.sh`, `main.md`, `state.md`, `memory.md`.

## 2026-05-13 19:45 — [MARCO] [conclusão] SPEC entregue e arquivada

**Entrega final:**
- `README.md` na raiz (~300 linhas, 10 seções, 10 entradas de troubleshooting) — porta de entrada de onboarding documentando Linux/WSL2.
- 4 scripts de atalho na raiz: `setup.sh`/`setup.bat` (configuram) + `run.sh`/`run.bat` (rodam dev servers).
- `run.sh` aceita `backend|portal|backoffice|all` + flag opt-in `--seed` (restrita a `backend`/`all`).
- `seeds/tenants.json` ganhou tenant `local-dev`/`localhost` pra DX sem `/etc/hosts`.
- `setup.sh` aceita Compose v2 (preferido) ou v1 (fallback EOL) via cascade detection.

**Validação humana confirmada em 2026-05-13 19:15:** dev rodou `./setup.sh --seed` → `./run.sh backend` → `npm run dev -w portal`; portal renderizou em `http://localhost:3000` com flavor `shopping-x`. Citação literal: *"Agora foi, acho que era o seed, eu tinha rodado ele somente no momento do setup"*.

**Critério de aceite:** todos os 21+ checkboxes em `main.md` marcados (alguns com commit hash, validação humana sem hash de código, ou marcados no commit de arquivamento).

**Features tocadas (R.7):**
- `infra-base` (vinculada na criação): SPEC movida de "Em execução" → "Concluídas" (commit final = este); seção "Onboarding e atalhos de dev" adicionada ao "Estado atual" descrevendo os 4 scripts e os tenants do seed; 2 gotchas novos ("`docker.io` Ubuntu universe sem plugin v2", "Editar `seeds/tenants.json` não dispara seed").
- `theme-system` (não-vinculada mas tocada): 1 gotcha novo registrado ("`notFound()` em `portal/src/app/layout.tsx:37` viola contrato do Next App Router"). Fix completo é escopo de SPEC futura.

**Commits da SPEC:**
- `98c43aa` — estrutura inicial da SPEC (criada por sessão Claude paralela)
- `1cff2da` — `README.md` na raiz (~290 linhas, 9 seções)
- `451a92e` — `setup.sh`/`setup.bat` + README seção "Setup rápido"
- `aa20692` — `setup.sh` aceita docker-compose v1 (fallback)
- `bbeff4f` — `run.sh`/`run.bat` + README "Primeira execução"
- `dfc32e4` — cadastro `local-dev`/`localhost` em `seeds/tenants.json`
- `c38d60a` — `run.sh --seed` opt-in + fix de portas 3001/3000 + troubleshooting #9
- (este commit) — arquivamento + R.7 features + theme-system gotcha

**Pendências não-bloqueantes** (não desta SPEC, registradas como gotchas pra SPEC futura):
1. Bug `notFound() in root layout` em `portal/src/app/layout.tsx:37` — gotcha em `theme-system.md`. Fix em SPEC futura (mover check pra `page.tsx` ou usar fallback `_default`).
2. `setup.bat`/`run.bat` não validados em Windows real — sem dev nessa plataforma. SPEC futura quando entrar dev Windows.

**Total da SPEC:** 1 sessão (~11h elapsed, 8 commits). Escopo expandiu 2x durante execução (de "só doc" pra "doc + setup.sh" pra "doc + setup + run separados"), motivado por pedidos do dev. Validação humana real pegou 4 problemas que escapavam de inspeção (Compose v1/v2, host `localhost` ausente do seed, seed não roda sozinho, portas invertidas no README) — efeito direto da regra de não pular validação humana.

_(SPEC arquivada — sem mais entradas neste log)_
