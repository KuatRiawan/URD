import { ROLE_LABELS } from './format.js';

const SESSION_ACTIONS = ['AUTH_LOGIN', 'LOGIN', 'AUTH_LOGOUT', 'LOGOUT'];

export const AUDIT_ACTION_LABELS = {
  AUTH_LOGIN: 'Masuk ke sistem',
  LOGIN: 'Masuk ke sistem',
  AUTH_LOGOUT: 'Keluar dari sistem',
  LOGOUT: 'Keluar dari sistem',
  USER_UPDATE_PROFILE: 'Pembaruan profil pengguna',
  USER_CHANGE_PASSWORD: 'Perubahan kata sandi',
  CREATE_ORDER: 'PO baru didaftarkan',
  ORDER_CREATE: 'PO baru didaftarkan',
  UPDATE_ORDER: 'Rincian PO diperbarui',
  ORDER_UPDATE: 'Rincian PO diperbarui',
  SCHEDULE_CREATE: 'Jadwal pemeriksaan dibuat',
  SCHEDULE_APPROVED: 'Persetujuan jadwal pemeriksaan',
  SCHEDULE_REJECTED: 'Penolakan jadwal pemeriksaan',
  ASSIGNMENT_CONFIRM: 'Konfirmasi penugasan Ahli K3',
  INSPECTION_SUBMIT: 'Hasil pemeriksaan dikirim',
  LHPP_REVIEW: 'Tinjauan QC dokumen LHPP',
  LHPP_PUBLISH: 'Dokumen LHPP disahkan',
  BAP_FINALIZE: 'Berita Acara difinalisasi',
  SUKET_PUBLISH: 'Suket K3 diterbitkan'
};

export function formatAuditAction(action) {
  if (!action) return 'Aktivitas sistem';
  if (AUDIT_ACTION_LABELS[action]) return AUDIT_ACTION_LABELS[action];
  const words = String(action).toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function isSessionActivity(action) {
  return SESSION_ACTIONS.includes(action);
}

/**
 * Ringkasan audit dari server dapat berupa objek, string JSON, atau teks biasa.
 * Ubah menjadi satu kalimat yang bisa dibaca, tanpa UUID mentah.
 */
export function formatAuditSummary(entry) {
  const raw = entry?.summary;
  if (!raw) return '';

  let data = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return trimmed;
    try {
      data = JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (!data || typeof data !== 'object') return String(data);

  const role = data.role ? ROLE_LABELS[data.role] || data.role : '';
  const actor = data.fullName || data.userName || '';
  const decision = data.decision === 'DISETUJUI' ? 'disetujui' : data.decision === 'DITOLAK' ? 'ditolak' : '';

  switch (entry?.action) {
    case 'AUTH_LOGIN':
    case 'LOGIN':
      return role ? `Masuk sebagai ${role}` : 'Masuk ke sistem';
    case 'AUTH_LOGOUT':
    case 'LOGOUT':
      return 'Mengakhiri sesi';
    case 'SCHEDULE_APPROVED':
    case 'SCHEDULE_REJECTED': {
      const reason = typeof data.reason === 'string' && data.reason.trim() ? ` Alasan: ${data.reason.trim()}.` : '';
      return `Jadwal pemeriksaan ${decision || 'ditinjau'} oleh Manager.${reason}`;
    }
    default:
      break;
  }

  const parts = [];
  if (actor) parts.push(actor);
  if (role) parts.push(role);
  if (data.clientName) parts.push(`Klien: ${data.clientName}`);
  if (data.poNumber || data.orderNo) parts.push(`PO: ${data.poNumber || data.orderNo}`);
  if (data.message) parts.push(String(data.message));
  if (data.reason) parts.push(`Alasan: ${data.reason}`);
  if (decision && !parts.length) parts.push(`Keputusan: ${decision}`);

  if (parts.length > 0) return parts.join(' · ');

  const readable = Object.entries(data)
    .filter(([key]) => !['id', 'orderId', 'order_id', 'inspectionId', 'userId'].includes(key))
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .map(([key, value]) => `${key}: ${value}`);

  return readable.join(' · ');
}

/** Buang aktivitas login/logout dari umpan operasional, bukan dari halaman Log Audit. */
export function operationalActivities(list) {
  return (Array.isArray(list) ? list : []).filter((entry) => !isSessionActivity(entry?.action));
}

/** Gabungkan baris audit berurutan dengan pelaku dan aksi sama menjadi satu baris. */
export function groupConsecutiveAudit(entries) {
  const rows = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    const previous = rows[rows.length - 1];
    if (previous && previous.action === entry.action && previous.user_name === entry.user_name) {
      previous.count += 1;
      previous.last_at = entry.created_at;
      continue;
    }
    rows.push({ ...entry, count: 1, last_at: entry.created_at });
  }
  return rows;
}
