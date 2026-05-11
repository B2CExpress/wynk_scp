import {
  AuthService,
  InvalidCredentialsError,
  RefreshTokenInvalidError,
  RefreshTokenReusedError,
  TenantNotFoundError,
} from '../src/services/auth.service';
import type { TenantRepository } from '../src/repositories/tenant.repository';
import type { UserRepository } from '../src/repositories/user.repository';
import type { RefreshTokenRepository } from '../src/repositories/refresh-token.repository';
import type { Tenant } from '../src/entities/Tenant';
import type { User } from '../src/entities/User';
import { RefreshToken } from '../src/entities/RefreshToken';
import { hashPassword, hashRefreshToken } from '../src/utils/passwords';
import { verifyAccessToken } from '../src/utils/jwt';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';
const TENANT: Tenant = {
  id: TENANT_ID,
  slug: 'shopping-x',
  host: 'shopping-x.local',
  flavorSlug: 'shopping-x',
  name: 'Shopping X',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function makeUser(password: string): Promise<User> {
  return {
    id: USER_ID,
    tenantId: TENANT_ID,
    email: 'admin@shopping-x.local',
    passwordHash: await hashPassword(password),
    name: 'Admin',
    role: 'tenant_admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeFakeRepos() {
  const tenantRepo = {
    findBySlug: jest.fn(),
    findById: jest.fn(),
    findByHost: jest.fn(),
  } as unknown as jest.Mocked<TenantRepository>;
  const userRepo = {
    findByTenantAndEmail: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;
  const refreshTokenRepo = {
    findValidByHash: jest.fn(),
    findAnyByHash: jest.fn(),
    save: jest.fn().mockImplementation(async (t: RefreshToken) => t),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
  } as unknown as jest.Mocked<RefreshTokenRepository>;
  return { tenantRepo, userRepo, refreshTokenRepo };
}

describe('AuthService.login', () => {
  it('throws TenantNotFoundError when tenant slug does not exist', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    tenantRepo.findBySlug.mockResolvedValue(null);
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await expect(svc.login('nope', 'a@b.com', 'pw')).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it('throws InvalidCredentialsError when user does not exist for tenant', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    tenantRepo.findBySlug.mockResolvedValue(TENANT);
    userRepo.findByTenantAndEmail.mockResolvedValue(null);
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await expect(svc.login('shopping-x', 'a@b.com', 'pw')).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('throws InvalidCredentialsError when password mismatches', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    tenantRepo.findBySlug.mockResolvedValue(TENANT);
    userRepo.findByTenantAndEmail.mockResolvedValue(await makeUser('correct-pw'));
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await expect(
      svc.login('shopping-x', 'admin@shopping-x.local', 'wrong-pw'),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('returns access+refresh tokens and persists refresh row when credentials valid', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    tenantRepo.findBySlug.mockResolvedValue(TENANT);
    userRepo.findByTenantAndEmail.mockResolvedValue(await makeUser('s3cret'));
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    const result = await svc.login('shopping-x', 'admin@shopping-x.local', 's3cret');

    expect(result.user).toEqual({
      id: USER_ID,
      email: 'admin@shopping-x.local',
      name: 'Admin',
      role: 'tenant_admin',
    });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));

    // Access JWT carrega o ctx do tenant
    const payload = verifyAccessToken(result.accessToken);
    expect(payload).toMatchObject({
      sub: USER_ID,
      tenantId: TENANT_ID,
      tenantSlug: 'shopping-x',
      tenantFlavorSlug: 'shopping-x',
      role: 'tenant_admin',
    });

    // Refresh foi persistido com hash correto
    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
    const saved = refreshTokenRepo.save.mock.calls[0][0];
    expect(saved.userId).toBe(USER_ID);
    expect(saved.tenantId).toBe(TENANT_ID);
    expect(saved.tokenHash).toBe(hashRefreshToken(result.refreshToken));
    expect(saved.revokedAt).toBeNull();
    expect(saved.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('AuthService.refresh', () => {
  it('throws RefreshTokenInvalidError when token is unknown', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    refreshTokenRepo.findValidByHash.mockResolvedValue(null);
    refreshTokenRepo.findAnyByHash.mockResolvedValue(null);
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await expect(svc.refresh('garbage')).rejects.toBeInstanceOf(RefreshTokenInvalidError);
  });

  it('throws RefreshTokenReusedError and revokes the whole user chain on revoked-token reuse', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    const revoked = new RefreshToken();
    revoked.id = 'tok-1';
    revoked.userId = USER_ID;
    revoked.tenantId = TENANT_ID;
    revoked.tokenHash = hashRefreshToken('plain-1');
    revoked.expiresAt = new Date(Date.now() + 1000);
    revoked.revokedAt = new Date(Date.now() - 1000);
    refreshTokenRepo.findValidByHash.mockResolvedValue(null);
    refreshTokenRepo.findAnyByHash.mockResolvedValue(revoked);
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await expect(svc.refresh('plain-1')).rejects.toBeInstanceOf(RefreshTokenReusedError);
    expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(USER_ID);
  });

  it('rotates: revokes the old token and issues a new one', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    const valid = new RefreshToken();
    valid.id = 'tok-1';
    valid.userId = USER_ID;
    valid.tenantId = TENANT_ID;
    valid.tokenHash = hashRefreshToken('plain-1');
    valid.expiresAt = new Date(Date.now() + 1000);
    valid.revokedAt = null;

    refreshTokenRepo.findValidByHash.mockResolvedValue(valid);
    userRepo.findById.mockResolvedValue(await makeUser('s3cret'));
    tenantRepo.findById.mockResolvedValue(TENANT);

    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);
    const tokens = await svc.refresh('plain-1');

    expect(refreshTokenRepo.revoke).toHaveBeenCalledWith('tok-1');
    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).not.toBe('plain-1');

    // Novo refresh persistido
    expect(refreshTokenRepo.save).toHaveBeenCalledTimes(1);
  });
});

describe('AuthService.logout', () => {
  it('revokes when token is valid', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    const valid = new RefreshToken();
    valid.id = 'tok-1';
    refreshTokenRepo.findValidByHash.mockResolvedValue(valid);
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await svc.logout('plain');

    expect(refreshTokenRepo.revoke).toHaveBeenCalledWith('tok-1');
  });

  it('is silent and idempotent when token is unknown', async () => {
    const { tenantRepo, userRepo, refreshTokenRepo } = makeFakeRepos();
    refreshTokenRepo.findValidByHash.mockResolvedValue(null);
    const svc = new AuthService(tenantRepo, userRepo, refreshTokenRepo);

    await expect(svc.logout('garbage')).resolves.toBeUndefined();
    expect(refreshTokenRepo.revoke).not.toHaveBeenCalled();
  });
});
