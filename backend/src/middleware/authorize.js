import { AppError } from '../utils/http.js';

// Pemetaan peran kanonik & backward compatibility
const ROLE_ALIASES = {
  // Marketing and Admin Kantor are separate duties. Keep both legacy values
  // accepted only when a route explicitly lists both roles.
  MARKETING: ['MARKETING'],
  ADMIN_KANTOR: ['ADMIN_KANTOR'],
  INSPECTOR: ['INSPECTOR', 'AHLI_K3'],
  AHLI_K3: ['INSPECTOR', 'AHLI_K3'],
  PIMPINAN: ['PIMPINAN', 'MANAGER'],
  MANAGER: ['PIMPINAN', 'MANAGER'],
  ADMIN_SISTEM: ['ADMIN_SISTEM']
};

function expandRoles(allowedRoles) {
  const expandedAllowedRoles = new Set();
  for (const role of allowedRoles) {
    expandedAllowedRoles.add(role);
    const aliases = ROLE_ALIASES[role] || [];
    for (const a of aliases) expandedAllowedRoles.add(a);
  }
  return expandedAllowedRoles;
}

function buildAuthorizer(allowedRoles, { allowManagerMutation = false } = {}) {
  const expandedAllowedRoles = expandRoles(allowedRoles);

  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHENTICATED', 'Autentikasi diperlukan.'));
    }

    const userRole = req.user.role;

    // PIMPINAN / MANAGER secara default hanya memiliki hak akses MONITORING.
    // Pengecualian eksplisit hanya untuk wewenang yang memang diberikan:
    // persetujuan jadwal pemeriksaan (lihat authorizeScheduleApproval).
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    if (!allowManagerMutation && ['PIMPINAN', 'MANAGER'].includes(userRole) && isMutation) {
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

export function authorize(...allowedRoles) {
  return buildAuthorizer(allowedRoles);
}

// Wewenang Manager yang diakui secara eksplisit: menyetujui/menolak jadwal
// aktivitas pemeriksaan. Tidak membuka akses teknis atau finalisasi dokumen.
export function authorizeScheduleApproval(...allowedRoles) {
  return buildAuthorizer(allowedRoles, { allowManagerMutation: true });
}
