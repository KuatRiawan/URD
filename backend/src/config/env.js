import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(rootEnvPath)) {
  const lines = fs.readFileSync(rootEnvPath, 'utf8').split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest,
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: isTest
    ? process.env.TEST_DATABASE_URL || 'postgres://urd:urd_local_dev_pw@localhost:5433/urd_test'
    : process.env.DATABASE_URL || 'postgres://urd:urd_local_dev_pw@localhost:5433/urd_dev',
  jwtSecret: process.env.JWT_SECRET || (isTest ? 'test-only-jwt-secret-minimum-32-chars-long' : ''),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
  refreshSessionDays: Number(process.env.REFRESH_SESSION_DAYS || 7),
  storageDir: path.resolve(
    __dirname,
    '../..',
    process.env.STORAGE_DIR || './storage/uploads'
  ),
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'PT Upaya Riksa Daya <urd@upayariksadaya.com>'
  },
  whatsapp: {
    apiUrl: process.env.WA_API_URL || 'https://api.fonnte.com/send',
    token: process.env.WA_API_TOKEN || ''
  },
  clientRemindersEnabled: process.env.CLIENT_REMINDER_ENABLED !== 'false',
  seedDefaultPassword: process.env.SEED_DEFAULT_PASSWORD || null
};

if (!env.jwtSecret || env.jwtSecret.length < 24) {
  if (env.isProd) {
    throw new Error('JWT_SECRET wajib disetel minimal 24 karakter pada environment produksi');
  }
  env.jwtSecret = 'dev-ephemeral-jwt-secret-pt-upaya-riksa-daya-2026';
}
