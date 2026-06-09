# SPEC-20260608-1000: Módulo de Dados do Shopping (endereço, horários, redes)

**Status:** active
**Criada:** 2026-06-08 10:00
**Ativada:** 2026-06-08 10:00
**Concluída:** —
**Commit final:** —
**Keywords:** shopping_info, dados-institucionais, endereco, horarios, redes-sociais, estacionamento, upsert, redis-cache
**Features:** shopping-info
**Branch:** feature/shopping-info
**Depende de:** —
**Origem:** usuário em 2026-06-08 10:00
**Resumo:** Criar tabela `shopping_info`, endpoints REST GET/PUT `/api/admin/settings/info` com validação, UPSERT, invalidação de cache Redis e permissões por role, permitindo que o admin edite dados institucionais do shopping sem intervenção de dev.

## Objetivo

Dados institucionais do shopping (endereço, telefone, horários, redes sociais, tarifas de estacionamento) precisam ser editáveis pelo tenant_admin via painel, pois hoje qualquer mudança requer alteração de código. A tela `/admin/settings/info` no backoffice e os endpoints no backend entregam essa capacidade. Dados consumidos por header, footer e menu lateral do portal via cache Redis.

## Escopo

**DENTRO:**
- Migration que cria tabela `shopping_info` no schema `scp` com todos os campos e constraint UNIQUE(tenant_id)
- Entity TypeORM `ShoppingInfo`
- Repository com métodos `findByTenantId` e `upsert`
- Service com validação de regras de negócio, UPSERT e invalidação de cache
- Controller com rotas GET e PUT protegidas por JWT + role check
- Validator de payload (address, phone, email, URLs, opening_hours, parking_rates, coordenadas)
- Registro das rotas em `src/routes/index.ts` (ou equivalente no projeto)

**FORA:**
- UI do backoffice (componentes HoursEditor, ParkingRatesEditor, SocialLinksEditor — escopo de SPEC separada)
- Integração com Google Maps Embed no frontend
- Consumo dos dados no portal (header, footer, menu lateral — SPEC separada)
- Autenticação/JWT (já existente)
- Middleware de tenant context (já existente)

## Implementação

### Banco de dados

Tabela `scp.shopping_info`:

```sql
id             uuid          PK DEFAULT gen_random_uuid()
tenant_id      uuid          FK → scp.tb_tenant(tenant_id) ON DELETE CASCADE, UNIQUE
address        text          NOT NULL
address_lat    decimal(10,7) nullable
address_lng    decimal(10,7) nullable
phone          varchar(20)   NOT NULL
phone_secondary varchar(20)  nullable
email          varchar(200)  NOT NULL
opening_hours  jsonb         NOT NULL DEFAULT '{}'
parking_rates  jsonb         NOT NULL DEFAULT '[]'
facebook_url   text          nullable
instagram_url  text          nullable
youtube_url    text          nullable
linkedin_url   text          nullable
tiktok_url     text          nullable
created_at     timestamp     DEFAULT NOW()
updated_at     timestamp     DEFAULT NOW()
```

Índices: PK(id), UNIQUE(tenant_id).

### Endpoints

- `GET /api/admin/settings/info` → 200 com dados ou objeto vazio se nunca preenchido | 401 | 403
- `PUT /api/admin/settings/info` → 200 `{ok: true, updated_at}` | 400 com erros por campo | 401 | 403

### Validação (validator)

| Campo | Regra |
|---|---|
| address | não vazio, max 500 chars |
| address_lat | decimal, [-90, 90], opcional |
| address_lng | decimal, [-180, 180], opcional |
| phone | regex permissivo: `[\d\s\(\)\+\-]{7,20}` |
| email | regex RFC-like |
| opening_hours | objeto; cada área tem dias; cada dia tem `{open, close}` em `HH:MM` |
| parking_rates | array de `{label: string, value: string}`, max 20 itens |
| *_url | opcional; se presente, deve iniciar com `https://` |

### Cache

Chave: `tenant:info:{tenant_id}`. TTL: 5 min. Invalidar com `redis.del` após UPSERT bem-sucedido.

### Permissões

- `editor` → 403
- `tenant_admin` → acesso completo ao próprio tenant
- `superadmin` → acesso completo a qualquer tenant

### Arquivos a criar/modificar

| Ação | Caminho |
|---|---|
| criar | `backend/src/migrations/1749380400000-CreateShoppingInfo.ts` |
| criar | `backend/src/entities/ShoppingInfo.ts` |
| criar | `backend/src/repositories/ShoppingInfoRepository.ts` |
| criar | `backend/src/services/ShoppingInfoService.ts` |
| criar | `backend/src/controllers/ShoppingInfoController.ts` |
| criar | `backend/src/dtos/ShoppingInfoDto.ts` |
| criar | `backend/src/routes/shoppingInfo.routes.ts` |
| criar | `portal/src/lib/validators/shopping_info.ts` |
| modificar | `backend/src/routes/index.ts` (registrar rota) |
| criar | `docs/features/shopping-info.md` |

## Critério de aceite

- [ ] Migration cria tabela `shopping_info` com UNIQUE(tenant_id) e FK para `tb_tenant`
- [ ] GET retorna dados existentes ou `{}` se nunca preenchido (nunca 404)
- [ ] PUT faz UPSERT correto — nunca insere 2 registros para o mesmo tenant
- [ ] Validação rejeita email inválido, phone com letras, URL sem https://, coordenadas fora do range
- [ ] opening_hours aceita estrutura aninhada com múltiplas áreas
- [ ] parking_rates aceita array de objetos `{label, value}`, rejeita array com > 20 itens
- [ ] Cache `tenant:info:{tenant_id}` é invalidado após PUT bem-sucedido
- [ ] Editor recebe 403 em GET e PUT
- [ ] Tenant_admin acessa apenas dados do próprio tenant
- [ ] Superadmin acessa qualquer tenant
- [ ] **Features tocadas (shopping-info) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado