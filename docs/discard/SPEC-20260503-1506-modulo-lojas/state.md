# State — SPEC-20260503-1506-modulo-lojas

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-03 15:06
> Descartada: 2026-05-12 12:42

---

## TL;DR

**Última atualização:** 2026-05-12 12:42
**Onde tô:** SPEC descartada permanentemente sem ativação.
**Próximo passo:** Não há — escopo será reaproveitado em SPECs futuras menores e focadas, herdando o schema mínimo da SPEC-20260506-1400.
**Última decisão:** Descarte autorizado pelo dev em 2026-05-12 12:42 ("Então manda bala") durante a sessão de re-escopo #2 da SPEC-1400.
**Bloqueio atual:** —
**Se retomar, ler:** seção "Justificativa de descarte" de `main.md` antes de criar qualquer SPEC nova que reaproveite escopo daqui.

---

## Status snapshot

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Criar SPEC inicial (escopo monstro do módulo de lojas) | concluído | 2026-05-03 15:06 | — |
| 2 | Validar viabilidade da SPEC com stack final (SPEC-1505) | descartado | 2026-05-12 12:42 | — |
| 3 | Re-escopar e absorver schema mínimo na SPEC-20260506-1400 | concluído | 2026-05-12 12:42 | — |
| 4 | Descartar permanentemente | concluído | 2026-05-12 12:42 | — |

### Próximos passos

_(nenhum — SPEC descartada permanentemente)_

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-12 12:42] SPEC descartada por 3 motivos: stack obsoleta (escrita antes da SPEC-1505 fixar Express+TypeORM), escopo monstro (~6 SPECs em uma) e sobreposição com SPECs já ativas/planejadas. Fonte: `main.md` §Justificativa de descarte.
- [2026-05-12 12:42] Schema mínimo (`tb_store`, `tb_category`, `tb_store_category`) absorvido pela SPEC-20260506-1400-stores-public-api. Fonte: `main.md` §Motivo técnico item 3.
- [2026-05-12 12:42] Detalhe `/api/v1/stores/[slug]` continua planejado em SPEC-20260508-1400-stores-public-detail (em `docs/future/`). Fonte: `main.md` §Motivo técnico item 3.
- [2026-05-12 12:42] Decisões de produto úteis (multi-categoria, filtros via querystring, reordenação int, upload para CDN com path por tenant, permissões Tenant Admin/Editor) ficam registradas aqui para reaproveitamento. Fonte: `main.md` §O que herdar.

## Inferências prováveis

_(nenhuma — SPEC descartada, não há mais cenários em aberto)_

## Dúvidas em aberto

_(nenhuma)_

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-03 15:06 — [criação]

SPEC criada em `docs/future/` com escopo amplo do módulo de lojas (admin CRUD + frontend + upload + cache + busca + permissões).

## 2026-05-12 12:42 — [MARCO] [descarte permanente]

SPEC descartada na sessão de re-escopo #2 da SPEC-20260506-1400-stores-public-api. Autorização explícita do dev: *"Então manda bala"*.

Motivos registrados em `main.md` §Justificativa de descarte:
1. Stack obsoleta (referencia `db/withTenant` genérico e Server Actions, anterior à SPEC-1505).
2. Escopo monstro — viola §9 do RULES.md (~6 SPECs em uma).
3. Sobreposição com SPEC-20260506-1400 (schema mínimo) e SPEC-20260508-1400-stores-public-detail (em future/).

Decisão: **permanente**. Não reativar — quando admin/upload virarem prioridade, criar SPECs novas focadas, cada uma com escopo de 1 entrega, herdando o schema mínimo já entregue pela SPEC-1400.
Commit: —
