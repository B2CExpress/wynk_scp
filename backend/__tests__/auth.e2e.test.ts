import request from 'supertest';
import { createApp } from '../src/app';
import { makeAppDeps, makeFakeTenantResolver } from './helpers/mock-deps';
import { AuthService } from '../src/services/auth.service';
import { AuthController } from '../src/controllers/auth.controller';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../src/middleware/require-auth';
import { hashPassword, hashRefreshToken } from '../src/utils/passwords';
import type { TenantRepository } from '../src/repositories/tenant.repository';
import type { UserRepository } from '../src/repositories/user.repository';
import type { RefreshTokenRepository } from '../src/repositories/refresh-token.repository';
import type { Tenant } from '../src/entities/Tenant';
import type { User } from '../src/entities/User';
import { RefreshToken } from '../src/entities/RefreshToken';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const PASSWORD = 's3cret';

const TENANT: Tenant = {
  id: TENANT_ID,
  slug: 'shopping-x',
  host: 'shopping-x.local',
  flavorSlug: 'shopping-x',
  name: 'Shopping X',
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface FakeRepos {
  tenantRepo: TenantRepository;
  userRepo: UserRepository;
  refreshTokenRepo: RefreshTokenRepository;
  refreshStore: Map<string, RefreshToken>;
}

async function makeFakeRepos(): Promise<FakeRepos> {
  const user: User = {
    id: USER_ID,
    tenantId: TENANT_ID,
    email: 'admin@shopping-x.local',
    passwordHash: await hashPassword(PASSWORD),
    name: 'Admin',
    role: 'tenant_admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tenantRepo = {
    findBySlug: async (slug: string) => (slug === TENANT.slug ? TENANT : null),
    findById: async (id: string) => (id === TENANT_ID ? TENANT : null),
    findByHost: async (_h: string) => null,
  } as unknown as TenantRepository;

  const userRepo = {
    findByTenantAndEmail: async (tenantId: string, email: string) =>
      tenantId === TENANT_ID && email === user.email ? user : null,
    findById: async (id: string) => (id === USER_ID ? user : null),
    save: async (u: User) => u,
  } as unknown as UserRepository;

  const refreshStore = new Map<string, RefreshToken>();
  let nextId = 0;
  const refreshTokenRepo = {
    findValidByHash: async (hash: string) => {
      const t = refreshStore.get(hash);
      if (!t) return null;
      if (t.revokedAt) return null;
      if (t.expiresAt.getTime() <= Date.now()) return null;
      return t;
    },
    findAnyByHash: async (hash: string) => refreshStore.get(hash) ?? null,
    save: async (t: RefreshToken) => {
      if (!t.id) {
        t.id = `tok-${++nextId}`;
        t.createdAt = new Date();
      }
      refreshStore.set(t.tokenHash, t);
      return t;
    },
    revoke: async (tokenId: string) => {
      for (const t of refreshStore.values()) {
        if (t.id === tokenId) {
          t.revokedAt = new Date();
        }
      }
    },
    revokeAllForUser: async (userId: string) => {
      for (const t of refreshStore.values()) {
        if (t.userId === userId && !t.revokedAt) {
          t.revokedAt = new Date();
        }
      }
    },
  } as unknown as RefreshTokenRepository;

  return { tenantRepo, userRepo, refreshTokenRepo, refreshStore };
}

async function makeAppWithAuth() {
  process.env.NODE_ENV = 'test';
  const { tenantRepo, userRepo, refreshTokenRepo, refreshStore } = await makeFakeRepos();
  const authService = new AuthService(tenantRepo, userRepo, refreshTokenRepo);
  const authController = new AuthController(authService, userRepo);
  const app = createApp(
    makeAppDeps({ tenantResolver: makeFakeTenantResolver(), authController }),
  );
  return { app, refreshStore };
}

function extractCookie(res: request.Response, name: string): string | undefined {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return undefined;
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of arr) {
    if (c.startsWith(`${name}=`)) {
      const value = c.split(';')[0].slice(name.length + 1);
      return value;
    }
  }
  return undefined;
}

describe('POST /auth/:slug/login', () => {
  it('returns 200 + sets cookies + returns user on valid credentials', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app)
      .post('/auth/shopping-x/login')
      .send({ email: 'admin@shopping-x.local', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { id: USER_ID, email: 'admin@shopping-x.local', name: 'Admin', role: 'tenant_admin' },
    });

    expect(extractCookie(res, ACCESS_COOKIE)).toBeTruthy();
    expect(extractCookie(res, REFRESH_COOKIE)).toBeTruthy();

    // Cookies devem ter HttpOnly + SameSite=Lax
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const accessCookieRaw = setCookie.find((c) => c.startsWith(`${ACCESS_COOKIE}=`))!;
    expect(accessCookieRaw).toMatch(/HttpOnly/i);
    expect(accessCookieRaw).toMatch(/SameSite=Lax/i);
  });

  it('returns 401 invalid_credentials when tenant slug does not exist', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app)
      .post('/auth/nope/login')
      .send({ email: 'a@b.com', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 401 invalid_credentials on wrong password', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app)
      .post('/auth/shopping-x/login')
      .send({ email: 'admin@shopping-x.local', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('returns 400 invalid_request when body fields are missing', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app).post('/auth/shopping-x/login').send({});
    expect(res.status).toBe(400);
  });

  it('does not require a valid Host header — auth bypasses tenant resolution by host', async () => {
    const { app } = await makeAppWithAuth();
    // Host bogus.local não corresponde a tenant nenhum no resolver fake;
    // auth deve funcionar mesmo assim porque resolveByHost é bypassado em /auth/*.
    const res = await request(app)
      .post('/auth/shopping-x/login')
      .set('Host', 'bogus.local')
      .send({ email: 'admin@shopping-x.local', password: PASSWORD });
    expect(res.status).toBe(200);
  });
});

describe('GET /auth/me', () => {
  it('returns 401 when no access cookie', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 + user data with valid access cookie', async () => {
    const { app } = await makeAppWithAuth();
    const login = await request(app)
      .post('/auth/shopping-x/login')
      .send({ email: 'admin@shopping-x.local', password: PASSWORD });
    const access = extractCookie(login, ACCESS_COOKIE)!;

    const res = await request(app).get('/auth/me').set('Cookie', `${ACCESS_COOKIE}=${access}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: USER_ID,
      email: 'admin@shopping-x.local',
      name: 'Admin',
      role: 'tenant_admin',
      tenantId: TENANT_ID,
    });
  });

  it('returns 401 with garbage access cookie', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app).get('/auth/me').set('Cookie', `${ACCESS_COOKIE}=garbage`);
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  it('returns 204 + rotates cookies on valid refresh', async () => {
    const { app } = await makeAppWithAuth();
    const login = await request(app)
      .post('/auth/shopping-x/login')
      .send({ email: 'admin@shopping-x.local', password: PASSWORD });
    const oldRefresh = extractCookie(login, REFRESH_COOKIE)!;

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${oldRefresh}`);

    expect(res.status).toBe(204);
    const newAccess = extractCookie(res, ACCESS_COOKIE);
    const newRefresh = extractCookie(res, REFRESH_COOKIE);
    expect(newAccess).toBeTruthy();
    expect(newRefresh).toBeTruthy();
    expect(newRefresh).not.toBe(oldRefresh);
  });

  it('returns 401 when no refresh cookie', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('returns 401 + revokes user chain on reused (revoked) refresh', async () => {
    const { app, refreshStore } = await makeAppWithAuth();
    const login = await request(app)
      .post('/auth/shopping-x/login')
      .send({ email: 'admin@shopping-x.local', password: PASSWORD });
    const oldRefresh = extractCookie(login, REFRESH_COOKIE)!;

    // Primeiro refresh: rotaciona normalmente
    const first = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${oldRefresh}`);
    expect(first.status).toBe(204);
    const newRefresh = extractCookie(first, REFRESH_COOKIE)!;

    // Segundo refresh com o token JÁ revogado → reuse detection
    const reuse = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${oldRefresh}`);
    expect(reuse.status).toBe(401);

    // Subsequente refresh com o token NOVO também deve falhar (cadeia revogada)
    const blocked = await request(app)
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE}=${newRefresh}`);
    expect(blocked.status).toBe(401);

    // Sanity: token novo está marcado como revogado no store
    const newHash = hashRefreshToken(newRefresh);
    expect(refreshStore.get(newHash)?.revokedAt).not.toBeNull();
  });
});

describe('POST /auth/logout', () => {
  it('returns 204 + clears cookies and revokes refresh token', async () => {
    const { app, refreshStore } = await makeAppWithAuth();
    const login = await request(app)
      .post('/auth/shopping-x/login')
      .send({ email: 'admin@shopping-x.local', password: PASSWORD });
    const refresh = extractCookie(login, REFRESH_COOKIE)!;

    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', `${REFRESH_COOKIE}=${refresh}`);

    expect(res.status).toBe(204);
    expect(refreshStore.get(hashRefreshToken(refresh))?.revokedAt).not.toBeNull();
  });

  it('returns 204 even with no cookie (idempotent)', async () => {
    const { app } = await makeAppWithAuth();
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(204);
  });
});
