# memory.md — SPEC-20260518-1915-postgres-drizzle-setup

_(sobrescrever campos relevantes a cada sessão — não é append-only)_

---

## TL;DR

SPEC corrigida em 2026-05-18 20:00. Decisão final: edição cirúrgica do `portal/package.json` — apenas adicionar deps e scripts em falta, sem substituir o arquivo. Todos os arquivos de código prontos para o dev copiar ao repositório. Aguardando execução das fases 1→8.

---

## Contexto rápido

Setup de persistência do `portal/` (Next.js App Router): Drizzle ORM como cliente type-safe. O Postgres já está provisionado pelo `docker-compose.yml` da raiz (porta 5435, credenciais `scp/scp/scp`). A SPEC valida o fluxo completo generate→migrate→studio com tabela temporária `_test`, depois limpa o schema. `backend/` mantém TypeORM — stacks separadas.

---

## Estado atual

- **Fase:** 1 (não iniciada)
- **O que está pronto:** todos os arquivos de código gerados e corrigidos
- **O que falta:** dev executar os passos no terminal

---

## Estrutura de arquivos desta SPEC

```
portal/
├── drizzle.config.ts          ← novo
├── .env.example               ← novo (commitar)
├── .env                       ← dev cria (NÃO commitar)
├── package.json               ← edição cirúrgica (só adicionar, não substituir)
└── src/
    └── lib/
        ├── tenant/            ← já existe, não mexer
        ├── theme/             ← já existe, não mexer
        └── db/                ← pasta nova
            ├── schema.ts
            ├── index.ts
            └── migrations/    ← criada pelo db:generate
```

---

## O que adicionar ao portal/package.json (edição cirúrgica)

```json
// Em "scripts" — adicionar após "typecheck":
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:studio":   "drizzle-kit studio",
"db:push":     "drizzle-kit push"

// Em "dependencies" — adicionar:
"drizzle-orm": "^0.43.1",
"pg": "^8.13.3"

// Em "devDependencies" — adicionar:
"@types/pg": "^8.11.11",
"dotenv": "^16.5.0",
"drizzle-kit": "^0.31.1"
```

---

## Decisões ativas

| Decisão | Motivo | Data |
|---------|--------|------|
| `portal/src/lib/db/` | Segue convenção `lib/tenant/`, `lib/theme/` já existente no portal | 2026-05-18 19:45 |
| `drizzle.config.ts` na raiz do portal/ | Drizzle Kit exige config na raiz do workspace | 2026-05-18 19:45 |
| Padrão `globalThis` no index.ts | Evita múltiplos pools no HMR do Next.js em dev | 2026-05-18 19:45 |
| Driver `node-postgres (pg)` | Compatibilidade e familiaridade da equipe | 2026-05-18 19:45 |
| `DATABASE_URL` porta 5435 | Alinhada com `docker-compose.yml` real do projeto | 2026-05-18 19:45 |
| Drizzle exclusivo do portal/ | backend/ usa TypeORM — não misturar stacks | 2026-05-18 19:45 |
| Edição cirúrgica do package.json | Substituição completa arriscaria sobrescrever configurações existentes | 2026-05-18 20:00 |

---

## Decisões descartadas (histórico)

| Decisão descartada | Por que descartada | Data |
|--------------------|--------------------|------|
| `lib/db/` na raiz do monorepo | Não existe `lib/` na raiz; portal já tem `src/lib/` com convenção própria | 2026-05-18 19:45 |
| `DATABASE_URL` porta 5432 | docker-compose.yml real usa porta 5435 | 2026-05-18 19:45 |
| Substituição completa do package.json | Risco de sobrescrever configurações existentes — edição cirúrgica é mais segura | 2026-05-18 20:00 |

---

## Armadilhas conhecidas

- `portal/.env` NÃO commitar — verificar `git status` antes do push
- `db:push` apenas local — NUNCA staging/produção
- Postgres demora ~3s após `docker compose up -d` — aguardar antes de conectar
- Credenciais padrão do projeto: usuário `scp`, senha `scp`, banco `scp`, porta `5435`
- `docker-compose.yml` da raiz já tem Redis também — não duplicar

---

## Próxima ação imediata

```bash
# 1. Raiz do monorepo
docker compose up -d
docker compose ps   # confirmar db running

# 2. Editar portal/package.json cirurgicamente (adicionar deps e scripts)

# 3. Dentro de portal/
cd portal
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:studio   # http://localhost:4983 — confirmar tabela _test

# 4. Após validar: remover _test do schema.ts
#    Rodar db:generate novamente → db:migrate
#    Atualizar checkboxes do main.md com timestamps e commits
#    Atualizar docs/features/infrastructure.md (R.7)
#    Mover SPEC: active/ → archive/
```