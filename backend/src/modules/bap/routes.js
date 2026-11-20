import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { notifyRoles } from '../../services/notify.js';
import { generateBapPdfBuffer } from '../../services/pdf-generator.js';
import { generateBapDocxBuffer } from '../../services/docx-generator.js';
import { BAP_SCOPE_CATALOG, syncOrderUnitStatus } from '../../services/workflow.js';
import { recordActivityHistory } from '../../services/inspection-activities.js';
import { formatDocumentNumber } from '../../services/system-settings-service.js';
import {
  resolveAttachmentPath,
  saveDataUrlPng,
  saveUploadedFile
} from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const updateBapDraftSchema = Joi.object({
  bapNo: Joi.string().max(160).allow('', null).optional(),
  inspectionDate: Joi.date().iso().allow('', null),
  scopeItems: Joi.array().items(Joi.string().max(160)).min(1).required(),
  conclusion: Joi.string()
    .valid('MEMENUHI_SYARAT', 'MEMENUHI_SYARAT_DENGAN_CATATAN', 'TIDAK_MEMENUHI_SYARAT')
    .allow('', null),
  isCompliant: Joi.boolean().allow(null),
  notes: Joi.string().max(4000).allow('', null),
  inspectionNotes: Joi.string().max(4000).allow('', null),
  visualCheckNotes: Joi.string().max(2000).allow('', null),
  dimensionMeasurementNotes: Joi.string().max(2000).allow('', null),
  ndtTestingNotes: Joi.string().max(2000).allow('', null),
  loadFunctionTestNotes: Joi.string().max(2000).allow('', null),
  safetyDeviceCheckNotes: Joi.string().max(2000).allow('', null),
  documentData: Joi.object().unknown(true).optional()
});

const bapSignatureSchema = Joi.object({
  signerRole: Joi.string().valid('AHLI_K3', 'PERWAKILAN_KLIEN').default('PERWAKILAN_KLIEN'),
  signerName: Joi.string().min(2).max(160).required(),
  signerTitle: Joi.string().max(160).allow('', null),
  dataUrl: Joi.string().min(20).allow('', null).optional(),
  useSavedSignature: Joi.boolean().optional()
}).or('dataUrl', 'useSavedSignature');

const reopenBapSchema = Joi.object({
  reason: Joi.string().min(3).max(1000).required()
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Otomatis memastikan setiap unit alat yang valid pada suatu PO memiliki dokumen BAP (1 Unit = 1 BAP).
 * Berjalan secara idempoten: jika BAP sudah ada untuk (order_id, object_id), tidak akan dibuat duplikat.
 */
export async function ensureBapsForOrderUnits(db, { orderId = null, objectId = null, userId = null } = {}) {
  const params = [];
  const conds = [
    `o.status <> 'DIBATALKAN'`,
    `oo.unit_status <> 'DIBATALKAN'`,
    `NOT EXISTS (
       SELECT 1 FROM bap_documents b
       WHERE b.order_id = oo.order_id AND b.object_id = oo.object_id
     )`
  ];

  if (orderId) {
    params.push(orderId);
    conds.push(`oo.order_id = $${params.length}`);
  }
  if (objectId) {
    params.push(objectId);
    conds.push(`oo.object_id = $${params.length}`);
  }

  const { rows: pendingUnits } = await db.query(
    `SELECT oo.order_id, oo.object_id, oo.scope_items, oo.proposed_date, oo.unit_notes,
            oo.inspector_id AS unit_inspector_id,
            o.order_no, o.po_number, o.client_id,
            c.name AS client_name, c.address AS client_address,
            cc.name AS contact_name, cc.position AS contact_title,
            t.name AS object_name, t.category_id, t.brand, t.model, t.manufacturer,
            t.serial_number, t.capacity, t.manufacture_year, t.install_location,
            t.equipment_type_id, t.equipment_subtype_id,
            oc.code AS category_code, oc.default_bap_scopes
     FROM order_objects oo
     JOIN orders o ON o.id = oo.order_id
     JOIN clients c ON c.id = o.client_id
     LEFT JOIN client_contacts cc ON cc.id = o.contact_id
     JOIN test_objects t ON t.id = oo.object_id
     JOIN object_categories oc ON oc.id = t.category_id
     WHERE ${conds.join(' AND ')}
     ORDER BY o.created_at ASC, oo.order_id, oo.object_id`,
    params
  );

  if (!pendingUnits.length) {
    return [];
  }

  const createdBaps = [];
  for (const unit of pendingUnits) {
    try {
      const { rows: existingBap } = await db.query(
        'SELECT id FROM bap_documents WHERE order_id = $1 AND object_id = $2 LIMIT 1',
        [unit.order_id, unit.object_id]
      );
      if (existingBap[0]) {
        continue;
      }

      let { rows: inspRows } = await db.query(
        `SELECT id, inspector_id FROM inspections
         WHERE order_id = $1 AND object_id = $2
         LIMIT 1`,
        [unit.order_id, unit.object_id]
      );
      let inspection = inspRows[0];

      if (!inspection) {
        let inspectorId = unit.unit_inspector_id || null;
        if (!inspectorId) {
          const { rows: actRows } = await db.query(
            `SELECT inspector_id FROM inspection_activities
             WHERE order_id = $1 AND object_id = $2 AND status <> 'DIBATALKAN' AND inspector_id IS NOT NULL
             ORDER BY sequence_no DESC LIMIT 1`,
            [unit.order_id, unit.object_id]
          );
          inspectorId = actRows[0]?.inspector_id || null;
        }
        if (!inspectorId) {
          const { rows: asgRows } = await db.query(
            `SELECT inspector_id FROM assignments
             WHERE order_id = $1 AND status IN ('MENUNGGU', 'DITERIMA') AND inspector_id IS NOT NULL
             ORDER BY created_at DESC LIMIT 1`,
            [unit.order_id]
          );
          inspectorId = asgRows[0]?.inspector_id || null;
        }
        if (!inspectorId && userId) {
          const { rows: uRows } = await db.query(
            `SELECT id FROM users WHERE id = $1 AND role IN ('AHLI_K3', 'INSPECTOR')`,
            [userId]
          );
          inspectorId = uRows[0]?.id || null;
        }
        if (!inspectorId) {
          const { rows: defaultInspRows } = await db.query(
            `SELECT id FROM users WHERE role IN ('AHLI_K3', 'INSPECTOR') AND is_active = true ORDER BY created_at ASC LIMIT 1`
          );
          inspectorId = defaultInspRows[0]?.id || null;
        }

        const { rows: verRows } = await db.query(
          `SELECT tv.id
           FROM inspection_templates t
           JOIN inspection_template_versions tv ON tv.template_id = t.id
           WHERE tv.status = 'AKTIF'
             AND (
               (t.subtype_id IS NOT NULL AND t.subtype_id = $1)
               OR (t.equipment_type_id IS NOT NULL AND t.equipment_type_id = $2)
               OR (t.category_id = $3)
             )
           ORDER BY CASE WHEN t.subtype_id IS NOT NULL THEN 1 WHEN t.equipment_type_id IS NOT NULL THEN 2 ELSE 3 END, tv.version DESC
           LIMIT 1`,
          [unit.equipment_subtype_id || null, unit.equipment_type_id || null, unit.category_id]
        );
        let templateVersionId = verRows[0]?.id || null;
        if (!templateVersionId) {
          const { rows: fallbackVer } = await db.query(
            `SELECT id FROM inspection_template_versions WHERE status = 'AKTIF' LIMIT 1`
          );
          templateVersionId = fallbackVer[0]?.id;
        }

        if (templateVersionId && inspectorId) {
          const { rows: newInspRows } = await db.query(
            `INSERT INTO inspections (order_id, object_id, template_version_id, inspector_id, status)
             VALUES ($1, $2, $3, $4, 'DRAF')
             RETURNING id, inspector_id`,
            [unit.order_id, unit.object_id, templateVersionId, inspectorId]
          );
          inspection = newInspRows[0];
        }
      }

      if (!inspection) {
        continue;
      }

      const { rows: seqRows } = await db.query("SELECT nextval('bap_no_seq') AS seq");
      const bapNo = await formatDocumentNumber('bap', {
        counter: seqRows[0].seq,
        categoryCode: unit.category_code,
        date: new Date()
      }).catch(() => `BAP/URD/${new Date().getFullYear()}/${String(seqRows[0].seq).padStart(4, '0')}`);

      const scopes = Array.isArray(unit.scope_items) && unit.scope_items.length
        ? unit.scope_items
        : Array.isArray(unit.default_bap_scopes) && unit.default_bap_scopes.length
        ? unit.default_bap_scopes
        : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

      const { rows: inspUserRows } = await db.query(
        `SELECT id, full_name, signer_title, signature_file_id FROM users WHERE id = $1`,
        [inspection.inspector_id]
      );
      const inspUser = inspUserRows[0];
      const inspectorSignerName = inspUser?.full_name || 'Ahli K3 Pemeriksa';
      const inspectorSignerTitle = inspUser?.signer_title || 'Ahli K3 Spesialis';
      const inspectorSigFileId = inspUser?.signature_file_id || null;
      const inspectorSignedAt = inspectorSigFileId ? new Date() : null;

      const documentData = {
        object_name: unit.object_name,
        client_name: unit.client_name,
        client_address: unit.client_address || '',
        contact_name: unit.contact_name || '',
        contact_title: unit.contact_title || 'Perwakilan Perusahaan',
        manufacturer: unit.manufacturer || unit.brand || '',
        brand: unit.brand || unit.manufacturer || '',
        manufacture_year: unit.manufacture_year || '',
        serial_number: unit.serial_number || '',
        capacity: unit.capacity || '',
        install_location: unit.install_location || unit.client_address || '',
        bap_no: bapNo,
        notes: unit.unit_notes || ''
      };

      const { rows: bapRows } = await db.query(
        `INSERT INTO bap_documents (
           inspection_id, order_id, object_id, bap_no, status,
           inspection_date, scope_items, conclusion, notes,
           inspector_signer_name, inspector_signer_title, inspector_signature_file_id, inspector_signed_at,
           client_signer_name, client_signer_title,
           created_by, document_data
         )
         VALUES ($1, $2, $3, $4, 'DRAF', CURRENT_DATE, $5, NULL, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (order_id, object_id) DO NOTHING
         RETURNING id, bap_no`,
        [
          inspection.id,
          unit.order_id,
          unit.object_id,
          bapNo,
          JSON.stringify(scopes),
          unit.unit_notes || null,
          inspectorSignerName,
          inspectorSignerTitle,
          inspectorSigFileId,
          inspectorSignedAt,
          unit.contact_name || null,
          unit.contact_title || 'Perwakilan Perusahaan',
          userId || null,
          JSON.stringify(documentData)
        ]
      );

      if (bapRows[0]) {
        createdBaps.push(bapRows[0]);
      }
    } catch (err) {
      console.warn(`[ensureBapsForOrderUnits] Lewati unit ${unit.object_id}:`, err?.message);
    }
  }

  return createdBaps;
}

export async function fetchFullBapContext(db, id) {
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return null;
  }
  const { rows } = await db.query(
    `SELECT b.*,
            i.inspector_id, i.status AS inspection_status, i.conclusion AS inspection_conclusion,
            i.conclusion_notes, i.inspected_at, i.submitted_at,
            o.order_no, o.po_number, o.po_date, o.service_type,
            c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
            COALESCE(cc.name, (SELECT cc2.name FROM client_contacts cc2 WHERE cc2.client_id = c.id AND cc2.is_active = true ORDER BY cc2.is_primary DESC, cc2.created_at DESC LIMIT 1)) AS contact_name,
            cl.name AS location_name, cl.address AS location_address, cl.city AS location_city,
            t.name AS object_name, t.brand, t.model, t.manufacturer,
            t.serial_number, t.manufacture_year, t.capacity, t.capacity_unit,
            t.install_location, t.previous_permit_no, t.attributes,
            COALESCE(eq.domain_code, oc.code) AS domain_code,
            eq.name AS equipment_type_name,
            sub.name AS equipment_subtype_name,
            oc.code AS category_code, oc.name AS category_name,
            oc.default_bap_scopes, oc.lhpp_schema,
            u_insp.full_name AS inspector_name,
            u_insp.signature_file_id AS inspector_saved_sig_file_id,
            u_insp.signature_url AS inspector_saved_sig_url,
            u_insp.signer_title AS inspector_saved_signer_title,
            u_insp_fa.storage_key AS inspector_saved_sig_storage_key,
            f_insp.storage_key AS inspector_sig_storage_key,
            f_cli.storage_key AS client_sig_storage_key,
            l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
     FROM bap_documents b
     JOIN inspections i ON i.id = b.inspection_id
     JOIN orders o ON o.id = b.order_id
     JOIN clients c ON c.id = o.client_id
     LEFT JOIN client_contacts cc ON cc.id = o.contact_id
     LEFT JOIN client_locations cl ON cl.id = o.location_id
     JOIN test_objects t ON t.id = b.object_id
     JOIN object_categories oc ON oc.id = t.category_id
     LEFT JOIN equipment_types eq ON eq.id = COALESCE(t.equipment_name_id, t.equipment_type_id)
     LEFT JOIN equipment_types sub ON sub.id = t.equipment_subtype_id
     JOIN users u_insp ON u_insp.id = i.inspector_id
     LEFT JOIN file_attachments u_insp_fa ON u_insp_fa.id = u_insp.signature_file_id
     LEFT JOIN file_attachments f_insp ON f_insp.id = b.inspector_signature_file_id
     LEFT JOIN file_attachments f_cli ON f_cli.id = b.client_signature_file_id
     LEFT JOIN lhpp_documents l ON l.inspection_id = b.inspection_id
     WHERE b.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const bap = rows[0];
  const revRes = await db.query(
    `SELECT r.*, u.full_name AS actor_name
     FROM bap_revisions r
     LEFT JOIN users u ON u.id = r.actor_id
     WHERE r.bap_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  );

  const overrides =
    bap.document_data && typeof bap.document_data === 'object' && !Array.isArray(bap.document_data)
      ? bap.document_data
      : {};

  const effectiveInspectorSigFileId =
    bap.inspector_signature_file_id || bap.inspector_saved_sig_file_id || null;
  const effectiveInspectorSigStorageKey =
    bap.inspector_sig_storage_key || (!bap.inspector_signature_file_id ? bap.inspector_saved_sig_storage_key : null) || null;
  const effectiveInspectorSignerName =
    bap.inspector_signer_name || bap.inspector_name;
  const effectiveInspectorSignerTitle =
    bap.inspector_signer_title || bap.inspector_saved_signer_title || 'Ahli K3 Spesialis';

  return {
    ...bap,
    ...overrides,
    id: bap.id,
    order_id: bap.order_id,
    object_id: bap.object_id,
    inspection_id: bap.inspection_id,
    status: bap.status,
    version: bap.version,
    created_at: bap.created_at,
    updated_at: bap.updated_at,
    document_data: overrides,
    raw_source: {
      client_name: bap.client_name,
      client_address: bap.client_address,
      object_name: bap.object_name,
      brand: bap.brand,
      model: bap.model,
      manufacturer: bap.manufacturer,
      serial_number: bap.serial_number,
      capacity: bap.capacity,
      manufacture_year: bap.manufacture_year,
      install_location: bap.install_location,
      bap_no: bap.bap_no
    },
    is_compliant:
      (overrides.conclusion || bap.conclusion) === 'TIDAK_MEMENUHI_SYARAT'
        ? false
        : (overrides.conclusion || bap.conclusion)
        ? true
        : null,
    inspection_notes: overrides.notes !== undefined ? overrides.notes : (bap.notes || ''),
    inspector_sig_file_id: effectiveInspectorSigFileId,
    inspector_signature_file_id: effectiveInspectorSigFileId,
    inspector_signer_name: effectiveInspectorSignerName,
    inspector_signer_title: effectiveInspectorSignerTitle,
    effectiveInspectorSignerName,
    effectiveInspectorSignerTitle,
    inspector_signature_path: effectiveInspectorSigStorageKey
      ? resolveAttachmentPath(effectiveInspectorSigStorageKey)
      : null,
    inspector_has_saved_sig: Boolean(bap.inspector_saved_sig_file_id),
    inspector_saved_sig_url: bap.inspector_saved_sig_url || null,
    inspector_saved_signer_title: bap.inspector_saved_signer_title || null,
    client_sig_file_id: bap.client_signature_file_id,
    client_signature_path: bap.client_sig_storage_key
      ? resolveAttachmentPath(bap.client_sig_storage_key)
      : null,
    client_signature_url: bap.client_signature_file_id
      ? `/api/v1/dashboard/files/${bap.client_signature_file_id}`
      : null,
    revisions: revRes.rows
  };
}

export async function canAccessBap(db, bap, user) {
  if (!user) return false;
  if (['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN'].includes(user.role)) return true;
  if (!['AHLI_K3', 'INSPECTOR'].includes(user.role)) return false;
  if (bap.inspector_id === user.id) return true;
  const { rows } = await db.query(
    `SELECT 1 FROM assignments
     WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU','DITERIMA')
     LIMIT 1`,
    [bap.order_id, user.id]
  );
  return Boolean(rows[0]);
}

const prepareBapSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  activityId: Joi.string().uuid().allow('', null),
  objectId: Joi.string().uuid().allow('', null),
  inspectionDate: Joi.date().iso().allow('', null),
  scopeItems: Joi.array().items(Joi.string().max(160)).default([])
});

router.get('/scopes', async (_req, res, next) => {
  try {
    const { rows: categories } = await query(
      'SELECT id, code, name, default_bap_scopes, lhpp_schema FROM object_categories ORDER BY id ASC'
    );
    return res.json({ catalog: BAP_SCOPE_CATALOG, scopes: BAP_SCOPE_CATALOG, categories });
  } catch (err) {
    return next(err);
  }
});

// Siapkan draf BAP lebih awal, bahkan sebelum checklist lapangan selesai,
// agar Inspector dapat meminta tanda tangan PIC klien. Status BAP terpisah
// dari status pemeriksaan dan tidak menandai pekerjaan lapangan sebagai selesai.
router.post('/prepare', authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM', 'ADMIN_KANTOR'), validate(prepareBapSchema), async (req, res, next) => {
  try {
    const { orderId, activityId, objectId, inspectionDate, scopeItems } = req.body;

    const bap = await withTransaction(async (db) => {
      const { rows: ordRows } = await db.query(
        'SELECT id, order_no, po_number, client_id FROM orders WHERE id = $1',
        [orderId]
      );
      const order = ordRows[0];
      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'PO tidak ditemukan.');

      let activity = null;
      if (activityId) {
        const { rows } = await db.query(
          'SELECT * FROM inspection_activities WHERE id = $1 AND order_id = $2',
          [activityId, orderId]
        );
        activity = rows[0];
        if (!activity) throw new AppError(404, 'ACTIVITY_NOT_FOUND', 'Aktivitas pemeriksaan tidak ditemukan pada PO ini.');
      } else if (objectId) {
        const { rows } = await db.query(
          `SELECT * FROM inspection_activities
           WHERE order_id = $1 AND object_id = $2 AND status <> 'DIBATALKAN'
           ORDER BY sequence_no DESC LIMIT 1`,
          [orderId, objectId]
        );
        activity = rows[0] || null;
      }
      const resolvedObjectId = activity?.object_id || objectId;
      if (!resolvedObjectId) {
        throw new AppError(400, 'OBJECT_REQUIRED', 'Unit alat wajib dipilih untuk menyiapkan BAP.');
      }

      const { rows: unitRows } = await db.query(
        `SELECT t.id, t.name, t.category_id, oc.code AS category_code, oo.scope_items, oc.default_bap_scopes
         FROM order_objects oo
         JOIN test_objects t ON t.id = oo.object_id
         JOIN object_categories oc ON oc.id = t.category_id
         WHERE oo.order_id = $1 AND oo.object_id = $2`,
        [orderId, resolvedObjectId]
      );
      const unit = unitRows[0];
      if (!unit) throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit alat tidak terdaftar pada PO ini.');

      if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
        const ownsActivity = activity?.inspector_id === req.user.id;
        const { rows: asgRows } = await db.query(
          `SELECT 1 FROM assignments
           WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU', 'DITERIMA') LIMIT 1`,
          [orderId, req.user.id]
        );
        if (!ownsActivity && !asgRows[0]) {
          throw new AppError(403, 'FORBIDDEN', 'Anda tidak ditugaskan untuk menyiapkan BAP pada unit ini.');
        }
      }

      // Idempoten: gunakan BAP yang sudah ada untuk unit/order yang sama.
      const { rows: existingBap } = await db.query(
        `SELECT b.id FROM bap_documents b
         WHERE (b.order_id = $1 AND b.object_id = $2)
            OR ($3::uuid IS NOT NULL AND b.inspection_id IN (SELECT id FROM inspections WHERE activity_id = $3))
         ORDER BY b.created_at DESC LIMIT 1`,
        [orderId, resolvedObjectId, activity?.id || null]
      );
      if (existingBap[0]) {
        if (activity) {
          await db.query(
            `UPDATE inspections i
             SET activity_id = $1, updated_at = now()
             FROM bap_documents b
             WHERE b.id = $2 AND i.id = b.inspection_id AND i.activity_id IS NULL`,
            [activity.id, existingBap[0].id]
          );
        }
        return fetchFullBapContext(db, existingBap[0].id);
      }

      let { rows: inspectionRows } = await db.query(
        activity
          ? 'SELECT * FROM inspections WHERE activity_id = $1'
          : `SELECT * FROM inspections
             WHERE order_id = $1 AND object_id = $2 AND activity_id IS NULL`,
        activity ? [activity.id] : [orderId, resolvedObjectId]
      );
      let inspection = inspectionRows[0];

      if (!inspection) {
        const { rows: verRows } = await db.query(
          `SELECT tv.id
           FROM inspection_templates t
           JOIN inspection_template_versions tv ON tv.template_id = t.id
           WHERE tv.status = 'AKTIF'
             AND (
               (t.subtype_id IS NOT NULL AND t.subtype_id = (SELECT equipment_subtype_id FROM test_objects WHERE id = $1))
               OR (t.equipment_type_id IS NOT NULL AND t.equipment_type_id = (SELECT equipment_type_id FROM test_objects WHERE id = $1))
               OR (t.category_id = $2)
             )
           ORDER BY CASE WHEN t.subtype_id IS NOT NULL THEN 1 WHEN t.equipment_type_id IS NOT NULL THEN 2 ELSE 3 END, tv.version DESC
           LIMIT 1`,
          [resolvedObjectId, unit.category_id]
        );
        if (!verRows[0]) {
          throw new AppError(
            400,
            'TEMPLATE_NOT_FOUND',
            'Belum ada template inspeksi aktif untuk unit ini sehingga BAP awal belum dapat disiapkan.'
          );
        }
        const { rows: createdInsp } = await db.query(
          `INSERT INTO inspections (order_id, object_id, activity_id, template_version_id, inspector_id, status)
           VALUES ($1, $2, $3, $4, $5, 'DRAF') RETURNING *`,
          [orderId, resolvedObjectId, activity?.id || null, verRows[0].id, req.user.id]
        );
        inspection = createdInsp[0];
      }

      const { rows: seqRows } = await db.query("SELECT nextval('bap_no_seq') AS seq");
      const bapNo = await formatDocumentNumber('bap', {
        counter: seqRows[0].seq,
        categoryCode: unit.category_code,
        date: new Date()
      }).catch(() => `BAP/URD/${new Date().getFullYear()}/${String(seqRows[0].seq).padStart(4, '0')}`);

      const scopes = scopeItems?.length
        ? scopeItems
        : Array.isArray(unit.scope_items) && unit.scope_items.length
        ? unit.scope_items
        : Array.isArray(unit.default_bap_scopes) && unit.default_bap_scopes.length
        ? unit.default_bap_scopes
        : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

      const { rows: bapRows } = await db.query(
        `INSERT INTO bap_documents
           (bap_no, inspection_id, order_id, object_id, status, inspection_date, scope_items, created_by)
         VALUES ($1, $2, $3, $4, 'DRAF', COALESCE($5::date, CURRENT_DATE), $6::jsonb, $7)
         RETURNING *`,
        [bapNo, inspection.id, orderId, resolvedObjectId, inspectionDate || null, JSON.stringify(scopes), req.user.id]
      );

      await db.query(
        `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
         VALUES ($1, 1, 'PREPARED', 'Draf BAP disiapkan untuk proses tanda tangan PIC klien', $2, $3)`,
        [bapRows[0].id, JSON.stringify({ scope_items: scopes, before_checklist_complete: true }), req.user.id]
      );

      if (activity) {
        await recordActivityHistory(db, {
          activityId: activity.id,
          action: 'BAP_PREPARED',
          note: 'Draf BAP disiapkan sebelum pemeriksaan selesai untuk tanda tangan PIC klien',
          snapshot: { bapNo },
          actorId: req.user.id
        });
      }

      await notifyRoles(
        {
          roles: ['ADMIN_KANTOR', 'ADMIN_SISTEM'],
          type: 'BAP_PREPARED',
          title: `Draf BAP Disiapkan: ${unit.name}`,
          body: `Draf BAP ${bapNo} telah disiapkan pada PO ${order.po_number || order.order_no}. Checklist lapangan belum tentu selesai.`,
          link: '/app/bap'
        },
        db
      );

      await recordAudit(
        {
          userId: req.user.id,
          action: 'BAP_PREPARE',
          entity: 'bap_documents',
          entityId: bapRows[0].id,
          summary: { bapNo, orderId, objectId: resolvedObjectId, activityId: activity?.id || null },
          ip: req.ip
        },
        db
      );

      return fetchFullBapContext(db, bapRows[0].id);
    });

    return res.status(201).json({ bap });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    // Otomatis pastikan setiap unit alat pada PO memiliki dokumen BAP (1 Unit = 1 BAP)
    try {
      await ensureBapsForOrderUnits({ query }, { userId: req.user?.id });
    } catch (syncErr) {
      console.warn('[BAP Sync Warning]', syncErr?.message);
    }

    const { page, limit, offset } = parsePagination(req.query);
    const status = (req.query.status || '').trim();
    const orderId = (req.query.orderId || '').trim();
    const search = (req.query.q || '').trim();

    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`i.inspector_id = $${params.length}`);
    }

    if (status === 'BELUM_TTD_PIC') {
      conds.push('b.client_signed_at IS NULL');
    } else if (status === 'SUDAH_TTD_PIC') {
      conds.push('b.client_signed_at IS NOT NULL');
    } else if (status === 'FINAL') {
      conds.push("b.status = 'FINAL'");
    } else if (status === 'DRAF') {
      conds.push("b.status = 'DRAF'");
    } else if (status) {
      params.push(status);
      conds.push(`b.status = $${params.length}`);
    }

    if (orderId) {
      params.push(orderId);
      conds.push(`b.order_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(b.bap_no) LIKE $${params.length}
          OR lower(o.order_no) LIKE $${params.length}
          OR lower(coalesce(o.po_number,'')) LIKE $${params.length}
          OR lower(c.name) LIKE $${params.length}
          OR lower(t.name) LIKE $${params.length}
          OR lower(coalesce(t.serial_number,'')) LIKE $${params.length}
          OR lower(coalesce(b.client_signer_name,'')) LIKE $${params.length})`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       JOIN orders o ON o.id = b.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = b.object_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT b.*,
              o.order_no, o.po_number,
              c.name AS client_name, c.address AS client_address,
              COALESCE(b.client_signer_name, cc.name) AS contact_name,
              t.name AS object_name, t.serial_number, t.capacity, t.install_location,
              oc.code AS category_code, oc.name AS category_name,
              u.full_name AS inspector_name,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       JOIN orders o ON o.id = b.order_id
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_contacts cc ON cc.id = o.contact_id
       JOIN test_objects t ON t.id = b.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       LEFT JOIN lhpp_documents l ON l.inspection_id = b.inspection_id
       ${whereSql}
       ORDER BY b.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ items: rows, page, limit, total: countRes.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const bap = await fetchFullBapContext({ query }, req.params.id);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    const hasAccess = await canAccessBap({ query }, bap, req.user);
    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengakses BAP milik penugasan Anda.');
    }
    const { rows: revisions } = await query(
      `SELECT r.*, u.full_name AS actor_name
       FROM bap_revisions r
       LEFT JOIN users u ON u.id = r.actor_id
       WHERE r.bap_id = $1
       ORDER BY r.created_at DESC`,
      [bap.id]
    );
    return res.json({ bap, revisions, scopeCatalog: BAP_SCOPE_CATALOG });
  } catch (err) {
    return next(err);
  }
});

router.put(
  '/:id/draft',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(updateBapDraftSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { inspectionDate, scopeItems, conclusion, isCompliant, notes, inspectionNotes, documentData } = req.body;
      const resolvedConclusion =
        conclusion ||
        (isCompliant === false ? 'TIDAK_MEMENUHI_SYARAT' : isCompliant === true ? 'MEMENUHI_SYARAT' : null);
      const resolvedNotes = notes !== undefined ? notes : inspectionNotes;

      const updated = await withTransaction(async (db) => {
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        const hasAccess = await canAccessBap(db, cur, req.user);
        if (!hasAccess) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengubah BAP milik penugasan Anda.');
        }
        if (cur.status === 'FINAL') {
          throw new AppError(
            409,
            'BAP_LOCKED',
            'BAP yang sudah difinalisasi terkunci. Gunakan fitur Revisi BAP untuk membuka kunci dengan alasan tercatat.'
          );
        }

        const mergedDocData = {
          ...(cur.document_data || {}),
          ...(documentData || {})
        };
        const customBapNo = mergedDocData.bap_no ? String(mergedDocData.bap_no).trim() : null;
        const customContactName = mergedDocData.contact_name ? String(mergedDocData.contact_name).trim() : null;

        await db.query(
          `UPDATE bap_documents
           SET inspection_date = COALESCE($1::date, inspection_date),
               scope_items = $2::jsonb,
               conclusion = $3,
               notes = $4,
               document_data = $5::jsonb,
               bap_no = COALESCE($6, bap_no),
               client_signer_name = COALESCE($8, client_signer_name),
               updated_at = now()
           WHERE id = $7
           RETURNING *`,
          [
            inspectionDate || null,
            JSON.stringify(scopeItems),
            resolvedConclusion,
            resolvedNotes || null,
            JSON.stringify(mergedDocData),
            customBapNo,
            id,
            customContactName
          ]
        );

        await db.query(
          `UPDATE order_objects
           SET scope_items = $1::jsonb, updated_at = now()
           WHERE order_id = $2 AND object_id = $3`,
          [JSON.stringify(scopeItems), cur.order_id, cur.object_id]
        );

        await db.query(
          `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
           VALUES ($1, $2, 'UPDATED', 'Informasi BAP diperbarui oleh pengguna terotorisasi', $3, $4)`,
          [
            id,
            (cur.version || 1),
            JSON.stringify({
              scope_items: scopeItems,
              conclusion: resolvedConclusion,
              document_data: mergedDocData
            }),
            req.user.id
          ]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'BAP_UPDATE_DRAFT',
            entity: 'bap_documents',
            entityId: id,
            summary: {
              bapNo: customBapNo || cur.bap_no,
              scopeCount: scopeItems.length,
              conclusion: resolvedConclusion,
              hasCustomDocumentData: Boolean(documentData && Object.keys(documentData).length)
            },
            ip: req.ip
          },
          db
        );

        return fetchFullBapContext(db, id);
      });

      return res.json({ bap: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/signatures',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(bapSignatureSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { signerRole, signerName, signerTitle, dataUrl } = req.body;

      const updated = await withTransaction(async (db) => {
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        const hasAccess = await canAccessBap(db, cur, req.user);
        if (!hasAccess) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat menandatangani BAP penugasan Anda.');
        }
        if (cur.status === 'FINAL') {
          throw new AppError(409, 'BAP_LOCKED', 'BAP sudah difinalisasi dan tidak dapat diubah.');
        }

        let file;
        if (req.body.useSavedSignature && !dataUrl) {
          const userRes = await db.query(
            'SELECT signature_file_id FROM users WHERE id = $1',
            [req.user.id]
          );
          const userSigFileId = userRes.rows[0]?.signature_file_id;
          if (!userSigFileId) {
            throw new AppError(400, 'NO_SAVED_SIGNATURE', 'Anda belum menyimpan tanda tangan digital di Pengaturan Profil.');
          }
          const fileRes = await db.query(
            'SELECT * FROM file_attachments WHERE id = $1',
            [userSigFileId]
          );
          const userFile = fileRes.rows[0];
          if (!userFile) {
            throw new AppError(404, 'SIGNATURE_FILE_NOT_FOUND', 'Berkas tanda tangan profil tidak ditemukan.');
          }
          const fullPath = resolveAttachmentPath(userFile.storage_key);
          const buffer = await readFile(fullPath);
          file = await saveUploadedFile(
            {
              buffer,
              originalName: `ttd-bap-${signerRole.toLowerCase()}.png`,
              mimeType: userFile.mime_type || 'image/png',
              ownerType: 'BAP_SIGNATURE',
              ownerId: id,
              uploadedBy: req.user.id
            },
            db
          );
        } else {
          file = await saveDataUrlPng(
            {
              dataUrl,
              ownerType: 'BAP_SIGNATURE',
              ownerId: id,
              originalName: `ttd-bap-${signerRole.toLowerCase()}.png`,
              uploadedBy: req.user.id
            },
            db
          );
        }

        // Simpan juga ke inspection_signatures untuk pemeriksaan terkait
        await db.query(
          `INSERT INTO inspection_signatures (inspection_id, signer_role, signer_name, signer_title, file_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (inspection_id, signer_role) DO UPDATE SET
             signer_name = EXCLUDED.signer_name,
             signer_title = EXCLUDED.signer_title,
             file_id = EXCLUDED.file_id,
             signed_at = now()`,
          [cur.inspection_id, signerRole, signerName.trim(), signerTitle || null, file.id]
        );

        let updQuery;
        if (signerRole === 'AHLI_K3') {
          updQuery = `
            UPDATE bap_documents
            SET inspector_signer_name = $1,
                inspector_signer_title = $2,
                inspector_signature_file_id = $3,
                inspector_signed_at = now(),
                updated_at = now()
            WHERE id = $4
            RETURNING *`;
        } else {
          updQuery = `
            UPDATE bap_documents
            SET client_signer_name = $1,
                client_signer_title = $2,
                client_signature_file_id = $3,
                client_signed_at = now(),
                updated_at = now()
            WHERE id = $4
            RETURNING *`;
        }

        const { rows } = await db.query(updQuery, [
          signerName.trim(),
          signerTitle || null,
          file.id,
          id
        ]);

        await recordAudit(
          {
            userId: req.user.id,
            action: `BAP_SIGN_${signerRole}`,
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, signerRole, signerName: signerName.trim() },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.status(201).json({ bap: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/finalize',
  authorize('ADMIN_KANTOR', 'ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await withTransaction(async (db) => {
        await db.query('SELECT id, status FROM bap_documents WHERE id = $1 FOR UPDATE', [id]);
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        const hasAccess = await canAccessBap(db, cur, req.user);
        if (!hasAccess) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat memfinalisasi BAP penugasan Anda.');
        }
        if (cur.status === 'FINAL') {
          throw new AppError(400, 'BAP_ALREADY_FINAL', 'Dokumen BAP sudah berstatus FINAL.');
        }

        const scopes = Array.isArray(cur.scope_items) ? cur.scope_items : [];
        if (scopes.length === 0) {
          throw new AppError(
            400,
            'BAP_SCOPE_REQUIRED',
            'Pilih minimal satu butir Ruang Lingkup Riksa Uji yang dilaksanakan sebelum memfinalisasi BAP.'
          );
        }
        if (!cur.conclusion) {
          throw new AppError(
            400,
            'BAP_CONCLUSION_REQUIRED',
            'Kesimpulan hasil riksa uji pada BAP wajib ditetapkan.'
          );
        }
        if (!cur.inspector_signature_file_id || !cur.inspector_signer_name) {
          throw new AppError(
            400,
            'BAP_INSPECTOR_SIGNATURE_REQUIRED',
            'Tanda tangan Inspector / Ahli K3 wajib dilengkapi sebelum BAP difinalisasi.'
          );
        }
        if (!cur.client_signature_file_id || !cur.client_signer_name) {
          throw new AppError(
            400,
            'BAP_CLIENT_SIGNATURE_REQUIRED',
            'Tanda tangan Pemilik Alat / Perwakilan Klien wajib dilengkapi sebelum BAP difinalisasi.'
          );
        }

        // Pastikan aset tanda tangan tersimpan terpatri secara permanen pada record BAP jika sebelumnya mengacu pada profil
        await db.query(
          `UPDATE bap_documents
           SET inspector_signature_file_id = COALESCE(inspector_signature_file_id, $1),
               inspector_signer_name = COALESCE(inspector_signer_name, $2),
               inspector_signer_title = COALESCE(inspector_signer_title, $3),
               inspector_signed_at = COALESCE(inspector_signed_at, now())
           WHERE id = $4`,
          [cur.inspector_signature_file_id, cur.inspector_signer_name, cur.inspector_signer_title, id]
        );

        const verificationCode = cur.verification_code || `URD-BAP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const pdfBuffer = await generateBapPdfBuffer({ ...cur, status: 'FINAL', verification_code: verificationCode });
        const docHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
        const savedPdf = await saveUploadedFile(
          {
            buffer: pdfBuffer,
            originalName: `${cur.bap_no.replace(/\//g, '-')}.pdf`,
            mimeType: 'application/pdf',
            ownerType: 'BAP_PDF',
            ownerId: id,
            caption: `Berita Acara Riksa Uji ${cur.bap_no}`,
            uploadedBy: req.user.id
          },
          db
        );

        const { rows: bapRows } = await db.query(
          `UPDATE bap_documents
           SET status = 'FINAL',
               verification_code = $1,
               document_hash = $2,
               pdf_file_id = $3,
               finalized_by = $4,
               finalized_at = now(),
               updated_at = now()
           WHERE id = $5
           RETURNING *`,
          [verificationCode, docHash, savedPdf.id, req.user.id, id]
        );

        await db.query(
          `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
           VALUES ($1, $2, 'FINALIZED', 'BAP difinalisasi dan siap dicetak', $3, $4)`,
          [
            id,
            cur.version,
            {
              bap_no: cur.bap_no,
              scope_items: cur.scope_items,
              conclusion: cur.conclusion,
              inspector_signer_name: cur.inspector_signer_name,
              client_signer_name: cur.client_signer_name
            },
            req.user.id
          ]
        );

        // Status unit setelah BAP difinalisasi menjadi SIAP_DISTRIBUSI
        await syncOrderUnitStatus(db, {
          orderId: cur.order_id,
          objectId: cur.object_id,
          unitStatus: 'SIAP_DISTRIBUSI',
          actorId: req.user.id
        });

        // Aktivitas pemeriksaan terkait selesai setelah dokumennya final.
        const { rows: actRows } = await db.query(
          `SELECT ia.id, ia.status FROM inspection_activities ia
           JOIN inspections i ON i.activity_id = ia.id
           WHERE i.id = $1`,
          [cur.inspection_id]
        );
        if (actRows[0]) {
          await db.query(
            "UPDATE inspection_activities SET status = 'SELESAI', updated_at = now() WHERE id = $1",
            [actRows[0].id]
          );
          await recordActivityHistory(db, {
            activityId: actRows[0].id,
            action: 'COMPLETED',
            fromStatus: actRows[0].status,
            toStatus: 'SELESAI',
            note: `BAP ${cur.bap_no} difinalisasi`,
            actorId: req.user.id
          });
        }

        // Daftarkan otomatis antrean distribusi dokumen wajib:
        // 1. BAP ke Klien
        await db.query(
          `INSERT INTO document_distributions
             (document_type, document_id, document_no, order_id, object_id,
              target_destination, recipient_name, dispatch_date, dispatch_media, status, dispatched_by)
           VALUES ('BAP', $1, $2, $3, $4, 'KLIEN', $5, CURRENT_DATE, 'PORTAL', 'SIAP_DIKIRIM', $6)
           ON CONFLICT DO NOTHING`,
          [id, cur.bap_no, cur.order_id, cur.object_id, cur.client_name, req.user.id]
        );

        // 2. BAP ke Disnaker
        await db.query(
          `INSERT INTO document_distributions
             (document_type, document_id, document_no, order_id, object_id,
              target_destination, recipient_name, dispatch_date, dispatch_media, status, dispatched_by)
           VALUES ('BAP', $1, $2, $3, $4, 'DISNAKER', 'Seksi Pengawasan K3 Disnaker', CURRENT_DATE, 'KURIR_FISIK', 'SIAP_DIKIRIM', $5)
           ON CONFLICT DO NOTHING`,
          [id, cur.bap_no, cur.order_id, cur.object_id, req.user.id]
        );

        // 3. LHPP ke Disnaker
        if (cur.lhpp_id && cur.lhpp_no) {
          await db.query(
            `INSERT INTO document_distributions
               (document_type, document_id, document_no, order_id, object_id,
                target_destination, recipient_name, dispatch_date, dispatch_media, status, dispatched_by)
             VALUES ('LHPP', $1, $2, $3, $4, 'DISNAKER', 'Seksi Pengawasan K3 Disnaker', CURRENT_DATE, 'KURIR_FISIK', 'SIAP_DIKIRIM', $5)
             ON CONFLICT DO NOTHING`,
            [cur.lhpp_id, cur.lhpp_no, cur.order_id, cur.object_id, req.user.id]
          );
        }

        await notifyRoles(
          {
            roles: ['MARKETING', 'ADMIN_KANTOR'],
            type: 'BAP_FINALIZED',
            title: `BAP Selesai Difinalisasi: ${cur.bap_no}`,
            body: `Dokumen BAP & LHPP untuk unit ${cur.object_name} (${cur.client_name}) siap dicetak dan didistribusikan.`,
            link: `/app/bap`
          },
          db
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'BAP_FINALIZE',
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, lhppId: cur.lhpp_id },
            ip: req.ip
          },
          db
        );

        return { bap: bapRows[0] };
      });

      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/reopen',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'AHLI_K3'),
  validate(reopenBapSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const reopened = await withTransaction(async (db) => {
        await db.query('SELECT id, status FROM bap_documents WHERE id = $1 FOR UPDATE', [id]);
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        const hasAccess = await canAccessBap(db, cur, req.user);
        if (!hasAccess) {
          throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses untuk membuka ulang BAP ini.');
        }
        if (cur.lhpp_status === 'TERBIT') {
          throw new AppError(
            409,
            'LHPP_ALREADY_PUBLISHED',
            'LHPP terkait sudah terbit sehingga BAP tidak dapat dibuka ulang.'
          );
        }
        const { rows: suketRows } = await db.query(
          "SELECT id FROM suket_documents WHERE bap_id = $1 AND status = 'TERBIT' LIMIT 1",
          [id]
        );
        if (suketRows[0]) {
          throw new AppError(
            409,
            'SUKET_ALREADY_PUBLISHED',
            'Suket K3 untuk BAP ini sudah terbit sehingga BAP tidak dapat dibuka ulang.'
          );
        }

        const nextVer = cur.version + 1;
        await db.query(
          `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
           VALUES ($1, $2, 'REOPENED', $3, $4, $5)`,
          [
            id,
            nextVer,
            reason.trim(),
            {
              bap_no: cur.bap_no,
              scope_items: cur.scope_items,
              conclusion: cur.conclusion,
              notes: cur.notes
            },
            req.user.id
          ]
        );

        const { rows } = await db.query(
          `UPDATE bap_documents
           SET status = 'REVISI', version = $1, pdf_file_id = NULL, updated_at = now()
           WHERE id = $2
           RETURNING *`,
          [nextVer, id]
        );

        await syncOrderUnitStatus(db, {
          orderId: cur.order_id,
          objectId: cur.object_id,
          unitStatus: 'BAP_DRAF',
          actorId: req.user.id
        });

        await recordAudit(
          {
            userId: req.user.id,
            action: 'BAP_REOPEN',
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, version: nextVer, reason: reason.trim() },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.json({ bap: reopened });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const bap = await fetchFullBapContext({ query }, req.params.id);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    const hasAccess = await canAccessBap({ query }, bap, req.user);
    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
    }
    let buf;
    if (bap.status === 'FINAL' && bap.pdf_file_id) {
      const { rows } = await query(
        `SELECT storage_key FROM file_attachments
         WHERE id = $1 AND owner_type = 'BAP_PDF' AND owner_id = $2 AND deleted_at IS NULL`,
        [bap.pdf_file_id, bap.id]
      );
      if (rows[0]) {
        buf = await readFile(resolveAttachmentPath(rows[0].storage_key));
      } else {
        buf = await generateBapPdfBuffer(bap);
      }
    } else {
      buf = await generateBapPdfBuffer(bap);
    }
    const filename = `${(bap.bap_no || 'BAP-DRAF').replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(buf);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/docx', async (req, res, next) => {
  try {
    const bap = await fetchFullBapContext({ query }, req.params.id);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    const hasAccess = await canAccessBap({ query }, bap, req.user);
    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
    }
    const docxBuffer = await generateBapDocxBuffer(bap);
    const filename = bap.bap_no
      ? `${bap.bap_no.replace(/\//g, '-')}.docx`
      : `Draf-BAP-${bap.id.slice(0, 8)}.docx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(docxBuffer);
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/share-log', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { shareMethod, method, recipient, notes } = req.body || {};
    const bap = await fetchFullBapContext({ query }, id);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    const hasAccess = await canAccessBap({ query }, bap, req.user);
    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
    }

    await recordAudit({
      userId: req.user.id,
      action: 'BAP_SHARE',
      entity: 'bap_documents',
      entityId: id,
      summary: {
        bapNo: bap.bap_no,
        orderId: bap.order_id,
        objectId: bap.object_id,
        objectName: bap.object_name,
        clientName: bap.client_name,
        shareMethod: shareMethod || method || 'NATIVE_OR_LINK',
        recipient: recipient || null,
        notes: notes || null
      },
      ip: req.ip
    });

    return res.json({ message: 'Riwayat pembagian BAP berhasil dicatat.' });
  } catch (err) {
    return next(err);
  }
});

// Batch print seluruh BAP dalam satu PO (satu halaman per unit tanpa mencampur identitas)
router.get('/order/:orderId/batch-pdf', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { rows } = await query(
      `SELECT b.id, i.inspector_id
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       WHERE b.order_id = $1
       ORDER BY b.created_at ASC`,
      [orderId]
    );
    if (!rows.length) {
      throw new AppError(
        404,
        'NO_BAP_IN_ORDER',
        'Belum ada dokumen BAP yang terbentuk untuk PO/Order ini.'
      );
    }
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && rows.some((row) => row.inspector_id !== req.user.id)) {
      throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses ke seluruh BAP dalam order ini.');
    }
    const fullList = [];
    for (const r of rows) {
      const ctx = await fetchFullBapContext({ query }, r.id);
      if (ctx) fullList.push(ctx);
    }
    const buf = await generateBapPdfBuffer(fullList);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Batch-BAP-${orderId.slice(0, 8)}.pdf"`);
    return res.send(buf);
  } catch (err) {
    return next(err);
  }
});

export default router;
