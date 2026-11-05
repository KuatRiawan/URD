import { Router } from 'express';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate, authorize('ADMIN_SISTEM', 'PIMPINAN'));

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 50, 200);
    const action = (req.query.action || '').trim();
    const entity = (req.query.entity || '').trim();
    const search = (req.query.q || '').trim();
    const userId = (req.query.userId || '').trim();
    const fromDate = (req.query.from || '').trim();
    const toDate = (req.query.to || '').trim();

    const conds = [];
    const params = [];

    if (action) {
      params.push(`%${action}%`);
      conds.push(`a.action ILIKE $${params.length}`);
    }
    if (entity) {
      params.push(entity);
      conds.push(`a.entity = $${params.length}`);
    }
    if (userId) {
      params.push(userId);
      conds.push(`a.user_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(a.action) LIKE $${params.length} OR lower(a.entity) LIKE $${params.length} OR lower(COALESCE(a.entity_id, '')) LIKE $${params.length} OR lower(COALESCE(u.full_name, '')) LIKE $${params.length} OR lower(COALESCE(u.email::text, '')) LIKE $${params.length} OR lower(COALESCE(a.summary::text, '')) LIKE $${params.length})`
      );
    }
    if (fromDate) {
      params.push(fromDate);
      conds.push(`a.created_at >= $${params.length}::timestamptz`);
    }
    if (toDate) {
      params.push(toDate);
      conds.push(`a.created_at <= ($${params.length}::date + interval '1 day')`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT a.*, a.ip AS ip_address, u.full_name AS user_name, u.email AS user_email, u.role AS user_role
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

