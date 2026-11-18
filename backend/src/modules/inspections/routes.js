import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { createNotification } from '../../services/notify.js';
import { generateBapPdfBuffer, generateRecommendationLetterPdfBuffer } from '../../services/pdf-generator.js';
import { generateBapDocxBuffer, generateLhppDocxBuffer } from '../../services/docx-generator.js';
import { formatDocumentNumber } from '../../services/system-settings-service.js';
import { BAP_SCOPE_CATALOG, syncOrderUnitStatus } from '../../services/workflow.js';
import { recordActivityHistory } from '../../services/inspection-activities.js';
import { saveDataUrlPng, saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';
import { fetchFullBapContext } from '../bap/routes.js';
import { fetchFullLhppContext } from '../lhpp/routes.js';

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
  conclusionNotes: Joi.string().max(4000).allow('', null),
  scopeItems: Joi.array().items(Joi.string().max(160)).optional(),
  inspectionDate: Joi.date().iso().allow('', null).optional(),
  prepareBapDraft: Joi.boolean().optional(),
  workPhase: Joi.string().valid('FIELD', 'OFFICE').optional(),
  results: Joi.array()
    .items(
      Joi.object({
        itemId: Joi.string().uuid().required(),
        choiceValue: Joi.string().valid('SESUAI', 'TIDAK_SESUAI', 'TIDAK_BERLAKU').allow('', null),
        numberValue: Joi.number().allow(null),
        textValue: Joi.string().max(4000).allow('', null),
        dateValue: Joi.date().iso().allow('', null),
        note: Joi.string().max(1500).allow('', null)
      })
    )
    .default([]),
  objectAttributes: Joi.object().unknown(true).optional()
});

const PHOTO_INPUT_TYPES = new Set(['PHOTO', 'FILE']);
const NUMERIC_INPUT_TYPES = new Set(['NUMBER', 'MEASUREMENT']);
const CONFORMITY_INPUT_TYPES = new Set(['CHOICE', 'CONFORMITY']);

const DOMAIN_STANDARD_MAP = {
  PAA: 'Permenaker No. 8 Tahun 2020',
  PAPA: 'Permenaker No. 8 Tahun 2020',
  PUBT: 'Permenaker No. 37 Tahun 2016',
  PTP: 'Permenaker No. 38 Tahun 2016',
  ILPP: 'Permenaker No. 12 Tahun 2015 & Permenaker No. 02/MEN/1989',
  LIS: 'Permenaker No. 12 Tahun 2015',
  IPP: 'Permenaker No. 02/MEN/1989',
  IPK: 'Permenaker No. 02/MEN/1983',
  LE: 'Permenaker No. 06 Tahun 2017',
  ELEVATOR_ESKALATOR: 'Permenaker No. 06 Tahun 2017'
};

function isResultFilled(item, result) {
  if (!result) return false;
  const t = String(item?.input_type || 'CHOICE').toUpperCase();
  if (CONFORMITY_INPUT_TYPES.has(t)) {
    return Boolean(result.choice_value || result.choiceValue || result.text_value || result.textValue);
  }
  if (NUMERIC_INPUT_TYPES.has(t)) {
    const nv = result.number_value !== undefined ? result.number_value : result.numberValue;
    return nv !== null && nv !== undefined && String(nv) !== '';
  }
  if (t === 'DATE') {
    return Boolean(result.date_value || result.dateValue || result.text_value || result.textValue);
  }
  return Boolean(result.text_value || result.textValue || result.choice_value || result.choiceValue);
}

function isConditionalItemActive(item, itemsBySeq, resultByItemId) {
  if (!item?.condition_parent_seq) return true;
  const parentItem = itemsBySeq.get(Number(item.condition_parent_seq));
  if (!parentItem) return true;
  const parentResult = resultByItemId.get(parentItem.id);
  if (!parentResult) return false;
  const expected = String(item.condition_expected_value || '').trim().toLowerCase();
  const actual = String(
    parentResult.choice_value ||
      parentResult.choiceValue ||
      parentResult.text_value ||
      parentResult.textValue ||
      (parentResult.number_value !== null && parentResult.number_value !== undefined ? parentResult.number_value : '') ||
      ''
  )
    .trim()
    .toLowerCase();
  if (!expected) return Boolean(actual);
  return actual === expected;
}

function resolveFactualIdentityPrefill(item, ctx, seenAddressRef) {
  const section = String(item.section || '').toLowerCase();
  if (!section.includes('data umum') && !section.includes('identitas')) {
    return null;
  }
  const t = String(item.input_type || 'TEXT').toUpperCase();
  if (!['TEXT', 'LONG_TEXT', 'NUMBER', 'MEASUREMENT', 'DATE'].includes(t)) {
    return null;
  }

  const label = String(item.label || '').toLowerCase();
  let textVal = null;
  let numVal = null;
  let dateVal = null;

  if (label === 'pemilik' || label.includes('perusahaan pemilik') || label.includes('nama perusahaan')) {
    textVal = ctx.client_name || null;
  } else if (label === 'pemakai' || label.includes('perusahaan pemakai')) {
    textVal = ctx.client_name || null;
  } else if (label === 'alamat' || label.includes('alamat')) {
    if (seenAddressRef.count === 0 && !label.includes('pemakai')) {
      seenAddressRef.count += 1;
      textVal = ctx.client_address || ctx.location_address || null;
    } else {
      seenAddressRef.count += 1;
      textVal = ctx.location_address || ctx.client_address || null;
    }
  } else if (label.includes('pengurus') || label.includes('penanggung')) {
    textVal = ctx.contact_name || null;
  } else if (label.includes('lokasi unit') || label === 'lokasi') {
    textVal = ctx.install_location || ctx.location_name || null;
  } else if (label.includes('jenis pesawat') || label.includes('jenis bejana') || label.includes('jenis unit')) {
    textVal = ctx.object_name || ctx.equipment_type_name || null;
  } else if (label.includes('nomor seri') || label.includes('no. seri')) {
    textVal = ctx.serial_number || null;
  } else if (label.includes('merk') || label.includes('model')) {
    const bm = [ctx.brand, ctx.model].filter(Boolean).join(' / ');
    textVal = bm || null;
  } else if (label === 'tahun' || label.includes('tahun pembuatan')) {
    textVal = ctx.manufacture_year ? String(ctx.manufacture_year) : null;
  } else if (label.includes('kapasitas') || label.includes('swl')) {
    if (NUMERIC_INPUT_TYPES.has(t)) {
      const parsed = parseFloat(String(ctx.capacity || '').replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (!Number.isNaN(parsed)) numVal = parsed;
    } else {
      const cap = [ctx.capacity, ctx.capacity_unit].filter(Boolean).join(' ');
      textVal = cap || null;
    }
  } else if (label.includes('standar')) {
    textVal = DOMAIN_STANDARD_MAP[(ctx.domain_code || ctx.category_code || '').toUpperCase()] || null;
  } else if (label.includes('tanggal diperiksa') || label.includes('tanggal pemeriksaan')) {
    const dt = ctx.planned_start_at || ctx.inspected_at || new Date();
    if (t === 'DATE') {
      dateVal = new Date(dt).toISOString().slice(0, 10);
    } else {
      textVal = new Date(dt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  } else if (label.includes('jenis pemeriksaan') || label.includes('status riksa')) {
    textVal = ctx.inspection_type_name || ctx.inspection_type_code || null;
  } else if (label.includes('ijin pemakai') || label.includes('izin pemakai')) {
    textVal = ctx.previous_permit_no || null;
  } else if (label.includes('diperiksa oleh')) {
    textVal = 'PT UPAYA RIKSA DAYA';
  }

  if (textVal === null && numVal === null && dateVal === null) return null;
  return { textVal, numVal, dateVal };
}

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

async function seedIdentityPrefillIfEmpty(db, inspectionId, templateVersionId, orderId, objectId, activity) {
  const { rows: existingRes } = await db.query(
    'SELECT count(*)::int AS cnt FROM inspection_results WHERE inspection_id = $1',
    [inspectionId]
  );
  if ((existingRes[0]?.cnt || 0) > 0) return;

  const { rows: ctxRows } = await db.query(
    `SELECT c.name AS client_name, c.address AS client_address,
            cl.name AS location_name, cl.address AS location_address,
            cc.name AS contact_name,
            t.name AS object_name, t.brand, t.model, t.manufacturer, t.serial_number,
            t.manufacture_year, t.capacity, t.capacity_unit, t.install_location, t.previous_permit_no,
            oc.code AS category_code,
            COALESCE(eq.domain_code, oc.code) AS domain_code,
            eq.name AS equipment_type_name,
            COALESCE(act.inspection_type_code, t.inspection_type_code) AS inspection_type_code,
            itype.name AS inspection_type_name,
            act.planned_start_at
     FROM orders o
     JOIN clients c ON c.id = o.client_id
     LEFT JOIN client_locations cl ON cl.id = o.location_id
     LEFT JOIN client_contacts cc ON cc.id = o.contact_id
     JOIN test_objects t ON t.id = $2
     JOIN object_categories oc ON oc.id = t.category_id
     LEFT JOIN equipment_types eq ON eq.id = COALESCE(t.equipment_name_id, t.equipment_type_id)
     LEFT JOIN inspection_activities act ON act.id = $3
     LEFT JOIN inspection_types itype ON itype.code = COALESCE(act.inspection_type_code, t.inspection_type_code)
     WHERE o.id = $1`,
    [orderId, objectId, activity?.id || null]
  );
  const ctx = ctxRows[0];
  if (!ctx) return;

  const { rows: items } = await db.query(
    'SELECT * FROM inspection_template_items WHERE version_id = $1 ORDER BY seq ASC',
    [templateVersionId]
  );
  const seenAddressRef = { count: 0 };
  for (const item of items) {
    const pre = resolveFactualIdentityPrefill(item, ctx, seenAddressRef);
    if (!pre) continue;
    await db.query(
      `INSERT INTO inspection_results (inspection_id, item_id, number_value, text_value, date_value)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (inspection_id, item_id) DO NOTHING`,
      [inspectionId, item.id, pre.numVal, pre.textVal, pre.dateVal]
    );
  }
}

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
        await seedIdentityPrefillIfEmpty(db, existing[0].id, existing[0].template_version_id, orderId, objectId, activity);
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
        // Dynamic Resolution: Subtype -> Equipment Name/Type -> Equipment Group -> Name Match -> Category
        const resolvedEqId = obj.equipment_name_id || obj.equipment_type_id || null;
        const { rows: verRows } = await db.query(
          `SELECT tv.id
           FROM inspection_templates t
           JOIN inspection_template_versions tv ON tv.template_id = t.id
           WHERE tv.status = 'AKTIF'
             AND (
               (t.subtype_id IS NOT NULL AND t.subtype_id = $1)
               OR (t.equipment_name_id IS NOT NULL AND t.equipment_name_id = $2)
               OR (t.equipment_type_id IS NOT NULL AND t.equipment_type_id = $2)
               OR (t.equipment_group_id IS NOT NULL AND t.equipment_group_id = $3)
               OR (lower(t.name) LIKE '%' || lower($4) || '%')
               OR (t.category_id = $5)
             )
           ORDER BY
             CASE
               WHEN t.subtype_id IS NOT NULL AND t.subtype_id = $1 THEN 1
               WHEN t.equipment_name_id IS NOT NULL AND t.equipment_name_id = $2 THEN 2
               WHEN t.equipment_type_id IS NOT NULL AND t.equipment_type_id = $2 THEN 3
               WHEN t.equipment_group_id IS NOT NULL AND t.equipment_group_id = $3 THEN 4
               WHEN lower(t.name) LIKE '%' || lower($4) || '%' THEN 5
               ELSE 6
             END ASC,
             tv.version DESC
           LIMIT 1`,
          [
            obj.equipment_subtype_id || null,
            resolvedEqId,
            obj.equipment_group_id || null,
            String(obj.name || '').trim() || '__NONE__',
            obj.category_id
          ]
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

      await seedIdentityPrefillIfEmpty(db, created[0].id, verId, orderId, objectId, activity);

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
              t.name AS object_name, t.serial_number, t.brand, t.manufacturer, t.model, t.capacity, t.capacity_unit,
              t.manufacture_year, t.install_location, t.previous_permit_no,
              t.equipment_group_id, t.equipment_type_id, t.equipment_name_id, t.equipment_subtype_id,
              t.attributes AS object_attributes,
              COALESCE(eq.domain_code, oc.code) AS domain_code,
              dm.name AS domain_name,
              COALESCE(eg.name, oc.name) AS equipment_group_name,
              COALESCE(eq.name, t.name) AS equipment_type_name,
              eq.code AS equipment_type_code,
              sub.name AS equipment_subtype_name,
              oc.code AS category_code, oc.name AS category_name,
              COALESCE(eq.attribute_schema, oc.attribute_schema, '[]'::jsonb) AS attribute_schema,
              oc.default_bap_scopes,
              oo.scope_items AS unit_scope_items, oo.unit_status,
              u.full_name AS inspector_name,
              tv.version AS template_version, tv.is_validated AS template_is_validated,
              it.name AS template_name,
              b.id AS bap_id, b.bap_no, b.status AS bap_status, b.finalized_at AS bap_finalized_at,
              b.scope_items AS bap_scope_items, b.conclusion AS bap_conclusion, b.notes AS bap_notes,
              b.inspection_date AS bap_inspection_date,
              b.inspector_signer_name AS bap_inspector_signer_name,
              b.inspector_signed_at AS bap_inspector_signed_at,
              b.inspector_signature_file_id AS bap_inspector_sig_file_id,
              b.client_signer_name AS bap_client_signer_name,
              b.client_signed_at AS bap_client_signed_at,
              b.client_signature_file_id AS bap_client_sig_file_id,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status,
              l.reviewed_by AS lhpp_reviewed_by, l.reviewed_at AS lhpp_reviewed_at,
              l.review_notes AS lhpp_review_notes, l.finalized_at AS lhpp_finalized_at
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
       LEFT JOIN equipment_types eq ON eq.id = COALESCE(t.equipment_name_id, t.equipment_type_id)
       LEFT JOIN equipment_types sub ON sub.id = t.equipment_subtype_id
       LEFT JOIN equipment_groups eg ON eg.id = COALESCE(t.equipment_group_id, eq.group_id)
       LEFT JOIN inspection_domains dm ON dm.code = COALESCE(eq.domain_code, oc.code)
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
        `SELECT id, original_name AS "originalName", caption, doc_category AS "docCategory", mime_type AS "mimeType", created_at AS "createdAt"
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

// M3-03, M3-04, M3-06: Simpan draf otomatis, progres fase lapangan, & persiapan BAP situasional
router.put('/:id/draft', authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'), validate(saveDraftSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      conclusion,
      conclusionNotes,
      results,
      scopeItems,
      inspectionDate,
      prepareBapDraft
    } = req.body;

    const updatedResult = await withTransaction(async (db) => {
      const insp = await assertEditableInspection(db, id, req.user);

      const { rows: tplItems } = await db.query(
        'SELECT * FROM inspection_template_items WHERE version_id = $1',
        [insp.template_version_id]
      );
      const itemMap = new Map(tplItems.map((i) => [i.id, i]));

      for (const r of results) {
        const meta = itemMap.get(r.itemId);
        if (!meta) continue;
        const inputType = String(meta.input_type || 'CHOICE').toUpperCase();
        let outOfRange = false;
        if (NUMERIC_INPUT_TYPES.has(inputType) && r.numberValue !== null && r.numberValue !== undefined) {
          if (meta.min_value !== null && Number(r.numberValue) < Number(meta.min_value)) {
            outOfRange = true;
          }
          if (meta.max_value !== null && Number(r.numberValue) > Number(meta.max_value)) {
            outOfRange = true;
          }
        }

        const safeChoice =
          CONFORMITY_INPUT_TYPES.has(inputType) && ['SESUAI', 'TIDAK_SESUAI', 'TIDAK_BERLAKU'].includes(r.choiceValue)
            ? r.choiceValue
            : null;
        const safeText =
          r.textValue !== undefined && r.textValue !== null && String(r.textValue) !== ''
            ? String(r.textValue)
            : (!safeChoice && r.choiceValue ? String(r.choiceValue) : null);

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
            safeChoice,
            r.numberValue ?? null,
            safeText,
            r.dateValue || null,
            r.note || null,
            outOfRange
          ]
        );
      }

      if (req.body?.objectAttributes && typeof req.body.objectAttributes === 'object') {
        const oa = req.body.objectAttributes;
        const yearVal = oa.manufacture_year || oa.year ? parseInt(oa.manufacture_year || oa.year, 10) : null;
        await db.query(
          `UPDATE test_objects
           SET attributes = COALESCE(attributes, '{}'::jsonb) || $1::jsonb,
               serial_number = COALESCE(NULLIF($2, ''), serial_number),
               brand = COALESCE(NULLIF($3, ''), brand),
               model = COALESCE(NULLIF($4, ''), model),
               manufacture_year = COALESCE($5, manufacture_year),
               capacity = COALESCE(NULLIF($6, ''), capacity),
               capacity_unit = COALESCE(NULLIF($7, ''), capacity_unit),
               install_location = COALESCE(NULLIF($8, ''), install_location),
               previous_permit_no = COALESCE(NULLIF($9, ''), previous_permit_no),
               updated_at = now()
           WHERE id = $10`,
          [
            JSON.stringify(oa),
            oa.serial_number || oa.serialNumber || null,
            oa.brand || null,
            oa.model || null,
            yearVal && !Number.isNaN(yearVal) ? yearVal : null,
            oa.capacity ? String(oa.capacity) : null,
            oa.capacity_unit || oa.capacityUnit || null,
            oa.install_location || oa.location || null,
            oa.previous_permit_no || oa.permit_number || null,
            insp.object_id
          ]
        );
      }

      if (Array.isArray(scopeItems) && scopeItems.length > 0) {
        await db.query(
          `UPDATE order_objects
           SET scope_items = $1::jsonb, updated_at = now()
           WHERE order_id = $2 AND object_id = $3`,
          [JSON.stringify(scopeItems), insp.order_id, insp.object_id]
        );
        await db.query(
          `UPDATE bap_documents
           SET scope_items = $1::jsonb, updated_at = now()
           WHERE inspection_id = $2 AND status <> 'FINAL'`,
          [JSON.stringify(scopeItems), id]
        );
      }

      const { rows: upd } = await db.query(
        `UPDATE inspections
         SET conclusion = COALESCE(NULLIF($1, ''), conclusion),
             conclusion_notes = COALESCE($2, conclusion_notes),
             updated_at = now()
         WHERE id = $3
         RETURNING *`,
        [conclusion || null, conclusionNotes !== undefined ? conclusionNotes : null, id]
      );

      let preparedBap = null;
      if (prepareBapDraft) {
        const { rows: curBapRows } = await db.query(
          'SELECT * FROM bap_documents WHERE inspection_id = $1',
          [id]
        );
        const { rows: sigRows } = await db.query(
          'SELECT * FROM inspection_signatures WHERE inspection_id = $1',
          [id]
        );
        const inspSig = sigRows.find((s) => ['INSPECTOR', 'AHLI_K3'].includes(s.signer_role));
        const clientSig = sigRows.find((s) => ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role));

        const { rows: unitMetaRows } = await db.query(
          `SELECT oc.code AS category_code, oo.scope_items, oc.default_bap_scopes
           FROM order_objects oo
           JOIN test_objects t ON t.id = oo.object_id
           JOIN object_categories oc ON oc.id = t.category_id
           WHERE oo.order_id = $1 AND oo.object_id = $2`,
          [insp.order_id, insp.object_id]
        );
        const unitMeta = unitMetaRows[0] || {};
        const finalScopes =
          Array.isArray(scopeItems) && scopeItems.length
            ? scopeItems
            : Array.isArray(unitMeta.scope_items) && unitMeta.scope_items.length
            ? unitMeta.scope_items
            : Array.isArray(unitMeta.default_bap_scopes) && unitMeta.default_bap_scopes.length
            ? unitMeta.default_bap_scopes
            : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

        const effectiveConclusion = conclusion || upd[0].conclusion || null;

        if (!curBapRows[0]) {
          const { rows: seqRows } = await db.query("SELECT nextval('bap_no_seq') AS seq");
          const bapNo = await formatDocumentNumber('bap', {
            counter: seqRows[0].seq,
            categoryCode: unitMeta.category_code,
            date: new Date()
          }).catch(() => `BAP/URD/${new Date().getFullYear()}/${String(seqRows[0].seq).padStart(4, '0')}`);

          const { rows: createdBap } = await db.query(
            `INSERT INTO bap_documents
               (bap_no, inspection_id, order_id, object_id, status, inspection_date, scope_items, conclusion, notes,
                inspector_signer_name, inspector_signer_title, inspector_signature_file_id, inspector_signed_at,
                client_signer_name, client_signer_title, client_signature_file_id, client_signed_at, created_by)
             VALUES ($1,$2,$3,$4,'DRAF',COALESCE($5::date, CURRENT_DATE),$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
             RETURNING *`,
            [
              bapNo,
              id,
              insp.order_id,
              insp.object_id,
              inspectionDate || null,
              JSON.stringify(finalScopes),
              effectiveConclusion,
              conclusionNotes || null,
              inspSig?.signer_name || null,
              inspSig?.signer_title || 'Ahli K3 Pemeriksa',
              inspSig?.file_id || null,
              inspSig?.signed_at || null,
              clientSig?.signer_name || null,
              clientSig?.signer_title || 'Pemilik Alat / Perwakilan Klien',
              clientSig?.file_id || null,
              clientSig?.signed_at || null,
              req.user.id
            ]
          );
          preparedBap = createdBap[0];

          await db.query(
            `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
             VALUES ($1, 1, 'PREPARED', 'Draf BAP disiapkan dari fase inspeksi lapangan', $2, $3)`,
            [preparedBap.id, JSON.stringify({ scope_items: finalScopes, conclusion: effectiveConclusion }), req.user.id]
          );
        } else if (curBapRows[0].status !== 'FINAL') {
          const { rows: updatedBap } = await db.query(
            `UPDATE bap_documents
             SET inspection_date = COALESCE($1::date, inspection_date),
                 scope_items = $2::jsonb,
                 conclusion = COALESCE($3, conclusion),
                 notes = COALESCE($4, notes),
                 inspector_signer_name = COALESCE($5, inspector_signer_name),
                 inspector_signer_title = COALESCE($6, inspector_signer_title),
                 inspector_signature_file_id = COALESCE($7, inspector_signature_file_id),
                 inspector_signed_at = COALESCE($8, inspector_signed_at),
                 client_signer_name = COALESCE($9, client_signer_name),
                 client_signer_title = COALESCE($10, client_signer_title),
                 client_signature_file_id = COALESCE($11, client_signature_file_id),
                 client_signed_at = COALESCE($12, client_signed_at),
                 updated_at = now()
             WHERE id = $13
             RETURNING *`,
            [
              inspectionDate || null,
              JSON.stringify(finalScopes),
              effectiveConclusion,
              conclusionNotes !== undefined && conclusionNotes !== '' ? conclusionNotes : null,
              inspSig?.signer_name || null,
              inspSig?.signer_title || null,
              inspSig?.file_id || null,
              inspSig?.signed_at || null,
              clientSig?.signer_name || null,
              clientSig?.signer_title || null,
              clientSig?.file_id || null,
              clientSig?.signed_at || null,
              curBapRows[0].id
            ]
          );
          preparedBap = updatedBap[0];
        } else {
          preparedBap = curBapRows[0];
        }
      }

      return { inspection: upd[0], bap: preparedBap };
    });

    return res.json(updatedResult);
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
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
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

      const itemId = req.body?.itemId || null;
      let resolvedCaption = (req.body?.caption || '').trim();
      let matchedItem = null;
      if (itemId && /^[0-9a-f-]{36}$/i.test(itemId)) {
        const { rows: itemRows } = await query(
          'SELECT * FROM inspection_template_items WHERE id = $1 AND version_id = $2',
          [itemId, rows[0].template_version_id]
        );
        matchedItem = itemRows[0] || null;
      }

      if (!resolvedCaption && matchedItem) {
        resolvedCaption = `[${matchedItem.section || 'Dokumentasi'}] ${matchedItem.label}`;
      } else if (!resolvedCaption) {
        const sec = (req.body?.section || '').trim();
        resolvedCaption = sec ? `[${sec}] Foto Dokumentasi Riksa Uji` : 'Foto Dokumentasi Riksa Uji';
      }

      const rawCat = (req.body?.docCategory || req.body?.category || '').trim().toUpperCase();
      let docCategory = rawCat;
      if (!docCategory) {
        if (/8\.1|foto unit|tampak depan|tampak samping|tampak belakang/i.test(resolvedCaption)) {
          docCategory = 'FOTO_UNIT';
        } else if (/8\.2|visual|komponen|chasis|mast|garpu|temuan/i.test(resolvedCaption)) {
          docCategory = 'FOTO_VISUAL';
        } else if (/8\.3|uji fungsi|fungsi|operasional|indikator|lampu|klakson/i.test(resolvedCaption)) {
          docCategory = 'FOTO_FUNGSI';
        } else if (/8\.4|uji beban|beban|defleksi|load test/i.test(resolvedCaption)) {
          docCategory = 'FOTO_BEBAN';
        } else if (/8\.5|stiker|sticker|nameplate|plat nama/i.test(resolvedCaption)) {
          docCategory = 'FOTO_STIKER';
        }
      }

      const saved = await saveUploadedFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerType: 'INSPECTION_FINDING',
        ownerId: id,
        caption: resolvedCaption,
        uploadedBy: req.user.id,
        docCategory: docCategory || null
      });

      if (matchedItem && PHOTO_INPUT_TYPES.has(String(matchedItem.input_type || '').toUpperCase())) {
        await query(
          `INSERT INTO inspection_results (inspection_id, item_id, text_value, updated_at)
           VALUES ($1, $2, $3, now())
           ON CONFLICT (inspection_id, item_id) DO UPDATE SET
             text_value = COALESCE(NULLIF(inspection_results.text_value, ''), EXCLUDED.text_value),
             updated_at = now()`,
          [id, matchedItem.id, resolvedCaption || 'Foto Terlampir']
        );
      }

      return res.status(201).json({ photo: saved });
    } catch (err) {
      return next(err);
    }
  }
);

// M3-05d: Perbarui keterangan/bagian foto dokumentasi hasil riksa uji
router.patch(
  '/:id/photos/:photoId',
  authorize('INSPECTOR', 'AHLI_K3', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id, photoId } = req.params;
      const caption = req.body?.caption !== undefined ? String(req.body.caption).trim() : null;
      const rawCategory = (req.body?.docCategory || req.body?.category || '').trim().toUpperCase();
      let docCategory = rawCategory || null;
      if (caption && (caption.length < 2 || caption.length > 300)) {
        throw new AppError(400, 'INVALID_CAPTION', 'Keterangan foto harus antara 2 sampai 300 karakter.');
      }
      if (!docCategory && caption) {
        if (/8\.1|foto unit|tampak depan|tampak samping|tampak belakang/i.test(caption)) {
          docCategory = 'FOTO_UNIT';
        } else if (/8\.2|visual|komponen|chasis|mast|garpu|temuan/i.test(caption)) {
          docCategory = 'FOTO_VISUAL';
        } else if (/8\.3|uji fungsi|fungsi|operasional|indikator|lampu|klakson/i.test(caption)) {
          docCategory = 'FOTO_FUNGSI';
        } else if (/8\.4|uji beban|beban|defleksi|load test/i.test(caption)) {
          docCategory = 'FOTO_BEBAN';
        } else if (/8\.5|stiker|sticker|nameplate|plat nama/i.test(caption)) {
          docCategory = 'FOTO_STIKER';
        }
      }

      const { rows: updated } = await query(
        `UPDATE file_attachments
         SET caption = COALESCE($1, caption),
             doc_category = COALESCE($2, doc_category)
         WHERE id = $3 AND owner_id = $4 AND owner_type = 'INSPECTION_FINDING' AND deleted_at IS NULL
         RETURNING id, original_name AS "originalName", caption, doc_category AS "docCategory", mime_type AS "mimeType", created_at AS "createdAt"`,
        [caption, docCategory, photoId, id]
      );
      if (!updated[0]) {
        throw new AppError(404, 'PHOTO_NOT_FOUND', 'Foto tidak ditemukan.');
      }
      return res.json({ photo: updated[0] });
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
        const oa = req.body.objectAttributes;
        const yearVal = oa.manufacture_year || oa.year ? parseInt(oa.manufacture_year || oa.year, 10) : null;
        await db.query(
          `UPDATE test_objects
           SET attributes = COALESCE(attributes, '{}'::jsonb) || $1::jsonb,
               serial_number = COALESCE(NULLIF($2, ''), serial_number),
               brand = COALESCE(NULLIF($3, ''), brand),
               model = COALESCE(NULLIF($4, ''), model),
               manufacture_year = COALESCE($5, manufacture_year),
               capacity = COALESCE(NULLIF($6, ''), capacity),
               capacity_unit = COALESCE(NULLIF($7, ''), capacity_unit),
               install_location = COALESCE(NULLIF($8, ''), install_location),
               previous_permit_no = COALESCE(NULLIF($9, ''), previous_permit_no),
               updated_at = now()
           WHERE id = $10`,
          [
            JSON.stringify(oa),
            oa.serial_number || oa.serialNumber || null,
            oa.brand || null,
            oa.model || null,
            yearVal && !Number.isNaN(yearVal) ? yearVal : null,
            oa.capacity ? String(oa.capacity) : null,
            oa.capacity_unit || oa.capacityUnit || null,
            oa.install_location || oa.location || null,
            oa.previous_permit_no || oa.permit_number || null,
            insp.object_id
          ]
        );
      }

      const { rows: tplItems } = await db.query(
        'SELECT * FROM inspection_template_items WHERE version_id = $1 ORDER BY seq ASC',
        [insp.template_version_id]
      );
      const itemMap = new Map(tplItems.map((i) => [i.id, i]));
      const itemsBySeq = new Map(tplItems.map((i) => [Number(i.seq), i]));

      // Simpan hasil butir checklist jika disertakan langsung pada payload kirim
      if (Array.isArray(req.body?.results) && req.body.results.length > 0) {
        for (const r of req.body.results) {
          if (!r.itemId) continue;
          const meta = itemMap.get(r.itemId);
          const inputType = String(meta?.input_type || 'CHOICE').toUpperCase();
          const safeChoice =
            CONFORMITY_INPUT_TYPES.has(inputType) && ['SESUAI', 'TIDAK_SESUAI', 'TIDAK_BERLAKU'].includes(r.choiceValue)
              ? r.choiceValue
              : null;
          const safeText =
            r.textValue !== undefined && r.textValue !== null && String(r.textValue) !== ''
              ? String(r.textValue)
              : (!safeChoice && r.choiceValue ? String(r.choiceValue) : null);

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
              safeChoice,
              r.numberValue !== null && r.numberValue !== undefined && r.numberValue !== '' ? Number(r.numberValue) : null,
              safeText,
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

      const [{ rows: curResults }, { rows: curPhotos }] = await Promise.all([
        db.query('SELECT * FROM inspection_results WHERE inspection_id = $1', [id]),
        db.query(
          `SELECT id, caption, original_name FROM file_attachments
           WHERE owner_type = 'INSPECTION_FINDING' AND owner_id = $1 AND deleted_at IS NULL`,
          [id]
        )
      ]);
      const resMap = new Map(curResults.map((r) => [r.item_id, r]));

      const isWordHandoff = Boolean(req.body?.handoffToWord || req.body?.workPhase === 'FIELD');
      if (!isWordHandoff) {
        for (const reqItem of tplItems.filter((it) => it.is_required)) {
          if (!isConditionalItemActive(reqItem, itemsBySeq, resMap)) continue;
          const val = resMap.get(reqItem.id);
          let filled = isResultFilled(reqItem, val);
          if (!filled && PHOTO_INPUT_TYPES.has(String(reqItem.input_type || '').toUpperCase())) {
            const cleanLabel = String(reqItem.label || '').toLowerCase();
            const numToken = cleanLabel.match(/^(\d+\.\d+)/)?.[1];
            filled = curPhotos.some((p) => {
              const cap = String(p.caption || '').toLowerCase();
              return (cleanLabel && cap.includes(cleanLabel)) || (numToken && cap.includes(numToken));
            });
          }
          if (!filled) {
            throw new AppError(
              400,
              'INCOMPLETE_FORM',
              `Butir wajib "${reqItem.label}" belum diisi.`
            );
          }
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

      const checklistFindingNotes = tplItems
        .filter((it) => /temuan|finding/i.test(`${it.section || ''} ${it.label || ''}`) && it.input_type === 'LONG_TEXT')
        .map((it) => resMap.get(it.id)?.text_value)
        .filter(Boolean);
      const checklistRecNotes = tplItems
        .filter((it) => /rekomendasi/i.test(it.label || '') && ['TEXT', 'LONG_TEXT'].includes(String(it.input_type || '').toUpperCase()))
        .map((it) => resMap.get(it.id)?.text_value)
        .filter(Boolean);

      const { rows: findings } = await db.query(
        'SELECT severity, description, recommendation FROM inspection_findings WHERE inspection_id = $1',
        [id]
      );
      const findingsSummary = findings.length
        ? findings.map((f, idx) => `${idx + 1}. [${f.severity}] ${f.description} (Rekomendasi: ${f.recommendation})`).join('\n')
        : checklistFindingNotes.join('\n');
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
        : checklistRecNotes.join('\n') || 'Pertahankan pemeliharaan berkala sesuai standar K3 yang berlaku.';
      const autoTechnicalNotes =
        lockedRows[0].conclusion_notes ||
        checklistFindingNotes.join('\n') ||
        'Hasil pemeriksaan telah dicatat sesuai form lapangan dan standar K3.';
      const oneYearLater = new Date(Date.now() + 365 * 86400 * 1000).toISOString().slice(0, 10);
      const validUntilDate = req.body?.recommendedValidUntil || oneYearLater;

      const { rows: lhppRows } = await db.query(
        `INSERT INTO lhpp_documents
           (inspection_id, status, method_summary, technical_notes, recommendations, recommended_valid_until, prepared_by)
         VALUES ($1, 'SIAP_PREVIEW', $2, $3, $4, $5, $6)
         ON CONFLICT (inspection_id) DO UPDATE SET
           status = CASE WHEN lhpp_documents.status IN ('FINAL', 'TERBIT') THEN lhpp_documents.status ELSE 'SIAP_PREVIEW' END,
           technical_notes = COALESCE(NULLIF(lhpp_documents.technical_notes, ''), EXCLUDED.technical_notes),
           recommendations = COALESCE(NULLIF(lhpp_documents.recommendations, ''), EXCLUDED.recommendations),
           recommended_valid_until = COALESCE(lhpp_documents.recommended_valid_until, EXCLUDED.recommended_valid_until),
           updated_at = now()
         RETURNING *`,
        [
          id,
          `Ruang lingkup pemeriksaan: ${unitScopes.join(', ')}.`,
          autoTechnicalNotes,
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

      // Jika BAP sudah disiapkan pada fase lapangan, sinkronkan tautan LHPP dan kesimpulan teknis tanpa menimpa tanda tangan atau statusnya
      let bapResult = null;
      const shouldAutoFinalize = Boolean(req.body?.autoFinalizeBap || req.body?.autoFinalizeLhpp);
      if (!shouldAutoFinalize) {
        const { rows: syncedBapRows } = await db.query(
          `UPDATE bap_documents
           SET lhpp_id = COALESCE(lhpp_id, $1),
               scope_items = $2::jsonb,
               conclusion = $3,
               notes = COALESCE(NULLIF(notes, ''), $4),
               updated_at = now()
           WHERE inspection_id = $5 AND status IN ('DRAF', 'MENUNGGU_TANDA_TANGAN', 'REVISI')
           RETURNING *`,
          [lhppRows[0].id, JSON.stringify(unitScopes), lockedRows[0].conclusion, bapNotes, id]
        );
        bapResult = syncedBapRows[0] || null;
      }
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

async function resolveOrCreateInspectionBapContext(db, inspectionId, _currentUser) {
  const { rows: curBap } = await db.query(
    'SELECT id FROM bap_documents WHERE inspection_id = $1 ORDER BY created_at DESC LIMIT 1',
    [inspectionId]
  );
  if (curBap[0]) {
    return await fetchFullBapContext(db, curBap[0].id);
  }

  const { rows: inspRows } = await db.query(
    `SELECT i.*, o.client_id, o.location_id, t.category_id,
            oc.code AS category_code, oc.default_bap_scopes,
            oo.scope_items AS unit_scope_items
     FROM inspections i
     JOIN orders o ON o.id = i.order_id
     JOIN test_objects t ON t.id = i.object_id
     JOIN object_categories oc ON oc.id = t.category_id
     LEFT JOIN order_objects oo ON oo.order_id = i.order_id AND oo.object_id = i.object_id
     WHERE i.id = $1`,
    [inspectionId]
  );
  if (!inspRows[0]) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Form inspeksi tidak ditemukan.');
  const insp = inspRows[0];

  const unitScopes =
    Array.isArray(insp.unit_scope_items) && insp.unit_scope_items.length
      ? insp.unit_scope_items
      : Array.isArray(insp.default_bap_scopes) && insp.default_bap_scopes.length
      ? insp.default_bap_scopes
      : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

  const { rows: seqRows } = await db.query("SELECT nextval('bap_no_seq') AS seq");
  const bapNo = await formatDocumentNumber('bap', {
    seq: seqRows[0].seq,
    categoryCode: insp.category_code || 'K3',
    date: new Date()
  });

  const { rows: newBap } = await db.query(
    `INSERT INTO bap_documents
       (bap_no, inspection_id, order_id, object_id, status, inspection_date, scope_items, notes)
     VALUES ($1, $2, $3, $4, 'DRAF', COALESCE($5, CURRENT_DATE), $6, $7)
     RETURNING id`,
    [
      bapNo,
      inspectionId,
      insp.order_id,
      insp.object_id,
      insp.inspected_at || null,
      JSON.stringify(unitScopes),
      insp.conclusion_notes || 'Draf BAP disiapkan untuk penandatanganan di lokasi riksa uji.'
    ]
  );

  return await fetchFullBapContext(db, newBap[0].id);
}

// M3-15: Unduh Pratinjau / File BAP PDF langsung dari form inspeksi
router.get('/:id/bap/pdf', async (req, res, next) => {
  try {
    const bap = await resolveOrCreateInspectionBapContext({ query }, req.params.id, req.user);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    const pdfBuf = await generateBapPdfBuffer(bap);
    const filename = `${(bap.bap_no || 'BAP-DRAF').replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuf);
  } catch (err) {
    return next(err);
  }
});

// M3-16: Unduh File BAP DOCX langsung dari form inspeksi
router.get('/:id/bap/docx', async (req, res, next) => {
  try {
    const bap = await resolveOrCreateInspectionBapContext({ query }, req.params.id, req.user);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    const docxBuf = await generateBapDocxBuffer(bap);
    const filename = `${(bap.bap_no || 'BAP-DRAF').replace(/\//g, '-')}.docx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(docxBuf);
  } catch (err) {
    return next(err);
  }
});

// M3-17: Unduh Blangko Tabel Kerja LHPP DOCX untuk penyusunan teknis di kantor
router.get('/:id/lhpp/docx', async (req, res, next) => {
  try {
    const { rows: lhppRows } = await query(
      'SELECT id FROM lhpp_documents WHERE inspection_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    let lhppContext = null;
    if (lhppRows[0]) {
      lhppContext = await fetchFullLhppContext({ query }, lhppRows[0].id);
    }
    if (!lhppContext) {
      const detailRes = await query(
        `SELECT i.*, o.order_no, o.po_number, o.service_type,
                c.name AS client_name, c.address AS client_address,
                cl.name AS location_name, cl.address AS location_address,
                t.name AS object_name, t.brand, t.model, t.serial_number,
                t.manufacture_year, t.capacity, t.capacity_unit, t.install_location,
                t.previous_permit_no, t.attributes AS object_attributes,
                oc.name AS category_name, oc.code AS category_code,
                u.full_name AS inspector_name, u.skp_no AS inspector_skp_no
         FROM inspections i
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         LEFT JOIN client_locations cl ON cl.id = o.location_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN object_categories oc ON oc.id = t.category_id
         LEFT JOIN users u ON u.id = i.inspector_id
         WHERE i.id = $1`,
        [req.params.id]
      );
      if (!detailRes.rows[0]) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Inspeksi tidak ditemukan.');
      const insp = detailRes.rows[0];
      const [{ rows: resRows }, { rows: photoRows }] = await Promise.all([
        query(
          `SELECT r.*, it.label, it.section
           FROM inspection_results r
           JOIN inspection_template_items it ON it.id = r.item_id
           WHERE r.inspection_id = $1`,
          [req.params.id]
        ),
        query(
          `SELECT * FROM file_attachments
           WHERE owner_type = 'INSPECTION_FINDING' AND owner_id = $1 AND deleted_at IS NULL
           ORDER BY created_at ASC`,
          [req.params.id]
        )
      ]);
      lhppContext = {
        ...insp,
        results: resRows,
        photos: photoRows,
        technical_data: insp.object_attributes || {},
        conclusion: insp.conclusion || null,
        report_date: new Date()
      };
    }

    const docxBuf = await generateLhppDocxBuffer(lhppContext);
    const filename = `Template-LHPP-${(lhppContext.object_name || 'Alat').replace(/\s+/g, '-')}-${(lhppContext.serial_number || 'Unit').replace(/\//g, '-')}.docx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(docxBuf);
  } catch (err) {
    return next(err);
  }
});

export default router;
