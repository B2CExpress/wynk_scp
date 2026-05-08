import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Env var ${name} must be an integer, got: ${raw}`);
  }
  return parsed;
}

export const config = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: int('PORT', 3001),

  database: {
    host: optional('DB_HOST', 'localhost'),
    port: int('DB_PORT', 5432),
    username: optional('DB_USER', 'scp'),
    password: optional('DB_PASS', 'scp'),
    database: optional('DB_NAME', 'scp'),
    schema: optional('DB_SCHEMA', 'scp'),
  },

  redis: {
    host: optional('REDIS_HOST', 'localhost'),
    port: int('REDIS_PORT', 6379),
  },

  jwt: {
    accessSecret: optional('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    refreshSecret: optional('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    accessTtlSeconds: int('JWT_ACCESS_TTL_SECONDS', 15 * 60),
    refreshTtlSeconds: int('JWT_REFRESH_TTL_SECONDS', 7 * 24 * 60 * 60),
  },

  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? undefined,
    secure: process.env.NODE_ENV === 'production',
  },
} as const;

// Force-ensure required vars are loaded in production
if (config.nodeEnv === 'production') {
  required('JWT_ACCESS_SECRET');
  required('JWT_REFRESH_SECRET');
  required('DB_HOST');
  required('DB_PASS');
}
