import type { Request, Response, CookieOptions } from 'express';
import {
  AuthService,
  InvalidCredentialsError,
  RefreshTokenInvalidError,
  RefreshTokenReusedError,
  TenantNotFoundError,
} from '../services/auth.service';
import type { UserRepository } from '../repositories/user.repository';
import { ACCESS_COOKIE, REFRESH_COOKIE, type AuthedUser } from '../middleware/require-auth';
import { config } from '../config';

/**
 * Cookies dos tokens de auth.
 *
 * - `scp_access` (path=/) viaja em toda request — controllers protegidos
 *   leem via `requireAuth`.
 * - `scp_refresh` (path=/auth) viaja apenas em `/auth/*` (refresh, logout).
 *   Reduz a superfície de exposição do refresh.
 */
function accessCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: config.jwt.accessTtlSeconds * 1000,
    domain: config.cookie.domain,
  };
}

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax',
    path: '/auth',
    maxAge: config.jwt.refreshTtlSeconds * 1000,
    domain: config.cookie.domain,
  };
}

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userRepo: UserRepository,
  ) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const slug = req.params.slug;
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };

    if (!slug || !email || !password) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    try {
      const result = await this.authService.login(slug, email, password);
      res.cookie(ACCESS_COOKIE, result.accessToken, accessCookieOptions());
      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
      res.status(200).json({ user: result.user });
    } catch (err) {
      if (err instanceof TenantNotFoundError || err instanceof InvalidCredentialsError) {
        // Mesmo response pra não vazar enumeração (tenant existe? user existe?).
        res.status(401).json({ error: 'invalid_credentials' });
        return;
      }
      throw err;
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
    const refreshToken = cookies[REFRESH_COOKIE];

    if (!refreshToken) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    try {
      const tokens = await this.authService.refresh(refreshToken);
      res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions());
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions());
      res.status(204).end();
    } catch (err) {
      if (err instanceof RefreshTokenReusedError) {
        // Reuse detectado: limpa cookies e responde 401. Service já revogou
        // a cadeia do user.
        res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
        res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
        res.status(401).json({ error: 'unauthorized' });
        return;
      }
      if (err instanceof RefreshTokenInvalidError) {
        res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
        res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
        res.status(401).json({ error: 'unauthorized' });
        return;
      }
      throw err;
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
    const refreshToken = cookies[REFRESH_COOKIE];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    res.status(204).end();
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const authed = (req as Request & { user?: AuthedUser }).user;
    if (!authed) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const user = await this.userRepo.findById(authed.userId);
    if (!user) {
      // Token válido mas user removido — força re-login.
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  };
}
