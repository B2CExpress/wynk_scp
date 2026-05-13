# State — SPEC-20260513-0910

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 09:10
**Onde tô:** SPEC recém-criada e ativada. `main.md` pronto, aguardando validação humana do Alioth antes de qualquer commit/escrita de README.
**Próximo passo:** Alioth lê `main.md`, ajusta escopo se necessário, e dá luz verde. Depois: escrever `README.md` na raiz refletindo literalmente `package.json` raiz, `backend/package.json`, `docker-compose.yml`, `.env.example`s e gotchas de `features/infra-base.md`.
**Última decisão:** Escopo "doc + WSL2 no Windows" — Windows nativo fica fora explicitamente para evitar trabalho de cross-platform em scripts. Confirmado por usuário em 2026-05-13 09:05 ("Isso mesmo").
**Bloqueio atual:** Aguardando validação humana do `main.md` (mitigação R3 — `main.md` é o contrato humano-validado).
**Se retomar, ler:** apenas o `main.md` desta SPEC + `docs/features/infra-base.md` (seção Gotchas) + `package.json` raiz + `backend/package.json` + `docker-compose.yml`. **Não** ler outras SPECs.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição                                                      | Status       | Atualizado       | Commit |
|---|----------------------------------------------------------------|--------------|------------------|--------|
| 1 | Criar estrutura da SPEC (main + state + memory) + atualizar feature `infra-base` (linha "Em execução") | em progresso | 2026-05-13 09:10 | —      |
| 2 | Validação humana do `main.md` por Alioth                       | pendente     | 2026-05-13 09:10 | —      |
| 3 | Escrever `README.md` na raiz                                   | pendente     | 2026-05-13 09:10 | —      |
| 4 | Validação humana — Alioth executa o passo-a-passo do README em ambiente limpo (Linux + WSL2) | pendente     | 2026-05-13 09:10 | —      |
| 5 | Conclusão: marcar critério de aceite, atualizar `features/infra-base.md` (move para "Concluídas" + atualiza "Estado atual"), mover SPEC para `archive/` | pendente     | 2026-05-13 09:10 | —      |

### Próximos passos

- [ ] Alioth valida `main.md` (escopo, critério de aceite, lista de gotchas, idioma PT-BR, sem emoji)
- [ ] Commit da estrutura inicial da SPEC (após validação)
- [ ] Escrever `README.md`
- [ ] Validar passo-a-passo em ambiente limpo
- [ ] Arquivar (R.7 + R.5)

### Bloqueios ativos

- [2026-05-13 09:10] **Validação humana pendente do `main.md`** — não escrever `README.md` antes do Alioth conferir o contrato.

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

- [2026-05-13 09:10] O Alioth quer **uma seção dedicada de macOS** explicitando "fora de escopo, será SPEC futura"? Ou basta menção curta em "Setup"? Resolver com: pergunta direta na validação do `main.md`.
- [2026-05-13 09:10] No bloco de Setup Windows, citar **Docker Desktop com integração WSL2** ou **Docker dentro do Ubuntu via `apt`** como caminho recomendado? O primeiro é mais comum em devs Windows, o segundo é mais idêntico ao caminho Linux. Resolver com: pergunta na validação.

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
