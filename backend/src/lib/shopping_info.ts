import type { ShoppingInfoRequestDto, ValidationError } from '../dtos/ShoppingInfoDto';

// Regex permissivo: aceita (61) 3000-0000, +55 61 3000-0000, 61300000000
const PHONE_REGEX = /^[\d\s\(\)\+\-]{7,20}$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// HH:MM
const TIME_REGEX = /^\d{2}:\d{2}$/;

const VALID_DAYS = ['weekdays', 'saturday', 'sunday', 'holidays'] as const;

function validateUrl(value: string | null | undefined, field: string): ValidationError | null {
  if (!value) return null;
  if (!value.startsWith('https://')) {
    return { field, message: `${field} deve começar com https://` };
  }
  try {
    new URL(value);
    return null;
  } catch {
    return { field, message: `${field} não é uma URL válida` };
  }
}

function validateOpeningHours(value: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    errors.push({ field: 'opening_hours', message: 'opening_hours deve ser um objeto' });
    return errors;
  }

  const areas = value as Record<string, unknown>;

  for (const [areaName, areaDays] of Object.entries(areas)) {
    if (typeof areaDays !== 'object' || areaDays === null || Array.isArray(areaDays)) {
      errors.push({
        field: `opening_hours.${areaName}`,
        message: `opening_hours.${areaName} deve ser um objeto com dias`,
      });
      continue;
    }

    const days = areaDays as Record<string, unknown>;
    for (const [dayName, slot] of Object.entries(days)) {
      if (!VALID_DAYS.includes(dayName as (typeof VALID_DAYS)[number])) {
        errors.push({
          field: `opening_hours.${areaName}.${dayName}`,
          message: `Dia inválido: "${dayName}". Use: weekdays, saturday, sunday, holidays`,
        });
        continue;
      }
      if (typeof slot !== 'object' || slot === null) {
        errors.push({
          field: `opening_hours.${areaName}.${dayName}`,
          message: 'Deve ser um objeto { open, close }',
        });
        continue;
      }
      const s = slot as Record<string, unknown>;
      if (typeof s.open !== 'string' || !TIME_REGEX.test(s.open)) {
        errors.push({
          field: `opening_hours.${areaName}.${dayName}.open`,
          message: 'Formato inválido. Use HH:MM (ex: 10:00)',
        });
      }
      if (typeof s.close !== 'string' || !TIME_REGEX.test(s.close)) {
        errors.push({
          field: `opening_hours.${areaName}.${dayName}.close`,
          message: 'Formato inválido. Use HH:MM (ex: 22:00)',
        });
      }
    }
  }

  return errors;
}

function validateParkingRates(value: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(value)) {
    errors.push({ field: 'parking_rates', message: 'parking_rates deve ser um array' });
    return errors;
  }
  if (value.length > 20) {
    errors.push({ field: 'parking_rates', message: 'parking_rates pode ter no máximo 20 itens' });
  }
  value.forEach((item, idx) => {
    if (typeof item !== 'object' || item === null) {
      errors.push({ field: `parking_rates[${idx}]`, message: 'Cada tarifa deve ser um objeto' });
      return;
    }
    const t = item as Record<string, unknown>;
    if (typeof t.label !== 'string' || t.label.trim() === '') {
      errors.push({ field: `parking_rates[${idx}].label`, message: 'label é obrigatório' });
    }
    if (typeof t.value !== 'string' || t.value.trim() === '') {
      errors.push({ field: `parking_rates[${idx}].value`, message: 'value é obrigatório' });
    }
  });

  return errors;
}

export function validateShoppingInfoPayload(body: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof body !== 'object' || body === null) {
    return [{ field: 'body', message: 'Payload inválido' }];
  }

  const data = body as Record<string, unknown>;

  if (typeof data.address !== 'string' || data.address.trim() === '') {
    errors.push({ field: 'address', message: 'address é obrigatório' });
  } else if (data.address.length > 500) {
    errors.push({ field: 'address', message: 'address deve ter no máximo 500 caracteres' });
  }

  if (data.address_lat !== undefined && data.address_lat !== null) {
    const lat = Number(data.address_lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push({ field: 'address_lat', message: 'address_lat deve ser um número entre -90 e 90' });
    }
  }

  if (data.address_lng !== undefined && data.address_lng !== null) {
    const lng = Number(data.address_lng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push({ field: 'address_lng', message: 'address_lng deve ser um número entre -180 e 180' });
    }
  }

  if (typeof data.phone !== 'string' || !PHONE_REGEX.test(data.phone)) {
    errors.push({ field: 'phone', message: 'phone inválido. Exemplos: (61) 3000-0000, +55 61 3000-0000' });
  }

  if (typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email)) {
    errors.push({ field: 'email', message: 'email inválido' });
  }

  errors.push(...validateOpeningHours(data.opening_hours));
  errors.push(...validateParkingRates(data.parking_rates));

  const urlFields = [
    'facebook_url',
    'instagram_url',
    'youtube_url',
    'linkedin_url',
    'tiktok_url',
  ] as const;
  for (const field of urlFields) {
    const err = validateUrl(data[field] as string | null | undefined, field);
    if (err) errors.push(err);
  }

  return errors;
}