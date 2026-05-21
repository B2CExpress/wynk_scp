# Feature: infrastructure

**Área:** Infraestrutura local de desenvolvimento e persistência
**Criada em:** 2026-05-18 19:15 (junto com SPEC-20260518-1915-postgres-drizzle-setup)
**Última atualização:** 2026-05-18 20:00

---

## Estado atual

> ⚠️ **Setup gerado, aguardando execução e validação pelo dev** (2026-05-18 20:00)

Postgres provisionado via `docker-compose.yml` da raiz (porta 5435, credenciais `scp/scp/scp`). Drizzle ORM configurado como cliente de acesso a dados exclusivo do `portal/` (Next.js). `backend/` mantém TypeORM — stacks separadas. Migrations versionadas no Git em `portal/src/lib/db/migrations/`.

---

## Responsabilidades desta feature

- `docker-compose.yml` raiz — Postgres e Redis locais
- Drizzle ORM no `portal/` (schema, migrations, studio)
- `portal/src/lib/db/` — schema, cliente singleton, migrations
- `portal/drizzle.config.ts` — config do Drizzle Kit
- Variáveis de ambiente de banco (`portal/.env` / `portal/.env.example`)
- Scripts npm do portal: `db:generate`, `db:migrate`, `db:studio`, `db:push`

---

## Em execução

| SPEC | Título | Iniciada |
|------|--------|----------|
| SPEC-20260518-1915-postgres-drizzle-setup | Drizzle ORM + migrations no portal/ | 2026-05-18 19:15 |

---

## Concluídas

_(nenhuma ainda)_

---

## Decisões arquiteturais ativas

| Decisão | Motivo | SPEC | Data |
|---------|--------|------|------|
| `portal/src/lib/db/` | Segue convenção `lib/tenant/`, `lib/theme/` já existente no portal | SPEC-20260518-1915 | 2026-05-18 19:45 |
| Padrão `globalThis` no index.ts | Evita múltiplos pools no HMR do Next.js em dev | SPEC-20260518-1915 | 2026-05-18 19:45 |
| Driver `node-postgres (pg)` | Compatibilidade com drizzle-orm/node-postgres, familiaridade da equipe | SPEC-20260518-1915 | 2026-05-18 19:45 |
| Migrations versionadas no Git | Garante mesmo schema para todos os devs. `db:push` proibido fora de prototipagem local | SPEC-20260518-1915 | 2026-05-18 19:45 |
| Drizzle exclusivo do portal/ | backend/ usa TypeORM — não misturar stacks no mesmo workspace | SPEC-20260518-1915 | 2026-05-18 19:45 |
| Edição cirúrgica do package.json | Substituição completa arriscaria sobrescrever configurações existentes | SPEC-20260518-1915 | 2026-05-18 20:00 |

---

## Gotchas

- `portal/.env` NÃO commitar — sempre `git status` antes do push (2026-05-18 19:45)
- `db:push` apenas local — NUNCA staging/produção (2026-05-18 19:45)
- Credenciais padrão: usuário `scp`, senha `scp`, banco `scp`, porta `5435` (2026-05-18 19:45)
- Postgres demora ~3s após `docker compose up -d` antes de aceitar conexões (2026-05-18 19:45)

---

## Alternativas rejeitadas

| Alternativa | Por que rejeitada | Data |
|-------------|-------------------|------|
| `lib/db/` na raiz do monorepo | Não existe `lib/` na raiz; portal já tem `src/lib/` com convenção própria | 2026-05-18 19:45 |
| `postgres.js` como driver | Menos familiar à equipe vs `node-postgres (pg)` | 2026-05-18 19:45 |
| Drizzle também no backend/ | backend/ já tem TypeORM estabelecido — misturar ORMs gera confusão | 2026-05-18 19:45 |
| Substituição completa do package.json | Risco de sobrescrever configurações existentes | 2026-05-18 20:00 |