# RULES — Sistema SPEC-driven (v2)

Este arquivo é a **FONTE DA VERDADE** do processo de documentação deste projeto. Toda IA que operar neste repositório **DEVE** ler este arquivo completo no início de qualquer sessão de desenvolvimento.

**Criado em:** {{NOW}}

---

## 0. Premissa central

**Esta documentação NÃO é para humanos se localizarem — é para IA ter contexto rico ao retomar, continuar ou mexer em qualquer parte do projeto, hoje ou daqui a anos.**

**Única exceção:** `main.md` de cada SPEC (o "contrato") é validado por humano (dev) — é o ponto de interseção humano↔IA.

Todo o resto (`state.md`, `memory.md`, `features/*.md`, `INDEX.md`) é **suporte técnico para a IA**: denso, imperativo, auto-contido, pensado para leitura de máquina.

Isto muda o design em 3 pontos:

1. **Densidade > enxutidão**: preserve raciocínio, alternativas rejeitadas, respostas literais do usuário, tentativas que falharam.
2. **Hierarquia de leitura substitui corte**: arquivos pequenos lidos sempre; densos, sob demanda.
3. **Arquivos arquivados são auto-contidos**: IA abrindo `archive/SPEC-X/` reconstrói TUDO daquela execução sem depender de outros arquivos.

---

## 1. Estrutura física obrigatória

```
<root>/
├── CLAUDE.md                              ← orientações AI + primeira ação obrigatória
├── scripts/
│   ├── generate-index.sh                  ← CI: gera docs/INDEX.md
│   ├── lint-docs.sh                       ← pre-commit: valida cabeçalhos
│   └── audit-docs.sh                      ← auditoria periódica
└── docs/
    ├── RULES.md                           ← este arquivo
    ├── INDEX.md                           ← GERADO PELO CI (só features)
    ├── features/
    │   └── <area>.md                      ← estado vivo por feature
    ├── active/                            ← INVARIANTE: vazio em main
    │   └── SPEC-<timestamp>-<slug>/
    │       ├── main.md                    ← CONTRATO humano-validado
    │       ├── state.md                   ← log cronológico + status
    │       └── memory.md                  ← cérebro vivo da execução
    ├── future/
    │   └── SPEC-<timestamp>-<slug>/
    │       └── main.md                    ← só contrato (state/memory nascem na ativação)
    ├── archive/
    │   └── SPEC-<timestamp>-<slug>/       ← pasta congelada (main + state + memory)
    └── discard/
        └── SPEC-<timestamp>-<slug>/       ← pasta + justificativa de descarte
```

**PROIBIDO:**
- Criar arquivos de controle fora desta estrutura.
- Editar `INDEX.md` manualmente (é gerado por CI).
- Deletar SPEC de qualquer lugar.
- Renomear IDs.

---

## 2. Regras obrigatórias (imperativas)

### R.1 — Identificação de SPEC

**OBRIGATÓRIO:** ID de SPEC é timestamp de criação no formato `YYYYMMDD-HHMM`. Exemplo: `SPEC-20260421-1430-parser-xml`.

**PROIBIDO** usar numeração sequencial (001, 002, …) ou reutilizar IDs.

Slug após o timestamp: kebab-case, 3-6 palavras, descritivo.

### R.2 — Gate da branch main

**INVARIANTE:** `docs/active/` em `main` é **SEMPRE VAZIO**. SPECs ativas vivem **APENAS em branches** de feature/dev.

**OBRIGATÓRIO:** Git hook server-side ou CI rejeita merge que adicione/modifique arquivos em `docs/active/`. Aceita-se apenas DELETE (spec saindo de active para archive).

**PROIBIDO** burlar o gate. Se trabalho precisa ser compartilhado entre branches, **quebrar a SPEC em sub-SPECs** — cada uma com seu ciclo completo.

### R.3 — Estrutura da SPEC

**OBRIGATÓRIO:** toda SPEC em `active/` ou `archive/` ou `discard/` tem pasta com **exatamente 3 arquivos**:
- `main.md` — contrato (§3.2)
- `state.md` — log (§3.3)
- `memory.md` — cérebro vivo (§3.4)

**EXCEÇÃO:** SPEC em `future/` tem apenas `main.md`. `state.md` e `memory.md` nascem na ativação.

### R.4 — Vinculação obrigatória a feature

**OBRIGATÓRIO:** toda SPEC se vincula a **pelo menos 1 feature**. Não existe SPEC órfã.

- Se escopo é técnico/interno (CI, refactor, devex, infra) → vincular a feature apropriada (`build-and-ci`, `developer-tooling`, `infrastructure`, etc.), **criando se não existir**.
- Feature nova **DEVE** ser criada junto com a SPEC que a introduz (mesmo PR/branch).
- **PROIBIDO** feature sem SPEC relacionada existir. Apagar feature exige SPEC explícita de descontinuação.

### R.5 — Ciclo de vida

**OBRIGATÓRIO:** SPEC segue exatamente um caminho:

```
future/  →  active/ (branch)  →  archive/ (concluída)
                             ↘  discard/ (abandonada)
future/  ←  active/ (pausada, motivo registrado)
```

Ou: criada direto em `active/` se vai executar na hora.

**PROIBIDO:**
- Deletar SPEC de qualquer pasta (nem archive, nem discard).
- Mover SPEC de `archive/` ou `discard/` de volta (exceto correção de erro em minutos).
- Abandonar branch com SPEC em `active/` sem antes movê-la para `discard/` ou `future/` via PR curto.

### R.6 — Timestamps e commits em TODA atualização

**OBRIGATÓRIO:** toda atualização em qualquer arquivo de controle (main.md, state.md, memory.md, feature.md) DEVE carregar:
- **Timestamp** no formato `YYYY-MM-DD HH:MM`
- **Commit hash** (curto, 7 chars) quando a mudança envolve código
- **Autor/reviewer** quando envolve revisão humana

Aplicável a:
- Todo checkbox (marcado/desmarcado)
- Toda célula de status em tabela de fases
- Toda decisão, descoberta, tentativa, blocker
- Toda mudança em "Estado atual" de feature
- Toda adição/obsolescência de "Decisão arquitetural"
- Toda adição de gotcha

**Formato obrigatório de checkbox:**

```markdown
- [x] Parser consome XML com namespace (2026-04-21 15:30, commit `abc1234`)
- [ ] Edge case CDATA tratado
- [x] Revisão de segurança (2026-04-20 09:00, reviewer: @carlos)
```

**Formato obrigatório de tabela de fases** (em state.md):

```markdown
| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Setup base | concluído | 2026-04-21 14:00 | `abc1234` |
| 2 | Parser | em progresso | 2026-04-21 16:30 | — |
| 3 | Integração | pendente | 2026-04-21 14:00 | — |
```

**Formato obrigatório de entrada no log (state.md):**

```markdown
## 2026-04-21 15:30 — [decisão] Usar DOMParser nativo
Considerei xml2js e fast-xml-parser. Escolhi DOMParser por ser nativo
(zero deps) e 3x mais rápido. Trade-off: API mais verbosa.
Commit: `abc1234`
```

**PROIBIDO:** qualquer checkbox, célula de status, decisão, atualização sem timestamp. `lint-docs.sh` **REJEITA COMMIT**.

### R.7 — Atualização obrigatória de features ao arquivar SPEC

**OBRIGATÓRIO:** antes de mover SPEC de `active/` para `archive/`, atualizar CADA feature listada em `main.md:Features:` no mesmo PR:

1. Adicionar linha na seção **"Concluídas"** com: ID, data de conclusão, commit, título
2. Remover linha da seção **"Em execução"** (se existia)
3. Atualizar seção **"Estado atual"** com timestamp se houve mudança arquitetural real (código, fluxo, contrato)
4. Adicionar em **"Decisões arquiteturais ativas"** (com link para SPEC + timestamp) se decisão nova foi tomada
5. Marcar decisões substituídas como `[obsoleta desde YYYY-MM-DD HH:MM, substituída por SPEC-<id>]`
6. Adicionar em **"Gotchas"** (com timestamp + link para SPEC) se surgiu novo
7. Adicionar em **"Alternativas consideradas e rejeitadas"** se aplicável

**OBRIGATÓRIO no critério de aceite padrão de TODA SPEC:**

```markdown
- [ ] Features tocadas atualizadas: <lista de features>
      (com timestamp de atualização e referência a esta SPEC)
```

**SPEC não pode ser arquivada sem esse checkbox marcado.** `audit-docs.sh` valida no PR — bloqueia merge se SPEC foi movida para archive mas features correspondentes não foram modificadas no mesmo PR.

### R.8 — Isolamento entre SPECs

**OBRIGATÓRIO** durante trabalho em SPEC-X, IA lê APENAS:
- `CLAUDE.md`, `docs/RULES.md`, `docs/INDEX.md` (Nível 0, automático)
- `docs/features/<X>.md` (features que a SPEC toca)
- `docs/active/SPEC-X/main.md` + `state.md` + `memory.md`

**PROIBIDO** ler por iniciativa própria:
- `state.md` ou `memory.md` de outras SPECs (ativas, arquivadas, descartadas)
- SPECs em `future/`
- Features não tocadas pela SPEC atual

Essas leituras **EXIGEM pedido explícito do usuário** OU inferência justificada seguida de **confirmação do usuário** (protocolo de escalação §4).

### R.9 — Classificação obrigatória de prompt

**OBRIGATÓRIO:** todo prompt do usuário DEVE ser classificado em UMA de 3 categorias **antes** de qualquer ação:

1. **Continuidade** — prompt é parte/evolução/fix de SPEC ativa em `active/`
2. **Nova SPEC** — prompt representa entregável novo sem SPEC
3. **Prompt livre** — pergunta pontual, exploração, utilitário (não persiste)

**DEFAULT EM AMBIGUIDADE: PERGUNTAR.** IA **NUNCA** infere silenciosamente em casos ambíguos.

**Defaults automáticos (sem perguntar):**
- 1 SPEC ativa em `active/` + prompt conecta ao escopo dela → **continuidade**
- `active/` vazio + prompt claramente trivial (conceito, comando utilitário) → **livre**
- Todo resto → **PERGUNTAR** qual das 3 categorias.

### R.10 — Protocolo de escalação de leitura

Ver §4 completo. Resumo: **PROIBIDO** ler Nível 1+ sem confirmação explícita do dev.

### R.11 — Atualização de feature em ativação de SPEC (na branch)

Ao ativar SPEC (mover de `future/` → `active/` ou criar direto em `active/`), IA atualiza cada `features/<X>.md` tocada adicionando linha na seção **"Em execução"** com: ID, título, branch.

Essa linha some no merge (vira "Concluída" via R.7 ou é removida se SPEC for descartada).

**Conflito aceito** quando 2+ devs trabalham simultaneamente na mesma feature (resolução manual trivial — poucas linhas).

---

## 3. Formatos obrigatórios (templates literais)

**OBRIGATÓRIO** seguir estes formatos LITERALMENTE. Nomes de campos, marcadores, ordem — sem variação. `lint-docs.sh` valida.

### 3.1 — `docs/features/<area>.md`

```markdown
# Feature: <nome-feature-kebab-case>

**Keywords:** palavra1, palavra2, palavra3
**Arquivos principais:**
  - path/para/arquivo1.ts
  - path/para/arquivo2.ts
**Resumo:** Uma frase densa sobre o que é esta feature e como opera em alto nível.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260419-1030 | 2026-04-20 | `9b8e919` | Email Marketing MVP |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| SPEC-20260422-0900 | Webhook de notificação | Rastrear entrega/bounce |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260421-1430 | Parser XML renderer | feature/parser-xml |

## Estado atual

Descrição densa da arquitetura vigente. Fluxo, contratos, integrações, dependências, decisões operacionais.

> Última atualização: YYYY-MM-DD HH:MM (SPEC-<id>)

## Decisões arquiteturais ativas

- **<Decisão>** (origem: SPEC-<id>, YYYY-MM-DD HH:MM) — Descrição + trade-off considerado.
- **<Decisão antiga>** (origem: SPEC-<id>, YYYY-MM-DD HH:MM) [obsoleta desde YYYY-MM-DD HH:MM, substituída por SPEC-<novo-id>]

## Alternativas consideradas e rejeitadas

- **<Caminho alternativo>** — rejeitado em SPEC-<id> (YYYY-MM-DD HH:MM). Motivo técnico detalhado.

## Gotchas

- **<Armadilha>** (YYYY-MM-DD HH:MM, SPEC-<id>) — O que é + como evitar.

## Estado congelado (se houver)

Pastas/arquivos que esta feature NÃO pode modificar (zona protegida).
```

### 3.2 — `SPEC-<id>/main.md` (CONTRATO humano-validado)

```markdown
# SPEC-<YYYYMMDD-HHMM>: <Título curto>

**Status:** draft | active | done | discarded
**Criada:** YYYY-MM-DD HH:MM
**Ativada:** — | YYYY-MM-DD HH:MM
**Concluída:** — | YYYY-MM-DD HH:MM
**Commit final:** — | `hash`
**Keywords:** palavra1, palavra2
**Features:** feature-1, feature-2
**Branch:** feature/<nome-branch> (quando ativa)
**Depende de:** SPEC-<id> (se aplicável)
**Origem:** sugerida em SPEC-<id> | usuário em YYYY-MM-DD HH:MM | etc.
**Resumo:** Uma frase sobre o que entrega e por quê.

## Objetivo

2-3 frases. O quê e por quê.

## Escopo

**DENTRO:**
- item 1
- item 2

**FORA:**
- item excluído 1

## Implementação

Arquitetura, decisões técnicas, arquivos afetados, gotchas conhecidos.
Visão ESTÁTICA. Descobertas/decisões durante execução ficam em `state.md`.

## Critério de aceite

- [ ] Critério específico 1
- [ ] Critério específico 2
- [ ] **Features tocadas (<lista>) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
```

**OBRIGATÓRIO:** seções `Objetivo`, `Escopo`, `Implementação`, `Critério de aceite` presentes. Checkbox "Features tocadas atualizadas" sempre presente.

### 3.3 — `SPEC-<id>/state.md`

```markdown
# State — SPEC-<YYYYMMDD-HHMM>

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: YYYY-MM-DD HH:MM

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** YYYY-MM-DD HH:MM
**Onde tô:** <fase atual + progresso em 1 linha>
**Próximo passo:** <ação imediata concreta>
**Última decisão:** <decisão + trade-off em 1 linha>
**Bloqueio atual:** <ou "nenhum">
**Se retomar, ler:** <seções específicas deste state (ex.: "entradas de 2026-04-21 14:00 em diante")>

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | ... | concluído | YYYY-MM-DD HH:MM | `hash` |
| 2 | ... | em progresso | YYYY-MM-DD HH:MM | — |

Status permitidos: `pendente` | `em progresso` | `concluído` | `bloqueado` | `descartado`.

### Próximos passos

- [ ] item 1
- [ ] item 2

### Bloqueios ativos

_(ou "nenhum")_

---

## Fatos confirmados

Observações diretas (não especulação).

- [YYYY-MM-DD HH:MM] <fato>. Fonte: `path:linha` ou comando:saída.

## Inferências prováveis

Hipóteses baseadas em fatos, AINDA NÃO validadas.

- [YYYY-MM-DD HH:MM] <hipótese>. Validar com: <ação>.

## Dúvidas em aberto

- [YYYY-MM-DD HH:MM] <dúvida>. Próxima ação: <como resolver>.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## YYYY-MM-DD HH:MM — [ativação]

Plano inicial + arquivos identificados como relevantes.

## YYYY-MM-DD HH:MM — [MARCO] [decisão] Título curto

Decisão importante. Alternativas consideradas. Trade-off.
Commit: `hash`

## YYYY-MM-DD HH:MM — [descoberta] Título

O que foi descoberto. Promoção de inferência para fato (ou refutação).
Fonte: `path:linha`

## YYYY-MM-DD HH:MM — [tentativa] Título

O que foi tentado. Resultado (sucesso/falha). Lições extraídas.

## YYYY-MM-DD HH:MM — [blocker] Título

Descrição do bloqueio. Status snapshot atualizado.

## YYYY-MM-DD HH:MM — [unblock] Título

Como foi resolvido. Quem/como/quando.

## YYYY-MM-DD HH:MM — [nota] Título

Observação importante que não cabe nos outros tipos.

## YYYY-MM-DD HH:MM — [conclusão] Resumo final

Entregue. Critério de aceite marcado. Features atualizadas. Commit final.
```

**Tipos permitidos no log:** `[ativação]`, `[descoberta]`, `[decisão]`, `[tentativa]`, `[blocker]`, `[unblock]`, `[refactor]`, `[nota]`, `[conclusão]`.

**Prefixo opcional `[MARCO]`** antes de qualquer tipo para indicar entrada crítica (decisão arquitetural, pivô, descoberta grande). Facilita busca visual e da IA.

### 3.4 — `SPEC-<id>/memory.md`

```markdown
# Memory — SPEC-<YYYYMMDD-HHMM>

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: YYYY-MM-DD HH:MM

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** YYYY-MM-DD HH:MM (sessão #<N>)
**Onde tô:** <resumo ativo em 1-2 linhas>
**Próximo passo:** <ação imediata>
**Última decisão:** <decisão + trade-off, 1 linha>
**Bloqueio atual:** <ou "nenhum">
**Se retomar, ler:** <seção específica deste memory ou state>

---

## Contexto ativo

### O que está sendo feito AGORA

Descrição densa do foco atual. 3-10 linhas. **Sobrescrever** a cada sessão.

### Hipóteses em jogo

- **<Hipótese 1>** (status: testando | confirmada | descartada). YYYY-MM-DD HH:MM
- **<Hipótese 2>** (status: …)

### Decisões recentes que importam pra continuar

Não é o log completo (está em state.md). É só o que importa pra nova sessão operar.

- [YYYY-MM-DD HH:MM] <decisão em 1-2 linhas>

### Respostas-chave do usuário

Citações LITERAIS de decisões/preferências do usuário que mudaram o rumo.

- [YYYY-MM-DD HH:MM] Usuário: "<citação literal>"
  Contexto: <situação>.

### Tentativas que falharam (para NÃO repetir)

- [YYYY-MM-DD HH:MM] Tentei X. Falhou por Y. Ver state para detalhe completo.

### Arquivos ativamente sendo tocados

- `path/a.ts` (em edição)
- `path/b.ts` (lido como referência)

### Onde parei exatamente

Detalhe suficiente para outra sessão retomar sem re-descoberta. Linha/função/arquivo específico.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | YYYY-MM-DD HH:MM | 2h | ativação | Setup + plano inicial |
| 2 | YYYY-MM-DD HH:MM | 1h | continuidade | Fase 1 concluída |
```

**memory.md é SOBRESCRITO (não é log).** É o "dump atual do cérebro da execução". Informação detalhada e cronológica vive em `state.md`.

---

## 4. Protocolo de escalação de leitura

### Níveis

| Nível | Lê | Quando |
|-------|----|--------|
| **0** | `CLAUDE.md` + `docs/RULES.md` + `docs/INDEX.md` | SEMPRE no início da sessão (automático, ~3-5k tokens) |
| **1** | `docs/features/<X>.md` + `active/SPEC-X/main.md` | SOB CONFIRMAÇÃO do dev |
| **2** | `active/SPEC-X/memory.md` (TL;DR primeiro) + `state.md` | SOB PERGUNTA EXPLÍCITA se Nível 1 insuficiente |
| **3** | `archive/SPEC-Y/*` (state/memory de SPECs antigas) | SÓ se raciocínio histórico é necessário |

### Fluxo obrigatório no início da sessão

**OBRIGATÓRIO** seguir esta sequência em toda sessão de desenvolvimento não-trivial:

```
1. IA lê Nível 0 automaticamente
2. IA confirma em texto que leu: "Li CLAUDE.md, RULES.md v2 (YYYY-MM-DD), INDEX (X features). Active local: <lista>."
3. IA recebe prompt do usuário
4. IA classifica (R.9): livre | continuidade | nova | ambíguo
   └─ se livre → responde direto, FIM
5. IA faz inferências usando INDEX + active/ local:
   - classificação mais provável
   - features candidatas a tocar
   - SPECs relevantes
   - ambiguidades a resolver
6. IA APRESENTA HIPÓTESES AO DEV (OBRIGATÓRIO):

   "Entendi como: <classificação>.
    Features candidatas: <lista com razão>.
    Pretendo ler (Nível 1): <arquivos específicos>.
    Ambiguidades a resolver: <lista, se houver>.
    Confirma ou ajusta?"

7. IA AGUARDA confirmação do dev
8. IA lê Nível 1 com escopo confirmado
9. Se contexto ainda insuficiente → IA PERGUNTA antes de Nível 2:

   "Li o contrato da SPEC-X, mas falta contexto sobre <ponto específico>.
    Posso ler memory.md (TL;DR primeiro) ou state.md?"

10. IA escala SOB CONFIRMAÇÃO. NUNCA indiscriminado.
```

### Registro obrigatório de escalação

**OBRIGATÓRIO:** toda vez que IA lê Nível 2+ (memory/state de SPEC, ou archive), registra no `state.md` da SPEC ATUAL:

```markdown
## YYYY-MM-DD HH:MM — [nota] Escalação de leitura

Li memory.md da SPEC-<id> (arquivada) para entender decisão sobre <ponto>.
Confirmação do usuário: HH:MM.
Motivação: <por que precisei>.
```

Transparência + auditoria. Mitigação de disciplina voluntária da IA.

---

## 5. Ciclo de vida detalhado

### 5.1 — Criar SPEC nova

1. IA segue protocolo §4 (confere hipóteses com dev).
2. Sob confirmação, IA cria pasta `active/SPEC-<timestamp>-<slug>/` (ou `future/` se só planejar):
   - `main.md` com todos os campos obrigatórios preenchidos (Status, timestamps, Features, Branch)
   - Se `active/`: cria `state.md` com entrada `[ativação]` + TL;DR inicial, e `memory.md` com TL;DR inicial
3. Se feature nova: cria stub de `features/<nova>.md` com cabeçalho mínimo (será preenchido durante execução).
4. Atualiza `features/<X>.md` de cada feature tocada: adiciona linha em "Em execução" com ID, título, branch.

### 5.2 — Executar SPEC (a cada sessão)

1. IA carrega `state.md` e `memory.md` da SPEC (Nível 2, via protocolo §4).
2. **Início da sessão:** lê TL;DR primeiro. Decide se precisa do log completo.
3. **Durante:** a cada momento significativo (descoberta, decisão, tentativa, blocker):
   - Append em log do `state.md` (NUNCA editar entradas antigas)
   - Atualiza `memory.md` (sobrescreve campos relevantes)
   - Atualiza Status snapshot do `state.md` se fase mudou
4. **Fim da sessão:** atualiza TL;DR do `state.md` E `memory.md` com timestamp + ação imediata para retomada.

### 5.3 — Concluir SPEC (OBRIGATÓRIO, em ordem)

1. Marca TODOS os checkboxes de `Critério de aceite` em `main.md` com timestamp + commit.
2. Marca checkbox obrigatório **"Features tocadas atualizadas"** (R.7).
3. **Atualiza CADA `features/<X>.md` tocada:**
   - Move SPEC de "Em execução" → "Concluídas"
   - Atualiza "Estado atual" se houve mudança arquitetural
   - Adiciona "Decisões arquiteturais ativas" se decisão nova (com link + timestamp)
   - Marca decisões substituídas como obsoletas (com timestamp + substituta)
   - Adiciona "Gotchas" novos
   - Adiciona "Alternativas consideradas" se aplicável
4. Última entrada em `state.md`: `## YYYY-MM-DD HH:MM — [conclusão]` com resumo, commit final, critério marcado.
5. TL;DR final em `memory.md`: "SPEC concluída em YYYY-MM-DD HH:MM, commit `hash`".
6. `main.md`: `Status: done`, `Concluída:`, `Commit final:`.
7. Move pasta `active/SPEC-.../` → `archive/SPEC-.../`.

**Sem esse fluxo completo, `audit-docs.sh` REJEITA o PR.**

### 5.4 — Descartar SPEC

**OBRIGATÓRIO:**

1. `main.md`: `Status: discarded`, adiciona seção `## Justificativa de descarte` com timestamp + motivo detalhado (por que não faz mais sentido, o que foi aprendido, se é permanente ou temporário).
2. `state.md`: entrada `[conclusão]` com motivo (ou `[MARCO] [decisão] descarte`).
3. `memory.md`: TL;DR final marcando "descartada em YYYY-MM-DD HH:MM".
4. **NÃO atualiza features** (R.7 aplica apenas para archive). Se feature nova foi criada junto e SPEC é descartada sem produzir código, a feature também é removida no mesmo PR.
5. Move pasta `active/SPEC-.../` → `discard/SPEC-.../`.

### 5.5 — Pausar SPEC (sem descartar)

Move pasta `active/SPEC-.../` → `future/SPEC-.../` (remove `state.md` e `memory.md`; reviver recria). Adiciona campo `**Pausada em:** YYYY-MM-DD HH:MM — motivo` em `main.md`.

Ao reativar: cria novo `state.md` e `memory.md`. Primeira entrada em state cita a pausa anterior para contexto.

---

## 6. Mitigação explícita de riscos residuais

### 🛡️ Mitigação R1 — Disciplina voluntária da IA

**Medidas obrigatórias:**

1. **Linguagem imperativa** em RULES.md e CLAUDE.md: "DEVE", "PROIBIDO", "NUNCA", "OBRIGATÓRIO". Zero eufemismo.
2. **Primeira ação obrigatória da IA em sessão:** confirmar por texto que leu Nível 0 e listar o que leu.
   Exemplo literal: *"Li CLAUDE.md, docs/RULES.md v2 (2026-04-21), docs/INDEX.md (5 features). Active local: [SPEC-20260421-1430-parser-xml]. Como posso ajudar?"*
3. **Registro de escalação** (§4): toda leitura Nível 2+ registrada em state.md da SPEC atual (tipo `[nota]`). Auditável.
4. **CLAUDE.md** do projeto inclui aviso imperativo no topo:
   > *"IA: você está em um projeto SPEC-driven v2. É PROIBIDO ler arquivos Nível 1+ sem confirmação explícita do usuário. É OBRIGATÓRIO seguir o fluxo de §4 do docs/RULES.md."*

### 🛡️ Mitigação R2 — Poda e revisão de features

**Medidas obrigatórias:**

1. Toda **Decisão arquitetural** em `features/<X>.md` tem status + timestamp. Quando substituída por SPEC nova, **DEVE ser marcada como obsoleta** com timestamp + ponteiro para SPEC substituta (R.7).
2. `scripts/audit-docs.sh` detecta decisões com mais de 180 dias sem revisão e aponta para revisão manual.
3. **OBRIGATÓRIO** no critério de aceite de toda SPEC que toca uma feature: checkbox "Decisões da feature revisadas: obsoletas marcadas, ativas confirmadas".

### 🛡️ Mitigação R3 — Qualidade do `main.md` humano-validado

**Medidas obrigatórias:**

1. Template rigoroso (§3.2) com seções **OBRIGATÓRIAS**. `lint-docs.sh` rejeita se falta seção.
2. IA cria `main.md` preenchendo campos automáticos (id, timestamps, features, branch) e deixa seções de conteúdo como placeholder `_(preencher)_`. **Dev DEVE validar antes de ativar.**
3. **OBRIGATÓRIO** no PR de criação de SPEC: checkbox "main.md revisado e validado por mim (dev humano)".
4. Este arquivo (§3.2) inclui **exemplo-modelo** de `main.md` bem escrito como referência.

### 🛡️ Mitigação R4 — Features não atualizadas ao arquivar (a mais forte)

**Medidas obrigatórias:**

1. **OBRIGATÓRIO:** critério de aceite em TODA SPEC inclui checkbox:
   ```markdown
   - [ ] Features tocadas (<lista>) atualizadas com timestamp e referência a esta SPEC
   ```
2. `scripts/audit-docs.sh` executado no PR valida:
   - SPEC movida de `active/` → `archive/` no diff? → SIM: verifica se cada feature em `main.md:Features:` foi modificada no mesmo PR.
   - Se não → **PR BLOQUEADO** com mensagem: "SPEC-X foi arquivada mas feature-Y não foi atualizada. Ver R.7."
3. Regra imperativa neste arquivo: **"PROIBIDO arquivar SPEC sem atualização de todas as features tocadas no mesmo PR."**
4. Revisor humano do PR tem item explícito na checklist: "Features atualizadas? ver diff".

---

## 7. Scripts de apoio

Este projeto tem 3 scripts em `scripts/`:

### 7.1 — `scripts/generate-index.sh`

**Propósito:** gera `docs/INDEX.md` a partir dos cabeçalhos de `docs/features/*.md`.

**Quando rodar:** CI no push para `main` quando `docs/features/**` muda.

**PROIBIDO:** editar `INDEX.md` manualmente. É saída de script.

### 7.2 — `scripts/lint-docs.sh`

**Propósito:** valida formato dos arquivos de controle.

**Quando rodar:** pre-commit (hook) e/ou CI.

**Checa:**
- Cabeçalhos de `features/*.md` e `SPEC-*/main.md` têm todos os campos obrigatórios
- Checkboxes marcados têm timestamp
- SPECs em `active/` têm os 3 arquivos (main, state, memory)
- Features em `INDEX.md` batem com `docs/features/*.md` existentes

**Falha → commit/PR bloqueado** com mensagem específica.

### 7.3 — `scripts/audit-docs.sh`

**Propósito:** auditoria periódica e checagem de PR.

**Quando rodar:** CI scheduled (semanal) + em cada PR.

**Checa:**
- SPECs em `active/` sem atualização em `state.md` há mais de 30 dias (sinal de esquecimento)
- SPECs referenciadas que não existem (zero fantasma)
- Features sem SPECs relacionadas
- PR que move SPEC para archive: features tocadas foram atualizadas? (R.7/R4 — BLOQUEIA PR)
- Decisões em features com mais de 180 dias sem revisão
- Cabeçalhos mal-formados

---

## 8. Anti-patterns — PROIBIDOS

- ❌ Pular Nível 0 (`CLAUDE.md` + `RULES.md` + `INDEX.md`) no início de sessão
- ❌ Ler Nível 1+ sem confirmação explícita do dev
- ❌ Criar SPEC sem vincular a pelo menos 1 feature
- ❌ Arquivar SPEC sem atualizar todas as features tocadas
- ❌ Editar entrada antiga do Log cronológico em `state.md` (append-only)
- ❌ Checkbox, célula de status, decisão ou atualização SEM timestamp
- ❌ Commit-referenciado sem hash
- ❌ SPEC em `active/` na branch `main` (gate impede)
- ❌ Deletar SPEC de qualquer pasta (nem archive, nem discard)
- ❌ Abandonar branch com SPEC ativa sem antes mover para `discard/` ou `future/`
- ❌ Apresentar hipótese como fato (vai em "Inferências" ou "Dúvidas", não em "Fatos")
- ❌ Misturar trabalho de 2+ SPECs na mesma sessão
- ❌ Tratar prompt ambíguo como continuidade sem PERGUNTAR
- ❌ Ler `state.md`/`memory.md` de outras SPECs por iniciativa própria
- ❌ Editar `INDEX.md` manualmente (é gerado pelo CI)
- ❌ Usar numeração sequencial em vez de timestamp para ID
- ❌ Tamanho como objetivo: cortar contexto rico "por ser longo" (docs são pra IA)

---

## 9. Boas práticas — RECOMENDADAS

- ✅ Prefixar entradas críticas de `state.md` com `[MARCO]` para facilitar busca
- ✅ Atualizar TL;DR do state e memory **ao fim de CADA sessão**
- ✅ Preencher campo `Origem:` quando SPEC deriva de sugestão anterior
- ✅ Registrar **respostas literais do usuário** que mudam rumo (memory → Respostas-chave)
- ✅ Revisar decisões arquiteturais das features tocadas (evita acúmulo de obsoletas)
- ✅ Quebrar SPEC em sub-SPECs quando escopo ultrapassar ~3 sessões de trabalho
- ✅ Incluir "Tentativas que falharam" no memory para evitar repetição pela IA

---

## 10. Primeira ação da IA em qualquer sessão

**OBRIGATÓRIO**, nesta ordem:

1. Ler `CLAUDE.md` (orientações do projeto)
2. Ler este arquivo `docs/RULES.md` (processo completo)
3. Ler `docs/INDEX.md` (mapa de features)
4. Listar `docs/active/` (SPECs ativas na branch local)
5. Se houver SPEC ativa e prompt conecta → ler `main.md` da SPEC (não `state` nem `memory` ainda)
6. Confirmar em texto: *"Li CLAUDE.md, docs/RULES.md v2, docs/INDEX.md (X features). Active local: [lista]. Como posso ajudar?"*
7. Aguardar prompt do usuário e seguir §4 (protocolo de escalação).

Confirmar que leu este processo **antes de qualquer outra ação**.
