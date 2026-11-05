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
    .valid('ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN')
    .required(),
  phone: Joi.string().allow('', null),
  password: Joi.string().min(8).max(128).required(),
  employeeNo: Joi.string().max(100).allow('', null)
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(120),
  role: Joi.string().valid('ADMIN_SISTEM', 'MARKETING', 'INSPECTOR', 'PIMPINAN', 'ADMIN_KANTOR', 'AHLI_K3'),
  phone: Joi.string().allow('', null),
  employeeNo: Joi.string().max(100).allow('', null),
  isActive: Joi.boolean(),
  password: Joi.string().min(8).max(128)
}).min(1);

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = (req.query.q || '').trim();
    const role = (req.query.role || '').trim();
    const status = (req.query.status || '').trim().toUpperCase();

    const conds = [];
    const params = [];
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(`(lower(u.full_name) LIKE $${params.length} OR lower(u.email::text) LIKE $${params.length} OR lower(COALESCE(i.employee_no, '')) LIKE $${params.length})`);
    }
    if (role) {
      if (role === 'AHLI_K3' || role === 'INSPECTOR') {
        conds.push(`u.role IN ('AHLI_K3', 'INSPECTOR')`);
      } else {
        params.push(role);
        conds.push(`u.role = $${params.length}`);
      }
    }
    if (status === 'ACTIVE') {
      conds.push(`u.is_active = true`);
    } else if (status === 'INACTIVE') {
      conds.push(`u.is_active = false`);
    }
    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT count(*)::int AS total FROM users u LEFT JOIN inspectors i ON i.user_id = u.id ${whereSql}`,
      params
    );
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT u.id, u.email, u.full_name AS "fullName", u.role, u.phone, u.is_active AS "isActive",
              u.avatar_url AS "avatarUrl",
              i.employee_no AS "employeeNo",
              (SELECT count(*)::int FROM inspector_competencies ic WHERE ic.inspector_id = u.id) AS "skpCount",
              (SELECT count(*)::int FROM inspector_competencies ic WHERE ic.inspector_id = u.id AND ic.valid_until < CURRENT_DATE) AS "expiredSkpCount",
              u.last_login_at AS "lastLoginAt", u.created_at AS "createdAt"
       FROM users u
       LEFT JOIN inspectors i ON i.user_id = u.id
       ${whereSql}
       ORDER BY u.created_at DESC
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

router.get('/:id/activity', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.summary, a.ip AS ip_address, a.created_at,
              u.full_name AS user_name, u.role AS user_role
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1::uuid OR (a.entity = 'users' AND a.entity_id = $1::text)
       ORDER BY a.created_at DESC
       LIMIT 15`,
      [id]
    );
    return res.json({ items: rows });
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
      if (['AHLI_K3', 'INSPECTOR'].includes(role)) {
        await client.query(
          `INSERT INTO inspectors (user_id, employee_no)
           VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET employee_no = COALESCE(EXCLUDED.employee_no, inspectors.employee_no)`,
          [user.id, employeeNo ? employeeNo.trim() : null]
        );
        user.employeeNo = employeeNo ? employeeNo.trim() : null;
      }
      await recordAudit(
        {
          userId: req.user.id,
          action: 'USER_CREATE',
          entity: 'users',
          entityId: user.id,
          summary: {
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            employeeNo: user.employeeNo || null
          },
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
    const { fullName, role, phone, employeeNo, isActive, password } = req.body;

    if (id === req.user.id && isActive === false) {
      throw new AppError(400, 'SELF_DEACTIVATE', 'Anda tidak dapat menonaktifkan akun sendiri.');
    }
    if (id === req.user.id && role && role !== req.user.role) {
      throw new AppError(400, 'SELF_ROLE_DEMOTE', 'Anda tidak dapat menurunkan peran Super Admin milik akun sendiri.');
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
          fullName ? fullName.trim() : cur.full_name,
          nextRole,
          phone !== undefined ? phone || null : cur.phone,
          nextActive,
          nextHash,
          id
        ]
      );

      let savedEmployeeNo = null;
      if (['AHLI_K3', 'INSPECTOR'].includes(nextRole) || employeeNo !== undefined) {
        const empNoVal = employeeNo !== undefined ? (employeeNo ? employeeNo.trim() : null) : null;
        const { rows: insRows } = await client.query(
          `INSERT INTO inspectors (user_id, employee_no)
           VALUES ($1, $2)
           ON CONFLICT (user_id)
           DO UPDATE SET
             employee_no = CASE WHEN $3::boolean THEN $2 ELSE inspectors.employee_no END
           RETURNING employee_no`,
          [id, empNoVal, employeeNo !== undefined]
        );
        savedEmployeeNo = insRows[0]?.employee_no || null;
      }
      if (!nextActive) {
        await client.query(
          'UPDATE refresh_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
          [id]
        );
      }

      const actionType =
        isActive !== undefined && isActive !== cur.is_active
          ? isActive
            ? 'USER_ACTIVATE'
            : 'USER_DEACTIVATE'
          : role && role !== cur.role
            ? 'USER_ROLE_CHANGE'
            : password
              ? 'USER_PASSWORD_RESET'
              : 'USER_UPDATE';

      await recordAudit(
        {
          userId: req.user.id,
          action: actionType,
          entity: 'users',
          entityId: id,
          summary: {
            email: cur.email,
            fullName: rows[0].fullName,
            previousRole: cur.role,
            role: nextRole,
            previousActive: cur.is_active,
            isActive: nextActive,
            passwordReset: Boolean(password),
            employeeNo: savedEmployeeNo
          },
          ip: req.ip
        },
        client
      );
      return { ...rows[0], employeeNo: savedEmployeeNo };
    });

    return res.json({ user: updated });
  } catch (err) {
    return next(err);
  }
});

export default router;
