import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withTransaction } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../../migrations');

export async function runMigrations({ reset = false } = {}) {
  if (reset) {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));

  const newlyApplied = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    });
    newlyApplied.push(file);
  }
  return newlyApplied;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reset = process.argv.includes('--reset');
  runMigrations({ reset })
    .then((applied) => {
      console.log(
        applied.length
          ? `Migrasi diterapkan: ${applied.join(', ')}`
          : 'Database sudah menggunakan migrasi terbaru.'
      );
      return pool.end();
    })
    .catch((err) => {
      console.error('Gagal menjalankan migrasi:', err.message);
      process.exit(1);
    });
}

