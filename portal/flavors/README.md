# Flavors — identidade visual por tenant

Cada subpasta deste diretório representa um **tenant** (shopping center) e contém a identidade visual completa daquele tenant: cores, fontes, meta tags, redes sociais, contato e assets (logo, favicon, og-image).

## Estrutura

```
flavors/
├── _default/                  # fallback de assets ausentes em qualquer tenant
│   ├── theme.json             # config completa (todos os campos preenchidos)
│   ├── logo.svg               # logo placeholder
│   └── favicon.ico            # favicon padrão
└── <slug>/                    # uma pasta por tenant — o slug bate com tenants.flavor_slug no banco
    ├── theme.json             # obrigatório
    ├── logo.svg               # obrigatório
    ├── favicon.ico            # obrigatório
    └── og-image.jpg           # opcional (fallback em _default/)
```

## Princípio

White-label aqui é **build-time**: branding versionado em git, edição apenas via PR + deploy. Nunca há edição em runtime.

A tabela `tenants` no banco guarda apenas identidade **operacional** (`id`, `slug`, `host`, `flavor_slug`, ...). Toda identidade **visual** vive aqui.

Decisão registrada em SPEC-20260503-1505 (2026-05-08).

## Adicionando um novo tenant

1. Criar pasta `flavors/<novo-slug>/`
2. Copiar `_default/theme.json` e ajustar (cores, meta, social, contato)
3. Adicionar `logo.svg` e `favicon.ico` reais
4. Adicionar tenant no banco via migration ou SQL: `INSERT INTO tenants (slug, host, flavor_slug, ...) VALUES (...)`
5. CI valida correspondência tabela ↔ pasta no PR

## Schema de `theme.json`

Validado em build via TypeScript (`portal/src/lib/theme/types.ts` — a criar). Estrutura:

```json
{
  "name": "string",
  "colors": {
    "primary": "string (hex)",
    "secondary": "string (hex)",
    "text": "string (hex)",
    "background": "string (hex)"
  },
  "fonts": {
    "primary": "string (Google Font name)"
  },
  "meta": {
    "title": "string",
    "description": "string",
    "ogImage": "string (path)"
  },
  "social": {
    "instagram": "string | null",
    "facebook": "string | null",
    "youtube": "string | null",
    "tiktok": "string | null"
  },
  "contact": {
    "phone": "string | null",
    "email": "string | null",
    "address": "string | null"
  }
}
```
