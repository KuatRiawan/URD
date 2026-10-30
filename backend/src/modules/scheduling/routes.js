import { Router } from 'express';
import Joi from 'joi';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

// Cek potensi konflik jadwal untuk Ahli K3 sebelum penugasan/penjadwalan disubmit
router.get('/conflicts', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN'), async (req, res, next) => {
  try {
    const schema = Joi.object({
      inspectorId: Joi.string().uuid().required(),
      startAt: Joi.date().iso().required(),
      endAt: Joi.date().iso().greater(Joi.ref('startAt')).required(),
      excludeOrderId: Joi.string().uuid().allow('', null)
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
      throw new AppError(400, 'VALIDATION_ERROR', error.details[0].message);
    }

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && value.inspectorId !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat memeriksa konflik jadwal milik sendiri.');
    }

    const { rows: conflicts } = await query(
      `SELECT o.id AS order_id, o.order_no, o.po_number,
              c.name AS client_name,
              s.start_at, s.end_at,
              u.full_name AS inspector_name
       FROM assignments a
       JOIN orders o ON o.id = a.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN schedules s ON s.order_id = o.id
       JOIN users u ON u.id = a.inspector_id
       WHERE a.inspector_id = $1
         AND ($2::uuid IS NULL OR a.order_id <> $2::uuid)
         AND a.status IN ('MENUNGGU', 'DITERIMA')
         AND o.status NOT IN ('SELESAI', 'DIBATALKAN')
         AND tstzrange(s.start_at, s.end_at) && tstzrange($3::timestamptz, $4::timestamptz)`,
      [value.inspectorId, value.excludeOrderId || null, value.startAt, value.endAt]
    );

    return res.json({
      hasConflict: conflicts.length > 0,
      conflicts
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from).toISOString() : null;
    const to = req.query.to ? new Date(req.query.to).toISOString() : null;

    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`o.id IN (SELECT order_id FROM assignments WHERE inspector_id = $${params.length})`);
    }
    if (from) {
      params.push(from);
      conds.push(`s.end_at >= $${params.length}::timestamptz`);
    }
    if (to) {
      params.push(to);
      conds.push(`s.start_at <= $${params.length}::timestamptz`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT s.*, o.order_no, o.status AS order_status, o.service_type,
              c.name AS client_name,
              cl.name AS location_name, cl.city AS location_city,
              coalesce(
                (SELECT json_agg(json_build_object(
                  'id', a.id,
                  'inspectorId', a.inspector_id,
                  'fullName', u.full_name,
                  'status', a.status
                ))
                FROM assignments a JOIN users u ON u.id = a.inspector_id
                WHERE a.order_id = o.id AND a.status IN ('MENUNGGU','DITERIMA')),
                '[]'::json
              ) AS assignments
       FROM schedules s
       JOIN orders o ON o.id = s.order_id
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_locations cl ON cl.id = o.location_id
       ${whereSql}
       ORDER BY s.start_at ASC`,
      params
    );

    return res.json({ items: rows });
  } catch (err) {
    return next(err);
  }
});

export default router;
