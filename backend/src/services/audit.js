import { query } from '../database/pool.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'token',
  'refreshToken',
  'accessToken',
  'secret'
]);

function scrub(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(scrub);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) continue;
    out[k] = typeof v === 'object' && v !== null ? scrub(v) : v;
  }
  return out;
}

export async function recordAudit(
  { userId, action, entity, entityId, summary = {}, ip = null },
  dbClient = null
) {
  const runner = dbClient || { query };
  const safeSummary = scrub(summary);
  await runner.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, summary, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId || null, action, entity, entityId ? String(entityId) : null, safeSummary, ip]
  );
}

