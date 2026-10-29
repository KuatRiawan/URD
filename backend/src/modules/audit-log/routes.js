import { Router } from 'express';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate, authorize('ADMIN_SISTEM', 'PIMPINAN'));

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 30, 100);
    const action = (req.query.action || '').trim();
    const entity = (req.query.entity || '').trim();

    const conds = [];
    const params = [];

    if (action) {
      params.push(action);
      conds.push(`a.action = $${params.length}`);
    }
    if (entity) {
      params.push(entity);
      conds.push(`a.entity = $${params.length}`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(`SELECT count(*)::int AS total FROM audit_logs a ${whereSql}`, params);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT a.*, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ items: rows, page, limit, total: countRes.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

export default router;

