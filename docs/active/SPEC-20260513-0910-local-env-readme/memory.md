# Memory — SPEC-20260513-0910

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-13 09:10

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-13 11:15 (sessão #1)
**Onde tô:** **2ª expansão de escopo** — dividir setup (configura) e run (sobe dev servers). `run.sh` aceita `backend` (default), `portal`, `backoffice`, `all`. Modo `all` roda os 3 em paralelo com prefixo no log e Ctrl+C centralizado. `run.bat` espelha `setup.bat`. Working tree pendente: setup.sh (mensagem final), setup.bat (mensagem final), run.sh (novo), run.bat (novo), README.md (seção "Primeira execução" + Estrutura), main.md (Origem/Resumo/Escopo/Implementação/Critério), state.md, memory.md.
**Próximo passo:** Commit `feat(setup): run.sh e run.bat como atalho para subir dev servers (SPEC-20260513-0910)`. Dev valida com `./setup.sh --seed` (já ajustado pra v1) e depois `./run.sh` ou `./run.sh all`.
**Última decisão:** Dividir em 2 scripts: `setup.sh` configura, `run.sh` roda. 2026-05-13 11:00.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** `run.sh` (especialmente `run_all` com trap+sed) + `run.bat` + seção "Primeira execução" do README + `main.md` desta SPEC.

---

## Contexto ativo

### O que está sendo feito AGORA

2ª expansão de escopo: configurar e rodar agora são scripts separados. `setup.sh`/`setup.bat` cuidam só de configuração; `run.sh`/`run.bat` sobem dev servers. `run.sh` aceita `backend` (default), `portal`, `backoffice`, `all` (3 em paralelo com prefixo via `sed -u` e Ctrl+C central via trap). `main.md` registra a expansão (Origem, Resumo, Escopo DENTRO, Implementação, Critério de aceite). README atualizado em "Primeira execução" (subseção "Atalho: `./run.sh`" antes do bloco manual) e "Estrutura do monorepo". `setup.sh`/`setup.bat` ajustados no resumo final pra apontar `./run.sh`. Pendente: commit + validação humana com `./setup.sh --seed` (já ajustado pra v1) e depois `./run.sh`.

### Hipóteses em jogo

- **Caminho dourado Linux = Ubuntu/Debian** (status: **confirmada** — coerente com WSL2 default + base que devs costumam usar). 2026-05-13 09:20.
- **Docker Desktop com integração WSL2 é o recomendado para Windows** (status: **confirmada** — decisão registrada no log do state.md em 2026-05-13 09:20). Alternativa `apt` no WSL descartada por exigir systemd + fragilidade.

### Decisões recentes que importam pra continuar

- [2026-05-13 11:00] **Separar setup e run em 2 scripts**: `setup.sh`/`setup.bat` só configuram (deps, .env, docker, schema, migrations, seed); `run.sh`/`run.bat` sobem dev servers. `run.sh` aceita `backend` (default), `portal`, `backoffice`, `all` (paralelo com `sed -u` prefixando e trap Ctrl+C central).
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
- [2026-05-13 10:55] Usuário: *"Espera, então o setup não roda nada, apenas o configura?"*
  Contexto: questionando o escopo do `setup.sh` — gatilho para separar configuração de execução.
- [2026-05-13 11:00] Usuário: *"Espera, ok, vamos manter um setup e podemos colocar um run.sh que tal?"*
  Contexto: proposta inicial de separar em 2 scripts (substituindo a ideia anterior dele de flags `--backend --backend --backend` que ele interrompeu).
- [2026-05-13 11:05] Usuário: *"Sim, pode ser assim, não importa misturar os logs"*
  Contexto: aprovando a interface (`backend` default, `portal`/`backoffice` individual, `all` paralelo com logs misturados).

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
