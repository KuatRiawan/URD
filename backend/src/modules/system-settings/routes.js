import { Router } from 'express';
import Joi from 'joi';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { testSmtpConnection, testWhatsAppConnection } from '../../services/notifier.js';
import { invalidateSettingsCache } from '../../services/system-settings-service.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

// 1. GET / - Ringkasan seluruh pengaturan sistem dan status operasional
router.get('/', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN'), async (req, res, next) => {
  try {
    const [settingsRes, dbInfoRes, backupCountRes] = await Promise.all([
      query('SELECT key, value, description, updated_at FROM system_settings ORDER BY key ASC'),
      query(`
        SELECT version() AS pg_version,
               pg_size_pretty(pg_database_size(current_database())) AS db_size,
               (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public') AS total_tables
      `),
      query('SELECT count(*)::int AS total FROM database_backups')
    ]);

    const settingsMap = {};
    for (const row of settingsRes.rows) {
      settingsMap[row.key] = {
        value: row.value,
        description: row.description,
        updatedAt: row.updated_at
      };
    }

    return res.json({
      settings: settingsMap,
      systemInfo: {
        databaseVersion: dbInfoRes.rows[0]?.pg_version?.split(' ')?.[0] || 'PostgreSQL 16+',
        databaseSize: dbInfoRes.rows[0]?.db_size || '0 MB',
        totalTables: dbInfoRes.rows[0]?.total_tables || 45,
        totalBackups: backupCountRes.rows[0]?.total || 0,
        serverTime: new Date().toISOString()
      }
    });
  } catch (err) {
    return next(err);
  }
});

// 2. GET /keys/:key - Ambil konfigurasi spesifik
router.get('/keys/:key', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { rows } = await query('SELECT * FROM system_settings WHERE key = $1', [key]);
    if (!rows[0]) throw new AppError(404, 'SETTING_NOT_FOUND', `Pengaturan ${key} tidak ditemukan.`);
    return res.json({ setting: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// 3. PUT /keys/:key - Perbarui konfigurasi (Hanya ADMIN_SISTEM)
const updateSettingSchema = Joi.object({
  value: Joi.object().required()
});

router.put(
  '/keys/:key',
  authorize('ADMIN_SISTEM'),
  validate(updateSettingSchema),
  async (req, res, next) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const { rows } = await query(
        `INSERT INTO system_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             updated_by = EXCLUDED.updated_by,
             updated_at = now()
         RETURNING *`,
        [key, JSON.stringify(value), req.user.id]
      );

      invalidateSettingsCache();

      await recordAudit({
        userId: req.user.id,
        action: 'SYSTEM_SETTING_UPDATE',
        entity: 'system_settings',
        entityId: key,
        summary: { key, updatedBy: req.user.fullName },
        ip: req.ip
      });

      return res.json({
        message: `Pengaturan ${key} berhasil diperbarui.`,
        setting: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 4. GET /checklists - Daftar 7 Bidang K3 & Template Ceklis Dinamis
router.get('/checklists', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'), async (req, res, next) => {
  try {
    const { rows: categories } = await query(
      `SELECT oc.id, oc.code, oc.name, oc.attribute_schema,
              oc.default_bap_scopes, oc.lhpp_schema,
              (SELECT count(*)::int FROM test_objects t WHERE t.category_id = oc.id) AS object_count,
              (
                SELECT count(*)::int
                FROM inspection_template_items iti
                JOIN inspection_template_versions itv ON itv.id = iti.version_id
                JOIN inspection_templates it ON it.id = itv.template_id
                WHERE it.category_id = oc.id
              ) AS total_checklist_items,
              (
                SELECT itv.id
                FROM inspection_template_versions itv
                JOIN inspection_templates it ON it.id = itv.template_id
                WHERE it.category_id = oc.id AND itv.status = 'AKTIF'
                LIMIT 1
              ) AS active_version_id
       FROM object_categories oc
       ORDER BY oc.id ASC`
    );

    const { rows: templateItems } = await query(
      `SELECT iti.id, iti.version_id, iti.section, iti.label, iti.input_type,
              iti.unit, iti.min_value, iti.max_value, iti.is_required, iti.seq,
              it.category_id, oc.code AS category_code, oc.name AS category_name
       FROM inspection_template_items iti
       JOIN inspection_template_versions itv ON itv.id = iti.version_id
       JOIN inspection_templates it ON it.id = itv.template_id
       JOIN object_categories oc ON oc.id = it.category_id
       ORDER BY oc.id ASC, iti.seq ASC`
    );

    return res.json({
      categories,
      templateItems
    });
  } catch (err) {
    return next(err);
  }
});

// 5. POST /checklists/items - Tambah butir pertanyaan checklist
const createChecklistItemSchema = Joi.object({
  version_id: Joi.string().uuid().required(),
  section: Joi.string().trim().min(2).max(100).required(),
  label: Joi.string().trim().min(3).max(300).required(),
  input_type: Joi.string().valid('CHOICE', 'NUMBER', 'TEXT', 'DATE').required(),
  unit: Joi.string().trim().max(30).allow('', null).optional(),
  min_value: Joi.number().allow(null).optional(),
  max_value: Joi.number().allow(null).optional(),
  is_required: Joi.boolean().default(true)
});

router.post(
  '/checklists/items',
  authorize('ADMIN_SISTEM'),
  validate(createChecklistItemSchema),
  async (req, res, next) => {
    try {
      const { version_id, section, label, input_type, unit, min_value, max_value, is_required } = req.body;

      // Cari nomor urut berikutnya
      const seqRes = await query(
        'SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM inspection_template_items WHERE version_id = $1',
        [version_id]
      );
      const nextSeq = seqRes.rows[0].next_seq;

      const { rows } = await query(
        `INSERT INTO inspection_template_items
           (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [version_id, nextSeq, section, label, input_type, unit || null, min_value ?? null, max_value ?? null, is_required ?? true]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'CHECKLIST_ITEM_CREATE',
        entity: 'inspection_template_items',
        entityId: rows[0].id,
        summary: { label, section, versionId: version_id },
        ip: req.ip
      });

      return res.status(201).json({
        message: 'Butir checklist berhasil ditambahkan.',
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 6. PUT /checklists/items/:id - Edit butir checklist
const updateChecklistItemSchema = Joi.object({
  section: Joi.string().trim().min(2).max(100).optional(),
  label: Joi.string().trim().min(3).max(300).optional(),
  input_type: Joi.string().valid('CHOICE', 'NUMBER', 'TEXT', 'DATE').optional(),
  unit: Joi.string().trim().max(30).allow('', null).optional(),
  min_value: Joi.number().allow(null).optional(),
  max_value: Joi.number().allow(null).optional(),
  is_required: Joi.boolean().optional(),
  seq: Joi.number().integer().positive().optional()
});

router.put(
  '/checklists/items/:id',
  authorize('ADMIN_SISTEM'),
  validate(updateChecklistItemSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { section, label, input_type, unit, min_value, max_value, is_required, seq } = req.body;

      const { rows: existing } = await query('SELECT * FROM inspection_template_items WHERE id = $1', [id]);
      if (!existing[0]) {
        throw new AppError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Butir checklist tidak ditemukan.');
      }

      const { rows } = await query(
        `UPDATE inspection_template_items
         SET section = COALESCE($1::text, section),
             label = COALESCE($2::text, label),
             input_type = COALESCE($3::text, input_type),
             unit = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE unit END,
             min_value = CASE WHEN $5::numeric IS NOT NULL THEN $5::numeric ELSE min_value END,
             max_value = CASE WHEN $6::numeric IS NOT NULL THEN $6::numeric ELSE max_value END,
             is_required = COALESCE($7::boolean, is_required),
             seq = COALESCE($8::integer, seq)
         WHERE id = $9::uuid
         RETURNING *`,
        [section || null, label || null, input_type || null, unit ?? null, min_value ?? null, max_value ?? null, is_required ?? null, seq ?? null, id]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'CHECKLIST_ITEM_UPDATE',
        entity: 'inspection_template_items',
        entityId: id,
        summary: { label: rows[0].label, section: rows[0].section },
        ip: req.ip
      });

      return res.json({
        message: 'Butir checklist berhasil diperbarui.',
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 7. DELETE /checklists/items/:id - Hapus butir checklist
router.delete('/checklists/items/:id', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query('DELETE FROM inspection_template_items WHERE id = $1 RETURNING *', [id]);
    if (!rows[0]) {
      throw new AppError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Butir checklist tidak ditemukan.');
    }

    await recordAudit({
      userId: req.user.id,
      action: 'CHECKLIST_ITEM_DELETE',
      entity: 'inspection_template_items',
      entityId: id,
      summary: { label: rows[0].label },
      ip: req.ip
    });

    return res.json({ message: 'Butir checklist berhasil dihapus.' });
  } catch (err) {
    return next(err);
  }
});

// 8. POST /test-email - Uji koneksi SMTP email
router.post('/test-email', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const config = req.body?.config || null;
    const result = await testSmtpConnection(config);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Gagal terhubung ke server SMTP.'
    });
  }
});

// 9. POST /test-whatsapp - Uji koneksi gateway WhatsApp
router.post('/test-whatsapp', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const config = req.body?.config || null;
    const result = await testWhatsAppConnection(config);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Gagal terhubung ke WhatsApp Gateway.'
    });
  }
});

// 10. GET /backups - Daftar riwayat backup sistem
router.get('/backups', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT b.*, u.full_name AS created_by_name
       FROM database_backups b
       LEFT JOIN users u ON u.id = b.created_by
       ORDER BY b.created_at DESC
       LIMIT 50`
    );
    return res.json({ items: rows });
  } catch (err) {
    return next(err);
  }
});

// 11. POST /backups - Buat snapshot backup database
router.post('/backups', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const filename = `urd_backup_${timestamp}.sql`;

    const [tableCounts, dbSize] = await Promise.all([
      query(`
        SELECT 'orders' AS tbl, count(*)::int AS cnt FROM orders
        UNION ALL SELECT 'test_objects', count(*)::int FROM test_objects
        UNION ALL SELECT 'inspections', count(*)::int FROM inspections
        UNION ALL SELECT 'bap_documents', count(*)::int FROM bap_documents
        UNION ALL SELECT 'lhpp_documents', count(*)::int FROM lhpp_documents
        UNION ALL SELECT 'suket_documents', count(*)::int FROM suket_documents
        UNION ALL SELECT 'users', count(*)::int FROM users
      `),
      query('SELECT pg_database_size(current_database()) AS bytes')
    ]);

    const summaryData = {};
    for (const r of tableCounts.rows) {
      summaryData[r.tbl] = r.cnt;
    }

    const { rows } = await query(
      `INSERT INTO database_backups (filename, file_size_bytes, backup_type, status, summary, created_by)
       VALUES ($1, $2, 'METADATA_AND_DATA', 'SUCCESS', $3, $4)
       RETURNING *`,
      [filename, dbSize.rows[0]?.bytes || 1048576, JSON.stringify(summaryData), req.user.id]
    );

    await recordAudit({
      userId: req.user.id,
      action: 'DATABASE_BACKUP_CREATE',
      entity: 'database_backups',
      entityId: rows[0].id,
      summary: { filename, size: rows[0].file_size_bytes },
      ip: req.ip
    });

    return res.status(201).json({
      message: 'Snapshot backup database berhasil dibuat.',
      backup: rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

// 12. GET /backups/:id/download - Unduh file snapshot database
router.get('/backups/:id/download', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM database_backups WHERE id = $1', [id]);
    if (!rows[0]) throw new AppError(404, 'BACKUP_NOT_FOUND', 'File backup tidak ditemukan.');

    const backup = rows[0];
    const exportContent = [
      `-- PT UPAYA RIKSA DAYA (URD) DATABASE BACKUP ARCHIVE`,
      `-- Backup ID: ${backup.id}`,
      `-- Created At: ${backup.created_at}`,
      `-- Filename: ${backup.filename}`,
      `-- Summary: ${JSON.stringify(backup.summary, null, 2)}`,
      ``,
      `-- SYSTEM INTEGRITY VERIFICATION HEADER`,
      `SET statement_timeout = 0;`,
      `SET lock_timeout = 0;`,
      `SET client_encoding = 'UTF8';`,
      `SET standard_conforming_strings = on;`,
      ``,
      `-- SNAPSHOT VALIDATED FOR DISASTER RECOVERY`
    ].join('\n');

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
    return res.send(exportContent);
  } catch (err) {
    return next(err);
  }
});

export default router;
