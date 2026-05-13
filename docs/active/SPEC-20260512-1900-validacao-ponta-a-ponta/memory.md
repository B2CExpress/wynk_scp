# Memory — SPEC-20260512-1900

> Main: [main.md](./main.md)  
> State: [state.md](./state.md)  
> Criado: 2026-05-12 19:00

---

## TL;DR

**Última atualização:** 2026-05-13 16:29  
**Onde tô:** SPEC de validação ponta-a-ponta da Fase 1 criada com ID real `SPEC-20260512-1900-validacao-ponta-a-ponta`. A estrutura correta mantém `main.md`, `memory.md` e `state.md` dentro da pasta da SPEC, enquanto `docs/fase-1-validacao.md` fica direto dentro de `docs/`.  
**Próximo passo:** Ajustar `seeds/tenants.json` mantendo o tenant existente da empresa e adicionando apenas um tenant específico para esta SPEC. Depois, commitar e enviar a branch.  
**Última decisão:** Não duplicar o conteúdo completo de `seeds/tenants.json` dentro dos documentos; apenas referenciar o arquivo real.  
**Bloqueio atual:** Docker Desktop não carrega corretamente no ambiente local, impedindo validação real de Postgres, Redis, migrations e seed.  
**Se retomar, ler:** `main.md`, TL;DR do `state.md` e seção "Bloqueios ativos".

---

## Contexto ativo

### O que está sendo feito AGORA

Estamos estruturando a validação ponta-a-ponta da Fase 1 da plataforma multitenant.

O objetivo é garantir que tenants de teste coexistam na mesma instalação, cada um com domínio local, identidade visual, cache, autenticação e isolamento próprios.

A validação precisa confirmar o arquivo `seeds/tenants.json`, os assets em `portal/public/flavors/`, a resolução por host, o cache Redis, a autenticação JWT e o isolamento entre tenants.

O usuário confirmou que o ID real da SPEC é `SPEC-20260512-1900-validacao-ponta-a-ponta`.

O usuário também confirmou, por imagem, que já existe um tenant no arquivo `seeds/tenants.json` da empresa:

- `slug`: `shopping-x`
- `host`: `shopping-x.local`
- `flavor_slug`: `shopping-x`
- `name`: `Shopping x`

A decisão atual é não substituir esse tenant. A SPEC deve adicionar apenas um tenant específico para validação.

---

## Hipóteses em jogo

- **Fase 1 toca `infra-base`, `tenant-resolution` e `theme-system`.**  
  Status: confirmada.  
  Data: 2026-05-12 19:00

- **A validação visual depende de `seeds/tenants.json` e `portal/public/flavors/`.**  
  Status: confirmada.  
  Data: 2026-05-12 19:00

- **O projeto real usa TypeORM.**  
  Status: confirmada.  
  Data: 2026-05-12 19:00

- **Autenticação pode exigir validação adicional ou SPEC própria se ainda não estiver completa.**  
  Status: testando.  
  Data: 2026-05-12 19:00

- **O seed de admins e superadmin pode ainda não estar implementado.**  
  Status: testando.  
  Data: 2026-05-12 19:00

- **Docker está bloqueando a validação real no ambiente local.**  
  Status: bloqueado.  
  Data: 2026-05-13 16:29

---

## Decisões recentes que importam para continuar

- [2026-05-12 19:00] Usar o ID real `SPEC-20260512-1900-validacao-ponta-a-ponta`.
- [2026-05-12 19:00] Manter a SPEC em `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/`.
- [2026-05-12 19:00] Não duplicar o conteúdo de `seeds/tenants.json` nos documentos.
- [2026-05-12 19:00] Usar `seeds/tenants.json` como fonte única para os tenants de teste.
- [2026-05-12 19:00] Validar os assets no caminho real do projeto: `portal/public/flavors/`.
- [2026-05-12 19:00] Validar o flavor `shopping-x`.
- [2026-05-12 19:00] Não editar `docs/INDEX.md` manualmente.
- [2026-05-12 19:00] Atualizar as features tocadas antes de arquivar a SPEC.
- [2026-05-13 16:29] Não apagar o tenant existente da empresa em `seeds/tenants.json`.
- [2026-05-13 16:29] Adicionar um tenant específico para esta SPEC no `seeds/tenants.json`.
- [2026-05-13 16:29] Registrar o Docker como bloqueio caso a validação real não possa ser executada.

---

## Respostas-chave do usuário

- [2026-05-12 19:00] Usuário informou: "eu botei um ID real - SPEC-20260512-1900-validacao-ponta-a-ponta".
- [2026-05-12 19:00] Usuário informou: "E os caminhos dos meus projetos estão corretos, está igual as imagens enviadas".
- [2026-05-12 19:00] Usuário pediu para não duplicar o conteúdo de `seeds/tenants.json` dentro dos documentos.
- [2026-05-12 19:00] Usuário pediu os quatro arquivos separadamente:
  - `main.md`
  - `memory.md`
  - `state.md`
  - `fase-1-validacao.md`
- [2026-05-13 16:29] Usuário informou que o Docker não carrega corretamente.
- [2026-05-13 16:29] Usuário mostrou que o `seeds/tenants.json` já possui um tenant criado pela empresa.

---

## Tentativas que falharam ou devem ser evitadas

- [2026-05-12 19:00] Evitar usar `SPEC-20260512-HHMM`, porque `HHMM` era placeholder e não atende ao formato real de timestamp.
- [2026-05-12 19:00] Evitar colar o conteúdo completo de `seeds/tenants.json` dentro de `main.md`, `memory.md`, `state.md` ou `fase-1-validacao.md`.
- [2026-05-12 19:00] Evitar trocar o caminho real `portal/public/flavors/` por `portal/flavors/`.
- [2026-05-12 19:00] Evitar editar `docs/INDEX.md` manualmente, pois é gerado pelo CI.
- [2026-05-12 19:00] Evitar marcar fatos não verificados como concluídos.
- [2026-05-13 16:29] Evitar apagar ou substituir o tenant existente em `seeds/tenants.json`.
- [2026-05-13 16:29] Evitar marcar validação de Docker, Postgres, Redis, migrations ou seed como concluída enquanto Docker estiver bloqueado.

---

## Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/main.md`
- `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/state.md`
- `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/memory.md`
- `docs/fase-1-validacao.md`
- `docs/features/infra-base.md`
- `docs/features/tenant-resolution.md`
- `docs/features/theme-system.md`
- `seeds/tenants.json`
- `portal/public/flavors/shopping-x/theme.json`
- `portal/public/flavors/shopping-x/logo.svg`
- `portal/public/flavors/shopping-x/favicon.ico`

---

## Onde parei exatamente

A documentação da SPEC foi corrigida para usar o ID real `SPEC-20260512-1900-validacao-ponta-a-ponta`.

A estrutura correta é:

```txt
docs/
├── active/
│   └── SPEC-20260512-1900-validacao-ponta-a-ponta/
│       ├── main.md
│       ├── memory.md
│       └── state.md
├── fase-1-validacao.md