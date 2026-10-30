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
});

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
              (ic.valid_until >= CURRENT_DATE) AS "isValid"
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
          "SELECT id FROM users WHERE id = $1 AND role IN ('AHLI_K3', 'INSPECTOR')",
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
            summary: { inspectorId, categoryId, certificateNo },
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

router.delete(
  '/:inspectorId/competencies/:compId',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  async (req, res, next) => {
    try {
      const { inspectorId, compId } = req.params;
      const { rowCount } = await query(
        'DELETE FROM inspector_competencies WHERE id = $1 AND inspector_id = $2',
        [compId, inspectorId]
      );
      if (!rowCount) throw new AppError(404, 'NOT_FOUND', 'Data kompetensi tidak ditemukan.');
      return res.json({ message: 'Kompetensi dihapus.' });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

