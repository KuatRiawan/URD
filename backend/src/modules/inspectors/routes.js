import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const competencySchema = Joi.object({
  categoryId: Joi.number().integer().min(1).max(7).required(),
  certificateNo: Joi.string().min(2).max(120).required(),
  validFrom: Joi.date().iso().allow(null),
  validUntil: Joi.date().iso().required()
}).custom((value, helpers) => {
  if (value.validFrom && new Date(value.validFrom) > new Date(value.validUntil)) {
    return helpers.error('date.invalid');
  }
  return value;
}).messages({
  'date.invalid': 'Tanggal mulai kompetensi tidak boleh setelah tanggal berakhir.'
});

const updateCompetencySchema = Joi.object({
  categoryId: Joi.number().integer().min(1).max(7),
  certificateNo: Joi.string().min(2).max(120),
  validFrom: Joi.date().iso().allow(null, ''),
  validUntil: Joi.date().iso()
})
  .min(1)
  .custom((value, helpers) => {
    if (value.validFrom && value.validUntil && new Date(value.validFrom) > new Date(value.validUntil)) {
      return helpers.error('date.invalid');
    }
    return value;
  })
  .messages({
    'date.invalid': 'Tanggal mulai kompetensi tidak boleh setelah tanggal berakhir.'
  });

const updateProfileSchema = Joi.object({
  employeeNo: Joi.string().max(100).allow('', null),
  notes: Joi.string().max(500).allow('', null)
}).min(1);

router.get('/', async (_req, res, next) => {
  try {
    const { rows: inspectors } = await query(
      `SELECT u.id, u.full_name AS "fullName", u.email, u.phone, u.is_active AS "isActive",
              i.employee_no AS "employeeNo", i.notes
       FROM users u
       LEFT JOIN inspectors i ON i.user_id = u.id
       WHERE u.role IN ('AHLI_K3', 'INSPECTOR')
       ORDER BY u.full_name ASC`
    );

    const { rows: competencies } = await query(
      `SELECT ic.id, ic.inspector_id AS "inspectorId", ic.category_id AS "categoryId",
              oc.code AS "categoryCode", oc.name AS "categoryName",
              ic.certificate_no AS "certificateNo", ic.valid_from AS "validFrom", ic.valid_until AS "validUntil",
              (ic.valid_until >= CURRENT_DATE) AS "isValid",
              (ic.valid_until - CURRENT_DATE)::int AS "daysRemaining",
              CASE
                WHEN ic.valid_until < CURRENT_DATE THEN 'KEDALUWARSA'
                WHEN (ic.valid_until - CURRENT_DATE) <= 30 THEN 'AKAN_HABIS'
                ELSE 'AKTIF'
              END AS "validityStatus"
       FROM inspector_competencies ic
       JOIN object_categories oc ON oc.id = ic.category_id
       ORDER BY ic.valid_until ASC`
    );

    const byInspector = {};
    for (const c of competencies) {
      if (!byInspector[c.inspectorId]) byInspector[c.inspectorId] = [];
      byInspector[c.inspectorId].push(c);
    }

    const items = inspectors.map((ins) => ({
      ...ins,
      competencies: byInspector[ins.id] || []
    }));

    return res.json({ items });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:inspectorId',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(updateProfileSchema),
  async (req, res, next) => {
    try {
      const { inspectorId } = req.params;
      const { employeeNo, notes } = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows: u } = await db.query(
          "SELECT id, full_name FROM users WHERE id = $1 AND role IN ('AHLI_K3', 'INSPECTOR')",
          [inspectorId]
        );
        if (!u[0]) throw new AppError(404, 'INSPECTOR_NOT_FOUND', 'Ahli K3 tidak ditemukan.');

        const { rows } = await db.query(
          `INSERT INTO inspectors (user_id, employee_no, notes)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id)
           DO UPDATE SET
             employee_no = CASE WHEN $4::boolean THEN $2 ELSE inspectors.employee_no END,
             notes = CASE WHEN $5::boolean THEN $3 ELSE inspectors.notes END
           RETURNING *`,
          [
            inspectorId,
            employeeNo !== undefined ? (employeeNo ? employeeNo.trim() : null) : null,
            notes !== undefined ? (notes ? notes.trim() : null) : null,
            employeeNo !== undefined,
            notes !== undefined
          ]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'INSPECTOR_PROFILE_UPDATE',
            entity: 'inspectors',
            entityId: inspectorId,
            summary: {
              inspectorName: u[0].full_name,
              employeeNo: rows[0].employee_no,
              notes: rows[0].notes
            },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.json({ inspector: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:inspectorId/competencies',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(competencySchema),
  async (req, res, next) => {
    try {
      const { inspectorId } = req.params;
      const { categoryId, certificateNo, validFrom, validUntil } = req.body;

      const created = await withTransaction(async (db) => {
        const { rows: u } = await db.query(
          "SELECT id, full_name FROM users WHERE id = $1 AND role IN ('AHLI_K3', 'INSPECTOR')",
          [inspectorId]
        );
        if (!u[0]) throw new AppError(404, 'INSPECTOR_NOT_FOUND', 'Ahli K3 tidak ditemukan.');

        await db.query(
          'INSERT INTO inspectors (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
          [inspectorId]
        );

        const { rows } = await db.query(
          `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [inspectorId, categoryId, certificateNo.trim(), validFrom || null, validUntil]
        );
        await recordAudit(
          {
            userId: req.user.id,
            action: 'INSPECTOR_COMPETENCY_ADD',
            entity: 'inspector_competencies',
            entityId: rows[0].id,
            summary: {
              inspectorId,
              inspectorName: u[0].full_name,
              categoryId,
              certificateNo: certificateNo.trim(),
              validUntil
            },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.status(201).json({ competency: created });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:inspectorId/competencies/:compId',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(updateCompetencySchema),
  async (req, res, next) => {
    try {
      const { inspectorId, compId } = req.params;
      const { categoryId, certificateNo, validFrom, validUntil } = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows: existing } = await db.query(
          'SELECT * FROM inspector_competencies WHERE id = $1 AND inspector_id = $2',
          [compId, inspectorId]
        );
        if (!existing[0]) {
          throw new AppError(404, 'NOT_FOUND', 'Data kompetensi SKP tidak ditemukan.');
        }
        const cur = existing[0];
        const nextValidFrom = validFrom !== undefined ? (validFrom || null) : cur.valid_from;
        const nextValidUntil = validUntil !== undefined ? validUntil : cur.valid_until;

        if (nextValidFrom && new Date(nextValidFrom) > new Date(nextValidUntil)) {
          throw new AppError(400, 'INVALID_DATE_RANGE', 'Tanggal mulai kompetensi tidak boleh setelah tanggal berakhir.');
        }

        const { rows } = await db.query(
          `UPDATE inspector_competencies
           SET category_id = $1, certificate_no = $2, valid_from = $3, valid_until = $4
           WHERE id = $5 AND inspector_id = $6
           RETURNING *`,
          [
            categoryId ?? cur.category_id,
            certificateNo !== undefined ? certificateNo.trim() : cur.certificate_no,
            nextValidFrom,
            nextValidUntil,
            compId,
            inspectorId
          ]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'INSPECTOR_COMPETENCY_UPDATE',
            entity: 'inspector_competencies',
            entityId: compId,
            summary: {
              inspectorId,
              categoryId: rows[0].category_id,
              certificateNo: rows[0].certificate_no,
              validUntil: rows[0].valid_until
            },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.json({ competency: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  '/:inspectorId/competencies/:compId',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  async (req, res, next) => {
    try {
      const { inspectorId, compId } = req.params;
      await withTransaction(async (db) => {
        const { rows } = await db.query(
          'DELETE FROM inspector_competencies WHERE id = $1 AND inspector_id = $2 RETURNING *',
          [compId, inspectorId]
        );
        if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Data kompetensi tidak ditemukan.');

        await recordAudit(
          {
            userId: req.user.id,
            action: 'INSPECTOR_COMPETENCY_DELETE',
            entity: 'inspector_competencies',
            entityId: compId,
            summary: {
              inspectorId,
              categoryId: rows[0].category_id,
              certificateNo: rows[0].certificate_no
            },
            ip: req.ip
          },
          db
        );
      });
      return res.json({ message: 'Kompetensi dihapus.' });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
