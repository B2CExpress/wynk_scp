import { validateCreateTenant, validateUpdateTenant } from '../src/utils/tenantValidator';

const VALID_CREATE = {
  name: 'Shopping Novo',
  slug: 'shopping-novo',
  host: 'shoppingnovo.com.br',
  status: 'trial' as const,
  admin_email: 'admin@shoppingnovo.com.br',
  admin_password: 'TempPassword123!',
};

describe('validateCreateTenant', () => {
  it('aceita um payload válido (sem cores — branding via flavor)', () => {
    const { isValid, errors } = validateCreateTenant(VALID_CREATE);
    expect(isValid).toBe(true);
    expect(errors).toEqual({});
  });

  it('aceita flavor_slug válido', () => {
    const { isValid } = validateCreateTenant({ ...VALID_CREATE, flavor_slug: 'default' });
    expect(isValid).toBe(true);
  });

  it('rejeita flavor_slug com maiúsculas/símbolos', () => {
    const { isValid, errors } = validateCreateTenant({ ...VALID_CREATE, flavor_slug: 'Bad Slug' });
    expect(isValid).toBe(false);
    expect(errors.flavor_slug).toBeDefined();
  });

  it('rejeita nome curto demais', () => {
    const { isValid, errors } = validateCreateTenant({ ...VALID_CREATE, name: 'X' });
    expect(isValid).toBe(false);
    expect(errors.name).toBeDefined();
  });

  it('rejeita slug com caracteres inválidos', () => {
    const { errors } = validateCreateTenant({ ...VALID_CREATE, slug: 'Shopping_Novo' });
    expect(errors.slug).toBeDefined();
  });

  it.each(['localhost', '127.0.0.1', '0.0.0.0', '192.168.0.1'])(
    'rejeita host local/IP: %s',
    (host) => {
      const { errors } = validateCreateTenant({ ...VALID_CREATE, host });
      expect(errors.host).toBeDefined();
    },
  );

  it('rejeita email inválido', () => {
    const { errors } = validateCreateTenant({ ...VALID_CREATE, admin_email: 'nope' });
    expect(errors.admin_email).toBeDefined();
  });

  it('rejeita senha com menos de 12 caracteres', () => {
    const { errors } = validateCreateTenant({ ...VALID_CREATE, admin_password: 'curta' });
    expect(errors.admin_password).toBeDefined();
  });

  it('rejeita status fora do enum', () => {
    const { errors } = validateCreateTenant({
      ...VALID_CREATE,
      status: 'bananas' as never,
    });
    expect(errors.status).toBeDefined();
  });
});

describe('validateUpdateTenant', () => {
  it('aceita payload válido', () => {
    const { isValid } = validateUpdateTenant({
      name: 'Novo Nome',
      host: 'novo.com.br',
      status: 'active',
    });
    expect(isValid).toBe(true);
  });

  it('rejeita host local', () => {
    const { errors } = validateUpdateTenant({
      name: 'Novo Nome',
      host: 'localhost',
      status: 'active',
    });
    expect(errors.host).toBeDefined();
  });
});
