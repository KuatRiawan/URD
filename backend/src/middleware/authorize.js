import { AppError } from '../utils/http.js';

export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Autentikasi diperlukan.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki hak akses untuk operasi ini.')
      );
    }
    return next();
  };
}

