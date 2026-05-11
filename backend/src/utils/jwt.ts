import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Payload do access token. Carrega o suficiente pra `requireAuth` montar
 * `req.user` + `req.tenant` sem nova consulta ao DB.
 *
 * `tenantSlug` e `tenantFlavorSlug` viajam no JWT pra evitar 1 SELECT por
 * request — ambos são identidade pública do tenant (não há vazamento).
 * Mudança de slug/flavor exige re-login (cookie expira em 15 min).
 */
export interface AccessTokenPayload {
  sub: string; // userId
  tenantId: string;
  tenantSlug: string;
  tenantFlavorSlug: string;
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtlSeconds,
  });
}

/**
 * Lança `JsonWebTokenError`/`TokenExpiredError` se inválido — chamador
 * trata como 401.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (typeof decoded !== 'object' || decoded === null) {
    throw new jwt.JsonWebTokenError('access token payload not an object');
  }
  // Confiamos no shape porque foi assinado com nosso secret — não há
  // necessidade de runtime validation completa aqui.
  return decoded as AccessTokenPayload;
}
