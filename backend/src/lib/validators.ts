import { z } from 'zod';

export const slugRegex = /^[a-z0-9-]+$/;

function normalizeTrimmedString(
  value: unknown,
  options?: { emptyAs?: 'null' | 'undefined' },
): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }

  if (options?.emptyAs === 'null') {
    return null;
  }

  if (options?.emptyAs === 'undefined') {
    return undefined;
  }

  return trimmed;
}

function mapZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_';
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return errors;
}

function validateWithSchema<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: mapZodErrors(result.error) };
}

export const StoreAdminInputSchema = z.object({
  name: z.preprocess(
    (value) => normalizeTrimmedString(value),
    z.string().min(2, 'name must be at least 2 characters').max(200, 'name must not exceed 200 characters').optional(),
  ),
  slug: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z
      .string()
      .regex(slugRegex, 'slug must contain only lowercase letters, numbers, and hyphens')
      .max(200, 'slug must not exceed 200 characters')
      .optional()
      .nullable(),
  ),
  description: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z.string().max(10000, 'description must not exceed 10000 characters').optional().nullable(),
  ),
  logo_url: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z.string().url('logo_url must be a valid URL').optional().nullable(),
  ),
  cover_image_url: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z.string().url('cover_image_url must be a valid URL').optional().nullable(),
  ),
  external_url: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z.string().url('external_url must be a valid URL').optional().nullable(),
  ),
  floor: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z.string().max(50, 'floor must not exceed 50 characters').optional().nullable(),
  ),
  phone: z.preprocess(
    (value) => normalizeTrimmedString(value, { emptyAs: 'null' }),
    z.string().max(20, 'phone must not exceed 20 characters').optional().nullable(),
  ),
  opening_hours: z.record(z.string(), z.unknown()).optional().nullable(),
  is_featured: z.boolean().optional(),
  is_restaurant: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  sort_order: z.number().int().optional(),
  category_ids: z.array(z.string().uuid()).optional().nullable(),
});

export type StoreAdminInput = z.infer<typeof StoreAdminInputSchema>;

export function validateStoreInput(
  data: unknown,
): { success: true; data: StoreAdminInput } | { success: false; errors: Record<string, string> } {
  return validateWithSchema(StoreAdminInputSchema, data);
}

export const CreateStoreSchema = StoreAdminInputSchema.extend({
  name: z
    .string()
    .min(2, 'name is required and must be at least 2 characters')
    .max(200, 'name must not exceed 200 characters'),
});

export function validateCreateStore(
  data: unknown,
): { success: true; data: z.infer<typeof CreateStoreSchema> } | {
  success: false;
  errors: Record<string, string>;
} {
  return validateWithSchema(CreateStoreSchema, data);
}
