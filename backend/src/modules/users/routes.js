import bcrypt from 'bcryptjs';
import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();

router.use(authenticate, authorize('ADMIN_SISTEM'));

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  fullName: Joi.string().min(2).max(120).required(),
  role: Joi.string()
    .valid('ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN')
    .required(),
  phone: Joi.string().allow('', null),
  password: Joi.string().min(8).max(128).required(),
  employeeNo: Joi.string().allow('', null)
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(120),
  role: Joi.string().valid('ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN'),
  phone: Joi.string().allow('', null),
  isActive: Joi.boolean(),
  password: Joi.string().min(8).max(128)
}).min(1);

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = (req.query.q || '').trim();
    const role = (req.query.role || '').trim();

    const conds = [];
    const params = [];
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(`(lower(full_name) LIKE $${params.length} OR lower(email::text) LIKE $${params.length})`);
    }
    if (role) {
      params.push(role);
      conds.push(`role = $${params.length}`);
    }
    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*)::int AS total FROM users ${whereSql}`, params);
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT id, email, full_name AS "fullName", role, phone, is_active AS "isActive",
              last_login_at AS "lastLoginAt", created_at AS "createdAt"
       FROM users
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      items: rows,
      page,
      limit,
      total: countRes.rows[0].total
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/', validate(createUserSchema), async (req, res, next) => {
  try {
    const { email, fullName, role, phone, password, employeeNo } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    const created = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (email, full_name, role, phone, password_hash)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, full_name AS "fullName", role, phone, is_active AS "isActive", created_at AS "createdAt"`,
        [email.trim(), fullName.trim(), role, phone || null, passwordHash]
      );
      const user = rows[0];
      if (role === 'AHLI_K3') {
        await client.query(
          `INSERT INTO inspectors (user_id, employee_no)
           VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
          [user.id, employeeNo || null]
        );
      }
      await recordAudit(
        {
          userId: req.user.id,
          action: 'USER_CREATE',
          entity: 'users',
          entityId: user.id,
          summary: { email: user.email, role: user.role },
          ip: req.ip
        },
        client
      );
      return user;
    });

    return res.status(201).json({ user: created });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', validate(updateUserSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, role, phone, isActive, password } = req.body;

    if (id === req.user.id && isActive === false) {
      throw new AppError(400, 'SELF_DEACTIVATE', 'Anda tidak dapat menonaktifkan akun sendiri.');
    }

    const updated = await withTransaction(async (client) => {
      const { rows: existingRows } = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (!existingRows[0]) {
        throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
      }
      const cur = existingRows[0];
      const nextHash = password ? await bcrypt.hash(password, 10) : cur.password_hash;
      const nextRole = role ?? cur.role;
      const nextActive = isActive ?? cur.is_active;

      const { rows } = await client.query(
        `UPDATE users
         SET full_name = $1, role = $2, phone = $3, is_active = $4, password_hash = $5, updated_at = now()
         WHERE id = $6
         RETURNING id, email, full_name AS "fullName", role, phone, is_active AS "isActive", updated_at AS "updatedAt"`,
        [
          fullName ?? cur.full_name,
          nextRole,
          phone !== undefined ? phone || null : cur.phone,
          nextActive,
          nextHash,
          id
        ]
      );

      if (nextRole === 'AHLI_K3') {
        await client.query(
          'INSERT INTO inspectors (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
          [id]
        );
      }
      if (!nextActive) {
        await client.query(
          'UPDATE refresh_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
          [id]
        );
      }

      await recordAudit(
        {
          userId: req.user.id,
          action: 'USER_UPDATE',
          entity: 'users',
          entityId: id,
          summary: { role: nextRole, isActive: nextActive },
          ip: req.ip
        },
        client
      );
      return rows[0];
    });

    return res.json({ user: updated });
  } catch (err) {
    return next(err);
  }
});

export default router;

