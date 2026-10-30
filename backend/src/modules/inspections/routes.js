import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { BAP_SCOPE_CATALOG, syncOrderUnitStatus } from '../../services/workflow.js';
import { saveDataUrlPng, saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const templateCreateSchema = Joi.object({
  categoryId: Joi.number().integer().min(1).max(7).required(),
  name: Joi.string().min(3).max(160).required(),
  isValidated: Joi.boolean().default(false),
  items: Joi.array()
    .items(
      Joi.object({
        seq: Joi.number().integer().min(1).required(),
        section: Joi.string().min(2).max(120).required(),
        label: Joi.string().min(2).max(300).required(),
        inputType: Joi.string().valid('CHOICE', 'NUMBER', 'TEXT', 'DATE').required(),
        unit: Joi.string().max(40).allow('', null),
        minValue: Joi.number().allow(null),
        maxValue: Joi.number().allow(null),
        isRequired: Joi.boolean().default(true)
      })
    )
    .min(1)
    .required()
});

const startInspectionSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  objectId: Joi.string().uuid().required(),
  templateVersionId: Joi.string().uuid().allow('', null)
});

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
    .default([])
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
  reason: Joi.string().min(5).max(500).required()
});

// Daftar template beserta versi aktif dan butirnya
router.get('/templates', async (req, res, next) => {
  try {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const params = [];
    const whereSql = categoryId ? (params.push(categoryId), 'WHERE t.category_id = $1') : '';

    const { rows: templates } = await query(
      `SELECT t.*, oc.code AS category_code, oc.name AS category_name,
              tv.id AS active_version_id, tv.version AS active_version,
              tv.is_validated, tv.validated_at
       FROM inspection_templates t
       JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN inspection_template_versions tv ON tv.template_id = t.id AND tv.status = 'AKTIF'
       ${whereSql}
       ORDER BY t.category_id ASC, t.name ASC`,
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
      const { categoryId, name, isValidated, items } = req.body;
      const result = await withTransaction(async (db) => {
        const { rows: tplRows } = await db.query(
          `INSERT INTO inspection_templates (category_id, name, created_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (category_id, name) DO UPDATE SET name = EXCLUDED.name
           RETURNING *`,
          [categoryId, name.trim(), req.user.id]
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
               (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
              it.isRequired ?? true
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

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(`SELECT count(*)::int AS total FROM inspections i ${whereSql}`, params);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT i.*, o.order_no, o.po_number, c.name AS client_name,
              t.name AS object_name, t.serial_number,
              oc.code AS category_code, oc.name AS category_name,
              u.full_name AS inspector_name,
              tv.is_validated AS template_is_validated,
              b.id AS bap_id, b.bap_no, b.status AS bap_status,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
       FROM inspections i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       JOIN inspection_template_versions tv ON tv.id = i.template_version_id
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
router.post('/start', authorize('AHLI_K3'), validate(startInspectionSchema), async (req, res, next) => {
  try {
    const { orderId, objectId, templateVersionId } = req.body;

    const inspection = await withTransaction(async (db) => {
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

      const { rows: existing } = await db.query(
        'SELECT * FROM inspections WHERE order_id = $1 AND object_id = $2',
        [orderId, objectId]
      );
      if (existing[0]) return existing[0];

      let verId = templateVersionId;
      if (!verId) {
        const { rows: verRows } = await db.query(
          `SELECT tv.id
           FROM inspection_templates t
           JOIN inspection_template_versions tv ON tv.template_id = t.id
           WHERE t.category_id = $1 AND tv.status = 'AKTIF'
           ORDER BY tv.version DESC LIMIT 1`,
          [obj.category_id]
        );
        if (!verRows[0]) {
          throw new AppError(
            400,
            'TEMPLATE_NOT_FOUND',
            'Belum ada template inspeksi aktif untuk kategori objek ini.'
          );
        }
        verId = verRows[0].id;
      }

      const { rows: created } = await db.query(
        `INSERT INTO inspections (order_id, object_id, template_version_id, inspector_id, status, inspected_at)
         VALUES ($1, $2, $3, $4, 'DRAF', now())
         RETURNING *`,
        [orderId, objectId, verId, req.user.id]
      );

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
          summary: { orderId, objectId },
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
              t.name AS object_name, t.serial_number, t.brand, t.manufacturer, t.model, t.capacity, t.install_location,
              oc.code AS category_code, oc.name AS category_name, oc.default_bap_scopes,
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
      const { rows: coAssigned } = await query(
        `SELECT 1 FROM assignments
         WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU','DITERIMA')`,
        [insp.order_id, req.user.id]
      );
      if (!coAssigned[0]) {
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

async function assertEditableInspection(db, id, user) {
  const { rows } = await db.query('SELECT * FROM inspections WHERE id = $1', [id]);
  const insp = rows[0];
  if (!insp) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Form inspeksi tidak ditemukan.');
  if (insp.status === 'TERKIRIM') {
    throw new AppError(
      409,
      'INSPECTION_LOCKED',
      'Form inspeksi telah terkirim dan terkunci. Perubahan hanya dapat dilakukan melalui pembukaan revisi tercatat.'
    );
  }

  // 1. Admin sistem selalu diizinkan untuk perbaikan atau pengawalan operasional
  if (user.role === 'ADMIN_SISTEM') {
    return insp;
  }

  // 2. Pastikan perannya adalah Ahli K3 atau Inspector
  if (!['AHLI_K3', 'INSPECTOR'].includes(user.role)) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'Hanya Ahli K3 / Inspector pemeriksa yang ditugaskan yang dapat mengisi form ini.'
    );
  }

  // 3. Jika ID cocok langsung
  if (insp.inspector_id === user.id) {
    return insp;
  }

  // 4. Periksa penugasan tim pada order (co-assigned)
  const { rows: coAssigned } = await db.query(
    `SELECT 1 FROM assignments
     WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU','DITERIMA')`,
    [insp.order_id, user.id]
  );
  if (coAssigned[0]) {
    return insp;
  }

  // 5. Periksa kesamaan identitas akun (nama atau nomor HP yang sama)
  const { rows: aliasCheck } = await db.query(
    `SELECT 1 FROM users u1, users u2
     WHERE u1.id = $1 AND u2.id = $2 AND (
       u1.full_name = u2.full_name OR
       u1.phone = u2.phone OR
       split_part(u1.email, '@', 1) = split_part(u2.email, '@', 1)
     )`,
    [user.id, insp.inspector_id]
  );
  if (aliasCheck[0]) {
    await db.query('UPDATE inspections SET inspector_id = $1 WHERE id = $2', [user.id, id]);
    insp.inspector_id = user.id;
    return insp;
  }

  throw new AppError(
    403,
    'FORBIDDEN',
    'Hanya Ahli K3 / Inspector pemeriksa yang ditugaskan yang dapat mengisi form ini.'
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
      const { rows: sigRows } = await db.query(
        'SELECT * FROM inspection_signatures WHERE inspection_id = $1',
        [id]
      );
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
        const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        const rm = romanMonths[now.getMonth()];
        const generatedBapNo = `BAP/URD/${rm}/${now.getFullYear()}/${String(seqRes.rows[0].seq).padStart(4, '0')}`;

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
  authorize('ADMIN_SISTEM', 'PIMPINAN', 'AHLI_K3'),
  validate(reopenSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const reopened = await withTransaction(async (db) => {
        const { rows } = await db.query('SELECT * FROM inspections WHERE id = $1', [id]);
        const insp = rows[0];
        if (!insp) throw new AppError(404, 'INSPECTION_NOT_FOUND', 'Inspeksi tidak ditemukan.');
        if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && insp.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
        }
        if (insp.status !== 'TERKIRIM') {
          throw new AppError(400, 'NOT_LOCKED', 'Form masih berstatus DRAF.');
        }

        const { rows: lhpp } = await db.query(
          'SELECT status FROM lhpp_documents WHERE inspection_id = $1',
          [id]
        );
        if (lhpp[0]?.status === 'TERBIT') {
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
            reason.trim(),
            { inspection: insp, results: curResults },
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

        await recordAudit(
          {
            userId: req.user.id,
            action: 'INSPECTION_REOPEN_REVISION',
            entity: 'inspections',
            entityId: id,
            summary: { revisionNo: nextRev, reason: reason.trim() },
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
