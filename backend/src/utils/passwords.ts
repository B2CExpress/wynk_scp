import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';

const BCRYPT_ROUNDS = 10;

/**
 * Hash bcrypt de senha (one-way). Custo 10 rounds — alinhado com wynk_ecommerce.
 */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Gera um refresh token aleatório (32 bytes / 256 bits) em hex.
 * Espaço de busca grande o suficiente pra dispensar bcrypt no hash de
 * armazenamento — usamos SHA-256 cru (`hashRefreshToken`).
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * SHA-256 hex (64 chars) do refresh token. Armazenado em DB; comparado
 * com o hash do plain que veio do cookie. DB comprometido NÃO vaza
 * sessões ativas (pré-imagem).
 */
export function hashRefreshToken(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}
