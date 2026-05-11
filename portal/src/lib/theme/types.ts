/**
 * Schema TypeScript de `public/flavors/<slug>/theme.json`.
 *
 * Build-time white-label (Modelo A — SPEC-20260503-1505): a identidade visual
 * de cada tenant vive versionada em git. Edição só por PR + deploy.
 *
 * Quando adicionar campos aqui, atualizar:
 *   - `_default/theme.json` (fallback)
 *   - `README.md` da pasta `flavors/`
 *   - script de validação CI (a criar)
 */
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  fonts: {
    primary: string;
  };
  meta: {
    title: string;
    description: string;
    ogImage: string;
  };
  social: {
    instagram: string | null;
    facebook: string | null;
    youtube: string | null;
    tiktok: string | null;
  };
  contact: {
    phone: string | null;
    email: string | null;
    address: string | null;
  };
}
