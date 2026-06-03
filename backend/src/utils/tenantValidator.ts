export interface CreateTenantPayload {
  name: string;
  slug: string;
  host: string;
  status: 'active' | 'trial' | 'inactive' | 'suspended';
  primary_color?: string | null;
  secondary_color?: string | null;
  admin_email: string;
  admin_password: string;
}

export interface UpdateTenantPayload {
  name: string;
  host: string;
  status: 'active' | 'trial' | 'inactive' | 'suspended';
}

export function validateCreateTenant(data: Partial<CreateTenantPayload>) {
  const errors: { [key: string]: string } = {};

  // Validação do Nome
  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 200) {
    errors.name = "O nome deve conter entre 2 e 200 caracteres.";
  }

  // Validação do Slug (Apenas minúsculas, números e hífen)
  const slugRegex = /^[a-z0-9-]+$/;
  if (!data.slug || !slugRegex.test(data.slug) || data.slug.length < 2 || data.slug.length > 100) {
    errors.slug = "Slug inválido. Use apenas letras minúsculas, números e hífens (ex: shopping-novo).";
  }

  // Validação do Host (Rejeita localhost, IPs locais e formatos inválidos)
  const hostRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  if (!data.host || !hostRegex.test(data.host)) {
    errors.host = "Formato de hostname/domínio inválido.";
  } else {
    const lowerHost = data.host.toLowerCase().trim();
    if (
      lowerHost === 'localhost' || 
      lowerHost === '127.0.0.1' || 
      lowerHost === '0.0.0.0' || 
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lowerHost)
    ) {
      errors.host = "Hosts locais ou IPs de rede não são permitidos como domínio corporativo.";
    }
  }

  // Validação do Status
  const validStatuses = ['active', 'trial', 'inactive', 'suspended'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.status = "O status deve ser: active, trial, inactive ou suspended.";
  }

  // Validação do Email do Admin
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.admin_email || !emailRegex.test(data.admin_email)) {
    errors.admin_email = "Insira um endereço de e-mail válido.";
  }

  // Validação da Senha Temporária (Mínimo 12 caracteres)
  if (!data.admin_password || data.admin_password.length < 12) {
    errors.admin_password = "A senha temporária do administrador deve possuir no mínimo 12 caracteres.";
  }

  // Validação Opcional das Cores (Hexadecimal #RRGGBB)
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (data.primary_color && !hexRegex.test(data.primary_color)) {
    errors.primary_color = "A cor primária deve ser um Hexadecimal válido (ex: #0066CC).";
  }
  if (data.secondary_color && !hexRegex.test(data.secondary_color)) {
    errors.secondary_color = "A cor secundária deve ser um Hexadecimal válido (ex: #003D7A).";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateUpdateTenant(data: Partial<UpdateTenantPayload>) {
  const errors: { [key: string]: string } = {};

  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 200) {
    errors.name = "O nome deve conter entre 2 e 200 caracteres.";
  }

  const hostRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  if (!data.host || !hostRegex.test(data.host)) {
    errors.host = "Formato de hostname inválido.";
  } else {
    const lowerHost = data.host.toLowerCase().trim();
    if (lowerHost === 'localhost' || lowerHost === '127.0.0.1' || lowerHost === '0.0.0.0') {
      errors.host = "Endereços locais não são permitidos.";
    }
  }

  const validStatuses = ['active', 'trial', 'inactive', 'suspended'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.status = "Status inválido.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}