# Feature: theme-system

**Keywords:** tema, design-tokens, css-variables, layout-raiz, branding-tenant, identidade-visual, flavors, white-label, build-time, modelo-a
**Arquivos principais:**
  - `portal/public/flavors/_default/{theme.json,logo.svg,favicon.ico}` (fallback de assets)
  - `portal/public/flavors/shopping-x/{theme.json,logo.svg,favicon.ico}` (tenant exemplo)
  - `portal/src/lib/theme/types.ts` (schema TS de `theme.json`)
  - `portal/src/lib/theme/load.ts` (`loadTheme(slug)` via `node:fs/promises` + fallback `_default`; `flavorAssets(slug)` retorna URLs canônicas)
  - `portal/src/lib/tenant/resolve.ts` (resolve host → flavor via backend `/tenant/resolve`)
  - `portal/src/app/layout.tsx` (`generateMetadata()` dinâmico + RootLayout aplica CSS vars + Google Font preconnect + `notFound()` em host desconhecido)
  - `portal/src/app/page.tsx` (homepage temporária pra validação visual)
  - `portal/src/app/globals.css` (variáveis CSS sem default hard-coded)
  - `seeds/tenants.json` (raiz; fonte canônica `tb_tenant` ↔ `portal/public/flavors/<slug>/`)
  - `scripts/validate-flavors.mjs` (CI: cada slug em `seeds/tenants.json` tem pasta + schema válido)
  - `.github/workflows/ci.yml` (job `validate-flavors`)
  - `.prettierignore` (exclui `next-env.d.ts` regenerado pelo Next 16 com aspas duplas)
**Resumo:** Identidade visual de cada tenant em `portal/public/flavors/<slug>/{theme.json, logo.svg, favicon.ico}`, versionada em git (Modelo A — build-time, sem painel runtime). Portal Next.js SSR lê `Host`, resolve flavor via backend, carrega `theme.json` server-side, aplica CSS variables no `<html style>`, injeta `<title>`/`<meta>`/`<link rel="icon">`. Branding nunca passa pelo banco — edição = PR + deploy. CI valida `tenant_flavor_slug` ↔ existência da pasta + shape do `theme.json`.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260503-1505 | 2026-05-11 | `968d389` | Base da plataforma multitenant |
| SPEC-20260512-1900 | 2026-05-13 | `43424f3` | Validação ponta-a-ponta da Fase 1 Multitenant |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

### Estrutura de flavors

```
portal/public/flavors/
  _default/
    theme.json
    logo.svg
    favicon.ico
  shopping-x/
    theme.json       # cores roxo/laranja, font Poppins
    logo.svg         # placeholder visual diferente do _default
    favicon.ico
```

Servido nativamente pelo Next em `https://<host>/flavors/<slug>/...` (era `portal/flavors/` em uma versão anterior; movido pra `public/` na fase 4 pra Next servir sem API route).

### Schema `theme.json`

```ts
interface Theme {
  name: string;
  colors: { primary: string; secondary: string; text: string; background: string };
  fonts: { primary: string };  // Google Font name
  meta: { title: string; description: string; ogImage: string };
  social: { instagram: string|null; facebook: string|null; youtube: string|null; tiktok: string|null };
  contact: { phone: string|null; email: string|null; address: string|null };
}
```

`_default/theme.json` cobre todos os campos obrigatórios (cores Slate, font Inter, meta padrão, social/contact null).

### Pipeline SSR

`app/layout.tsx`:
1. `(await headers()).get('host')` → host da request
2. `resolveTenantByHost(host)` → chama backend `GET /tenant/resolve` com `X-Forwarded-Host` (não `Host`, ver Gotcha em `tenant-resolution`). Cache `no-store` no fetch (Redis backend já cacheia).
3. Host desconhecido → `notFound()` (404 do Next)
4. `loadTheme(flavorSlug)` → lê `portal/public/flavors/<slug>/theme.json` via `node:fs/promises`. Fallback pra `_default` se arquivo faltar.
5. Aplica:
   - CSS vars no `<html style={{...}}>`: `--color-primary`, `--color-secondary`, `--color-text`, `--color-background`, `--font-primary`
   - `<title>` + `<meta name="description">` via `generateMetadata()`
   - `<link rel="icon" href="/flavors/<slug>/favicon.ico" />`
   - Google Font preconnect + stylesheet com `theme.fonts.primary`

`globals.css` referencia apenas `var(--color-*)` e `var(--font-primary)` — sem fallback hard-coded.

### Manifesto + validação CI

`seeds/tenants.json` na raiz é a fonte canônica que liga slug operacional ↔ flavor folder:

```json
[
  { "slug": "shopping-x", "host": "shopping-x.local", "flavorSlug": "shopping-x", "name": "Shopping X" }
]
```

`scripts/validate-flavors.mjs` (job CI `validate-flavors`):
1. Pra cada entry do JSON: verifica existência de `portal/public/flavors/<flavorSlug>/{theme.json, logo.svg, favicon.ico}`.
2. Valida shape do `theme.json` (campos obrigatórios + tipos).
3. Falha CI se algum estiver faltando ou inválido.

Sem necessidade de DB pra rodar — JSON é fonte canônica. **Mesmo arquivo é consumido pelo `seed` do backend** (cria tenants no DB), então drift entre "branding versionado" e "tenant no DB" é impossível.

> Última atualização: 2026-05-11 09:00 (SPEC-20260503-1505)

## Decisões arquiteturais ativas

- **White-label = Modelo A (build-time, flavor folder)** (origem: SPEC-20260503-1505, 2026-05-08 15:33) — Branding versionado em git. Edição = PR + deploy. Sem painel runtime. Quote literal do dev: "se deixamos tudo na base podemos alterar em produção sem testar antes; em arquivos a única forma é publicando uma nova versão e promovendo". Diverge intencionalmente do `wynk_ecommerce` (que usa Modelo B / `tb_white_label_config`).
- **`tb_tenant` sem colunas de branding** (origem: SPEC-20260503-1505, 2026-05-08 15:33) — Identidade visual NUNCA passa pelo banco. `tenant_flavor_slug` é só o ponteiro pra pasta.
- **Flavors em `portal/public/flavors/`** (origem: SPEC-20260503-1505, 2026-05-09 09:55) — Next serve assets nativamente em `/flavors/<slug>/...`. Alternativa de API route foi rejeitada por complexidade desnecessária.
- **`seeds/tenants.json` é fonte canônica única** (origem: SPEC-20260503-1505, 2026-05-09 09:55) — Mesmo arquivo alimenta `validate-flavors` (CI) e `npm run seed -w backend` (DB). Drift entre "pasta versionada" e "tenant operacional" é impossível.
- **Tipagem forte de `theme.json` em build** (origem: SPEC-20260503-1505, 2026-05-09 09:55) — `Theme` em TS + validação no CI. Errar nome de cor ou esquecer campo quebra o pipeline.
- **`_default/` como fallback de assets ausentes** (origem: SPEC-20260503-1505, 2026-05-08 15:33) — `og-image.jpg` e demais opcionais caem em `_default/` se ausentes no tenant.

## Alternativas consideradas e rejeitadas

- **Modelo B (branding em DB com `tb_white_label_config`)** (2026-05-08 15:33) — Padrão `wynk_ecommerce`. Permite editar branding em runtime via admin. Rejeitada pela política do dev de "não alterar prod sem deploy".
- **Modelo C (híbrido — assets em pasta, dados estruturados em DB)** (2026-05-08 15:33) — Cores no DB violariam a regra "branding só via deploy". Rejeitada.
- **CDN externa + signed URLs pra flavors** (2026-05-08 15:33) — Overkill pro MVP. Next serve `public/` direto.
- **API route do Next servindo flavors** (2026-05-09 09:55) — Mais complexa que `portal/public/flavors/`. Sem ganho.

## Gotchas

- **`next-env.d.ts` regenerado pelo Next 16 com aspas duplas** (2026-05-09 09:55) — Turbopack regrava o arquivo com `import "./.next/dev/types/routes.d.ts"`, violando `singleQuote: true` do prettier. Arquivo é autogerado com header "should not be edited". Fix: adicionar ao `.prettierignore`.
- **Host header reescrito por undici (fetch nativo do Node)** (2026-05-09 09:55) — Portal chamava backend com `headers: { Host: host }` mas undici sobrescreve `Host` a partir da URL → backend recebia `localhost:3001` e respondia 404. Fix: trocar pra `X-Forwarded-Host` (também é padrão de proxy reverso real). Backend já tinha `app.set('trust proxy', true)` desde fase 3.
- **Containers Docker caem entre sessões** (2026-05-09 09:55) — Provável reboot. Volumes persistem (tenant `shopping-x` segue no DB). Re-up com `docker-compose up -d`.
- **`notFound()` em `portal/src/app/layout.tsx:37` viola contrato do Next App Router** (2026-05-13 19:00, descoberto na [[SPEC-20260513-0910]] durante validação humana do setup local) — Next App Router exige que o **root layout** sempre renderize `<html>` e `<body>`. A chamada `notFound()` quando `tenant` é `null` dispara erro `notFound() is not allowed to use in root layout`. Acontece toda vez que o host da request não bate com nenhum `tenant_host` cadastrado. **Workaround atual** (aplicado na SPEC-20260513-0910 pra dev local): cadastrar `host: localhost` no `seeds/tenants.json` evita disparar a chamada. **Fix correto** (não aplicado — escopo era setup local): mover o check pra `page.tsx` (que pode chamar `notFound()` legalmente) OU fazer o layout renderizar com fallback `_default` quando `tenant` é `null`. Abrir SPEC de fix quando virar dor recorrente em prod (ex.: tenant deletado, host typo, etc.).

## Estado congelado (se houver)

_(nenhum)_
