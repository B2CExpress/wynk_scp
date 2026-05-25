# Memory — SPEC-20260503-1506-modulo-lojas

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-03 15:06
> Descartada: 2026-05-12 12:42

---

## TL;DR (final)

**Última atualização:** 2026-05-12 12:42
**Onde tô:** SPEC descartada permanentemente sem nunca ter sido ativada.
**Próximo passo:** Nenhum. Quando admin/upload/etc. virarem prioridade, criar SPECs novas focadas (não reativar esta).
**Última decisão:** Descarte autorizado pelo dev em 2026-05-12 12:42, durante o re-escopo #2 da SPEC-20260506-1400.
**Bloqueio atual:** —
**Se retomar, ler:** `main.md` inteiro (especialmente §Justificativa de descarte e §O que herdar).

---

## Contexto ativo (no momento do descarte)

### O que estava sendo feito

A SPEC original tentava entregar o módulo de lojas inteiro em uma única SPEC: schema de lojas + categorias, admin CRUD de ambos, upload de imagens com CDN, frontend público (listagem + detalhe), cache Redis, full-text search, permissões. Foi escrita em 2026-05-03, antes da SPEC-20260503-1505 fixar a stack final do projeto (Express 4 + TypeORM 0.3).

Durante a sessão de re-escopo #2 da SPEC-20260506-1400, ficou claro que:
- O schema mínimo pode ser absorvido pela 1400.
- O endpoint de detalhe já tem SPEC própria planejada (1400-stores-public-detail em future/).
- Admin/upload/permissões cada um merece SPEC focada.

Resultado: descartar a 1506 e seguir com SPECs menores.

### Hipóteses em jogo (no descarte)

- **A 1506 era grande demais para ser entregue como SPEC única.** Status: confirmada. 2026-05-12 12:42
- **O schema mínimo absorvido pela 1400 é suficiente para a fase pública.** Status: confirmada. 2026-05-12 12:42
- **Admin/upload virarão prioridade depois — em SPECs separadas, não nesta.** Status: confirmada. 2026-05-12 12:42

### Decisões recentes que importam para qualquer retomada

- [2026-05-12 12:42] Descarte permanente — não reativar este documento.
- [2026-05-12 12:42] Schema mínimo (`tb_store`, `tb_category`, `tb_store_category`) já entregue pela SPEC-20260506-1400.
- [2026-05-12 12:42] Colunas avançadas (`descrição`, `imagens[]`, `horário`, `contato`) ficam para `ALTER TABLE` em SPECs futuras quando admin/UX exigir.

### Respostas-chave do usuário

- [2026-05-12 12:42] Dev: *"Então manda bala"* (autorização explícita para descartar).

### Tentativas que falharam (para NÃO repetir)

- [2026-05-03 15:06] Tentar entregar módulo de lojas inteiro em UMA SPEC. Lição: cada SPEC = 1 entrega focada. Violou §9 do RULES.md.

### Arquivos ativamente sendo tocados

_(nenhum — nunca foi ativada)_

### Onde parei exatamente

SPEC nunca foi ativada. Foi diretamente de `future/` para `discard/` em 2026-05-12 12:42 durante o re-escopo da SPEC-1400.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-03 15:06 | ~30min | criação | SPEC inicial escrita em `future/` com escopo amplo do módulo de lojas |
| 2 | 2026-05-12 12:42 | parte da sessão da SPEC-1400 | descarte | SPEC descartada permanentemente; schema mínimo absorvido pela 1400 |
