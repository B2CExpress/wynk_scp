import type { TenantRepository } from '../repositories/tenant.repository';
import type { UserRepository } from '../repositories/user.repository';
import type { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { RefreshToken } from '../entities/RefreshToken';
import type { User } from '../entities/User';
import { signAccessToken } from '../utils/jwt';
import { generateRefreshToken, hashRefreshToken, verifyPassword } from '../utils/passwords';
import { config } from '../config';

export class TenantNotFoundError extends Error {
  constructor(public readonly slug: string) {
    super(`tenant not found: ${slug}`);
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('invalid credentials');
  }
}

export class RefreshTokenInvalidError extends Error {
  constructor() {
    super('refresh token invalid');
  }
}

/**
 * Levantada quando recebemos um refresh já revogado — heurística de "leaked
 * token reuse". Resposta padrão é revogar **toda a cadeia do user** e exigir
 * re-login. Caller (controller) trata como 401 + cookie clear.
 */
export class RefreshTokenReusedError extends Error {
  constructor() {
    super('refresh token reuse detected');
  }
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}

export class AuthService {
  constructor(
    private readonly tenantRepo: TenantRepository,
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  async login(tenantSlug: string, email: string, password: string): Promise<LoginResult> {
    const tenant = await this.tenantRepo.findBySlug(tenantSlug);
    if (!tenant) {
      throw new TenantNotFoundError(tenantSlug);
    }

    const user = await this.userRepo.findByTenantAndEmail(tenant.id, email);
    if (!user) {
      // Mesma exceção de "senha errada" pra não diferenciar enumeração de email.
      throw new InvalidCredentialsError();
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantFlavorSlug: tenant.flavorSlug,
      role: user.role,
    });

    const refreshToken = await this.issueRefreshToken(user.id, tenant.id);

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotação de refresh: revoga o atual e emite novo. Se refresh recebido
   * já está revogado, levanta `RefreshTokenReusedError` (caller revoga todos
   * os tokens do user pra mitigar leak).
   */
  async refresh(plainRefresh: string): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(plainRefresh);

    const valid = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (!valid) {
      // Pode ser: token nunca existiu, expirou, OU já foi revogado.
      // Pra distinguir reuse de "nunca existiu", consultamos sem filtros.
      const any = await this.refreshTokenRepo.findAnyByHash(tokenHash);
      if (any && any.revokedAt !== null) {
        // Reuse de token revogado → revoga toda a cadeia do user.
        await this.refreshTokenRepo.revokeAllForUser(any.userId);
        throw new RefreshTokenReusedError();
      }
      throw new RefreshTokenInvalidError();
    }

    const user = await this.userRepo.findById(valid.userId);
    if (!user) {
      // User foi deletado mas o token ficou — trata como inválido.
      throw new RefreshTokenInvalidError();
    }

    const tenant = await this.tenantRepo.findById(valid.tenantId);
    if (!tenant) {
      throw new RefreshTokenInvalidError();
    }

    // Rotação: revoga o atual antes de emitir o novo.
    await this.refreshTokenRepo.revoke(valid.id);

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantFlavorSlug: tenant.flavorSlug,
      role: user.role,
    });

    const refreshToken = await this.issueRefreshToken(user.id, tenant.id);

    return { accessToken, refreshToken };
  }

  /**
   * Logout idempotente — se o token não existe ou já está revogado,
   * silenciosamente sucede. Caller limpa cookies.
   */
  async logout(plainRefresh: string): Promise<void> {
    const tokenHash = hashRefreshToken(plainRefresh);
    const token = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (token) {
      await this.refreshTokenRepo.revoke(token.id);
    }
  }

  private async issueRefreshToken(userId: string, tenantId: string): Promise<string> {
    const plain = generateRefreshToken();
    const tokenHash = hashRefreshToken(plain);
    const expiresAt = new Date(Date.now() + config.jwt.refreshTtlSeconds * 1000);

    const token = new RefreshToken();
    token.userId = userId;
    token.tenantId = tenantId;
    token.tokenHash = tokenHash;
    token.expiresAt = expiresAt;
    token.revokedAt = null;

    await this.refreshTokenRepo.save(token);

    return plain;
  }
}
