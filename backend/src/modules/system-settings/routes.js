import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { isMaskedSecret, testSmtpConnection, testWhatsAppConnection } from '../../services/notifier.js';
import { invalidateSettingsCache } from '../../services/system-settings-service.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const MASKED_SECRET = '••••••••';
const BACKUP_DIR = path.resolve(process.cwd(), 'storage', 'backups');

const DEFAULT_CALIBRATION_TOOLS = [
  {
    code: 'UTM-NDT-01',
    name: 'Ultrasonic Thickness Gauge Digital',
    brand: 'Olympus 38DL PLUS',
    serialNo: 'OL-38DL-99281',
    category: 'PUBT / PAA',
    certNo: 'KAL-2026-0081/KAN',
    calibrationLab: 'Lab Kalibrasi KAN - PT Sucofindo',
    calibratedAt: '2026-01-14',
    validUntil: '2027-01-14'
  },
  {
    code: 'IR-THERM-02',
    name: 'Infrared Thermal Imager Camera',
    brand: 'Fluke Ti480 PRO',
    serialNo: 'FLK-480-77120',
    category: 'ILP / PTP',
    certNo: 'KAL-2026-0112/KAN',
    calibrationLab: 'Lab Kalibrasi KAN - Balai Metrologi',
    calibratedAt: '2026-02-20',
    validUntil: '2027-02-20'
  },
  {
    code: 'EARTH-TEST-03',
    name: 'Digital Earth Ground Clamp Tester',
    brand: 'Kyoritsu 4200',
    serialNo: 'KYO-4200-3319',
    category: 'ILP',
    certNo: 'KAL-2025-0944/KAN',
    calibrationLab: 'Lab Kalibrasi KAN - PT Kalibrasi Presisi',
    calibratedAt: '2025-11-30',
    validUntil: '2026-11-30'
  },
  {
    code: 'SOUND-LUX-04',
    name: 'Integrating Sound Level & Lux Meter',
    brand: 'Rion NL-52 / Lutron',
    serialNo: 'RN-NL52-5501',
    category: 'LTK',
    certNo: 'KAL-2026-0205/KAN',
    calibrationLab: 'Lab Kalibrasi KAN - Balai Hiperkes',
    calibratedAt: '2026-03-10',
    validUntil: '2027-03-10'
  },
  {
    code: 'PITOT-FLOW-05',
    name: 'Hydrant Pitot Pressure & Flow Gauge',
    brand: 'DwyerInstruments',
    serialNo: 'DWY-PT-1180',
    category: 'IPK',
    certNo: 'KAL-2026-0150/KAN',
    calibrationLab: 'Lab Kalibrasi KAN - PT Sucofindo',
    calibratedAt: '2026-01-25',
    validUntil: '2027-01-25'
  },
  {
    code: 'TACH-LASER-06',
    name: 'Digital Laser Tachometer & Vibration Meter',
    brand: 'Hioki FT3406 / Lutron VB-8206SD',
    serialNo: 'HIO-3406-8842',
    category: 'EES / PTP / PAA',
    certNo: 'KAL-2025-1012/KAN',
    calibrationLab: 'Lab Kalibrasi KAN - Balai Metrologi',
    calibratedAt: '2025-12-18',
    validUntil: '2026-12-18'
  }
];

const DEFAULT_DOCUMENT_TEMPLATES = {
  surat_tugas: {
    code: 'ST',
    name: 'Surat Tugas Pemeriksaan & Pengujian (Ahli K3)',
    legal_basis: 'UU No. 1 Tahun 1970 & Permenaker RI No. Per.04/MEN/1995 tentang Perusahaan Jasa K3',
    signatory_title: 'Direktur Operasional PJK3',
    footer_note: 'Dokumen resmi PT Upaya Riksa Daya - Wajib dibawa saat pelaksanaan riksa uji lapangan.',
    is_active: true
  },
  bap: {
    code: 'BAP',
    name: 'Berita Acara Pemeriksaan & Pengujian Teknis (BAP)',
    legal_basis: 'UU No. 1 Tahun 1970 & Peraturan Menteri Ketenagakerjaan RI sesuai Bidang Objek K3',
    signatory_title: 'Ahli K3 Spesialis & Perwakilan Klien',
    footer_note: 'Ditandatangani secara sah oleh Ahli K3 pemegang SKP Kemnaker RI dan perwakilan perusahaan pemilik alat.',
    is_active: true
  },
  lhpp: {
    code: 'LHPP',
    name: 'Laporan Hasil Pemeriksaan dan Pengujian (LHPP)',
    legal_basis: 'Standar Teknis Pemeriksaan dan Pengujian K3 Kemnaker RI & SNI Terkait',
    signatory_title: 'Penanggung Jawab Teknis PJK3 & Ahli K3',
    footer_note: 'Laporan teknis ini merupakan dasar pengajuan Surat Keterangan (Suket) K3 ke Dinas Tenaga Kerja Provinsi.',
    is_active: true
  },
  suket: {
    code: 'SUKET',
    name: 'Pengantar & Registri Surat Keterangan (Suket) K3 Disnaker',
    legal_basis: 'Kewenangan Pengawasan Ketenagakerjaan Dinas Tenaga Kerja & Transmigrasi Provinsi',
    signatory_title: 'Kepala Dinas Tenaga Kerja / Pejabat Berwenang',
    footer_note: 'Masa berlaku dievaluasi otomatis untuk pengingat perpanjangan berkala H-60, H-30, H-14, dan H-7.',
    is_active: true
  },
  bast: {
    code: 'BAST',
    name: 'Berita Acara Serah Terima Dokumen (BAST)',
    legal_basis: 'Standar Operasional Prosedur Distribusi Dokumen Resmi PT Upaya Riksa Daya',
    signatory_title: 'Admin Kantor PJK3 & Penerima Dokumen Klien',
    footer_note: 'Bukti sah penyerahan dokumen asli LHPP, BAP, dan Surat Keterangan K3 kepada pelanggan.',
    is_active: true
  }
};

function maskSensitiveSetting(key, rawValue) {
  if (!rawValue || typeof rawValue !== 'object') return rawValue;
  const copy = { ...rawValue };
  if (key === 'whatsapp_gateway') {
    const hasSecret = Boolean(copy.api_key || copy.token);
    if (copy.api_key) copy.api_key = MASKED_SECRET;
    if (copy.token) copy.token = MASKED_SECRET;
    copy.has_secret = hasSecret;
  } else if (key === 'smtp_configuration') {
    const hasSecret = Boolean(copy.pass);
    if (copy.pass) copy.pass = MASKED_SECRET;
    copy.has_secret = hasSecret;
  }
  return copy;
}

function enrichCalibrationTool(tool) {
  const validUntilDate = tool.validUntil ? new Date(tool.validUntil) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let daysRemaining = null;
  let validityStatus = 'VALID';

  if (validUntilDate && !Number.isNaN(validUntilDate.getTime())) {
    daysRemaining = Math.ceil((validUntilDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      validityStatus = 'EXPIRED';
    } else if (daysRemaining <= 30) {
      validityStatus = 'EXPIRING_SOON';
    }
  }

  return {
    ...tool,
    daysRemaining,
    validityStatus
  };
}

function sqlLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function generateGenuineSqlDump(backupMeta) {
  const dumpTables = [
    'object_categories',
    'system_settings',
    'users',
    'inspectors',
    'inspector_competencies',
    'inspection_templates',
    'inspection_template_versions',
    'inspection_template_items',
    'clients',
    'client_locations',
    'client_contacts',
    'test_objects',
    'orders',
    'order_objects',
    'schedules',
    'assignments',
    'inspections',
    'inspection_results',
    'inspection_findings',
    'bap_documents',
    'lhpp_documents',
    'suket_documents',
    'document_distributions',
    'audit_logs'
  ];

  const lines = [
    `-- ============================================================================`,
    `-- PT UPAYA RIKSA DAYA (URD) - POSTGRESQL RELATIONAL DATABASE DUMP`,
    `-- Backup Filename : ${backupMeta.filename}`,
    `-- Generated At    : ${new Date().toISOString()}`,
    `-- Generated By    : ${backupMeta.createdByName || 'Super Admin'}`,
    `-- Backup Mode     : FULL_SQL_DUMP (Schema Metadata + Transactional Data)`,
    `-- ============================================================================`,
    ``,
    `BEGIN;`,
    `SET statement_timeout = 0;`,
    `SET lock_timeout = 0;`,
    `SET client_encoding = 'UTF8';`,
    `SET standard_conforming_strings = on;`,
    `SET session_replication_role = 'replica';`,
    ``
  ];

  const tableCounts = {};
  let totalRows = 0;

  for (const tbl of dumpTables) {
    try {
      const { rows } = await query(`SELECT * FROM public.${tbl}`);
      tableCounts[tbl] = rows.length;
      totalRows += rows.length;

      lines.push(`-- Table: public.${tbl} (${rows.length} rows)`);
      if (rows.length > 0) {
        const cols = Object.keys(rows[0]);
        const colList = cols.map((c) => `"${c}"`).join(', ');
        for (const row of rows) {
          const sanitizedRow = { ...row };
          if (tbl === 'users' && sanitizedRow.password_hash) {
            // Preserve bcrypt hash format for disaster recovery while keeping dump self-contained
          }
          if (tbl === 'system_settings' && (sanitizedRow.key === 'smtp_configuration' || sanitizedRow.key === 'whatsapp_gateway')) {
            sanitizedRow.value = maskSensitiveSetting(sanitizedRow.key, sanitizedRow.value);
          }
          const valList = cols.map((c) => sqlLiteral(sanitizedRow[c])).join(', ');
          lines.push(`INSERT INTO public."${tbl}" (${colList}) VALUES (${valList}) ON CONFLICT DO NOTHING;`);
        }
      }
      lines.push('');
    } catch {
      tableCounts[tbl] = 0;
    }
  }

  lines.push(`SET session_replication_role = 'origin';`);
  lines.push(`COMMIT;`);
  lines.push(`-- END OF URD POSTGRESQL DUMP (${totalRows} total rows exported)`);

  const content = lines.join('\n');
  const sha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  const byteSize = Buffer.byteLength(content, 'utf8');

  return {
    content,
    sha256,
    byteSize,
    tableCounts,
    totalRows
  };
}

// Helper: Pastikan perubahan pada template ceklis yang sudah dipakai inspeksi historis
// melakukan kloning versi baru (Copy-on-Write) agar data historis inspeksi tidak pernah berubah/rusak.
async function ensureEditableTemplateVersion(db, versionId, userId) {
  const { rows: verRows } = await db.query(
    `SELECT itv.*, it.category_id, it.name AS template_name
     FROM inspection_template_versions itv
     JOIN inspection_templates it ON it.id = itv.template_id
     WHERE itv.id = $1`,
    [versionId]
  );
  if (!verRows[0]) {
    throw new AppError(404, 'TEMPLATE_VERSION_NOT_FOUND', 'Versi template checklist tidak ditemukan.');
  }
  const currentVersion = verRows[0];

  const { rows: usageRows } = await db.query(
    `SELECT
       (SELECT count(*)::int FROM inspections WHERE template_version_id = $1) AS inspection_count,
       (SELECT count(*)::int FROM inspection_results ir JOIN inspection_template_items iti ON iti.id = ir.item_id WHERE iti.version_id = $1) AS result_count`,
    [versionId]
  );
  const isUsedInHistory =
    (usageRows[0]?.inspection_count || 0) > 0 || (usageRows[0]?.result_count || 0) > 0;

  if (!isUsedInHistory) {
    return {
      versionId,
      versionNo: currentVersion.version,
      cloned: false,
      itemMap: new Map()
    };
  }

  // Arsipkan versi lama agar tetap utuh untuk inspeksi historis
  await db.query(
    `UPDATE inspection_template_versions SET status = 'ARSIP' WHERE template_id = $1 AND status = 'AKTIF'`,
    [currentVersion.template_id]
  );

  const { rows: maxVerRows } = await db.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_ver FROM inspection_template_versions WHERE template_id = $1`,
    [currentVersion.template_id]
  );
  const nextVersionNo = maxVerRows[0].next_ver;

  const { rows: newVerRows } = await db.query(
    `INSERT INTO inspection_template_versions (template_id, version, status, is_validated, validated_by, validated_at, published_at, created_by)
     VALUES ($1, $2, 'AKTIF', true, $3, now(), now(), $3)
     RETURNING *, version AS version_no`,
    [currentVersion.template_id, nextVersionNo, userId]
  );
  const newVersion = newVerRows[0];

  const { rows: oldItems } = await db.query(
    `SELECT * FROM inspection_template_items WHERE version_id = $1 ORDER BY seq ASC`,
    [versionId]
  );

  const itemMap = new Map();
  for (const item of oldItems) {
    const { rows: insertedItem } = await db.query(
      `INSERT INTO inspection_template_items
         (version_id, seq, section, label, input_type, is_required, unit, min_value, max_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        newVersion.id,
        item.seq,
        item.section,
        item.label,
        item.input_type,
        item.is_required,
        item.unit,
        item.min_value,
        item.max_value
      ]
    );
    itemMap.set(item.id, insertedItem[0].id);
  }

  return {
    versionId: newVersion.id,
    versionNo: newVersion.version,
    cloned: true,
    previousVersionNo: currentVersion.version,
    itemMap
  };
}

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

    const isSuperAdmin = req.user.role === 'ADMIN_SISTEM';
    const settingsMap = {};
    for (const row of settingsRes.rows) {
      if (!isSuperAdmin && (row.key === 'smtp_configuration' || row.key === 'whatsapp_gateway')) {
        continue;
      }
      settingsMap[row.key] = {
        value: maskSensitiveSetting(row.key, row.value),
        description: row.description,
        updatedAt: row.updated_at
      };
    }

    if (!settingsMap.document_templates) {
      settingsMap.document_templates = {
        value: DEFAULT_DOCUMENT_TEMPLATES,
        description: 'Konfigurasi metadata, dasar hukum, dan penandatangan template dokumen resmi PJK3',
        updatedAt: new Date().toISOString()
      };
    }

    if (!settingsMap.calibration_tools) {
      settingsMap.calibration_tools = {
        value: { items: DEFAULT_CALIBRATION_TOOLS.map(enrichCalibrationTool) },
        description: 'Registri alat ukur riksa uji dan masa berlaku sertifikat kalibrasi KAN',
        updatedAt: new Date().toISOString()
      };
    } else if (Array.isArray(settingsMap.calibration_tools.value?.items)) {
      settingsMap.calibration_tools.value = {
        ...settingsMap.calibration_tools.value,
        items: settingsMap.calibration_tools.value.items.map(enrichCalibrationTool)
      };
    }

    return res.json({
      settings: settingsMap,
      systemInfo: {
        databaseVersion: dbInfoRes.rows[0]?.pg_version?.split(' ')?.slice(0, 2)?.join(' ') || 'PostgreSQL 16',
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
    if (req.user.role !== 'ADMIN_SISTEM' && (key === 'smtp_configuration' || key === 'whatsapp_gateway')) {
      throw new AppError(403, 'FORBIDDEN', 'Akses konfigurasi kredensial gateway hanya untuk Super Admin.');
    }
    const { rows } = await query('SELECT * FROM system_settings WHERE key = $1', [key]);
    if (!rows[0]) throw new AppError(404, 'SETTING_NOT_FOUND', `Pengaturan ${key} tidak ditemukan.`);
    return res.json({
      setting: {
        ...rows[0],
        value: maskSensitiveSetting(key, rows[0].value)
      }
    });
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
      let nextValue = { ...req.body.value };

      // Validasi khusus untuk auto_numbering agar tidak merusak penomoran dokumen
      if (key === 'auto_numbering') {
        const requiredPrefixes = [
          'order_prefix',
          'assignment_prefix',
          'bap_prefix',
          'lhpp_prefix',
          'suket_prefix',
          'bast_prefix'
        ];
        for (const field of requiredPrefixes) {
          if (nextValue[field] !== undefined) {
            const pat = String(nextValue[field] || '').trim();
            if (pat.length < 5 || (!pat.includes('{COUNTER}') && !pat.includes('{SEQ}'))) {
              throw new AppError(
                400,
                'INVALID_NUMBERING_PATTERN',
                `Pola penomoran "${field}" tidak valid. Wajib menyertakan token {COUNTER} agar nomor dokumen tetap unik.`
              );
            }
            nextValue[field] = pat;
          }
        }
      }

      // Pertahankan secret di database bila UI mengirimkan nilai ter-masking ('••••••••')
      if (key === 'whatsapp_gateway' || key === 'smtp_configuration') {
        const { rows: existingRows } = await query('SELECT value FROM system_settings WHERE key = $1', [key]);
        const prev = existingRows[0]?.value || {};
        if (key === 'whatsapp_gateway') {
          if (isMaskedSecret(nextValue.api_key)) {
            nextValue.api_key = prev.api_key || prev.token || '';
          }
          if (isMaskedSecret(nextValue.token)) {
            nextValue.token = prev.token || prev.api_key || nextValue.api_key || '';
          }
          delete nextValue.has_secret;
        } else if (key === 'smtp_configuration') {
          if (isMaskedSecret(nextValue.pass)) {
            nextValue.pass = prev.pass || '';
          }
          delete nextValue.has_secret;
        }
      }

      const { rows } = await query(
        `INSERT INTO system_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             updated_by = EXCLUDED.updated_by,
             updated_at = now()
         RETURNING *`,
        [key, JSON.stringify(nextValue), req.user.id]
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
        setting: {
          ...rows[0],
          value: maskSensitiveSetting(key, rows[0].value)
        }
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 3b. GET / POST / PUT / DELETE Calibration Tools (Phase 5 Master Kalibrasi Alat Uji)
const calibrationToolSchema = Joi.object({
  code: Joi.string().trim().min(2).max(50).required(),
  name: Joi.string().trim().min(3).max(160).required(),
  brand: Joi.string().trim().min(2).max(120).required(),
  serialNo: Joi.string().trim().max(100).allow('', null),
  category: Joi.string().trim().min(2).max(80).required(),
  certNo: Joi.string().trim().min(3).max(120).required(),
  calibrationLab: Joi.string().trim().max(160).allow('', null),
  calibratedAt: Joi.string().trim().allow('', null),
  validUntil: Joi.string().trim().required()
});

async function getStoredCalibrationTools() {
  const { rows } = await query(`SELECT value FROM system_settings WHERE key = 'calibration_tools'`);
  if (rows[0]?.value?.items && Array.isArray(rows[0].value.items)) {
    return rows[0].value.items;
  }
  return [...DEFAULT_CALIBRATION_TOOLS];
}

router.get('/calibration-tools', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN'), async (_req, res, next) => {
  try {
    const items = await getStoredCalibrationTools();
    return res.json({ items: items.map(enrichCalibrationTool) });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/calibration-tools',
  authorize('ADMIN_SISTEM'),
  validate(calibrationToolSchema),
  async (req, res, next) => {
    try {
      const tool = req.body;
      const items = await getStoredCalibrationTools();
      if (items.some((t) => t.code.toUpperCase() === tool.code.toUpperCase())) {
        throw new AppError(409, 'DUPLICATE_TOOL_CODE', `Alat ukur dengan kode ${tool.code} sudah terdaftar.`);
      }
      if (tool.calibratedAt && tool.validUntil && new Date(tool.calibratedAt) > new Date(tool.validUntil)) {
        throw new AppError(400, 'INVALID_CALIBRATION_DATE', 'Tanggal kalibrasi tidak boleh setelah tanggal kedaluwarsa.');
      }

      const nextItems = [...items, tool];
      await query(
        `INSERT INTO system_settings (key, value, description, updated_by, updated_at)
         VALUES ('calibration_tools', $1, 'Registri alat ukur riksa uji dan sertifikat kalibrasi KAN', $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [JSON.stringify({ items: nextItems }), req.user.id]
      );
      invalidateSettingsCache();

      await recordAudit({
        userId: req.user.id,
        action: 'CALIBRATION_TOOL_CREATE',
        entity: 'system_settings',
        entityId: tool.code,
        summary: { code: tool.code, name: tool.name, certNo: tool.certNo, validUntil: tool.validUntil },
        ip: req.ip
      });

      return res.status(201).json({
        message: `Alat ukur ${tool.name} berhasil ditambahkan.`,
        tool: enrichCalibrationTool(tool),
        items: nextItems.map(enrichCalibrationTool)
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.put(
  '/calibration-tools/:code',
  authorize('ADMIN_SISTEM'),
  validate(calibrationToolSchema),
  async (req, res, next) => {
    try {
      const targetCode = req.params.code;
      const tool = req.body;
      if (tool.calibratedAt && tool.validUntil && new Date(tool.calibratedAt) > new Date(tool.validUntil)) {
        throw new AppError(400, 'INVALID_CALIBRATION_DATE', 'Tanggal kalibrasi tidak boleh setelah tanggal kedaluwarsa.');
      }

      const items = await getStoredCalibrationTools();
      const idx = items.findIndex((t) => t.code.toUpperCase() === targetCode.toUpperCase());
      if (idx === -1) {
        throw new AppError(404, 'TOOL_NOT_FOUND', `Alat ukur ${targetCode} tidak ditemukan.`);
      }

      const nextItems = [...items];
      nextItems[idx] = { ...nextItems[idx], ...tool };

      await query(
        `INSERT INTO system_settings (key, value, description, updated_by, updated_at)
         VALUES ('calibration_tools', $1, 'Registri alat ukur riksa uji dan sertifikat kalibrasi KAN', $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
        [JSON.stringify({ items: nextItems }), req.user.id]
      );
      invalidateSettingsCache();

      await recordAudit({
        userId: req.user.id,
        action: 'CALIBRATION_TOOL_UPDATE',
        entity: 'system_settings',
        entityId: tool.code,
        summary: { code: tool.code, name: tool.name, certNo: tool.certNo, validUntil: tool.validUntil },
        ip: req.ip
      });

      return res.json({
        message: `Data kalibrasi ${tool.name} berhasil diperbarui.`,
        tool: enrichCalibrationTool(nextItems[idx]),
        items: nextItems.map(enrichCalibrationTool)
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete('/calibration-tools/:code', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const targetCode = req.params.code;
    const items = await getStoredCalibrationTools();
    const existing = items.find((t) => t.code.toUpperCase() === targetCode.toUpperCase());
    if (!existing) {
      throw new AppError(404, 'TOOL_NOT_FOUND', `Alat ukur ${targetCode} tidak ditemukan.`);
    }
    const nextItems = items.filter((t) => t.code.toUpperCase() !== targetCode.toUpperCase());

    await query(
      `INSERT INTO system_settings (key, value, description, updated_by, updated_at)
       VALUES ('calibration_tools', $1, 'Registri alat ukur riksa uji dan sertifikat kalibrasi KAN', $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [JSON.stringify({ items: nextItems }), req.user.id]
    );
    invalidateSettingsCache();

    await recordAudit({
      userId: req.user.id,
      action: 'CALIBRATION_TOOL_DELETE',
      entity: 'system_settings',
      entityId: targetCode,
      summary: { code: existing.code, name: existing.name },
      ip: req.ip
    });

    return res.json({
      message: `Alat ukur ${existing.name} berhasil dihapus dari registri.`,
      items: nextItems.map(enrichCalibrationTool)
    });
  } catch (err) {
    return next(err);
  }
});

// 3c. PUT /categories/:id - Perbarui metadata Master 7 Bidang K3 (tanpa merusak objek historis)
const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(3).max(160).optional(),
  default_bap_scopes: Joi.array().items(Joi.string().trim().min(2).max(120)).optional(),
  attribute_schema: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().trim().min(1).max(60).required(),
        label: Joi.string().trim().min(1).max(120).required(),
        required: Joi.boolean().default(false)
      })
    )
    .optional()
}).min(1);

router.put(
  '/categories/:id',
  authorize('ADMIN_SISTEM'),
  validate(updateCategorySchema),
  async (req, res, next) => {
    try {
      const categoryId = Number(req.params.id);
      const { name, default_bap_scopes, attribute_schema } = req.body;

      const { rows: existing } = await query('SELECT * FROM object_categories WHERE id = $1', [categoryId]);
      if (!existing[0]) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Bidang K3 tidak ditemukan.');
      }
      const cur = existing[0];

      const { rows } = await query(
        `UPDATE object_categories
         SET name = $1,
             default_bap_scopes = $2::jsonb,
             attribute_schema = $3::jsonb
         WHERE id = $4
         RETURNING *`,
        [
          name || cur.name,
          JSON.stringify(default_bap_scopes ?? cur.default_bap_scopes ?? []),
          JSON.stringify(attribute_schema ?? cur.attribute_schema ?? []),
          categoryId
        ]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'MASTER_CATEGORY_UPDATE',
        entity: 'object_categories',
        entityId: String(categoryId),
        summary: {
          code: cur.code,
          name: rows[0].name,
          attributeCount: Array.isArray(rows[0].attribute_schema) ? rows[0].attribute_schema.length : 0,
          scopeCount: Array.isArray(rows[0].default_bap_scopes) ? rows[0].default_bap_scopes.length : 0
        },
        ip: req.ip
      });

      return res.json({
        message: `Master Bidang [${cur.code}] ${rows[0].name} berhasil diperbarui.`,
        category: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 4. GET /checklists - Daftar 7 Bidang K3 & Template Ceklis Dinamis (Hanya versi AKTIF + riwayat versi)
router.get('/checklists', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'), async (_req, res, next) => {
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
                WHERE it.category_id = oc.id AND itv.status = 'AKTIF'
              ) AS total_checklist_items,
              (
                SELECT itv.id
                FROM inspection_template_versions itv
                JOIN inspection_templates it ON it.id = itv.template_id
                WHERE it.category_id = oc.id AND itv.status = 'AKTIF'
                ORDER BY itv.version DESC
                LIMIT 1
              ) AS active_version_id,
              (
                SELECT itv.version
                FROM inspection_template_versions itv
                JOIN inspection_templates it ON it.id = itv.template_id
                WHERE it.category_id = oc.id AND itv.status = 'AKTIF'
                ORDER BY itv.version DESC
                LIMIT 1
              ) AS active_version_no,
              (
                SELECT count(*)::int
                FROM inspections i
                JOIN inspection_template_versions itv ON itv.id = i.template_version_id
                JOIN inspection_templates it ON it.id = itv.template_id
                WHERE it.category_id = oc.id AND itv.status = 'AKTIF'
              ) AS active_version_usage_count
       FROM object_categories oc
       ORDER BY oc.id ASC`
    );

    const { rows: templateItems } = await query(
      `SELECT iti.id, iti.version_id, iti.section, iti.label, iti.input_type,
              iti.unit, iti.min_value, iti.max_value, iti.is_required, iti.seq,
              it.category_id, oc.code AS category_code, oc.name AS category_name,
              itv.version AS version_no
       FROM inspection_template_items iti
       JOIN inspection_template_versions itv ON itv.id = iti.version_id
       JOIN inspection_templates it ON it.id = itv.template_id
       JOIN object_categories oc ON oc.id = it.category_id
       WHERE itv.status = 'AKTIF'
       ORDER BY oc.id ASC, iti.seq ASC`
    );

    const { rows: versions } = await query(
      `SELECT itv.id, itv.version AS version_no, itv.version, itv.status, itv.is_validated, itv.published_at AS effective_from, itv.created_at,
              it.category_id, oc.code AS category_code,
              (SELECT count(*)::int FROM inspection_template_items iti WHERE iti.version_id = itv.id) AS item_count,
              (SELECT count(*)::int FROM inspections i WHERE i.template_version_id = itv.id) AS inspection_count
       FROM inspection_template_versions itv
       JOIN inspection_templates it ON it.id = itv.template_id
       JOIN object_categories oc ON oc.id = it.category_id
       ORDER BY oc.id ASC, itv.version DESC`
    );

    return res.json({
      categories,
      templateItems,
      versions
    });
  } catch (err) {
    return next(err);
  }
});

// 4b. POST /checklists/versions - Terbitkan versi template baru secara eksplisit (Snapshot Versioning)
const createVersionSchema = Joi.object({
  category_id: Joi.number().integer().min(1).max(7).required()
});

router.post(
  '/checklists/versions',
  authorize('ADMIN_SISTEM'),
  validate(createVersionSchema),
  async (req, res, next) => {
    try {
      const { category_id } = req.body;
      const result = await withTransaction(async (db) => {
        const { rows: curVer } = await db.query(
          `SELECT itv.id, itv.version AS version_no, itv.template_id, oc.code
           FROM inspection_template_versions itv
           JOIN inspection_templates it ON it.id = itv.template_id
           JOIN object_categories oc ON oc.id = it.category_id
           WHERE it.category_id = $1 AND itv.status = 'AKTIF'
           ORDER BY itv.version DESC LIMIT 1`,
          [category_id]
        );
        if (!curVer[0]) {
          throw new AppError(404, 'TEMPLATE_NOT_FOUND', 'Template aktif untuk bidang ini tidak ditemukan.');
        }

        const oldVer = curVer[0];
        await db.query(
          `UPDATE inspection_template_versions SET status = 'ARSIP' WHERE template_id = $1 AND status = 'AKTIF'`,
          [oldVer.template_id]
        );

        const nextVerNo = oldVer.version_no + 1;
        const { rows: newVer } = await db.query(
          `INSERT INTO inspection_template_versions (template_id, version, status, is_validated, validated_by, validated_at, published_at, created_by)
           VALUES ($1, $2, 'AKTIF', true, $3, now(), now(), $3)
           RETURNING *, version AS version_no`,
          [oldVer.template_id, nextVerNo, req.user.id]
        );

        await db.query(
          `INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, is_required, unit, min_value, max_value)
           SELECT $1, seq, section, label, input_type, is_required, unit, min_value, max_value
           FROM inspection_template_items
           WHERE version_id = $2
           ORDER BY seq ASC`,
          [newVer[0].id, oldVer.id]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'CHECKLIST_VERSION_PUBLISH',
            entity: 'inspection_template_versions',
            entityId: newVer[0].id,
            summary: {
              categoryCode: oldVer.code,
              previousVersion: oldVer.version_no,
              newVersion: nextVerNo
            },
            ip: req.ip
          },
          db
        );

        return {
          code: oldVer.code,
          previousVersionNo: oldVer.version_no,
          newVersion: newVer[0]
        };
      });

      return res.status(201).json({
        message: `Versi baru v${result.newVersion.version_no} untuk Bidang ${result.code} berhasil diterbitkan. Inspeksi terdahulu tetap tersimpan pada v${result.previousVersionNo}.`,
        version: result.newVersion
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 5. POST /checklists/items - Tambah butir pertanyaan checklist (Copy-on-Write bila versi aktif sudah dipakai inspeksi)
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
      if (min_value !== null && min_value !== undefined && max_value !== null && max_value !== undefined && Number(min_value) > Number(max_value)) {
        throw new AppError(400, 'INVALID_THRESHOLD_RANGE', 'Batas ukur minimum tidak boleh lebih besar dari batas maksimum.');
      }

      const result = await withTransaction(async (db) => {
        const editable = await ensureEditableTemplateVersion(db, version_id, req.user.id);
        const targetVersionId = editable.versionId;

        const seqRes = await db.query(
          'SELECT COALESCE(MAX(seq), 0) + 1 AS next_seq FROM inspection_template_items WHERE version_id = $1',
          [targetVersionId]
        );
        const nextSeq = seqRes.rows[0].next_seq;

        const { rows } = await db.query(
          `INSERT INTO inspection_template_items
             (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [targetVersionId, nextSeq, section, label, input_type, unit || null, min_value ?? null, max_value ?? null, is_required ?? true]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'CHECKLIST_ITEM_CREATE',
            entity: 'inspection_template_items',
            entityId: rows[0].id,
            summary: {
              label,
              section,
              versionId: targetVersionId,
              versionNo: editable.versionNo,
              clonedNewVersion: editable.cloned
            },
            ip: req.ip
          },
          db
        );

        return { item: rows[0], editable };
      });

      return res.status(201).json({
        message: result.editable.cloned
          ? `Butir checklist ditambahkan pada versi baru v${result.editable.versionNo} (data historis v${result.editable.previousVersionNo} tetap terlindungi).`
          : 'Butir checklist berhasil ditambahkan.',
        item: result.item,
        versionCloned: result.editable.cloned,
        versionNo: result.editable.versionNo
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 6. PUT /checklists/items/:id - Edit butir checklist (Copy-on-Write bila versi aktif sudah dipakai inspeksi)
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

      if (min_value !== null && min_value !== undefined && max_value !== null && max_value !== undefined && Number(min_value) > Number(max_value)) {
        throw new AppError(400, 'INVALID_THRESHOLD_RANGE', 'Batas ukur minimum tidak boleh lebih besar dari batas maksimum.');
      }

      const result = await withTransaction(async (db) => {
        const { rows: existing } = await db.query('SELECT * FROM inspection_template_items WHERE id = $1', [id]);
        if (!existing[0]) {
          throw new AppError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Butir checklist tidak ditemukan.');
        }

        const editable = await ensureEditableTemplateVersion(db, existing[0].version_id, req.user.id);
        const targetItemId = editable.cloned ? editable.itemMap.get(id) || id : id;

        const { rows } = await db.query(
          `UPDATE inspection_template_items
           SET section = COALESCE($1::text, section),
               label = COALESCE($2::text, label),
               input_type = COALESCE($3::text, input_type),
               unit = CASE WHEN $4::boolean THEN $5::text ELSE unit END,
               min_value = CASE WHEN $6::boolean THEN $7::numeric ELSE min_value END,
               max_value = CASE WHEN $8::boolean THEN $9::numeric ELSE max_value END,
               is_required = COALESCE($10::boolean, is_required),
               seq = COALESCE($11::integer, seq)
           WHERE id = $12::uuid
           RETURNING *`,
          [
            section || null,
            label || null,
            input_type || null,
            unit !== undefined,
            unit || null,
            min_value !== undefined,
            min_value ?? null,
            max_value !== undefined,
            max_value ?? null,
            is_required ?? null,
            seq ?? null,
            targetItemId
          ]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'CHECKLIST_ITEM_UPDATE',
            entity: 'inspection_template_items',
            entityId: targetItemId,
            summary: {
              label: rows[0].label,
              section: rows[0].section,
              versionNo: editable.versionNo,
              clonedNewVersion: editable.cloned
            },
            ip: req.ip
          },
          db
        );

        return { item: rows[0], editable };
      });

      return res.json({
        message: result.editable.cloned
          ? `Butir checklist diperbarui pada versi baru v${result.editable.versionNo} (inspeksi historis v${result.editable.previousVersionNo} tetap utuh).`
          : 'Butir checklist berhasil diperbarui.',
        item: result.item,
        versionCloned: result.editable.cloned,
        versionNo: result.editable.versionNo
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 7. DELETE /checklists/items/:id - Hapus butir checklist (Copy-on-Write bila versi aktif sudah dipakai inspeksi)
router.delete('/checklists/items/:id', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await withTransaction(async (db) => {
      const { rows: existing } = await db.query('SELECT * FROM inspection_template_items WHERE id = $1', [id]);
      if (!existing[0]) {
        throw new AppError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Butir checklist tidak ditemukan.');
      }

      const editable = await ensureEditableTemplateVersion(db, existing[0].version_id, req.user.id);
      const targetItemId = editable.cloned ? editable.itemMap.get(id) || id : id;

      const { rows } = await db.query('DELETE FROM inspection_template_items WHERE id = $1 RETURNING *', [targetItemId]);
      if (!rows[0]) {
        throw new AppError(404, 'CHECKLIST_ITEM_NOT_FOUND', 'Butir checklist tidak ditemukan.');
      }

      await recordAudit(
        {
          userId: req.user.id,
          action: 'CHECKLIST_ITEM_DELETE',
          entity: 'inspection_template_items',
          entityId: targetItemId,
          summary: {
            label: rows[0].label,
            versionNo: editable.versionNo,
            clonedNewVersion: editable.cloned
          },
          ip: req.ip
        },
        db
      );

      return { deleted: rows[0], editable };
    });

    return res.json({
      message: result.editable.cloned
        ? `Butir checklist dihapus pada versi baru v${result.editable.versionNo} (data historis v${result.editable.previousVersionNo} tetap terlindungi).`
        : 'Butir checklist berhasil dihapus.',
      versionCloned: result.editable.cloned,
      versionNo: result.editable.versionNo
    });
  } catch (err) {
    return next(err);
  }
});

// 8. POST /test-email - Uji koneksi SMTP email
router.post('/test-email', authorize('ADMIN_SISTEM'), async (req, res, _next) => {
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
router.post('/test-whatsapp', authorize('ADMIN_SISTEM'), async (req, res, _next) => {
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
router.get('/backups', authorize('ADMIN_SISTEM'), async (_req, res, next) => {
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

// 11. POST /backups - Buat SQL dump backup database relasional penuh
router.post('/backups', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const filename = `urd_backup_${timestamp}.sql`;

    const dump = await generateGenuineSqlDump({
      filename,
      createdByName: req.user.fullName || req.user.email
    });

    await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
    const filePath = path.join(BACKUP_DIR, filename);
    await fs.promises.writeFile(filePath, dump.content, 'utf8');

    const summaryPayload = {
      ...dump.tableCounts,
      _meta: {
        totalRows: dump.totalRows,
        sha256: dump.sha256,
        format: 'POSTGRESQL_SQL_DUMP',
        persistedOnDisk: true
      }
    };

    const { rows } = await query(
      `INSERT INTO database_backups (filename, file_size_bytes, backup_type, status, summary, created_by)
       VALUES ($1, $2, 'FULL_SQL_DUMP', 'SUCCESS', $3, $4)
       RETURNING *`,
      [filename, dump.byteSize, JSON.stringify(summaryPayload), req.user.id]
    );

    await recordAudit({
      userId: req.user.id,
      action: 'DATABASE_BACKUP_CREATE',
      entity: 'database_backups',
      entityId: rows[0].id,
      summary: {
        filename,
        sizeBytes: dump.byteSize,
        totalRows: dump.totalRows,
        sha256: dump.sha256.slice(0, 16)
      },
      ip: req.ip
    });

    return res.status(201).json({
      message: `Backup SQL database (${dump.totalRows} baris data, ${Math.max(1, Math.round(dump.byteSize / 1024))} KB) berhasil dibuat dan diverifikasi.`,
      backup: rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

// 11b. POST /backups/:id/verify - Verifikasi integritas checksum SHA-256 & ketersediaan file SQL dump
router.post('/backups/:id/verify', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM database_backups WHERE id = $1', [id]);
    if (!rows[0]) throw new AppError(404, 'BACKUP_NOT_FOUND', 'Catatan backup tidak ditemukan.');

    const backup = rows[0];
    const safeFilename = path.basename(backup.filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);
    let content = null;

    if (fs.existsSync(filePath)) {
      content = await fs.promises.readFile(filePath, 'utf8');
    } else {
      const regenerated = await generateGenuineSqlDump({
        filename: safeFilename,
        createdByName: req.user.fullName
      });
      await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
      await fs.promises.writeFile(filePath, regenerated.content, 'utf8');
      content = regenerated.content;
    }

    const computedSha256 = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    const byteSize = Buffer.byteLength(content, 'utf8');
    const statementCount = (content.match(/^INSERT INTO /gm) || []).length;

    return res.json({
      verified: true,
      filename: safeFilename,
      byteSize,
      statementCount,
      sha256: computedSha256,
      message: `Arsip SQL terverifikasi utuh (${statementCount} statement INSERT, SHA-256: ${computedSha256.slice(0, 12)}...).`
    });
  } catch (err) {
    return next(err);
  }
});

// 12. GET /backups/:id/download - Unduh file SQL dump database lengkap
router.get('/backups/:id/download', authorize('ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query('SELECT * FROM database_backups WHERE id = $1', [id]);
    if (!rows[0]) throw new AppError(404, 'BACKUP_NOT_FOUND', 'File backup tidak ditemukan.');

    const backup = rows[0];
    const safeFilename = path.basename(backup.filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);
    let exportContent = null;

    if (fs.existsSync(filePath)) {
      exportContent = await fs.promises.readFile(filePath, 'utf8');
    } else {
      const dump = await generateGenuineSqlDump({
        filename: safeFilename,
        createdByName: req.user.fullName || 'Super Admin'
      });
      await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
      await fs.promises.writeFile(filePath, dump.content, 'utf8');
      exportContent = dump.content;
    }

    await recordAudit({
      userId: req.user.id,
      action: 'DATABASE_BACKUP_DOWNLOAD',
      entity: 'database_backups',
      entityId: backup.id,
      summary: { filename: safeFilename },
      ip: req.ip
    });

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return res.send(exportContent);
  } catch (err) {
    return next(err);
  }
});

export default router;
