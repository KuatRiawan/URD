import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { AppError } from '../../utils/http.js';

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Format email tidak valid.',
    'any.required': 'Email wajib diisi.'
  }),
  password: Joi.string().min(6).max(128).required().messages({
    'any.required': 'Kata sandi wajib diisi.'
  })
});

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.jwtSecret,
    { expiresIn: env.jwtAccessTtl }
  );
}

function setAuthCookies(res, accessToken, refreshToken) {
  const common = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/'
  };
  res.cookie('urd_access', accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000
  });
  res.cookie('urd_refresh', refreshToken, {
    ...common,
    maxAge: env.refreshSessionDays * 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res) {
  res.clearCookie('urd_access', { path: '/' });
  res.clearCookie('urd_refresh', { path: '/' });
}

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query(
      `SELECT id, email, full_name, role, phone, password_hash, is_active
       FROM users WHERE email = $1`,
      [email.trim()]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi tidak sesuai.');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau kata sandi tidak sesuai.');
    }

    const rawRefresh = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(rawRefresh);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + env.refreshSessionDays * 86400 * 1000);

    await withTransaction(async (client) => {
      await client.query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
      await client.query(
        `INSERT INTO refresh_sessions (user_id, family_id, token_hash, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.id, familyId, tokenHash, expiresAt, req.headers['user-agent'] || null, req.ip]
      );
      await recordAudit(
        {
          userId: user.id,
          action: 'AUTH_LOGIN',
          entity: 'users',
          entityId: user.id,
          summary: { email: user.email, role: user.role },
          ip: req.ip
        },
        client
      );
    });

    const accessToken = signAccessToken(user);
    setAuthCookies(res, accessToken, rawRefresh);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rawRefresh = req.cookies?.urd_refresh || req.body?.refreshToken;
    if (!rawRefresh) {
      throw new AppError(401, 'NO_REFRESH_TOKEN', 'Sesi tidak ditemukan. Silakan masuk kembali.');
    }
    const tokenHash = hashToken(rawRefresh);
    const rotated = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT rs.*, u.email, u.full_name, u.role, u.phone, u.is_active
         FROM refresh_sessions rs
         JOIN users u ON u.id = rs.user_id
         WHERE rs.token_hash = $1
         FOR UPDATE OF rs`,
        [tokenHash]
      );
      const session = rows[0];
      if (!session) {
        return { error: new AppError(401, 'INVALID_REFRESH_TOKEN', 'Sesi tidak valid.') };
      }

      if (session.revoked_at) {
        await client.query(
          'UPDATE refresh_sessions SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL',
          [session.family_id]
        );
        return {
          error: new AppError(401, 'SESSION_REUSED', 'Sesi telah berakhir. Silakan masuk kembali.')
        };
      }

      if (new Date(session.expires_at) <= new Date() || !session.is_active) {
        return {
          error: new AppError(401, 'SESSION_EXPIRED', 'Sesi telah berakhir. Silakan masuk kembali.')
        };
      }

      const nextRawRefresh = crypto.randomBytes(40).toString('hex');
      const nextHash = hashToken(nextRawRefresh);
      const expiresAt = new Date(Date.now() + env.refreshSessionDays * 86400 * 1000);
      const { rows: inserted } = await client.query(
        `INSERT INTO refresh_sessions (user_id, family_id, token_hash, expires_at, user_agent, ip)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          session.user_id,
          session.family_id,
          nextHash,
          expiresAt,
          req.headers['user-agent'] || null,
          req.ip
        ]
      );
      await client.query(
        'UPDATE refresh_sessions SET revoked_at = now(), replaced_by = $1 WHERE id = $2 AND revoked_at IS NULL',
        [inserted[0].id, session.id]
      );

      return {
        user: {
          id: session.user_id,
          email: session.email,
          full_name: session.full_name,
          role: session.role,
          phone: session.phone
        },
        nextRawRefresh
      };
    });

    if (rotated.error) {
      clearAuthCookies(res);
      throw rotated.error;
    }

    const { user, nextRawRefresh } = rotated;
    const accessToken = signAccessToken(user);
    setAuthCookies(res, accessToken, nextRawRefresh);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const rawRefresh = req.cookies?.urd_refresh || req.body?.refreshToken;
    if (rawRefresh) {
      const tokenHash = hashToken(rawRefresh);
      await query(
        'UPDATE refresh_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL',
        [tokenHash]
      );
    }
    clearAuthCookies(res);
    return res.json({ message: 'Sesi berhasil diakhiri.' });
  } catch (err) {
    return next(err);
  }
});

const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(120).required().messages({
    'string.min': 'Nama lengkap minimal 2 karakter.',
    'string.max': 'Nama lengkap maksimal 120 karakter.',
    'any.required': 'Nama lengkap wajib diisi.'
  }),
  phone: Joi.string().allow('', null)
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Kata sandi saat ini wajib diisi.'
  }),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Kata sandi baru minimal 8 karakter.',
    'string.max': 'Kata sandi baru maksimal 128 karakter.',
    'any.required': 'Kata sandi baru wajib diisi.'
  })
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, full_name AS "fullName", role, phone, is_active AS "isActive",
              last_login_at AS "lastLoginAt", created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const user = rows[0];
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    let inspectorData = null;
    if (['AHLI_K3', 'INSPECTOR'].includes(user.role)) {
      const inspRes = await query(
        `SELECT i.employee_no AS "employeeNo", i.notes,
                coalesce(
                  json_agg(
                    json_build_object(
                      'categoryName', oc.name,
                      'certificateNo', ic.certificate_no,
                      'validFrom', ic.valid_from,
                      'validUntil', ic.valid_until
                    )
                  ) FILTER (WHERE ic.id IS NOT NULL), '[]'
                ) AS competencies
         FROM inspectors i
         LEFT JOIN inspector_competencies ic ON ic.inspector_id = i.user_id
         LEFT JOIN object_categories oc ON oc.id = ic.category_id
         WHERE i.user_id = $1
         GROUP BY i.user_id, i.employee_no, i.notes`,
        [req.user.id]
      );
      if (inspRes.rows.length) {
        inspectorData = inspRes.rows[0];
      }
    }

    return res.json({
      user: {
        ...user,
        inspector: inspectorData
      }
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/profile', authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const { rows } = await query(
      `UPDATE users
       SET full_name = $1, phone = $2, updated_at = now()
       WHERE id = $3
       RETURNING id, email, full_name AS "fullName", role, phone, is_active AS "isActive"`,
      [fullName.trim(), phone ? phone.trim() : null, req.user.id]
    );

    await recordAudit({
      userId: req.user.id,
      action: 'USER_UPDATE_PROFILE',
      entity: 'users',
      entityId: req.user.id,
      summary: { fullName: fullName.trim(), phone: phone || null },
      ip: req.ip
    });

    return res.json({
      message: 'Profil pengguna berhasil diperbarui.',
      user: rows[0]
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/password', authenticate, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await query('SELECT id, password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Kata sandi saat ini tidak sesuai.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, req.user.id]);

    await recordAudit({
      userId: req.user.id,
      action: 'USER_CHANGE_PASSWORD',
      entity: 'users',
      entityId: req.user.id,
      summary: { message: 'Kata sandi akun diubah oleh pengguna' },
      ip: req.ip
    });

    return res.json({
      message: 'Kata sandi berhasil diperbarui.'
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
