import { query } from '../database/pool.js';

export async function createNotification(
  { userId, type, title, body = null, link = null },
  dbClient = null
) {
  const runner = dbClient || { query };
  const { rows } = await runner.query(
    `INSERT INTO notifications (user_id, type, title, body, link)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, type, title, body, link]
  );
  return rows[0];
}

export async function notifyRoles(
  { roles, type, title, body = null, link = null },
  dbClient = null
) {
  const runner = dbClient || { query };
  const { rows: users } = await runner.query(
    `SELECT id FROM users WHERE role = ANY($1::text[]) AND is_active = true`,
    [roles]
  );
  for (const u of users) {
    await createNotification({ userId: u.id, type, title, body, link }, dbClient);
  }
}

