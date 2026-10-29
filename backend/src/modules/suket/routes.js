import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate, authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN'));

const createSuketSchema = Joi.object({
  objectId: Joi.string().uuid().required(),
  lhppId: Joi.string().uuid().allow('', null),
  suketNo: Joi.string().max(120).allow('', null),
  status: Joi.string()
    .valid('BERKAS_DISIAPKAN', 'DIAJUKAN', 'DALAM_PROSES', 'TERBIT', 'PERLU_PERBAIKAN')
    .default('BERKAS_DISIAPKAN'),
  submittedDate: Joi.date().iso().allow('', null),
  issuedDate: Joi.date().iso().allow('', null),
  validUntil: Joi.date().iso().when('status', {
    is: 'TERBIT',
    then: Joi.date().iso().required(),
    otherwise: Joi.date().iso().allow('', null)
  }),
  issuer: Joi.string().max(180).default('Dinas Tenaga Kerja / Instansi Berwenang'),
  statusNotes: Joi.string().max(1000).allow('', null)
});

const updateSuketSchema = Joi.object({
  suketNo: Joi.string().max(120).allow('', null),
  status: Joi.string().valid(
    'BERKAS_DISIAPKAN',
    'DIAJUKAN',
    'DALAM_PROSES',
    'TERBIT',
    'PERLU_PERBAIKAN'
  ),
  submittedDate: Joi.date().iso().allow('', null),
  issuedDate: Joi.date().iso().allow('', null),
  validUntil: Joi.date().iso().allow('', null),
  issuer: Joi.string().max(180),
  statusNotes: Joi.string().max(1000).allow('', null)
}).min(1);

const followupSchema = Joi.object({
  status: Joi.string()
    .valid('BELUM_DIHUBUNGI', 'SUDAH_DIHUBUNGI', 'SETUJU_PERPANJANG', 'MENOLAK', 'TERJADWAL')
    .required(),
  note: Joi.string().min(3).max(1500).required(),
  contactPic: Joi.string().max(120).allow('', null)
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = (req.query.status || '').trim();
    const search = (req.query.q || '').trim();

    const conds = [];
    const params = [];

    if (status) {
      params.push(status);
      conds.push(`s.status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(coalesce(s.suket_no,'')) LIKE $${params.length} OR lower(t.name) LIKE $${params.length} OR lower(c.name) LIKE $${params.length})`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM suket_documents s
       JOIN test_objects t ON t.id = s.object_id
       JOIN clients c ON c.id = t.client_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT s.*,
              t.name AS object_name, t.serial_number,
              oc.code AS category_code, oc.name AS category_name,
              c.id AS client_id, c.name AS client_name,
              l.lhpp_no,
              CASE WHEN s.valid_until IS NOT NULL THEN (s.valid_until - CURRENT_DATE) ELSE NULL END AS days_remaining
       FROM suket_documents s
       JOIN test_objects t ON t.id = s.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN clients c ON c.id = t.client_id
       LEFT JOIN lhpp_documents l ON l.id = s.lhpp_id
       ${whereSql}
       ORDER BY COALESCE(s.valid_until, '2099-12-31'::date) ASC, s.created_at DESC
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
    const { rows } = await query(
      `SELECT s.*, t.name AS object_name, t.serial_number, t.client_id,
              oc.code AS category_code, oc.name AS category_name,
              c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
              l.lhpp_no,
              CASE WHEN s.valid_until IS NOT NULL THEN (s.valid_until - CURRENT_DATE) ELSE NULL END AS days_remaining
       FROM suket_documents s
       JOIN test_objects t ON t.id = s.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN clients c ON c.id = t.client_id
       LEFT JOIN lhpp_documents l ON l.id = s.lhpp_id
       WHERE s.id = $1`,
      [id]
    );
    if (!rows[0]) throw new AppError(404, 'SUKET_NOT_FOUND', 'Data Suket K3 tidak ditemukan.');

    const followups = await query(
      `SELECT rf.*, u.full_name AS recorded_by_name
       FROM renewal_followups rf
       LEFT JOIN users u ON u.id = rf.recorded_by
       WHERE rf.suket_id = $1
       ORDER BY rf.created_at DESC`,
      [id]
    );

    return res.json({ suket: rows[0], followups: followups.rows });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(createSuketSchema),
  async (req, res, next) => {
    try {
      const b = req.body;
      if (b.status === 'TERBIT' && !b.suketNo) {
        throw new AppError(400, 'SUKET_NO_REQUIRED', 'Nomor Suket K3 wajib diisi saat status Terbit.');
      }

      const created = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `INSERT INTO suket_documents
             (object_id, lhpp_id, suket_no, status, submitted_date, issued_date, valid_until, issuer, status_notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
           RETURNING *`,
          [
            b.objectId,
            b.lhppId || null,
            b.suketNo ? b.suketNo.trim() : null,
            b.status,
            b.submittedDate || null,
            b.issuedDate || null,
            b.validUntil || null,
            b.issuer,
            b.statusNotes || null,
            req.user.id
          ]
        );
        await recordAudit(
          {
            userId: req.user.id,
            action: 'SUKET_CREATE',
            entity: 'suket_documents',
            entityId: rows[0].id,
            summary: { suketNo: rows[0].suket_no, status: rows[0].status, validUntil: rows[0].valid_until },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.status(201).json({ suket: created });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(updateSuketSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const b = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows: curRows } = await db.query('SELECT * FROM suket_documents WHERE id = $1', [id]);
        const cur = curRows[0];
        if (!cur) throw new AppError(404, 'SUKET_NOT_FOUND', 'Data Suket K3 tidak ditemukan.');

        const nextStatus = b.status ?? cur.status;
        const nextSuketNo = b.suketNo !== undefined ? (b.suketNo ? b.suketNo.trim() : null) : cur.suket_no;
        const nextValidUntil = b.validUntil !== undefined ? b.validUntil || null : cur.valid_until;

        if (nextStatus === 'TERBIT' && (!nextSuketNo || !nextValidUntil)) {
          throw new AppError(
            400,
            'SUKET_TERBIT_INCOMPLETE',
            'Nomor Suket dan Tanggal Masa Berlaku wajib diisi untuk status Terbit.'
          );
        }

        const { rows } = await db.query(
          `UPDATE suket_documents
           SET suket_no = $1, status = $2, submitted_date = $3, issued_date = $4,
               valid_until = $5, issuer = $6, status_notes = $7, updated_at = now()
           WHERE id = $8
           RETURNING *`,
          [
            nextSuketNo,
            nextStatus,
            b.submittedDate !== undefined ? b.submittedDate || null : cur.submitted_date,
            b.issuedDate !== undefined ? b.issuedDate || null : cur.issued_date,
            nextValidUntil,
            b.issuer ?? cur.issuer,
            b.statusNotes !== undefined ? b.statusNotes || null : cur.status_notes,
            id
          ]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'SUKET_UPDATE',
            entity: 'suket_documents',
            entityId: id,
            summary: { status: nextStatus, suketNo: nextSuketNo, validUntil: nextValidUntil },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.json({ suket: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/scan',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError(400, 'NO_FILE', 'Berkas pindaian Suket wajib dipilih.');
      const saved = await saveUploadedFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerType: 'SUKET',
        ownerId: id,
        caption: 'Berkas Pindaian Suket K3',
        uploadedBy: req.user.id
      });
      await query('UPDATE suket_documents SET scan_file_id = $1, updated_at = now() WHERE id = $2', [
        saved.id,
        id
      ]);
      return res.status(201).json({ file: saved });
    } catch (err) {
      return next(err);
    }
  }
);

// M5-06: Catat status tindak lanjut perpanjangan oleh Admin
router.post(
  '/:id/followups',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(followupSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, note, contactPic } = req.body;

      const created = await withTransaction(async (db) => {
        const { rows: s } = await db.query('SELECT id FROM suket_documents WHERE id = $1', [id]);
        if (!s[0]) throw new AppError(404, 'SUKET_NOT_FOUND', 'Suket K3 tidak ditemukan.');

        const { rows } = await db.query(
          `INSERT INTO renewal_followups (suket_id, status, note, contact_pic, recorded_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [id, status, note.trim(), contactPic || null, req.user.id]
        );
        await db.query(
          'UPDATE suket_documents SET followup_status = $1, updated_at = now() WHERE id = $2',
          [status, id]
        );
        await recordAudit(
          {
            userId: req.user.id,
            action: 'SUKET_FOLLOWUP_RECORD',
            entity: 'renewal_followups',
            entityId: rows[0].id,
            summary: { suketId: id, status },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.status(201).json({ followup: created });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

