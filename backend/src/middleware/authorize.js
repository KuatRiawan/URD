import { AppError } from '../utils/http.js';

// Pemetaan peran kanonik & backward compatibility
const ROLE_ALIASES = {
  MARKETING: ['MARKETING', 'ADMIN_KANTOR'],
  ADMIN_KANTOR: ['MARKETING', 'ADMIN_KANTOR'],
  INSPECTOR: ['INSPECTOR', 'AHLI_K3'],
  AHLI_K3: ['INSPECTOR', 'AHLI_K3'],
  PIMPINAN: ['PIMPINAN', 'MANAGER'],
  MANAGER: ['PIMPINAN', 'MANAGER'],
  ADMIN_SISTEM: ['ADMIN_SISTEM']
};

export function authorize(...allowedRoles) {
  // Ekspansi peran yang diizinkan berdasarkan alias
  const expandedAllowedRoles = new Set();
  for (const role of allowedRoles) {
    expandedAllowedRoles.add(role);
    const aliases = ROLE_ALIASES[role] || [];
    for (const a of aliases) expandedAllowedRoles.add(a);
  }

  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Autentikasi diperlukan.'));
    }

    const userRole = req.user.role;

    // PIMPINAN / MANAGER hanya memiliki hak akses MONITORING (Read-Only)
    // Blokir mutasi (POST, PUT, PATCH, DELETE) jika dilakukan oleh PIMPINAN
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    if (['PIMPINAN', 'MANAGER'].includes(userRole) && isMutation) {
      return next(
        new AppError(
          403,
          'MANAGER_READ_ONLY',
          'Pimpinan/Manager hanya memiliki kewenangan monitoring (read-only) dan tidak diizinkan mengubah data operasional atau dokumen.'
        )
      );
    }

    if (!expandedAllowedRoles.has(userRole)) {
      return next(
        new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki hak akses untuk operasi ini.')
      );
    }
    return next();
  };
}

