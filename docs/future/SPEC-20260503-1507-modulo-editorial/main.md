# SPEC-20260503-1507: Módulo Editorial

**Status:** draft
**Criada:** 2026-05-03 15:07
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** noticias, eventos, teatro, promocoes, servicos, editor, wysiwyg
**Features:** noticias, eventos, teatro, promocoes, servicos
**Branch:** feature/modulo-editorial (quando ativa)
**Depende de:** SPEC-20260503-1505 (base), SPEC-20260503-1506 (lojas — promoções podem vincular)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 3 — usuário em 2026-05-03 15:05
**Resumo:** Implementa o conteúdo editorial do shopping — notícias (WYSIWYG, categorias, agendamento), eventos (com arquivamento automático), sub-módulo Teatro, promoções (com/sem vínculo a loja) e cadastro de serviços.

## Objetivo

Dar ao tenant ferramentas editoriais para publicar e gerenciar conteúdo dinâmico do shopping com mínimo treinamento, e ao visitante uma forma agradável de consumi-lo.

## Escopo

**DENTRO:**
- **Notícias:** schema (tenant_id, título, slug, conteúdo HTML, categoria, autor, publicado_em, agendado_para, status), admin com WYSIWYG (TipTap ou similar), categorias, publicação programada (job que ativa quando `agendado_para <= now`)
- **Eventos:** schema (tenant_id, título, descrição, data_inicio, data_fim, local, imagem, destaque, status), arquivamento automático ao encerrar (job que move para `status=archived` quando `data_fim < now`)
- **Teatro:** sub-módulo de eventos (mesmo schema + flag `tipo=teatro` ou tabela separada — decidir na ativação) para sessões teatrais
- **Promoções:** schema (tenant_id, título, descrição, loja_id NULL, validade_inicio, validade_fim, imagem), CRUD admin, listagem pública com filtro por validade
- **Serviços:** cadastro simples (tenant_id, nome, descrição, ícone, ordem) — sem agendamento ou booking
- Frontend público: `/noticias`, `/noticias/[slug]`, `/eventos`, `/eventos/[slug]`, `/teatro`, `/promocoes`, `/servicos`
- Cache Redis 5 min em listagens (§9)

**FORA:**
- Booking/reserva de serviços
- Comentários ou interação social em notícias/eventos
- Push notifications de eventos
- Newsletter de promoções (Fase 4 — newsletter geral)

## Implementação

- WYSIWYG: TipTap (controle granular, extensível) ou Quill — decidir na ativação. Output sanitizado server-side antes de salvar
- Job de publicação programada e arquivamento de eventos: cron a cada 5 min (Vercel Cron / sidekiq / equivalente)
- Promoções com `loja_id NULL` aparecem em listagem geral; com `loja_id` aparecem também na página da loja
- Permissões: Editor pode tudo no editorial; Tenant Admin idem; Superadmin idem
- ISR (60s, §9) para `/noticias/[slug]`, `/eventos/[slug]` — invalida sob demanda quando publicado/atualizado

## Critério de aceite

- [ ] Editor consegue criar notícia, agendar publicação para data futura, e ela ativa sozinha
- [ ] Evento com `data_fim` passada arquiva automaticamente em até 5 min
- [ ] Promoção sem loja aparece em `/promocoes` mas não em página de loja específica
- [ ] Promoção com loja aparece nas duas
- [ ] WYSIWYG sanitiza HTML perigoso (testar paste de `<script>`)
- [ ] Sub-módulo Teatro herda comportamento de evento mas tem listagem própria em `/teatro`
- [ ] Páginas de detalhe ISR — primeira request lenta, demais rápidas
- [ ] Isolamento por tenant validado em todas as 5 entidades
- [ ] **Features tocadas (noticias, eventos, teatro, promocoes, servicos) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
