export interface IntegrationsPayload {
  ga4_measurement_id?: string | null;
  meta_pixel_id?: string | null;
  app_store_url?: string | null;
  play_store_url?: string | null;
  popup_show_rule: 'always' | 'once_per_session' | 'once_per_day' | 'once_ever';
}

export function validateIntegrations(data: Partial<IntegrationsPayload>) {
  const errors: { [key: string]: string } = {};

  // Valida padrão GA4 (G-XXXXXX) e rejeita o formato antigo (UA-XXXXXX)
  if (data.ga4_measurement_id) {
    if (!/^G-[A-Z0-9]{6,}$/.test(data.ga4_measurement_id)) {
      errors.ga4_measurement_id = "Formato inválido. Use o padrão GA4 (G-XXXXXX).";
    }
  }

  // Valida se possui de 15 a 16 dígitos numéricos
  if (data.meta_pixel_id) {
    if (!/^\d{15,16}$/.test(data.meta_pixel_id)) {
      errors.meta_pixel_id = "O ID do Pixel deve conter de 15 a 16 dígitos numéricos.";
    }
  }

  // Valida o início da URL da App Store
  if (data.app_store_url && !data.app_store_url.startsWith('https://apple.com')) {
    errors.app_store_url = "A URL deve começar com https://apple.com";
  }

  // Valida o início da URL da Play Store
  if (data.play_store_url && !data.play_store_url.startsWith('https://google.com')) {
    errors.play_store_url = "A URL deve começar com https://google.com";
  }

  // Valida as opções aceitas pelo popup
  const validRules = ['always', 'once_per_session', 'once_per_day', 'once_ever'];
  if (data.popup_show_rule && !validRules.includes(data.popup_show_rule)) {
    errors.popup_show_rule = "Regra de exibição inválida.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}