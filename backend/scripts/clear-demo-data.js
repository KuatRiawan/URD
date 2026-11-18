import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool } from '../src/database/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../storage/uploads');

const DEMO_PASSWORD = 'DevURD2026!';

const TABLES_TO_TRUNCATE = [
  'audit_logs',
  'bap_documents',
  'bap_revisions',
  'client_contacts',
  'client_locations',
  'client_portal_tokens',
  'client_reminder_log',
  'clients',
  'delivery_logs',
  'document_distributions',
  'file_attachments',
  'inspection_activities',
  'inspection_activity_history',
  'inspection_findings',
  'inspection_results',
  'inspection_revisions',
  'inspection_signatures',
  'inspection_template_items',
  'inspection_template_versions',
  'inspection_templates',
  'inspections',
  'lhpp_documents',
  'lhpp_revisions',
  'notifications',
  'operational_issue_events',
  'operational_issue_evidence',
  'operational_issues',
  'order_invoices',
  'order_objects',
  'order_revisions',
  'order_status_history',
  'orders',
  'refresh_sessions',
  'reminder_dispatches',
  'renewal_followups',
  'schedule_changes',
  'schedules',
  'suket_documents',
  'test_objects'
];

async function clearDemoData() {
  console.log('==> [PT Upaya Riksa Daya] Membersihkan seluruh data dummy operasional...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Truncate semua tabel operasional & transaksi dummy
    const truncateSql = `TRUNCATE TABLE ${TABLES_TO_TRUNCATE.join(', ')} RESTART IDENTITY CASCADE;`;
    await client.query(truncateSql);
    console.log(`✓ Berhasil mengosongkan ${TABLES_TO_TRUNCATE.length} tabel operasional/transaksional.`);

    // 2. Setel ulang kata sandi seluruh akun pengguna menjadi DevURD2026! dan pastikan aktif
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const { rowCount: userCount } = await client.query(
      'UPDATE users SET password_hash = $1, is_active = true RETURNING id',
      [passwordHash]
    );
    console.log(`✓ Kata sandi ${userCount} akun pengguna disetel seragam ke: ${DEMO_PASSWORD}`);

    // 3. Pastikan Ahli K3 memiliki kompetensi & profil inspector aktif
    const { rows: inspectors } = await client.query(`
      SELECT u.id, u.email, u.full_name, i.user_id as inspector_user_id
      FROM users u
      LEFT JOIN inspectors i ON i.user_id = u.id
      WHERE u.role IN ('INSPECTOR', 'AHLI_K3')
    `);

    const { rows: categories } = await client.query('SELECT id, code, name FROM object_categories');

    for (const insp of inspectors) {
      if (!insp.inspector_user_id) {
        await client.query(
          `INSERT INTO inspectors (user_id, employee_no)
           VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET employee_no = EXCLUDED.employee_no`,
          [insp.id, `URD-AK3-${insp.email.split('@')[0].toUpperCase()}`]
        );
      }

      for (const cat of categories) {
        await client.query(
          `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
           VALUES ($1, $2, $3, '2025-01-01', '2028-12-31')
           ON CONFLICT (inspector_id, category_id, certificate_no) DO UPDATE SET valid_until = EXCLUDED.valid_until`,
          [insp.id, cat.id, `SKP-${cat.code}/URD/2025`]
        );
      }
    }
    console.log('✓ Profil & SKP Ahli K3 (Inspector) terverifikasi aktif untuk seluruh kategori K3.');

    await client.query('COMMIT');

    // 4. Bersihkan file berkas dummy di storage/uploads
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let removedCount = 0;
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(uploadsDir, file);
        try {
          if (fs.statSync(filePath).isFile()) {
            fs.unlinkSync(filePath);
            removedCount += 1;
          }
        } catch {
          // ignore
        }
      }
      console.log(`✓ Berkas unggahan/pratinjau dummy dibersihkan (${removedCount} berkas dihapus).`);
    }

    // 5. Tampilkan status tabel database saat ini
    console.log('\n--- STATUS TABEL SETELAH PEMBERSIHAN ---');
    for (const t of TABLES_TO_TRUNCATE) {
      const { rows } = await client.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`  ${t.padEnd(30)}: ${rows[0].count} data`);
    }

    const { rows: userList } = await client.query(
      'SELECT email, role, full_name FROM users ORDER BY role, email'
    );
    console.log('\n--- AKUN RESMI SIAP UNTUK DEMO MANUAL ---');
    console.log(`Kata Sandi Seluruh Akun: ${DEMO_PASSWORD}\n`);
    for (const u of userList) {
      console.log(`  [${u.role.padEnd(14)}] ${u.email.padEnd(36)} -> ${u.full_name}`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Gagal membersihkan data dummy:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

clearDemoData()
  .then(() => {
    console.log('\n==> Selesai! Seluruh data dummy telah bersih. Anda siap demo manual dari awal.');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
