import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { resolveLhppTemplate } from '../../services/lhpp-template-service.js';
import { generateLhppPdfBuffer } from '../../services/pdf-generator.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

// Joi Schemas
const createTemplateSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(64).required(),
  name: Joi.string().trim().min(3).max(180).required(),
  description: Joi.string().trim().max(1000).allow('', null),
  domainCode: Joi.string().trim().uppercase().required(),
  equipmentTypeId: Joi.string().uuid().allow('', null),
  equipmentSubtypeId: Joi.string().uuid().allow('', null),
  inspectionTypeCode: Joi.string().trim().uppercase().allow('', null),
  outputFormat: Joi.string().valid('PDF', 'DOCX', 'BOTH').default('BOTH'),
  initialTitle: Joi.string().trim().min(5).max(255).required(),
  regulationReference: Joi.string().trim().max(500).allow('', null),
  sections: Joi.array().items(
    Joi.object({
      key: Joi.string().required(),
      title: Joi.string().required(),
      type: Joi.string().required(),
      enabled: Joi.boolean().default(true)
    })
  ).default([]),
  fieldMappings: Joi.array().items(
    Joi.object({
      target: Joi.string().required(),
      source: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().default(false)
    })
  ).default([])
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().trim().min(3).max(180).required(),
  description: Joi.string().trim().max(1000).allow('', null),
  domainCode: Joi.string().trim().uppercase().required(),
  equipmentTypeId: Joi.string().uuid().allow('', null),
  equipmentSubtypeId: Joi.string().uuid().allow('', null),
  inspectionTypeCode: Joi.string().trim().uppercase().allow('', null),
  outputFormat: Joi.string().valid('PDF', 'DOCX', 'BOTH').required()
});

const createVersionSchema = Joi.object({
  title: Joi.string().trim().min(5).max(255).required(),
  regulationReference: Joi.string().trim().max(500).allow('', null),
  effectiveDate: Joi.date().iso().default(() => new Date()),
  sections: Joi.array().items(
    Joi.object({
      key: Joi.string().required(),
      title: Joi.string().required(),
      type: Joi.string().required(),
      enabled: Joi.boolean().default(true)
    })
  ).required(),
  fieldMappings: Joi.array().items(
    Joi.object({
      target: Joi.string().required(),
      source: Joi.string().required(),
      label: Joi.string().required(),
      required: Joi.boolean().default(false)
    })
  ).required(),
  layoutConfig: Joi.object().default({}),
  changelog: Joi.string().max(1000).allow('', null)
});

/**
 * GET /api/v1/lhpp-templates
 * List all LHPP templates with active version & domain details
 */
router.get('/', async (req, res, next) => {
  try {
    const { domainCode, equipmentTypeId, status, search } = req.query;

    const conditions = ['1=1'];
    const values = [];

    if (domainCode && domainCode !== 'ALL') {
      values.push(domainCode);
      conditions.push(`t.domain_code = $${values.length}`);
    }

    if (equipmentTypeId && equipmentTypeId !== 'ALL') {
      values.push(equipmentTypeId);
      conditions.push(`t.equipment_type_id = $${values.length}`);
    }

    if (status === 'ACTIVE') {
      conditions.push('t.is_active = true');
    } else if (status === 'INACTIVE') {
      conditions.push('t.is_active = false');
    }

    if (search) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(t.name ILIKE $${values.length} OR t.code ILIKE $${values.length})`);
    }

    const { rows } = await query(
      `SELECT t.*,
              d.name AS domain_name,
              eq.name AS equipment_type_name,
              sub.name AS equipment_subtype_name,
              it.name AS inspection_type_name,
              v.version_code AS active_version_code,
              v.version_number AS active_version_number,
              v.title AS active_version_title,
              v.regulation_reference AS active_regulation_reference,
              v.effective_date AS active_effective_date,
              (SELECT COUNT(*) FROM lhpp_template_versions WHERE template_id = t.id) AS total_versions,
              (SELECT COUNT(*) FROM lhpp_documents WHERE template_version_id IN (SELECT id FROM lhpp_template_versions WHERE template_id = t.id)) AS usage_count
       FROM lhpp_templates t
       JOIN inspection_domains d ON d.code = t.domain_code
       LEFT JOIN equipment_types eq ON eq.id = t.equipment_type_id
       LEFT JOIN equipment_types sub ON sub.id = t.equipment_subtype_id
       LEFT JOIN inspection_types it ON it.code = t.inspection_type_code
       LEFT JOIN lhpp_template_versions v ON v.id = t.active_version_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY d.display_order ASC, t.name ASC`,
      values
    );

    return res.json({ templates: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/lhpp-templates/resolve
 * Resolve matching template for equipment parameters
 */
router.get('/resolve', async (req, res, next) => {
  try {
    const { domainCode, equipmentTypeId, equipmentSubtypeId, inspectionTypeCode } = req.query;
    const resolved = await resolveLhppTemplate(query, {
      domainCode,
      equipmentTypeId,
      equipmentSubtypeId,
      inspectionTypeCode
    });
    return res.json({ template: resolved });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/lhpp-templates/:id
 * Detail of an LHPP template including all versions history
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT t.*,
              d.name AS domain_name,
              eq.name AS equipment_type_name,
              sub.name AS equipment_subtype_name,
              it.name AS inspection_type_name
       FROM lhpp_templates t
       JOIN inspection_domains d ON d.code = t.domain_code
       LEFT JOIN equipment_types eq ON eq.id = t.equipment_type_id
       LEFT JOIN equipment_types sub ON sub.id = t.equipment_subtype_id
       LEFT JOIN inspection_types it ON it.code = t.inspection_type_code
       WHERE t.id = $1`,
      [id]
    );

    if (!rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Template LHPP tidak ditemukan.');
    }

    const versionsRes = await query(
      `SELECT v.*, u.full_name AS created_by_name
       FROM lhpp_template_versions v
       LEFT JOIN users u ON u.id = v.created_by
       WHERE v.template_id = $1
       ORDER BY v.version_number DESC`,
      [id]
    );

    return res.json({
      template: {
        ...rows[0],
        versions: versionsRes.rows,
        active_version: versionsRes.rows.find((v) => v.id === rows[0].active_version_id) || versionsRes.rows[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/lhpp-templates
 * Create new template with initial V1 version (Super Admin only)
 */
router.post(
  '/',
  authorize('ADMIN_SISTEM'),
  validate(createTemplateSchema),
  async (req, res, next) => {
    try {
      const {
        code,
        name,
        description,
        domainCode,
        equipmentTypeId,
        equipmentSubtypeId,
        inspectionTypeCode,
        outputFormat,
        initialTitle,
        regulationReference,
        sections,
        fieldMappings
      } = req.body;

      const created = await withTransaction(async (db) => {
        // 1. Create Template record
        const tplRes = await db.query(
          `INSERT INTO lhpp_templates (
            code, name, description, domain_code,
            equipment_type_id, equipment_subtype_id, inspection_type_code,
            output_format, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          RETURNING *`,
          [
            code,
            name,
            description || null,
            domainCode,
            equipmentTypeId || null,
            equipmentSubtypeId || null,
            inspectionTypeCode || null,
            outputFormat || 'BOTH'
          ]
        );
        const tpl = tplRes.rows[0];

        // 2. Create initial Version 1
        const verRes = await db.query(
          `INSERT INTO lhpp_template_versions (
            template_id, version_number, version_code, title,
            regulation_reference, effective_date, is_active,
            sections, field_mappings, changelog, created_by
          ) VALUES ($1, 1, 'V1', $2, $3, CURRENT_DATE, true, $4, $5, 'Inisialisasi template baru', $6)
          RETURNING *`,
          [
            tpl.id,
            initialTitle,
            regulationReference || null,
            JSON.stringify(sections || []),
            JSON.stringify(fieldMappings || []),
            req.user.id
          ]
        );
        const ver = verRes.rows[0];

        // 3. Set active version ID
        await db.query(
          'UPDATE lhpp_templates SET active_version_id = $1 WHERE id = $2',
          [ver.id, tpl.id]
        );

        return { ...tpl, active_version_id: ver.id, active_version: ver };
      });

      await recordAudit({
        userId: req.user?.id,
        action: 'CREATE_LHPP_TEMPLATE',
        entity: 'LHPP_TEMPLATE',
        entityId: created.id,
        summary: { code: created.code, name: created.name },
        ip: req.ip
      });

      return res.status(201).json({
        message: 'Template LHPP berhasil dibuat.',
        template: created
      });
    } catch (err) {
      if (err.code === '23505') {
        return next(new AppError(409, 'DUPLICATE_CODE', `Kode template "${req.body.code}" sudah digunakan.`));
      }
      next(err);
    }
  }
);

/**
 * PUT /api/v1/lhpp-templates/:id
 * Update template metadata (Super Admin only)
 */
router.put(
  '/:id',
  authorize('ADMIN_SISTEM'),
  validate(updateTemplateSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        domainCode,
        equipmentTypeId,
        equipmentSubtypeId,
        inspectionTypeCode,
        outputFormat
      } = req.body;

      const { rows } = await query(
        `UPDATE lhpp_templates
         SET name = $1,
             description = $2,
             domain_code = $3,
             equipment_type_id = $4,
             equipment_subtype_id = $5,
             inspection_type_code = $6,
             output_format = $7,
             updated_at = now()
         WHERE id = $8
         RETURNING *`,
        [
          name,
          description || null,
          domainCode,
          equipmentTypeId || null,
          equipmentSubtypeId || null,
          inspectionTypeCode || null,
          outputFormat,
          id
        ]
      );

      if (!rows[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Template LHPP tidak ditemukan.');
      }

      await recordAudit({
        userId: req.user?.id,
        action: 'UPDATE_LHPP_TEMPLATE',
        entity: 'LHPP_TEMPLATE',
        entityId: id,
        summary: { name },
        ip: req.ip
      });

      return res.json({
        message: 'Metadata template LHPP berhasil diperbarui.',
        template: rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/lhpp-templates/:id/versions
 * Publish a new template version with copy-on-write
 */
router.post(
  '/:id/versions',
  authorize('ADMIN_SISTEM'),
  validate(createVersionSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        title,
        regulationReference,
        effectiveDate,
        sections,
        fieldMappings,
        layoutConfig,
        changelog
      } = req.body;

      const version = await withTransaction(async (db) => {
        // Check template exists
        const tplRes = await db.query('SELECT * FROM lhpp_templates WHERE id = $1', [id]);
        if (!tplRes.rows[0]) {
          throw new AppError(404, 'NOT_FOUND', 'Template LHPP tidak ditemukan.');
        }

        // Get max version number
        const maxRes = await db.query(
          'SELECT COALESCE(MAX(version_number), 0) AS max_ver FROM lhpp_template_versions WHERE template_id = $1',
          [id]
        );
        const nextNum = Number(maxRes.rows[0].max_ver) + 1;
        const nextCode = `V${nextNum}`;

        // Insert new version
        const verRes = await db.query(
          `INSERT INTO lhpp_template_versions (
            template_id, version_number, version_code, title,
            regulation_reference, effective_date, is_active,
            sections, field_mappings, layout_config, changelog, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            id,
            nextNum,
            nextCode,
            title,
            regulationReference || null,
            effectiveDate || new Date(),
            JSON.stringify(sections),
            JSON.stringify(fieldMappings),
            JSON.stringify(layoutConfig || {}),
            changelog || null,
            req.user.id
          ]
        );

        const newVer = verRes.rows[0];

        // Set as active version
        await db.query(
          'UPDATE lhpp_templates SET active_version_id = $1, updated_at = now() WHERE id = $2',
          [newVer.id, id]
        );

        return newVer;
      });

      await recordAudit({
        userId: req.user?.id,
        action: 'CREATE_LHPP_TEMPLATE_VERSION',
        entity: 'LHPP_TEMPLATE_VERSION',
        entityId: version.id,
        summary: { templateId: id, versionCode: version.version_code, title: version.title },
        ip: req.ip
      });

      return res.status(201).json({
        message: `Versi baru (${version.version_code}) berhasil diterbitkan dan diaktifkan.`,
        version
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/lhpp-templates/:id/status
 * Toggle template active/inactive status
 */
router.patch(
  '/:id/status',
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const { rows } = await query(
        'UPDATE lhpp_templates SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *',
        [Boolean(isActive), id]
      );

      if (!rows[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Template LHPP tidak ditemukan.');
      }

      await recordAudit({
        userId: req.user?.id,
        action: 'TOGGLE_LHPP_TEMPLATE_STATUS',
        entity: 'LHPP_TEMPLATE',
        entityId: id,
        summary: { isActive: Boolean(isActive) },
        ip: req.ip
      });

      return res.json({
        message: `Status template berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
        template: rows[0]
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/lhpp-templates/:id/preview
 * Generate a test render preview of the template with sample data
 */
router.post('/:id/preview', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT t.*, v.*, v.id AS version_id
       FROM lhpp_templates t
       JOIN lhpp_template_versions v ON v.id = t.active_version_id
       WHERE t.id = $1`,
      [id]
    );

    if (!rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Template LHPP tidak ditemukan.');
    }

    const tpl = rows[0];

    // Build sample report data
    const sampleData = {
      lhpp_no: 'LHPP-PREVIEW/TEST/2026',
      bap_no: 'BAP-PREVIEW/TEST/2026',
      category_code: tpl.domain_code,
      domain_code: tpl.domain_code,
      template_title: tpl.title,
      template_version_title: tpl.title,
      template_regulation_reference: tpl.regulation_reference,
      client_name: 'PT Contoh Klien Pratinjau',
      client_address: 'Kawasan Industri MM2100, Cikarang Barat, Bekasi',
      install_location: 'Gedung Workshop Produksi A',
      object_name: tpl.name,
      serial_number: 'SN-SAMPLE-9901',
      brand: 'URD Testing Unit',
      model: 'Model-X 2026',
      capacity: '5000 kg',
      manufacture_year: '2022',
      inspection_date: new Date().toISOString().slice(0, 10),
      inspection_type: 'BERKALA',
      inspector_name: req.user.fullName || 'Ahli K3 Spesialis URD',
      conclusion: 'MEMENUHI_SYARAT',
      technical_notes: 'Pemeriksaan pengujian sampel pratinjau layout template dokumen LHPP.',
      recommendations: 'Lakukan perawatan berkala secara rutin sesuai petunjuk pabrik pembuat.',
      results: [
        { section: 'Pemeriksaan Visual', label: 'Rangka & Konstruksi Utama', choice_value: 'MEMENUHI_SYARAT' },
        { section: 'Pemeriksaan Visual', label: 'Safety Devices & Interlock', choice_value: 'MEMENUHI_SYARAT' },
        { section: 'Pengujian Teknis', label: 'Pengujian Fungsi Operasional', choice_value: 'MEMENUHI_SYARAT' }
      ],
      findings: []
    };

    const pdfBuffer = await generateLhppPdfBuffer(sampleData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview-lhpp-template.pdf"');
    return res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
