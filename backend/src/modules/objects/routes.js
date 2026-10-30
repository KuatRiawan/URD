import { Router } from 'express';
import Joi from 'joi';
import QRCode from 'qrcode';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const objectSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  locationId: Joi.string().uuid().allow('', null),
  categoryId: Joi.number().integer().min(1).max(7).required(),
  name: Joi.string().min(2).max(160).required(),
  brand: Joi.string().max(120).allow('', null),
  manufacturer: Joi.string().max(160).allow('', null),
  model: Joi.string().max(120).allow('', null),
  serialNumber: Joi.string().min(1).max(120).required(),
  manufactureYear: Joi.number().integer().min(1900).max(2100).allow(null),
  capacity: Joi.string().max(100).allow('', null),
  capacityUnit: Joi.string().max(40).allow('', null),
  installLocation: Joi.string().max(200).allow('', null),
  previousPermitNo: Joi.string().max(120).allow('', null),
  nextInspectionDate: Joi.date().iso().allow('', null),
  validityNotes: Joi.string().max(500).allow('', null),
  attributes: Joi.object().default({}),
  isActive: Joi.boolean()
});

const csvImportSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  csvText: Joi.string().min(5).required()
});

router.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM object_categories ORDER BY id ASC');
    return res.json({ categories: rows });
  } catch (err) {
    return next(err);
  }
});

// Bagian 9: Riwayat Pengujian lintas PO & unit
router.get('/history/all', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = (req.query.q || '').trim();
    const clientId = (req.query.clientId || '').trim();
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const objectId = (req.query.objectId || '').trim();

    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`i.inspector_id = $${params.length}`);
    }
    if (clientId) {
      params.push(clientId);
      conds.push(`o.client_id = $${params.length}`);
    }
    if (categoryId) {
      params.push(categoryId);
      conds.push(`t.category_id = $${params.length}`);
    }
    if (objectId) {
      params.push(objectId);
      conds.push(`i.object_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(t.name) LIKE $${params.length} OR lower(t.serial_number) LIKE $${params.length} OR lower(o.order_no) LIKE $${params.length} OR lower(coalesce(o.po_number,'')) LIKE $${params.length} OR lower(c.name) LIKE $${params.length})`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM inspections i
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = i.object_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT i.id AS inspection_id, i.status AS inspection_status, i.conclusion, i.conclusion_notes,
              i.inspected_at, i.submitted_at, i.revision_no AS inspection_revision_no,
              u.full_name AS inspector_name,
              o.id AS order_id, o.order_no, o.po_number, o.po_date, o.service_type,
              c.id AS client_id, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
              COALESCE(cc_ord.name, (SELECT cc.name FROM client_contacts cc WHERE cc.client_id = c.id ORDER BY cc.created_at DESC LIMIT 1)) AS contact_name,
              COALESCE(cc_ord.phone, (SELECT cc.phone FROM client_contacts cc WHERE cc.client_id = c.id ORDER BY cc.created_at DESC LIMIT 1), c.phone) AS contact_phone,
              COALESCE(cc_ord.email, (SELECT cc.email FROM client_contacts cc WHERE cc.client_id = c.id ORDER BY cc.created_at DESC LIMIT 1), c.email) AS contact_email,
              t.id AS object_id, t.name AS object_name, t.serial_number, t.brand, t.manufacturer,
              t.capacity, t.install_location, t.next_inspection_date,
              oc.code AS category_code, oc.name AS category_name,
              b.id AS bap_id, b.bap_no, b.status AS bap_status, b.finalized_at AS bap_finalized_at,
              (b.conclusion <> 'TIDAK_MEMENUHI_SYARAT') AS bap_is_compliant,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status, l.published_at AS lhpp_published_at,
              l.recommendations AS lhpp_recommendations, l.recommended_valid_until, l.version AS lhpp_version,
              s.id AS suket_id, s.suket_no, s.valid_until AS suket_valid_until, s.status AS suket_status,
              (SELECT count(*)::int FROM inspection_findings f WHERE f.inspection_id = i.id) AS findings_count,
              (SELECT count(*)::int FROM delivery_logs d WHERE d.lhpp_id = l.id) AS deliveries_count,
              coalesce(
                (SELECT json_agg(json_build_object(
                  'id', f.id,
                  'severity', f.severity,
                  'description', f.description,
                  'recommendation', f.recommendation
                ))
                FROM inspection_findings f WHERE f.inspection_id = i.id),
                '[]'::json
              ) AS findings,
              coalesce(
                (SELECT json_agg(json_build_object(
                  'id', d.id,
                  'deliveredAt', d.delivered_at,
                  'channel', d.channel,
                  'recipientName', d.recipient_name
                ))
                FROM delivery_logs d WHERE d.lhpp_id = l.id),
                '[]'::json
              ) AS deliveries
       FROM inspections i
       JOIN users u ON u.id = i.inspector_id
       JOIN orders o ON o.id = i.order_id
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_contacts cc_ord ON cc_ord.id = o.contact_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN bap_documents b ON b.inspection_id = i.id
       LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
       LEFT JOIN suket_documents s ON s.lhpp_id = l.id
       ${whereSql}
       ORDER BY COALESCE(i.inspected_at, i.created_at) DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ items: rows, page, limit, total: countRes.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = (req.query.q || '').trim();
    const clientId = (req.query.clientId || '').trim();
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;

    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`t.id IN (
        SELECT oo.object_id FROM order_objects oo
        JOIN assignments a ON a.order_id = oo.order_id
        WHERE a.inspector_id = $${params.length} AND a.status IN ('MENUNGGU', 'DITERIMA')
      )`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(t.name) LIKE $${params.length} OR lower(t.serial_number) LIKE $${params.length} OR lower(coalesce(t.brand,'')) LIKE $${params.length})`
      );
    }
    if (clientId) {
      params.push(clientId);
      conds.push(`t.client_id = $${params.length}`);
    }
    if (categoryId) {
      params.push(categoryId);
      conds.push(`t.category_id = $${params.length}`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(`SELECT count(*)::int AS total FROM test_objects t ${whereSql}`, params);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT t.*,
              c.name AS client_name,
              oc.code AS category_code,
              oc.name AS category_name,
              cl.name AS location_name,
              (SELECT s.valid_until FROM suket_documents s WHERE s.object_id = t.id AND s.status = 'TERBIT' ORDER BY s.valid_until DESC LIMIT 1) AS active_suket_valid_until,
              (SELECT s.suket_no FROM suket_documents s WHERE s.object_id = t.id AND s.status = 'TERBIT' ORDER BY s.valid_until DESC LIMIT 1) AS active_suket_no
       FROM test_objects t
       JOIN clients c ON c.id = t.client_id
       JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN client_locations cl ON cl.id = t.location_id
       ${whereSql}
       ORDER BY t.created_at DESC
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
    const { id } = req.params;
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      const { rows: allowed } = await query(
        `SELECT 1 FROM order_objects oo
         JOIN assignments a ON a.order_id = oo.order_id
         WHERE oo.object_id = $1 AND a.inspector_id = $2 AND a.status IN ('MENUNGGU', 'DITERIMA')
         LIMIT 1`,
        [id, req.user.id]
      );
      if (!allowed[0]) {
        throw new AppError(403, 'FORBIDDEN', 'Objek uji ini tidak termasuk dalam penugasan Anda.');
      }
    }

    const { rows } = await query(
      `SELECT t.*, c.name AS client_name, oc.code AS category_code, oc.name AS category_name,
              oc.attribute_schema, cl.name AS location_name
       FROM test_objects t
       JOIN clients c ON c.id = t.client_id
       JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN client_locations cl ON cl.id = t.location_id
       WHERE t.id = $1`,
      [id]
    );
    if (!rows[0]) throw new AppError(404, 'OBJECT_NOT_FOUND', 'Objek uji tidak ditemukan.');

    // M1-06 & Bagian 9: Riwayat pemeriksaan per objek lintas PO dalam satu garis waktu
    const [history, attachments, sukets] = await Promise.all([
      query(
        `SELECT i.id AS inspection_id, i.status AS inspection_status, i.conclusion, i.conclusion_notes,
                i.inspected_at, i.submitted_at, i.revision_no AS inspection_revision_no,
                u.full_name AS inspector_name,
                o.id AS order_id, o.order_no, o.po_number, o.po_date, o.service_type,
                b.id AS bap_id, b.bap_no, b.status AS bap_status, b.finalized_at AS bap_finalized_at,
                l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status, l.published_at AS lhpp_published_at,
                l.recommendations AS lhpp_recommendations, l.recommended_valid_until, l.version AS lhpp_version,
                s.id AS suket_id, s.suket_no, s.valid_until AS suket_valid_until,
                (SELECT count(*)::int FROM inspection_findings f WHERE f.inspection_id = i.id) AS findings_count,
                (SELECT count(*)::int FROM delivery_logs d WHERE d.lhpp_id = l.id) AS deliveries_count,
                coalesce(
                  (SELECT json_agg(json_build_object(
                    'id', f.id,
                    'severity', f.severity,
                    'description', f.description,
                    'recommendation', f.recommendation
                  ))
                  FROM inspection_findings f WHERE f.inspection_id = i.id),
                  '[]'::json
                ) AS findings,
                coalesce(
                  (SELECT json_agg(json_build_object(
                    'id', d.id,
                    'deliveredAt', d.delivered_at,
                    'channel', d.channel,
                    'recipientName', d.recipient_name
                  ))
                  FROM delivery_logs d WHERE d.lhpp_id = l.id),
                  '[]'::json
                ) AS deliveries
         FROM inspections i
         JOIN users u ON u.id = i.inspector_id
         JOIN orders o ON o.id = i.order_id
         LEFT JOIN bap_documents b ON b.inspection_id = i.id
         LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
         LEFT JOIN suket_documents s ON s.lhpp_id = l.id
         WHERE i.object_id = $1
         ORDER BY i.created_at DESC`,
        [id]
      ),
      query(
        `SELECT id, original_name, mime_type, size_bytes, caption, created_at
         FROM file_attachments
         WHERE owner_type = 'OBJECT' AND owner_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        [id]
      ),
      query(
        `SELECT * FROM suket_documents WHERE object_id = $1 ORDER BY created_at DESC`,
        [id]
      )
    ]);

    return res.json({
      object: rows[0],
      history: history.rows,
      attachments: attachments.rows,
      suketDocuments: sukets.rows
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/qr', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT t.id, t.name, t.serial_number, c.name AS client_name
       FROM test_objects t JOIN clients c ON c.id = t.client_id
       WHERE t.id = $1`,
      [id]
    );
    if (!rows[0]) throw new AppError(404, 'OBJECT_NOT_FOUND', 'Objek uji tidak ditemukan.');
    const targetUrl = `${req.headers.origin || 'http://localhost:5173'}/app/objects/${id}`;
    const dataUrl = await QRCode.toDataURL(targetUrl, { width: 240, margin: 1 });
    return res.json({ qrDataUrl: dataUrl, targetUrl, object: rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(objectSchema),
  async (req, res, next) => {
    try {
      const b = req.body;
      const dupCheck = await query(
        `SELECT id FROM test_objects
         WHERE client_id = $1 AND lower(btrim(serial_number)) = lower(btrim($2))`,
        [b.clientId, b.serialNumber]
      );
      if (dupCheck.rows[0]) {
        throw new AppError(
          409,
          'DUPLICATE_SERIAL_NUMBER',
          `Objek dengan nomor seri "${b.serialNumber.trim()}" sudah terdaftar untuk klien ini.`
        );
      }

      const created = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `INSERT INTO test_objects
             (client_id, location_id, category_id, name, brand, manufacturer, model, serial_number,
              manufacture_year, capacity, capacity_unit, install_location, previous_permit_no,
              next_inspection_date, validity_notes, attributes, is_active, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
           RETURNING *`,
          [
            b.clientId,
            b.locationId || null,
            b.categoryId,
            b.name.trim(),
            b.brand || b.manufacturer || null,
            b.manufacturer || b.brand || null,
            b.model || null,
            b.serialNumber.trim(),
            b.manufactureYear || null,
            b.capacity || null,
            b.capacityUnit || null,
            b.installLocation || null,
            b.previousPermitNo || null,
            b.nextInspectionDate || null,
            b.validityNotes || null,
            b.attributes || {},
            b.isActive ?? true,
            req.user.id
          ]
        );
        await recordAudit(
          {
            userId: req.user.id,
            action: 'OBJECT_CREATE',
            entity: 'test_objects',
            entityId: rows[0].id,
            summary: { name: rows[0].name, serialNumber: rows[0].serial_number },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });
      return res.status(201).json({ object: created });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(objectSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const b = req.body;

      const dupCheck = await query(
        `SELECT id FROM test_objects
         WHERE client_id = $1 AND lower(btrim(serial_number)) = lower(btrim($2)) AND id <> $3`,
        [b.clientId, b.serialNumber, id]
      );
      if (dupCheck.rows[0]) {
        throw new AppError(
          409,
          'DUPLICATE_SERIAL_NUMBER',
          `Objek dengan nomor seri "${b.serialNumber.trim()}" sudah terdaftar untuk klien ini.`
        );
      }

      const updated = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `UPDATE test_objects
           SET client_id = $1, location_id = $2, category_id = $3, name = $4, brand = $5,
               manufacturer = $6, model = $7, serial_number = $8, manufacture_year = $9, capacity = $10,
               capacity_unit = $11, install_location = $12, previous_permit_no = $13,
               next_inspection_date = $14, validity_notes = $15, attributes = $16,
               is_active = $17, updated_at = now()
           WHERE id = $18
           RETURNING *`,
          [
            b.clientId,
            b.locationId || null,
            b.categoryId,
            b.name.trim(),
            b.brand || b.manufacturer || null,
            b.manufacturer || b.brand || null,
            b.model || null,
            b.serialNumber.trim(),
            b.manufactureYear || null,
            b.capacity || null,
            b.capacityUnit || null,
            b.installLocation || null,
            b.previousPermitNo || null,
            b.nextInspectionDate || null,
            b.validityNotes || null,
            b.attributes || {},
            b.isActive ?? true,
            id
          ]
        );
        if (!rows[0]) throw new AppError(404, 'OBJECT_NOT_FOUND', 'Objek uji tidak ditemukan.');
        await recordAudit(
          {
            userId: req.user.id,
            action: 'OBJECT_UPDATE',
            entity: 'test_objects',
            entityId: id,
            summary: { name: rows[0].name, serialNumber: rows[0].serial_number },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });
      return res.json({ object: updated });
    } catch (err) {
      return next(err);
    }
  }
);

// M1-09: Impor CSV dengan validasi per baris
router.post(
  '/import-csv',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(csvImportSchema),
  async (req, res, next) => {
    try {
      const { clientId, csvText } = req.body;
      const { rows: cats } = await query('SELECT id, code FROM object_categories');
      const catByCode = Object.fromEntries(cats.map((c) => [c.code.toUpperCase(), c.id]));

      const lines = csvText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2) {
        throw new AppError(400, 'EMPTY_CSV', 'Berkas CSV harus memuat baris header dan minimal 1 baris data.');
      }

      const errors = [];
      const validRows = [];
      for (let i = 1; i < lines.length; i += 1) {
        const cols = lines[i].split(',').map((c) => c.trim());
        const [categoryCode, name, brand, model, serialNumber, manufactureYear, capacity, installLocation] = cols;
        const categoryId = catByCode[(categoryCode || '').toUpperCase()];
        if (!categoryId) {
          errors.push({ row: i + 1, message: `Kode kategori "${categoryCode}" tidak dikenal.` });
          continue;
        }
        if (!name || !serialNumber) {
          errors.push({ row: i + 1, message: 'Nama objek dan nomor seri wajib diisi.' });
          continue;
        }
        validRows.push({
          rowNo: i + 1,
          categoryId,
          name,
          brand: brand || null,
          model: model || null,
          serialNumber,
          manufactureYear: manufactureYear ? Number(manufactureYear) : null,
          capacity: capacity || null,
          installLocation: installLocation || null
        });
      }

      if (errors.length) {
        return res.status(400).json({
          error: {
            code: 'CSV_VALIDATION_FAILED',
            message: `Terdapat ${errors.length} baris tidak valid.`,
            details: errors
          }
        });
      }

      const inserted = await withTransaction(async (db) => {
        const out = [];
        for (const r of validRows) {
          const { rows } = await db.query(
            `INSERT INTO test_objects
               (client_id, category_id, name, brand, model, serial_number, manufacture_year, capacity, install_location, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
             RETURNING *`,
            [
              clientId,
              r.categoryId,
              r.name,
              r.brand,
              r.model,
              r.serialNumber,
              r.manufactureYear,
              r.capacity,
              r.installLocation,
              req.user.id
            ]
          );
          out.push(rows[0]);
        }
        await recordAudit(
          {
            userId: req.user.id,
            action: 'OBJECT_IMPORT_CSV',
            entity: 'test_objects',
            entityId: clientId,
            summary: { importedCount: out.length },
            ip: req.ip
          },
          db
        );
        return out;
      });

      return res.status(201).json({ imported: inserted.length, items: inserted });
    } catch (err) {
      return next(err);
    }
  }
);

// M1-10: Lampiran dokumen objek
router.post(
  '/:id/attachments',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError(400, 'NO_FILE', 'Berkas wajib dipilih.');
      const saved = await saveUploadedFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerType: 'OBJECT',
        ownerId: id,
        caption: req.body.caption || null,
        uploadedBy: req.user.id
      });
      return res.status(201).json({ attachment: saved });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

