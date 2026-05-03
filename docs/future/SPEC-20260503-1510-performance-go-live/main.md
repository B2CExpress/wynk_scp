# SPEC-20260503-1510: Performance, testes e go-live

**Status:** draft
**Criada:** 2026-05-03 15:10
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** performance, testes-carga, cdn, dns, monitoramento, staging, go-live
**Features:** performance, infra-cdn, monitoramento, staging
**Branch:** feature/performance-go-live (quando ativa)
**Depende de:** SPEC-20260503-1505 a SPEC-20260503-1509 (toda a plataforma funcional)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 6 — usuário em 2026-05-03 15:05
**Resumo:** Endurece a plataforma para produção — testes de carga, CDN configurado, DNS dos primeiros tenants, monitoramento (logs, métricas, alertas), ambientes de staging por tenant e checklist de go-live.

## Objetivo

Garantir que a plataforma sustenta tráfego real de múltiplos shoppings sem degradar, e que problemas em produção são detectados antes dos usuários reportarem.

## Escopo

**DENTRO:**
- **Testes de carga:** k6 ou Artillery simulando picos (ex.: black friday — 10x baseline) por tenant; identificar gargalos e ajustar índices/cache
- **CDN:** configurar (CloudFront, Cloudflare ou Vercel Edge) para `cdn.plataforma.com/{tenant-id}/...` (§9), incluindo assets estáticos e ISR
- **DNS:** roteiro para apontar host de cada tenant (`brasiliashopping.com`, etc.) → entrada A/CNAME → middleware resolve por host (Fase 1)
- **Monitoramento:** logs estruturados (request_id, tenant_id em cada log), métricas (latência p50/p95/p99 por tenant, error rate), dashboards (Grafana ou Datadog), alertas (PagerDuty ou similar)
- **Staging por tenant:** subdomínio `staging.{dominio}` apontando para ambiente staging com dados anonimizados ou snapshot — §10
- **Healthcheck:** endpoint `/health` que valida banco + Redis + cada tenant ativo (smoke check)
- **Runbook de go-live:** checklist DNS, certificado SSL, smoke tests, rollback plan
- **Backup e restore:** rotina diária + procedimento documentado de restore por tenant (recuperação parcial)

**FORA:**
- Migração de dados de sites legados (responsabilidade do tenant)
- Testes E2E completos (parte de qualquer fase anterior — aqui só testes de carga e smoke)
- Multi-região (single region inicialmente)
- DR cross-region (futuro pós-MVP)

## Implementação

- k6 scripts versionados em `tests/load/` com cenários: home, listagem de lojas, detalhe de notícia, inscrição newsletter
- CDN: configurar invalidação por tag `tenant-{id}` para purgar tudo de um tenant
- Logs: usar pino (Node) ou equivalente — todo log carrega `tenant_id` injetado pelo middleware da Fase 1
- Alertas críticos: error rate >5% por 2 min, p95 >2s por 5 min, healthcheck failing
- Staging: réplica de banco com restore noturno + flag `STAGING=true` que adiciona banner "AMBIENTE DE STAGING" no site
- Runbook como markdown em `docs/runbooks/go-live.md` (não em SPEC) ou no próprio `state.md` desta SPEC

## Critério de aceite

- [ ] Teste de carga 10x baseline mantém p95 <2s e error rate <1%
- [ ] CDN serve assets de tenant correto, invalidação funciona ao publicar
- [ ] DNS de pelo menos 1 tenant real apontado e funcionando em produção
- [ ] Logs em produção carregam `tenant_id` em 100% das entradas
- [ ] Dashboard mostra latência por tenant e total
- [ ] Alerta dispara ao injetar erro proposital (teste de fogo)
- [ ] `staging.{dominio}` de pelo menos 1 tenant funcionando, claramente identificado como staging
- [ ] `/health` retorna 200 quando saudável, 503 quando qualquer dependência cai
- [ ] Restore de backup testado em ambiente isolado (RTO <1h documentado)
- [ ] Runbook de go-live revisado por pelo menos 2 pessoas
- [ ] **Features tocadas (performance, infra-cdn, monitoramento, staging) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
