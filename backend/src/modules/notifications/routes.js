import { Router } from 'express';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query, 25, 100);
    const [countRes, unreadRes, listRes] = await Promise.all([
      query('SELECT count(*)::int AS total FROM notifications WHERE user_id = $1', [req.user.id]),
      query(
        'SELECT count(*)::int AS unread FROM notifications WHERE user_id = $1 AND read_at IS NULL',
        [req.user.id]
      ),
      query(
        `SELECT * FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      )
    ]);

    return res.json({
      items: listRes.rows,
      unreadCount: unreadRes.rows[0].unread,
      page,
      limit,
      total: countRes.rows[0].total
    });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE notifications
       SET read_at = COALESCE(read_at, now())
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    return res.json({ notification: rows[0] || null });
  } catch (err) {
    return next(err);
  }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL',
      [req.user.id]
    );
    return res.json({ message: 'Seluruh notifikasi ditandai telah dibaca.' });
  } catch (err) {
    return next(err);
  }
});

export default router;

