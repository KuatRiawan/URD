import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { createNotification } from '../../services/notify.js';
import { generateRecommendationLetterPdfBuffer } from '../../services/pdf-generator.js';
import { formatDocumentNumber } from '../../services/system-settings-service.js';
import { BAP_SCOPE_CATALOG, syncOrderUnitStatus } from '../../services/workflow.js';
import { recordActivityHistory } from '../../services/inspection-activities.js';
import { saveDataUrlPng, saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const templateCreateSchema = Joi.object({
  categoryId: Joi.number().integer().min(1).max(20).optional(),
  domainCode: Joi.string().trim().uppercase().allow('', null).optional(),
  equipmentGroupId: Joi.string().uuid().allow('', null).optional(),
  equipmentTypeId: Joi.string().uuid().allow('', null).optional(),
  equipmentNameId: Joi.string().uuid().allow('', null).optional(),
  subtypeId: Joi.string().uuid().allow('', null).optional(),
  inspectionTypeCode: Joi.string().allow('', null).optional(),
  name: Joi.string().min(3).max(160).required(),
  isValidated: Joi.boolean().default(false),
  items: Joi.array()
    .items(
      Joi.object({
        seq: Joi.number().integer().min(1).required(),
        section: Joi.string().min(2).max(120).required(),
        label: Joi.string().min(2).max(300).required(),
        inputType: Joi.string()
          .valid(
            'CHOICE',
            'CONFORMITY',
            'YES_NO',
            'TEXT',
            'LONG_TEXT',
            'NUMBER',
            'MEASUREMENT',
            'SINGLE_SELECT',
            'MULTI_SELECT',
            'DATE',
            'PHOTO',
            'FILE'
          )
          .required(),
        unit: Joi.string().max(40).allow('', null),
        minValue: Joi.number().allow(null),
        maxValue: Joi.number().allow(null),
        isRequired: Joi.boolean().default(true),
        options: Joi.array().default([]),
        requiresNote: Joi.boolean().default(false),
        requiresPhoto: Joi.boolean().default(false),
        conditionParentSeq: Joi.number().integer().allow(null),
        conditionExpectedValue: Joi.string().allow('', null),
        validationRules: Joi.object().default({})
      })
    )
    .min(1)
    .required()
});

const startInspectionSchema = Joi.object({
  orderId: Joi.string().uuid(),
  objectId: Joi.string().uuid(),
  activityId: Joi.string().uuid().allow('', null),
  templateVersionId: Joi.string().uuid().allow('', null)
}).or('activityId', 'orderId');

const saveDraftSchema = Joi.object({
  conclusion: Joi.string()
    .valid('MEMENUHI_SYARAT', 'MEMENUHI_SYARAT_DENGAN_CATATAN', 'TIDAK_MEMENUHI_SYARAT')
    .allow('', null),
  conclusionNotes: Joi.string().max(2000).allow('', null),
  results: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        choiceValue: Joi.string().valid('SESUAI', 'TIDAK_SESUAI', 'TIDAK_BERLAKU').allow('', null),
        numberValue: Joi.number().allow(null),
        textValue: Joi.string().max(1000).allow('', null),
        dateValue: Joi.date().iso().allow('', null),
        note: Joi.string().max(1000).allow('', null)
      })
    )
    .default([]),
  objectAttributes: Joi.object().unknown(true).optional()
});

const findingSchema = Joi.object({
  itemId: Joi.string().uuid().allow('', null),
  severity: Joi.string().valid('KRITIS', 'MAYOR', 'MINOR').required(),
  description: Joi.string().min(3).max(1500).required(),
  recommendation: Joi.string().min(3).max(1500).required()
});

const signatureSchema = Joi.object({
  signerRole: Joi.string()
    .valid('INSPECTOR', 'AHLI_K3', 'PERWAKILAN_KLIEN', 'PIC_KLIEN')
    .required(),
  signerName: Joi.string().min(2).max(120).required(),
  signerTitle: Joi.string().max(120).allow('', null),
  dataUrl: Joi.string().min(30).required()
});

const reopenSchema = Joi.object({
  reason: Joi.string().min(5).max(500).required(),
  targetSection: Joi.string().max(80).allow('', null).optional()
});

// Resolver Template Checklist Dinamis berdasarkan Bidang Riksa Uji, Jenis Alat, Nama Alat, dan Jenis Riksa
router.get('/templates/resolve', async (req, res, next) => {
  try {
    let domainCode = (req.query.domainCode || req.query.domain || '').trim().toUpperCase();
    const equipmentNameId = req.query.equipmentNameId || req.query.equipmentTypeId || req.query.equipmentType;
    const equipmentGroupId = req.query.equipmentGroupId || req.query.groupId;
    const subtypeId = req.query.subtypeId || req.query.subtype;
    const inspectionTypeCode = (req.query.inspectionTypeCode || req.query.inspectionType || '').trim().toUpperCase();
    let categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;

    let resolvedGroupId = equipmentGroupId || null;

    if (equipmentNameId) {
      const { rows: etRows } = await query(
        'SELECT domain_code, group_id FROM equipment_types WHERE id = $1',
        [equipmentNameId]
      );
      if (etRows[0]?.domain_code && !domainCode) domainCode = etRows[0].domain_code;
      if (etRows[0]?.group_id && !resolvedGroupId) resolvedGroupId = etRows[0].group_id;
    }

    if (!categoryId && domainCode) {
      const { rows: domRows } = await query(
        'SELECT legacy_category_id FROM inspection_domains WHERE code = $1',
        [domainCode]
      );
      if (domRows[0]?.legacy_category_id) categoryId = domRows[0].legacy_category_id;
    }

    let matchedTemplate = null;
    let resolvedBy = null;

    // 1. Coba cari berdasarkan Nama Alat spesifik (equipment_name_id) + inspection_type_code
    if (equipmentNameId && inspectionTypeCode) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE (t.equipment_name_id = $1 OR t.equipment_type_id = $1)
           AND t.inspection_type_code = $2 AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [equipmentNameId, inspectionTypeCode]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'EQUIPMENT_NAME_AND_INSPECTION_TYPE';
      }
    }

    // 2. Coba cari berdasarkan Nama Alat spesifik (equipment_name_id)
    if (!matchedTemplate && equipmentNameId) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE (t.equipment_name_id = $1 OR t.equipment_type_id = $1)
           AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [equipmentNameId]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'EQUIPMENT_NAME';
      }
    }

    // 3. Fallback: Cari berdasarkan subtipe legacy jika ada
    if (!matchedTemplate && subtypeId && inspectionTypeCode) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE t.subtype_id = $1 AND t.inspection_type_code = $2 AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [subtypeId, inspectionTypeCode]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'SUBTYPE_AND_INSPECTION_TYPE';
      }
    }
    if (!matchedTemplate && subtypeId) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE t.subtype_id = $1 AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [subtypeId]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'SUBTYPE';
      }
    }

    // 4. Fallback: Cari berdasarkan Jenis Alat (equipment_group_id)
    if (!matchedTemplate && resolvedGroupId) {
      if (inspectionTypeCode) {
        const { rows } = await query(
          `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
           FROM inspection_templates t
           JOIN inspection_template_versions tv ON tv.template_id = t.id
           WHERE t.equipment_group_id = $1 AND t.inspection_type_code = $2 AND tv.status = 'AKTIF'
           ORDER BY tv.version DESC LIMIT 1`,
          [resolvedGroupId, inspectionTypeCode]
        );
        if (rows[0]) {
          matchedTemplate = rows[0];
          resolvedBy = 'EQUIPMENT_GROUP_AND_INSPECTION_TYPE';
        }
      }
      if (!matchedTemplate) {
        const { rows } = await query(
          `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
           FROM inspection_templates t
           JOIN inspection_template_versions tv ON tv.template_id = t.id
           WHERE t.equipment_group_id = $1 AND tv.status = 'AKTIF'
           ORDER BY tv.version DESC LIMIT 1`,
          [resolvedGroupId]
        );
        if (rows[0]) {
          matchedTemplate = rows[0];
          resolvedBy = 'EQUIPMENT_GROUP';
        }
      }
    }

    // 5. Coba cari berdasarkan domain_code + inspection_type_code
    if (!matchedTemplate && domainCode && inspectionTypeCode) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE t.domain_code = $1 AND t.inspection_type_code = $2 AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [domainCode, inspectionTypeCode]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'DOMAIN_AND_INSPECTION_TYPE';
      }
    }

    // 6. Coba cari berdasarkan domain_code
    if (!matchedTemplate && domainCode) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE (t.domain_code = $1 OR t.category_id = $2) AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [domainCode, categoryId || 0]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'DOMAIN';
      }
    }

    // 7. Fallback legacy category_id
    if (!matchedTemplate && categoryId) {
      const { rows } = await query(
        `SELECT t.*, tv.id AS version_id, tv.version, tv.is_validated, tv.status AS version_status
         FROM inspection_templates t
         JOIN inspection_template_versions tv ON tv.template_id = t.id
         WHERE t.category_id = $1 AND tv.status = 'AKTIF'
         ORDER BY tv.version DESC LIMIT 1`,
        [categoryId]
      );
      if (rows[0]) {
        matchedTemplate = rows[0];
        resolvedBy = 'LEGACY_CATEGORY';
      }
    }

    if (!matchedTemplate) {
      throw new AppError(404, 'TEMPLATE_NOT_CONFIGURED', 'Tidak ditemukan template checklist aktif yang sesuai kriteria.');
    }

    // Ambil item checklist
    const { rows: items } = await query(
      `SELECT * FROM inspection_template_items WHERE version_id = $1 ORDER BY seq ASC`,
      [matchedTemplate.version_id]
    );

    return res.json({
      template: matchedTemplate,
      versionId: matchedTemplate.version_id,
      version: matchedTemplate.version,
      isValidated: matchedTemplate.is_validated,
      items,
      resolvedBy
    });
  } catch (err) {
    return next(err);
  }
});

// Daftar template beserta versi aktif dan butirnya
router.get('/templates', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const domainCode = (req.query.domainCode || '').trim().toUpperCase();
    const equipmentTypeId = req.query.equipmentTypeId;
    const params = [];
    const conds = [];

    if (categoryId) {
      params.push(categoryId);
      conds.push(`t.category_id = $${params.length}`);
    }
    if (domainCode) {
      params.push(domainCode);
      conds.push(`t.domain_code = $${params.length}`);
    }
    if (equipmentTypeId) {
      params.push(equipmentTypeId);
      conds.push(`t.equipment_type_id = $${params.length}`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows: templates } = await query(
      `SELECT t.*, oc.code AS category_code, oc.name AS category_name,
              d.name AS domain_name, et.name AS equipment_type_name,
              tv.id AS active_version_id, tv.version AS active_version,
              tv.is_validated, tv.validated_at
       FROM inspection_templates t
       LEFT JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN inspection_domains d ON d.code = t.domain_code
       LEFT JOIN equipment_types et ON et.id = t.equipment_type_id
       LEFT JOIN inspection_template_versions tv ON tv.template_id = t.id AND tv.status = 'AKTIF'
       ${whereSql}
       ORDER BY coalesce(t.category_id, 0) ASC, t.name ASC`,
      params
    );

    const versionIds = templates.map((t) => t.active_version_id).filter(Boolean);
    let itemsByVer = {};
    if (versionIds.length) {
      const { rows: items } = await query(
        `SELECT * FROM inspection_template_items
         WHERE version_id = ANY($1::uuid[])
         ORDER BY seq ASC`,
        [versionIds]
      );
      for (const it of items) {
        if (!itemsByVer[it.version_id]) itemsByVer[it.version_id] = [];
        itemsByVer[it.version_id].push(it);
      }
    }

    return res.json({
      items: templates.map((t) => ({
        ...t,
        items: itemsByVer[t.active_version_id] || []
      }))
    });
  } catch (err) {
    return next(err);
  }
});

// M3-02: Admin Sistem atau Pimpinan mengelola template berversi tanpa pemrograman
router.post(
  '/templates',
  authorize('ADMIN_SISTEM', 'PIMPINAN'),
  validate(templateCreateSchema),
  async (req, res, next) => {
    try {
      const {
        categoryId,
        domainCode,
        equipmentGroupId,
        equipmentTypeId,
        equipmentNameId,
        subtypeId,
        inspectionTypeCode,
        name,
        isValidated,
        items
      } = req.body;

      let finalCategoryId = categoryId;
      let finalDomainCode = domainCode || null;
      let finalGroupId = equipmentGroupId || null;
      const finalEquipmentNameId = equipmentNameId || equipmentTypeId || null;

      if (finalEquipmentNameId) {
        const { rows: etRows } = await query(
          `SELECT et.*, d.legacy_category_id FROM equipment_types et
           JOIN inspection_domains d ON d.code = et.domain_code
           WHERE et.id = $1`,
          [finalEquipmentNameId]
        );
        if (etRows[0]) {
          if (!finalCategoryId && etRows[0].legacy_category_id) {
            finalCategoryId = etRows[0].legacy_category_id;
          }
          if (!finalDomainCode) {
            finalDomainCode = etRows[0].domain_code;
          }
          if (!finalGroupId && etRows[0].group_id) {
            finalGroupId = etRows[0].group_id;
          }
        }
      }
      if (!finalCategoryId) finalCategoryId = 1;

      const result = await withTransaction(async (db) => {
        const { rows: tplRows } = await db.query(
          `INSERT INTO inspection_templates
             (category_id, domain_code, equipment_group_id, equipment_type_id, equipment_name_id, subtype_id, inspection_type_code, name, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (category_id, name) DO UPDATE
           SET name = EXCLUDED.name,
               domain_code = coalesce(EXCLUDED.domain_code, inspection_templates.domain_code),
               equipment_group_id = coalesce(EXCLUDED.equipment_group_id, inspection_templates.equipment_group_id),
               equipment_type_id = coalesce(EXCLUDED.equipment_type_id, inspection_templates.equipment_type_id),
               equipment_name_id = coalesce(EXCLUDED.equipment_name_id, inspection_templates.equipment_name_id),
               subtype_id = coalesce(EXCLUDED.subtype_id, inspection_templates.subtype_id),
               inspection_type_code = coalesce(EXCLUDED.inspection_type_code, inspection_templates.inspection_type_code)
           RETURNING *`,
          [
            finalCategoryId,
            finalDomainCode,
            finalGroupId,
            finalEquipmentNameId,
            finalEquipmentNameId,
            subtypeId || null,
            inspectionTypeCode || null,
            name.trim(),
            req.user.id
          ]
        );
        const tpl = tplRows[0];

        const { rows: maxVer } = await db.query(
          'SELECT coalesce(max(version), 0)::int AS max_v FROM inspection_template_versions WHERE template_id = $1',
          [tpl.id]
        );
        const nextVersion = maxVer[0].max_v + 1;

        await db.query(
          "UPDATE inspection_template_versions SET status = 'ARSIP' WHERE template_id = $1 AND status = 'AKTIF'",
          [tpl.id]
        );

        const { rows: verRows } = await db.query(
          `INSERT INTO inspection_template_versions
             (template_id, version, status, is_validated, validated_by, validated_at, published_at, created_by)
           VALUES ($1, $2, 'AKTIF', $3, $4, CASE WHEN $3 THEN now() ELSE NULL END, now(), $5)
           RETURNING *`,
          [tpl.id, nextVersion, Boolean(isValidated), isValidated ? req.user.id : null, req.user.id]
        );
        const ver = verRows[0];

        const insertedItems = [];
        for (const it of items) {
          const { rows: itemRows } = await db.query(
            `INSERT INTO inspection_template_items
               (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required,
                options, requires_note, requires_photo, condition_parent_seq, condition_expected_value, validation_rules)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
             RETURNING *`,
            [
              ver.id,
              it.seq,
              it.section.trim(),
              it.label.trim(),
              it.inputType,
              it.unit || null,
              it.minValue ?? null,
              it.maxValue ?? null,
              it.isRequired ?? true,
              JSON.stringify(it.options || []),
              it.requiresNote ?? false,
              it.requiresPhoto ?? false,
              it.conditionParentSeq || null,
              it.conditionExpectedValue || null,
              JSON.stringify(it.validationRules || {})
            ]
          );
          insertedItems.push(itemRows[0]);
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'TEMPLATE_VERSION_PUBLISH',
            entity: 'inspection_template_versions',
            entityId: ver.id,
            summary: { templateId: tpl.id, name: tpl.name, version: nextVersion, isValidated },
            ip: req.ip
          },
          db
        );

        return { template: tpl, version: ver, items: insertedItems };
      });

      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }
);

// GET /templates/:id/versions: Riwayat versi template
router.get(
  '/templates/:id/versions',
  authorize('ADMIN_SISTEM', 'PIMPINAN', 'ADMIN_KANTOR'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { rows: versions } = await query(
        `SELECT tv.*,
                u.full_name AS created_by_name,
                uv.full_name AS validated_by_name,
                (SELECT count(*)::int FROM inspection_template_items ti WHERE ti.version_id = tv.id) AS item_count,
                (SELECT count(*)::int FROM inspections i WHERE i.template_version_id = tv.id) AS inspection_count
         FROM inspection_template_versions tv
         LEFT JOIN users u ON u.id = tv.created_by
         LEFT JOIN users uv ON uv.id = tv.validated_by
         WHERE tv.template_id = $1
         ORDER BY tv.version DESC`,
        [id]
      );
      return res.json({ versions });
    } catch (err) {
      return next(err);
    }
  }
);

// POST /templates/:id/versions: Terbitkan versi baru template (Copy-on-Write)
router.post(
  '/templates/:id/versions',
  authorize('ADMIN_SISTEM', 'PIMPINAN'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { rows: tpls } = await query('SELECT * FROM inspection_templates WHERE id = $1', [id]);
      if (!tpls[0]) throw new AppError(404, 'NOT_FOUND', 'Template tidak ditemukan.');
      const tpl = tpls[0];

      // Ambil versi aktif saat ini
      const { rows: activeVers } = await query(
        "SELECT * FROM inspection_template_versions WHERE template_id = $1 AND status = 'AKTIF' ORDER BY version DESC LIMIT 1",
        [id]
      );

      const result = await withTransaction(async (db) => {
        const { rows: maxVer } = await db.query(
          'SELECT coalesce(max(version), 0)::int AS max_v FROM inspection_template_versions WHERE template_id = $1',
          [id]
        );
        const nextVersion = maxVer[0].max_v + 1;

        // Arsipkan versi lama
        await db.query(
          "UPDATE inspection_template_versions SET status = 'ARSIP' WHERE template_id = $1 AND status = 'AKTIF'",
          [id]
        );

        // Buat versi baru
        const { rows: newVers } = await db.query(
          `INSERT INTO inspection_template_versions
             (template_id, version, status, is_validated, validated_by, validated_at, published_at, created_by)
           VALUES ($1, $2, 'AKTIF', false, NULL, NULL, now(), $3)
           RETURNING *`,
          [id, nextVersion, req.user.id]
        );
        const newVer = newVers[0];

        // Jika ada versi sebelumnya, salin butir-butirnya ke versi baru
        if (activeVers[0]) {
          await db.query(
            `INSERT INTO inspection_template_items
               (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required,
                options, requires_note, requires_photo, condition_parent_seq, condition_expected_value, validation_rules)
             SELECT $1, seq, section, label, input_type, unit, min_value, max_value, is_required,
                    options, requires_note, requires_photo, condition_parent_seq, condition_expected_value, validation_rules
             FROM inspection_template_items
             WHERE version_id = $2
             ORDER BY seq ASC`,
            [newVer.id, activeVers[0].id]
          );
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'TEMPLATE_VERSION_PUBLISH',
            entity: 'inspection_template_versions',
            entityId: newVer.id,
            summary: { templateId: id, name: tpl.name, version: nextVersion },
            ip: req.ip
          },
          db
        );

        return { template: tpl, version: newVer };
      });

      return res.status(201).json({
        message: `Versi v${result.version.version} untuk template "${tpl.name}" berhasil diterbitkan.`,
        newVersion: result.version.version,
        ...result
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/templates/versions/:versionId/validate',
  authorize('ADMIN_SISTEM', 'PIMPINAN'),
  async (req, res, next) => {
    try {
      const { versionId } = req.params;
      const isValidated = req.body?.isValidated !== false;
      const { rows } = await query(
        `UPDATE inspection_template_versions
         SET is_validated = $1,
             validated_by = CASE WHEN $1 THEN $2::uuid ELSE NULL END,
             validated_at = CASE WHEN $1 THEN now() ELSE NULL END
         WHERE id = $3
         RETURNING *`,
        [isValidated, req.user.id, versionId]
      );
      if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Versi template tidak ditemukan.');
      await recordAudit({
        userId: req.user.id,
        action: 'TEMPLATE_VALIDATE',
        entity: 'inspection_template_versions',
        entityId: versionId,
        summary: { isValidated },
        ip: req.ip
      });
      return res.json({ version: rows[0] });
    } catch (err) {
      return next(err);
    }
  }
);

// Daftar form inspeksi
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = (req.query.status || '').trim();
    const orderId = (req.query.orderId || '').trim();
    const categoryCode = (req.query.categoryCode || '').trim();
    const q = (req.query.q || '').trim();
    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`(i.inspector_id = $${params.length} OR i.order_id IN (
        SELECT order_id FROM assignments WHERE inspector_id = $${params.length} AND status IN ('MENUNGGU','DITERIMA')
      ))`);
    }
    if (status) {
      params.push(status);
      conds.push(`i.status = $${params.length}`);
    }
    if (orderId) {
      params.push(orderId);
      conds.push(`i.order_id = $${params.length}`);
    }
    if (categoryCode) {
      params.push(categoryCode);
      conds.push(`oc.code = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conds.push(
        `(o.order_no ILIKE $${params.length} OR coalesce(o.po_number, '') ILIKE $${params.length} OR c.name ILIKE $${params.length} OR t.name ILIKE $${params.length} OR coalesce(t.serial_number, '') ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM inspections i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT i.*, o.order_no, o.po_number, o.valid_from, o.valid_until, c.name AS client_name,
              t.name AS object_name, t.serial_number,
              oc.code AS category_code, oc.name AS category_name,
              u.full_name AS inspector_name,
              tv.is_validated AS template_is_validated,
              act.inspection_type_code, itype.name AS inspection_type_name,
              act.planned_start_at AS activity_start_at, act.planned_end_at AS activity_end_at,
              act.schedule_status AS activity_schedule_status,
              b.id AS bap_id, b.bap_no, b.status AS bap_status,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
       FROM inspections i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       JOIN inspection_template_versions tv ON tv.id = i.template_version_id
       LEFT JOIN inspection_activities act ON act.id = i.activity_id
       LEFT JOIN inspection_types itype ON itype.code = act.inspection_type_code
       LEFT JOIN bap_documents b ON b.inspection_id = i.id
       LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
       ${whereSql}
       ORDER BY i.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ items: rows, page, limit, total: countRes.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

// Mulai atau ambil form inspeksi untuk order & objek tertentu
router.post('/start', authorize('AHLI_K3', 'INSPECTOR'), validate(startInspectionSchema), async (req, res, next) => {
  try {
    const { templateVersionId } = req.body;
    let { orderId, objectId } = req.body;
    const { activityId } = req.body;

    const inspection = await withTransaction(async (db) => {
      let activity = null;
      if (activityId) {
        const { rows: actRows } = await db.query(
          `SELECT ia.*, o.order_no, o.po_number, t.name AS object_name
           FROM inspection_activities ia
           JOIN orders o ON o.id = ia.order_id
           JOIN test_objects t ON t.id = ia.object_id
           WHERE ia.id = $1`,
          [activityId]
        );
        activity = actRows[0];
        if (!activity) throw new AppError(404, 'ACTIVITY_NOT_FOUND', 'Aktivitas pemeriksaan tidak ditemukan.');
        if (activity.status === 'DIBATALKAN') {
          throw new AppError(400, 'ACTIVITY_CANCELLED', 'Aktivitas pemeriksaan ini telah dibatalkan.');
        }
        if (orderId && activity.order_id !== orderId) {
          throw new AppError(400, 'ACTIVITY_MISMATCH', 'Aktivitas bukan bagian dari PO yang dipilih.');
        }
        orderId = activity.order_id;
        objectId = activity.object_id;

        const { rows: ownAssignment } = await db.query(
          `SELECT 1 FROM assignments
           WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU', 'DITERIMA') LIMIT 1`,
          [orderId, req.user.id]
        );
        if (activity.inspector_id !== req.user.id && !ownAssignment[0]) {
          throw new AppError(403, 'FORBIDDEN', 'Aktivitas ini tidak ditugaskan kepada Anda.');
        }
        if (activity.inspector_id && activity.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Aktivitas ini ditugaskan kepada Ahli K3 lain.');
        }
      }

      if (!objectId) {
        throw new AppError(400, 'OBJECT_REQUIRED', 'Unit alat wajib dipilih untuk memulai pemeriksaan.');
      }

      if (!activity) {
        // Pastikan Ahli K3 ditugaskan ke order ini
        const { rows: asgRows } = await db.query(
          `SELECT * FROM assignments
           WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU', 'DITERIMA')`,
          [orderId, req.user.id]
        );
        if (!asgRows[0]) {
          throw new AppError(
            403,
            'FORBIDDEN',
            'Anda tidak ditugaskan pada order ini untuk melakukan pemeriksaan.'
          );
        }
      }

      const { rows: objRows } = await db.query(
        `SELECT t.* FROM order_objects oo
         JOIN test_objects t ON t.id = oo.object_id
         WHERE oo.order_id = $1 AND oo.object_id = $2`,
        [orderId, objectId]
      );
      const obj = objRows[0];
      if (!obj) {
        throw new AppError(400, 'OBJECT_NOT_IN_ORDER', 'Objek uji tidak terdaftar pada order ini.');
      }

      const { rows: existing } = activity
        ? await db.query('SELECT * FROM inspections WHERE activity_id = $1', [activityId])
        : await db.query(
            'SELECT * FROM inspections WHERE order_id = $1 AND object_id = $2 AND activity_id IS NULL',
            [orderId, objectId]
          );
      if (existing[0]) {
        // Pemeriksaan mungkin sudah dibuat lebih awal saat BAP disiapkan.
        // Memulai pemeriksaan tetap harus menandai aktivitas sedang diperiksa.
        if (activity) {
          await db.query(
            `UPDATE inspection_activities
             SET status = 'SEDANG_DIPERIKSA', inspector_id = COALESCE(inspector_id, $1), updated_at = now()
             WHERE id = $2`,
            [req.user.id, activityId]
          );
          await recordActivityHistory(db, {
            activityId,
            action: 'INSPECTION_STARTED',
            fromStatus: activity.status,
            toStatus: 'SEDANG_DIPERIKSA',
            note: 'Pemeriksaan lapangan dimulai',
            actorId: req.user.id
          });
          await syncOrderUnitStatus(db, {
            orderId,
            objectId,
            unitStatus: 'SEDANG_DIPERIKSA',
            inspectorId: req.user.id,
            actorId: req.user.id
          });
        }
        return existing[0];
      }

      let verId = templateVersionId;
      if (!verId) {
        // Dynamic Resolution: Subtype -> Equipment Type -> Category
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
           ORDER BY
             CASE
               WHEN t.subtype_id IS NOT NULL AND t.subtype_id = $1 THEN 1
               WHEN t.equipment_type_id IS NOT NULL AND t.equipment_type_id = $2 THEN 2
               ELSE 3
             END ASC,
             tv.version DESC
           LIMIT 1`,
          [obj.equipment_subtype_id || null, obj.equipment_type_id || null, obj.category_id]
        );
        if (!verRows[0]) {
          throw new AppError(
            400,
            'TEMPLATE_NOT_FOUND',
            'Belum ada template inspeksi aktif untuk kategori/jenis unit ini.'
          );
        }
        verId = verRows[0].id;
      }

      const { rows: created } = await db.query(
        `INSERT INTO inspections (order_id, object_id, activity_id, template_version_id, inspector_id, status, inspected_at)
         VALUES ($1, $2, $3, $4, $5, 'DRAF', now())
         RETURNING *`,
        [orderId, objectId, activityId || null, verId, req.user.id]
      );

      if (activity) {
        await db.query(
          `UPDATE inspection_activities
           SET status = 'SEDANG_DIPERIKSA', inspector_id = COALESCE(inspector_id, $1), updated_at = now()
           WHERE id = $2`,
          [req.user.id, activityId]
        );
        await recordActivityHistory(db, {
          activityId,
          action: 'INSPECTION_STARTED',
          fromStatus: activity.status,
          toStatus: 'SEDANG_DIPERIKSA',
          note: 'Pemeriksaan lapangan dimulai',
          actorId: req.user.id
        });
      }

      await syncOrderUnitStatus(db, {
        orderId,
        objectId,
        unitStatus: 'SEDANG_DIPERIKSA',
        inspectorId: req.user.id,
        actorId: req.user.id
      });

      // Ubah status order ke SEDANG_DIPERIKSA bila masih DITUGASKAN
      const { rows: ord } = await db.query('SELECT status FROM orders WHERE id = $1', [orderId]);
      if (ord[0]?.status === 'DITUGASKAN') {
        await db.query("UPDATE orders SET status = 'SEDANG_DIPERIKSA', updated_at = now() WHERE id = $1", [orderId]);
        await db.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
           VALUES ($1, 'DITUGASKAN', 'SEDANG_DIPERIKSA', 'Pemeriksaan lapangan dimulai', $2)`,
          [orderId, req.user.id]
        );
      }

      await recordAudit(
        {
          userId: req.user.id,
          action: 'INSPECTION_START',
          entity: 'inspections',
          entityId: created[0].id,
                      summary: { orderId, objectId, activityId: activityId || null },
            ip: req.ip
          },
          db
        );

        return created[0];
      });

    return res.status(201).json({ inspection });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT i.*, o.order_no, o.po_number, o.po_date, o.status AS order_status, o.notes AS order_notes,
              c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
              cl.name AS location_name, cl.address AS location_address, cl.city AS location_city,
              cc.name AS contact_name, cc.phone AS contact_phone, cc.email AS contact_email,
              s.start_at AS schedule_start_at, s.end_at AS schedule_end_at, s.notes AS schedule_notes,
              act.inspection_type_code, itype.name AS inspection_type_name,
              act.planned_start_at AS activity_start_at, act.planned_end_at AS activity_end_at,
              act.schedule_status AS activity_schedule_status,
              t.name AS object_name, t.serial_number, t.brand, t.manufacturer, t.model, t.capacity, t.install_location,
              t.attributes AS object_attributes,
              oc.code AS category_code, oc.name AS category_name, oc.attribute_schema, oc.default_bap_scopes,
              oo.scope_items AS unit_scope_items,
              u.full_name AS inspector_name,
              tv.version AS template_version, tv.is_validated AS template_is_validated,
              it.name AS template_name,
              b.id AS bap_id, b.bap_no, b.status AS bap_status, b.finalized_at AS bap_finalized_at,
              b.scope_items AS bap_scope_items,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
       FROM inspections i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_locations cl ON cl.id = o.location_id
       LEFT JOIN client_contacts cc ON cc.id = o.contact_id
       LEFT JOIN schedules s ON s.order_id = o.id
       LEFT JOIN inspection_activities act ON act.id = i.activity_id
       LEFT JOIN inspection_types itype ON itype.code = act.inspection_type_code
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN order_objects oo ON oo.order_id = i.order_id AND oo.object_id = i.object_id
       JOIN users u ON u.id = i.inspector_id
       JOIN inspection_template_versions tv ON tv.id = i.template_version_id
       JOIN inspection_templates it ON it.id = tv.template_id
       LEFT JOIN bap_documents b ON b.inspection_id = i.id
       LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
       WHERE i.id = $1`,
      [id]
    );
    const insp = rows[0];
    if (!insp) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Data inspeksi tidak ditemukan.');

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && insp.inspector_id !== req.user.id) {
      const { rows: unitAssigned } = await query(
        `SELECT 1 FROM order_objects
         WHERE order_id = $1 AND object_id = $2 AND inspector_id = $3`,
        [insp.order_id, insp.object_id, req.user.id]
      );
      if (!unitAssigned[0]) {
        throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses pada form inspeksi ini.');
      }
    }

    const [items, results, findings, photos, signatures, revisions] = await Promise.all([
      query(
        'SELECT * FROM inspection_template_items WHERE version_id = $1 ORDER BY seq ASC',
        [insp.template_version_id]
      ),
      query('SELECT * FROM inspection_results WHERE inspection_id = $1', [id]),
      query(
        `SELECT f.*,
                coalesce(
                  (SELECT json_agg(json_build_object(
                    'id', fa.id,
                    'originalName', fa.original_name,
                    'caption', fa.caption,
                    'createdAt', fa.created_at
                  ))
                  FROM file_attachments fa
                  WHERE fa.owner_type = 'INSPECTION_FINDING' AND fa.owner_id = f.id AND fa.deleted_at IS NULL),
                  '[]'::json
                ) AS photos
         FROM inspection_findings f
         WHERE f.inspection_id = $1
         ORDER BY f.created_at ASC`,
        [id]
      ),
      query(
        `SELECT id, original_name AS "originalName", caption, mime_type AS "mimeType", created_at AS "createdAt"
         FROM file_attachments
         WHERE owner_type = 'INSPECTION_FINDING' AND owner_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [id]
      ),
      query('SELECT * FROM inspection_signatures WHERE inspection_id = $1', [id]),
      query('SELECT * FROM inspection_revisions WHERE inspection_id = $1 ORDER BY created_at DESC', [id])
    ]);

    return res.json({
      inspection: insp,
      items: items.rows,
      results: results.rows,
      findings: findings.rows,
      photos: photos.rows,
      signatures: signatures.rows,
      revisions: revisions.rows,
      scopeCatalog: BAP_SCOPE_CATALOG
    });
  } catch (err) {
    return next(err);
  }
});

// PRD Section 4.2 Dokumen #3: Lembar Temuan & Rekomendasi K3 (Corrective Action Notice PDF)
router.get('/:id/recommendation-letter.pdf', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT i.*,
              c.name AS client_name, c.address AS client_address,
              cl.name AS location_name, cl.address AS location_address,
              t.name AS object_name, t.serial_number, t.capacity, t.capacity_unit, t.install_location,
              oc.name AS category_name, oc.code AS category_code,
              u.full_name AS inspector_name,
              ic.certificate_no AS inspector_skp_no
       FROM inspections i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_locations cl ON cl.id = o.location_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       LEFT JOIN LATERAL (
         SELECT certificate_no
         FROM inspector_competencies
         WHERE inspector_id = i.inspector_id AND category_id = t.category_id
         ORDER BY valid_until DESC
         LIMIT 1
       ) ic ON TRUE
       WHERE i.id = $1`,
      [id]
    );
    const insp = rows[0];
    if (!insp) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Data inspeksi tidak ditemukan.');

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && insp.inspector_id !== req.user.id) {
      const { rows: unitAssigned } = await query(
        `SELECT 1 FROM order_objects
         WHERE order_id = $1 AND object_id = $2 AND inspector_id = $3`,
        [insp.order_id, insp.object_id, req.user.id]
      );
      if (!unitAssigned[0]) {
        throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses pada form inspeksi ini.');
      }
    }

    const { rows: findings } = await query(
      `SELECT * FROM inspection_findings WHERE inspection_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const capStr = [insp.capacity, insp.capacity_unit].filter(Boolean).join(' ') || '-';
    const letterNo = `REK-K3/URD/${new Date(insp.inspected_at || insp.created_at).getFullYear()}/${String(insp.id).slice(-4).toUpperCase()}`;

    const buffer = await generateRecommendationLetterPdfBuffer({
      inspection_id: insp.id,
      recommendation_no: letterNo,
      inspection_date: insp.inspected_at || insp.created_at,
      client_name: insp.client_name,
      company_address: insp.location_address || insp.client_address || '-',
      object_name: insp.object_name,
      category_name: insp.category_name,
      serial_number: insp.serial_number,
      capacity: capStr,
      location: insp.install_location || insp.location_name || '-',
      findings: findings.map((f) => ({
        finding: f.description || '-',
        risk_level: f.severity || 'SEDANG',
        recommendation: f.recommendation || '-',
        deadline: '-'
      })),
      conclusion: insp.conclusion || 'PERLU PERBAIKAN SEBELUM OPERASI',
      conclusion_notes: insp.conclusion_notes || '',
      inspector_name: insp.inspector_name,
      inspector_skp_no: insp.inspector_skp_no || 'SKP-K3/URD'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="rekomendasi-k3-${insp.serial_number || insp.id}.pdf"`
    );
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
});

async function assertEditableInspection(db, id, user) {
  const { rows } = await db.query('SELECT * FROM inspections WHERE id = $1', [id]);
  const insp = rows[0];
  if (!insp) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Form inspeksi tidak ditemukan.');

  await assertInspectionOwnership(db, insp, user);

  if (insp.status === 'TERKIRIM') {
    throw new AppError(
      409,
      'INSPECTION_LOCKED',
      'Form inspeksi telah terkirim dan terkunci. Perubahan hanya dapat dilakukan melalui pembukaan revisi tercatat.'
    );
  }

  return insp;
}

async function assertInspectionOwnership(db, insp, user) {
  if (user.role === 'ADMIN_SISTEM') return;
  if (!['AHLI_K3', 'INSPECTOR'].includes(user.role)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Hanya Ahli K3 / Inspector pemeriksa yang ditugaskan yang dapat mengisi form ini.'
    );
  }
  if (insp.inspector_id === user.id) return;

  // Inspector lain hanya dapat mengakses jika tercatat sebagai pemeriksa yang ditugaskan pada unit ini.
  const { rows: unitAssigned } = await db.query(
    `SELECT 1 FROM order_objects
     WHERE order_id = $1 AND object_id = $2 AND inspector_id = $3`,
    [insp.order_id, insp.object_id, user.id]
  );
  if (unitAssigned[0]) return;

  throw new AppError(
    403,
    'FORBIDDEN',
    'Hanya Ahli K3 / Inspector pemeriksa yang ditugaskan pada unit ini yang dapat mengisi form ini.'
  );
}

// M3-03, M3-04, M3-06: Simpan draf otomatis & validasi rentang nilai
router.put('/:id/draft', authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'), validate(saveDraftSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { conclusion, conclusionNotes, results } = req.body;

    const updated = await withTransaction(async (db) => {
      const insp = await assertEditableInspection(db, id, req.user);

      const { rows: tplItems } = await db.query(
        'SELECT * FROM inspection_template_items WHERE version_id = $1',
        [insp.template_version_id]
      );
      const itemMap = new Map(tplItems.map((i) => [i.id, i]));

      for (const r of results) {
        const meta = itemMap.get(r.itemId);
        if (!meta) continue;
        let outOfRange = false;
        if (meta.input_type === 'NUMBER' && r.numberValue !== null && r.numberValue !== undefined) {
          if (meta.min_value !== null && Number(r.numberValue) < Number(meta.min_value)) {
            outOfRange = true;
          }
          if (meta.max_value !== null && Number(r.numberValue) > Number(meta.max_value)) {
            outOfRange = true;
          }
        }

        await db.query(
          `INSERT INTO inspection_results
             (inspection_id, item_id, choice_value, number_value, text_value, date_value, note, out_of_range, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
           ON CONFLICT (inspection_id, item_id) DO UPDATE SET
             choice_value = EXCLUDED.choice_value,
             number_value = EXCLUDED.number_value,
             text_value = EXCLUDED.text_value,
             date_value = EXCLUDED.date_value,
             note = EXCLUDED.note,
             out_of_range = EXCLUDED.out_of_range,
             updated_at = now()`,
          [
            id,
            r.itemId,
            r.choiceValue || null,
            r.numberValue ?? null,
            r.textValue || null,
            r.dateValue || null,
            r.note || null,
            outOfRange
          ]
        );
      }

      if (req.body?.objectAttributes && typeof req.body.objectAttributes === 'object') {
        await db.query(
          `UPDATE test_objects
           SET attributes = COALESCE(attributes, '{}'::jsonb) || $1::jsonb,
               updated_at = now()
           WHERE id = $2`,
          [JSON.stringify(req.body.objectAttributes), insp.object_id]
        );
      }

      const { rows: upd } = await db.query(
        `UPDATE inspections
         SET conclusion = COALESCE($1, conclusion),
             conclusion_notes = COALESCE($2, conclusion_notes),
             updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [conclusion || null, conclusionNotes !== undefined ? conclusionNotes : null, id]
      );
      return upd[0];
    });

    return res.json({ inspection: updated });
  } catch (err) {
    return next(err);
  }
});

// M3-08: Tambah temuan lapangan (Kritis / Mayor / Minor) beserta rekomendasi
router.post('/:id/findings', authorize('AHLI_K3'), validate(findingSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { itemId, severity, description, recommendation } = req.body;
    const finding = await withTransaction(async (db) => {
      await assertEditableInspection(db, id, req.user);
      const { rows } = await db.query(
        `INSERT INTO inspection_findings (inspection_id, item_id, severity, description, recommendation)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, itemId || null, severity, description.trim(), recommendation.trim()]
      );
      return rows[0];
    });
    return res.status(201).json({ finding: { ...finding, photos: [] } });
  } catch (err) {
    return next(err);
  }
});

// M3-05: Unggah bukti foto temuan
router.post(
  '/:id/findings/:findingId/photos',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'),
  uploadMiddleware.single('photo'),
  async (req, res, next) => {
    try {
      const { id, findingId } = req.params;
      if (!req.file) throw new AppError(400, 'NO_FILE', 'Foto wajib dipilih.');
      await withTransaction(async (db) => {
        await assertEditableInspection(db, id, req.user);
        const { rows } = await db.query(
          'SELECT 1 FROM inspection_findings WHERE id = $1 AND inspection_id = $2',
          [findingId, id]
        );
        if (!rows[0]) {
          throw new AppError(404, 'FINDING_NOT_FOUND', 'Temuan tidak ditemukan pada inspeksi ini.');
        }
      });
      const saved = await saveUploadedFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerType: 'INSPECTION_FINDING',
        ownerId: findingId,
        caption: req.body.caption || null,
        uploadedBy: req.user.id
      });
      return res.status(201).json({ photo: saved });
    } catch (err) {
      return next(err);
    }
  }
);

// M3-05b: Unggah foto dokumentasi hasil riksa uji langsung pada lembar kerja inspeksi
router.post(
  '/:id/photos',
  authorize('AHLI_K3', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  uploadMiddleware.single('photo'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError(400, 'NO_FILE', 'Foto hasil riksa uji wajib dipilih.');
      const { rows } = await query('SELECT * FROM inspections WHERE id = $1', [id]);
      if (!rows[0]) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Form inspeksi tidak ditemukan.');
      if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
        await assertEditableInspection({ query }, id, req.user);
      }

      const saved = await saveUploadedFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerType: 'INSPECTION_FINDING',
        ownerId: id,
        caption: req.body?.caption || 'Foto Dokumentasi Riksa Uji',
        uploadedBy: req.user.id
      });
      return res.status(201).json({ photo: saved });
    } catch (err) {
      return next(err);
    }
  }
);

// M3-05c: Hapus foto dokumentasi hasil riksa uji sebelum finalisasi
router.delete(
  '/:id/photos/:photoId',
  authorize('INSPECTOR', 'AHLI_K3', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id, photoId } = req.params;
      const { rows } = await query('SELECT * FROM inspections WHERE id = $1', [id]);
      if (!rows[0]) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Form inspeksi tidak ditemukan.');
      if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
        await assertEditableInspection({ query }, id, req.user);
      }

      const { rowCount } = await query(
        `UPDATE file_attachments
         SET deleted_at = now()
         WHERE id = $1 AND owner_id = $2 AND owner_type = 'INSPECTION_FINDING' AND deleted_at IS NULL`,
        [photoId, id]
      );
      if (!rowCount) {
        throw new AppError(404, 'PHOTO_NOT_FOUND', 'Foto tidak ditemukan atau sudah dihapus.');
      }
      return res.json({ success: true, message: 'Foto dokumentasi berhasil dihapus.' });
    } catch (err) {
      return next(err);
    }
  }
);

// M3-10: Tanda tangan digital Ahli K3 & perwakilan klien di lokasi
router.post(
  '/:id/signatures',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'),
  validate(signatureSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { signerRole, signerName, signerTitle, dataUrl } = req.body;

      const sig = await withTransaction(async (db) => {
        await assertEditableInspection(db, id, req.user);
        const file = await saveDataUrlPng(
          {
            dataUrl,
            ownerType: 'INSPECTION_SIGNATURE',
            ownerId: id,
            originalName: `ttd-${signerRole.toLowerCase()}.png`,
            uploadedBy: req.user.id
          },
          db
        );

        const { rows } = await db.query(
          `INSERT INTO inspection_signatures (inspection_id, signer_role, signer_name, signer_title, file_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (inspection_id, signer_role) DO UPDATE SET
             signer_name = EXCLUDED.signer_name,
             signer_title = EXCLUDED.signer_title,
             file_id = EXCLUDED.file_id,
             signed_at = now()
           RETURNING *`,
          [id, signerRole, signerName.trim(), signerTitle || null, file.id]
        );

        if (signerRole === 'AHLI_K3') {
          await db.query(
            `UPDATE bap_documents
             SET inspector_signer_name = $1, inspector_signer_title = $2, inspector_signature_file_id = $3, inspector_signed_at = now(), updated_at = now()
             WHERE inspection_id = $4`,
            [signerName.trim(), signerTitle || 'Ahli K3 Pemeriksa', file.id, id]
          );
        } else {
          await db.query(
            `UPDATE bap_documents
             SET client_signer_name = $1, client_signer_title = $2, client_signature_file_id = $3, client_signed_at = now(), updated_at = now()
             WHERE inspection_id = $4`,
            [signerName.trim(), signerTitle || 'Pemilik Alat / Perwakilan Klien', file.id, id]
          );
        }

        return rows[0];
      });

      return res.status(201).json({ signature: sig });
    } catch (err) {
      return next(err);
    }
  }
);

// M3-09, M3-11, M4-01: Kirim & kunci form inspeksi, lalu buat draf BAP & draf LHPP otomatis
router.post('/:id/submit', authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await withTransaction(async (db) => {
      // Periksa apakah formulir inspeksi sudah pernah dikirim sebelumnya (idempotent handling)
      const { rows: existingRows } = await db.query('SELECT * FROM inspections WHERE id = $1', [id]);
      if (!existingRows[0]) {
        throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Form inspeksi tidak ditemukan.');
      }
      await assertInspectionOwnership(db, existingRows[0], req.user);
      if (existingRows[0].status === 'TERKIRIM') {
        const { rows: lhppRows } = await db.query(
          'SELECT * FROM lhpp_documents WHERE inspection_id = $1',
          [id]
        );
        const { rows: bapRows } = await db.query(
          'SELECT * FROM bap_documents WHERE inspection_id = $1',
          [id]
        );
        return {
          inspection: existingRows[0],
          lhpp: lhppRows[0] || null,
          bap: bapRows[0] || null,
          alreadySubmitted: true
        };
      }

      const insp = await assertEditableInspection(db, id, req.user);

      // Simpan kesimpulan dan catatan jika disertakan langsung pada payload kirim
      if (req.body?.conclusion) {
        await db.query(
          `UPDATE inspections
           SET conclusion = $1,
               conclusion_notes = COALESCE($2, conclusion_notes),
               updated_at = now()
           WHERE id = $3`,
          [req.body.conclusion, req.body.conclusionNotes || null, id]
        );
        insp.conclusion = req.body.conclusion;
        if (req.body.conclusionNotes) insp.conclusion_notes = req.body.conclusionNotes;
      }

      // Simpan pembaruan parameter spesifikasi teknis objek uji (Bab II LHPP)
      if (req.body?.objectAttributes && typeof req.body.objectAttributes === 'object') {
        await db.query(
          `UPDATE test_objects
           SET attributes = COALESCE(attributes, '{}'::jsonb) || $1::jsonb,
               updated_at = now()
           WHERE id = $2`,
          [JSON.stringify(req.body.objectAttributes), insp.object_id]
        );
      }

      // Simpan hasil butir checklist jika disertakan langsung pada payload kirim
      if (Array.isArray(req.body?.results) && req.body.results.length > 0) {
        for (const r of req.body.results) {
          if (!r.itemId) continue;
          await db.query(
            `INSERT INTO inspection_results
               (inspection_id, item_id, choice_value, number_value, text_value, date_value, note)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (inspection_id, item_id) DO UPDATE SET
               choice_value = EXCLUDED.choice_value,
               number_value = EXCLUDED.number_value,
               text_value = EXCLUDED.text_value,
               date_value = EXCLUDED.date_value,
               note = EXCLUDED.note,
               updated_at = now()`,
            [
              id,
              r.itemId,
              r.choiceValue || null,
              r.numberValue !== null && r.numberValue !== undefined && r.numberValue !== '' ? Number(r.numberValue) : null,
              r.textValue || null,
              r.dateValue || null,
              r.note || null
            ]
          );
        }
      }

      if (!insp.conclusion) {
        throw new AppError(
          400,
          'CONCLUSION_REQUIRED',
          'Kesimpulan akhir pemeriksaan wajib dipilih sebelum mengirim form.'
        );
      }

      const { rows: reqItems } = await db.query(
        'SELECT id, label FROM inspection_template_items WHERE version_id = $1 AND is_required = true',
        [insp.template_version_id]
      );
      const { rows: curResults } = await db.query(
        'SELECT * FROM inspection_results WHERE inspection_id = $1',
        [id]
      );
      const resMap = new Map(curResults.map((r) => [r.item_id, r]));

      for (const reqItem of reqItems) {
        const val = resMap.get(reqItem.id);
        const filled =
          val &&
          (val.choice_value ||
            (val.number_value !== null && val.number_value !== undefined) ||
            val.text_value ||
            val.date_value);
        if (!filled) {
          throw new AppError(
            400,
            'INCOMPLETE_FORM',
            `Butir wajib "${reqItem.label}" belum diisi.`
          );
        }
      }

      const { rows: sigRows } = await db.query(
        'SELECT * FROM inspection_signatures WHERE inspection_id = $1',
        [id]
      );
      const hasInspectorSignature = sigRows.some((s) => ['INSPECTOR', 'AHLI_K3'].includes(s.signer_role));
      const hasClientSignature = sigRows.some((s) => ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role));
      if (!hasInspectorSignature || !hasClientSignature) {
        throw new AppError(
          400,
          'SIGNATURES_REQUIRED',
          'Tanda tangan Ahli K3 dan perwakilan klien wajib tersimpan sebelum pemeriksaan dikirim.'
        );
      }

      const { rows: lockedRows } = await db.query(
        `UPDATE inspections
         SET status = 'TERKIRIM', submitted_at = now(), updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      // Ambil ruang lingkup BAP dari order_objects atau default kategori objek
      const { rows: scopeRows } = await db.query(
        `SELECT oo.scope_items, oc.default_bap_scopes
         FROM order_objects oo
         JOIN test_objects t ON t.id = oo.object_id
         JOIN object_categories oc ON oc.id = t.category_id
         WHERE oo.order_id = $1 AND oo.object_id = $2`,
        [insp.order_id, insp.object_id]
      );
      const customScopes = Array.isArray(req.body?.scopeItems) && req.body.scopeItems.length > 0
        ? req.body.scopeItems
        : null;
      const unitScopes = customScopes
        ? customScopes
        : Array.isArray(scopeRows[0]?.scope_items) && scopeRows[0].scope_items.length
        ? scopeRows[0].scope_items
        : Array.isArray(scopeRows[0]?.default_bap_scopes)
        ? scopeRows[0].default_bap_scopes
        : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

      const { rows: findings } = await db.query(
        'SELECT severity, description, recommendation FROM inspection_findings WHERE inspection_id = $1',
        [id]
      );
      const findingsSummary = findings.length
        ? findings.map((f, idx) => `${idx + 1}. [${f.severity}] ${f.description} (Rekomendasi: ${f.recommendation})`).join('\n')
        : '';
      const bapNotes = [lockedRows[0].conclusion_notes, findingsSummary].filter(Boolean).join('\n\n') ||
        'Pemeriksaan dan pengujian di lapangan telah dilaksanakan sesuai prosedur K3.';

      // Periksa tanda tangan digital yang sudah ada pada form inspeksi
      const inspSig = sigRows.find((s) => ['INSPECTOR', 'AHLI_K3'].includes(s.signer_role));
      const clientSig = sigRows.find((s) => ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role));

      // M4-01 TERBARU: Sesuai alur bisnis PT Upaya Riksa Daya terbaru,
      // LHPP dibuat TERLEBIH DAHULU setelah pemeriksaan dan tanda tangan digital selesai.
      // Setelah LHPP selesai/difinalisasi, barulah BAP diterbitkan.
      const autoRecommendations = findings.length
        ? findings.map((f, idx) => `${idx + 1}. [${f.severity}] ${f.recommendation}`).join('\n')
        : 'Pertahankan pemeliharaan berkala sesuai standar K3 yang berlaku.';
      const oneYearLater = new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10);
      const validUntilDate = req.body?.recommendedValidUntil || oneYearLater;

      const { rows: lhppRows } = await db.query(
        `INSERT INTO lhpp_documents
           (inspection_id, status, method_summary, technical_notes, recommendations, recommended_valid_until, prepared_by)
         VALUES ($1, 'SIAP_PREVIEW', $2, $3, $4, $5, $6)
         ON CONFLICT (inspection_id) DO UPDATE SET
           status = CASE WHEN lhpp_documents.status IN ('FINAL', 'TERBIT') THEN lhpp_documents.status ELSE 'SIAP_PREVIEW' END,
           recommendations = COALESCE(lhpp_documents.recommendations, EXCLUDED.recommendations),
           recommended_valid_until = COALESCE(lhpp_documents.recommended_valid_until, EXCLUDED.recommended_valid_until),
           updated_at = now()
         RETURNING *`,
        [
          id,
          `Ruang lingkup pemeriksaan: ${unitScopes.join(', ')}.`,
          lockedRows[0].conclusion_notes || 'Hasil pemeriksaan telah dicatat sesuai form lapangan dan standar K3.',
          autoRecommendations,
          validUntilDate,
          req.user.id
        ]
      );

      // Simpan tanggal pemeriksaan berikutnya pada test_objects untuk riwayat & pengingat
      await db.query(
        `UPDATE test_objects
         SET next_inspection_date = COALESCE(next_inspection_date, $1::date),
             updated_at = now()
         WHERE id = $2`,
        [validUntilDate, insp.object_id]
      );

      // Jika autoFinalizeBap / autoFinalizeLhpp diminta (misal via testing/shortcut)
      let bapResult = null;
      const shouldAutoFinalize = Boolean(req.body?.autoFinalizeBap || req.body?.autoFinalizeLhpp);
      if (shouldAutoFinalize) {
        const seqRes = await db.query("SELECT nextval('bap_no_seq') AS seq");
        const now = new Date();
        const generatedBapNo = await formatDocumentNumber('bap', {
          counter: seqRes.rows[0].seq,
          date: now
        });

        const { rows: bapRows } = await db.query(
          `INSERT INTO bap_documents
             (bap_no, inspection_id, lhpp_id, order_id, object_id, status, inspection_date, scope_items,
              conclusion, notes,
              inspector_signer_name, inspector_signer_title, inspector_signature_file_id, inspector_signed_at,
              client_signer_name, client_signer_title, client_signature_file_id, client_signed_at,
              finalized_by, finalized_at, created_by)
           VALUES ($1,$2,$3,$4,$5,'FINAL',CURRENT_DATE,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
           ON CONFLICT (inspection_id) DO UPDATE SET
             lhpp_id = EXCLUDED.lhpp_id,
             status = 'FINAL',
             scope_items = EXCLUDED.scope_items,
             conclusion = EXCLUDED.conclusion,
             notes = COALESCE(bap_documents.notes, EXCLUDED.notes),
             inspector_signer_name = COALESCE(EXCLUDED.inspector_signer_name, bap_documents.inspector_signer_name),
             inspector_signature_file_id = COALESCE(EXCLUDED.inspector_signature_file_id, bap_documents.inspector_signature_file_id),
             inspector_signed_at = COALESCE(EXCLUDED.inspector_signed_at, bap_documents.inspector_signed_at),
             client_signer_name = COALESCE(EXCLUDED.client_signer_name, bap_documents.client_signer_name),
             client_signature_file_id = COALESCE(EXCLUDED.client_signature_file_id, bap_documents.client_signature_file_id),
             client_signed_at = COALESCE(EXCLUDED.client_signed_at, bap_documents.client_signed_at),
             finalized_by = EXCLUDED.finalized_by,
             finalized_at = now(),
             updated_at = now()
           RETURNING *`,
          [
            generatedBapNo,
            id,
            lhppRows[0].id,
            insp.order_id,
            insp.object_id,
            JSON.stringify(unitScopes),
            lockedRows[0].conclusion,
            bapNotes,
            inspSig?.signer_name || req.user.fullName,
            inspSig?.signer_title || 'Inspector / Ahli K3',
            inspSig?.file_id || null,
            inspSig?.signed_at || now,
            clientSig?.signer_name || null,
            clientSig?.signer_title || 'Pemilik Alat / PIC Klien',
            clientSig?.file_id || null,
            clientSig?.signed_at || null,
            req.user.id,
            now,
            req.user.id
          ]
        );
        bapResult = bapRows[0];
      }

      await syncOrderUnitStatus(db, {
        orderId: insp.order_id,
        objectId: insp.object_id,
        unitStatus: shouldAutoFinalize ? 'BAP_FINAL' : 'LHPP_SIAP_PREVIEW',
        inspectorId: req.user.id,
        actorId: req.user.id
      });

      await db.query(
        "UPDATE orders SET status = 'MENUNGGU_DOKUMEN', updated_at = now() WHERE id = $1 AND status IN ('DITUGASKAN','SEDANG_DIPERIKSA')",
        [insp.order_id]
      );

      await recordAudit(
        {
          userId: req.user.id,
          action: 'INSPECTION_SUBMIT',
          entity: 'inspections',
          entityId: id,
          summary: {
            conclusion: lockedRows[0].conclusion,
            lhppId: lhppRows[0].id,
            bapId: bapResult?.id || null
          },
          ip: req.ip
        },
        db
      );

      return { inspection: lockedRows[0], lhpp: lhppRows[0], bap: bapResult };
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

// M3-11: Pembukaan kunci form melalui revisi tercatat
router.post(
  '/:id/reopen',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'AHLI_K3'),
  validate(reopenSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason, targetSection } = req.body;
      const cleanSection = targetSection ? String(targetSection).trim() : '';
      const formattedReason = cleanSection
        ? `[Bagian: ${cleanSection}] ${reason.trim()}`
        : reason.trim();

      const reopened = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `SELECT i.*, t.name AS object_name, o.order_no
           FROM inspections i
           JOIN test_objects t ON t.id = i.object_id
           JOIN orders o ON o.id = i.order_id
           WHERE i.id = $1
           FOR UPDATE OF i`,
          [id]
        );
        const insp = rows[0];
        if (!insp) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Inspeksi tidak ditemukan.');
        if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && insp.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
        }
        if (insp.status !== 'TERKIRIM') {
          throw new AppError(400, 'NOT_LOCKED', 'Form masih berstatus DRAF.');
        }

        const { rows: lhpp } = await db.query(
          'SELECT id, status FROM lhpp_documents WHERE inspection_id = $1 FOR UPDATE',
          [id]
        );
        if (['TERBIT', 'FINAL'].includes(lhpp[0]?.status)) {
          throw new AppError(
            409,
            'LHPP_ALREADY_PUBLISHED',
            'LHPP telah terbit dan terkunci permanen. Form tidak dapat dibuka kembali.'
          );
        }

        const { rows: curResults } = await db.query(
          'SELECT * FROM inspection_results WHERE inspection_id = $1',
          [id]
        );
        const nextRev = insp.revision_no + 1;

        await db.query(
          `INSERT INTO inspection_revisions (inspection_id, revision_no, reason, snapshot, opened_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            id,
            nextRev,
            formattedReason,
            { inspection: insp, results: curResults, targetSection: cleanSection || null },
            req.user.id
          ]
        );

        const { rows: upd } = await db.query(
          `UPDATE inspections
           SET status = 'DRAF', revision_no = $1, updated_at = now()
           WHERE id = $2
           RETURNING *`,
          [nextRev, id]
        );

        // Jika terdapat draf LHPP yang belum final, kembalikan statusnya ke DIKEMBALIKAN dengan catatan revisi
        if (lhpp[0]) {
          await db.query(
            `UPDATE lhpp_documents
             SET status = 'DIKEMBALIKAN',
                 review_notes = $1,
                 reviewed_by = $2,
                 reviewed_at = now(),
                 updated_at = now()
             WHERE id = $3`,
            [formattedReason, req.user.id, lhpp[0].id]
          );
        }

        // Sinkronisasi status pada level unit terkait saja tanpa memblokir unit lain di PO yang sama
        await syncOrderUnitStatus(db, {
          orderId: insp.order_id,
          objectId: insp.object_id,
          unitStatus: 'PERLU_REVISI',
          actorId: req.user.id
        });

        if (insp.inspector_id && insp.inspector_id !== req.user.id) {
          await createNotification(
            {
              userId: insp.inspector_id,
              type: 'INSPECTION_REVISION_REQUESTED',
              title: `Revisi Inspeksi: ${insp.object_name}`,
              body: `Catatan revisi (${insp.order_no}): ${formattedReason}`,
              link: '/app/inspections'
            },
            db
          );
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'INSPECTION_REOPEN_REVISION',
            entity: 'inspections',
            entityId: id,
            summary: { revisionNo: nextRev, reason: formattedReason, targetSection: cleanSection || null },
            ip: req.ip
          },
          db
        );
        return upd[0];
      });

      return res.json({ inspection: reopened });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
