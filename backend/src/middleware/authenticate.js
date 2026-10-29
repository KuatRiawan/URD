import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../database/pool.js';
import { AppError } from '../utils/http.js';

export async function authenticate(req, _res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.cookies?.urd_access) {
      token = req.cookies.urd_access;
    }

    if (!token) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Sesi tidak ditemukan. Silakan masuk kembali.');
    }

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Sesi telah berakhir atau tidak valid. Silakan masuk kembali.');
    }

    const { rows } = await query(
      'SELECT id, email, full_name, role, phone, is_active FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      throw new AppError(401, 'ACCOUNT_INACTIVE', 'Akun tidak aktif atau tidak ditemukan.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      phone: user.phone
    };
    next();
  } catch (err) {
    next(err);
  }
}

