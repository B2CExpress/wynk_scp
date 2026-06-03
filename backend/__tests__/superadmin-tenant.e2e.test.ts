import request from 'supertest';
import type { Request, Response } from 'express';
import { createApp } from '../src/app';
import { makeAppDeps, makeFakeTenantResolver } from './helpers/mock-deps';
import { signAccessToken } from '../src/utils/jwt';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../src/middleware/require-auth';
import { AuthService } from '../src/services/auth.service';
import { AuthController } from '../src/controllers/auth.controller';
import { hashPassword } from '../src/utils/passwords';
import type { SuperadminTenantController } from '../src/controllers/superadminTenantController';
import type { TenantRepository } from '../src/repositories/tenant.repository';
import type { UserRepository } from '../src/repositories/user.repository';
import type { RefreshTokenRepository } from '../src/repositories/refresh-token.repository';
import type { User } from '../src/entities/User';
import { RefreshToken } from '../src/entities/RefreshToken';

process.env.NODE_ENV = 'test';

/** Controller fake que sempre responde 200 — usado p/ testar SÓ o gate de auth. */
function makeOkSuperadminController(): SuperadminTenantController {
  const ok = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ reached: true });
  };
  return { list: ok, create: ok, update: ok, remove: ok } as unknown as SuperadminTenantController;
}

function superadminCookie(): string {
  const token = signAccessToken({ sub: 'su-1', role: 'superadmin' });
  return `${ACCESS_COOKIE}=${token}`;
}

function tenantAdminCookie(): string {
  const token = signAccessToken({
    sub: 'u-1',
    tenantId: 't-1',
    tenantSlug: 'shopping-x',
    tenantFlavorSlug: 'shopping-x',
    role: 'tenant_admin',
  });
  return `${ACCESS_COOKIE}=${token}`;
}

describe('autorização de /api/superadmin/tenants', () => {
  const app = createApp(makeAppDeps({ superadminTenantController: makeOkSuperadminController() }));

  it('401 sem cookie de acesso', async () => {
    const res = await request(app).get('/api/superadmin/tenants');
    expect(res.status).toBe(401);
  });

  it('403 para tenant_admin', async () => {
    const res = await request(app)
      .get('/api/superadmin/tenants')
      .set('Cookie', tenantAdminCookie());
    expect(res.status).toBe(403);
  });

  it('200 para superadmin (chega no controller, sem abrir contexto de tenant)', async () => {
    const res = await request(app)
      .get('/api/superadmin/tenants')
      .set('Cookie', superadminCookie());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reached: true });
  });

  it('403 para tenant_admin também em POST/PUT/DELETE', async () => {
    const cookie = tenantAdminCookie();
    expect((await request(app).post('/api/superadmin/tenants').set('Cookie', cookie)).status).toBe(
      403,
    );
    expect(
      (await request(app).put('/api/superadmin/tenants/x').set('Cookie', cookie)).status,
    ).toBe(403);
    expect(
      (await request(app).delete('/api/superadmin/tenants/x').set('Cookie', cookie)).status,
    ).toBe(403);
  });
});

// ---- Login de superadmin ----

const SU_ID = '99999999-9999-9999-9999-999999999999';
const SU_PASSWORD = 'superadmin123!';

async function makeAppWithSuperadminAuth() {
  const su: User = {
    id: SU_ID,
    tenantId: null,
    email: 'super@scp.local',
    passwordHash: await hashPassword(SU_PASSWORD),
    name: 'Superadmin',
    role: 'superadmin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tenantRepo = {
    findBySlug: async () => null,
    findById: async () => null,
    findByHost: async () => null,
  } as unknown as TenantRepository;

  const userRepo = {
    findSuperadminByEmail: async (email: string) => (email === su.email ? su : null),
    findByTenantAndEmail: async () => null,
    findById: async (id: string) => (id === SU_ID ? su : null),
    save: async (u: User) => u,
  } as unknown as UserRepository;

  const store = new Map<string, RefreshToken>();
  let n = 0;
  const refreshTokenRepo = {
    findValidByHash: async (h: string) => {
      const t = store.get(h);
      if (!t || t.revokedAt || t.expiresAt.getTime() <= Date.now()) return null;
      return t;
    },
    findAnyByHash: async (h: string) => store.get(h) ?? null,
    save: async (t: RefreshToken) => {
      if (!t.id) t.id = `tok-${++n}`;
      store.set(t.tokenHash, t);
      return t;
    },
    revoke: async () => undefined,
    revokeAllForUser: async () => undefined,
  } as unknown as RefreshTokenRepository;

  const authService = new AuthService(tenantRepo, userRepo, refreshTokenRepo);
  const authController = new AuthController(authService, userRepo);
  return createApp(makeAppDeps({ tenantResolver: makeFakeTenantResolver(), authController }));
}

describe('POST /auth/superadmin/login', () => {
  it('200 + cookies em credenciais válidas (não é capturado por /auth/:slug/login)', async () => {
    const app = await makeAppWithSuperadminAuth();
    const res = await request(app)
      .post('/auth/superadmin/login')
      .send({ email: 'super@scp.local', password: SU_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { id: SU_ID, email: 'super@scp.local', name: 'Superadmin', role: 'superadmin' },
    });
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((c) => c.startsWith(`${ACCESS_COOKIE}=`))).toBe(true);
    expect(setCookie.some((c) => c.startsWith(`${REFRESH_COOKIE}=`))).toBe(true);
  });

  it('401 em senha errada', async () => {
    const app = await makeAppWithSuperadminAuth();
    const res = await request(app)
      .post('/auth/superadmin/login')
      .send({ email: 'super@scp.local', password: 'errada' });
    expect(res.status).toBe(401);
  });

  it('401 quando não existe superadmin com aquele email', async () => {
    const app = await makeAppWithSuperadminAuth();
    const res = await request(app)
      .post('/auth/superadmin/login')
      .send({ email: 'ninguem@scp.local', password: SU_PASSWORD });
    expect(res.status).toBe(401);
  });

  it('400 quando faltam campos', async () => {
    const app = await makeAppWithSuperadminAuth();
    const res = await request(app).post('/auth/superadmin/login').send({});
    expect(res.status).toBe(400);
  });
});
