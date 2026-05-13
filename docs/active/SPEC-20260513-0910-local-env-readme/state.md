# State — SPEC-20260513-0910

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 09:40
**Onde tô:** `README.md` escrito na raiz (~290 linhas, 9 seções, 8 entradas de troubleshooting). Branch local `feature/local-env-readme` em commit `98c43aa` (criado anteriormente por sessão paralela com a mesma estrutura de SPEC). Working tree tem: `README.md` novo + `state.md`/`memory.md` modificados. **Falta commitar**.
**Próximo passo:** Commit único — README.md + state/memory atualizados, com mensagem `docs(infra-base): README.md de setup local na raiz (SPEC-20260513-0910)`. Depois: pedir validação humana ao Alioth (executar passo-a-passo em ambiente limpo).
**Última decisão:** Estilo do README — *Sintoma → Causa → Fix* no troubleshooting, comandos em fences ` ```bash `, pré-requisitos em tabela única com 5 colunas (ferramenta / o que é / pra que serve / versão / como instalar). Sem emojis. Português. Confirmado em 2026-05-13 09:35.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** `README.md` recém-criado + `main.md` desta SPEC + `docs/features/infra-base.md`.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição                                                      | Status       | Atualizado       | Commit |
|---|----------------------------------------------------------------|--------------|------------------|--------|
| 1 | Criar estrutura da SPEC (main + state + memory) + atualizar feature `infra-base` (linha "Em execução") | concluído    | 2026-05-13 09:20 | —      |
| 2 | Validação humana do `main.md` por Alioth                       | concluído    | 2026-05-13 09:20 | —      |
| 3 | Escrever `README.md` na raiz                                   | concluído    | 2026-05-13 09:40 | (pendente — virá no commit imediato) |
| 4 | Validação humana — Alioth executa o passo-a-passo do README em ambiente limpo (Linux + WSL2) | pendente     | 2026-05-13 09:40 | —      |
| 5 | Conclusão: marcar critério de aceite, atualizar `features/infra-base.md` (move para "Concluídas" + atualiza "Estado atual"), mover SPEC para `archive/` | pendente     | 2026-05-13 09:40 | —      |

### Próximos passos

- [x] Alioth valida `main.md` (2026-05-13 09:20 — *"Isso mesmo, manda bala!"*)
- [x] Estrutura inicial da SPEC + linha em `features/infra-base.md` (já no commit `98c43aa` por sessão anterior)
- [x] Escrever `README.md` na raiz (2026-05-13 09:40)
- [ ] Commit do `README.md` + state/memory atualizados
- [ ] Validar passo-a-passo em ambiente limpo (Alioth)
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
