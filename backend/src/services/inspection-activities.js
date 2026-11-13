// Logika bersama untuk aktivitas pemeriksaan mandiri di dalam satu PO.
// Satu unit dapat memiliki beberapa aktivitas (jenis pemeriksaan berbeda) dengan
// jadwal, penugasan, dan persetujuan Manager yang terpisah.

import { AppError } from '../utils/http.js';

export const ACTIVITY_STATUSES = [
  'BELUM_DIJADWALKAN',
  'MENUNGGU_PERSETUJUAN',
  'TERJADWAL',
  'DITUGASKAN',
  'SEDANG_DIPERIKSA',
  'SELESAI',
  'DIBATALKAN'
];

export const SCHEDULE_STATUSES = ['BELUM_DIUSULKAN', 'DIUSULKAN', 'DISETUJUI', 'DITOLAK'];

// Status unit yang masih boleh disimpulkan dari aktivitas. Setelah dokumen mulai
// diproses (LHPP/BAP), status unit dikendalikan alur dokumen agar tidak mundur.
const EARLY_UNIT_STATUSES = new Set([
  'BELUM_DIJADWALKAN',
  'MENUNGGU_PERSETUJUAN',
  'TERJADWAL',
  'DITUGASKAN',
  'SEDANG_DIPERIKSA',
  'DIBATALKAN'
]);

export const DEFAULT_BAP_SCOPES = [
  'Pemeriksaan Data & Gambar',
  'Pemeriksaan Visual',
  'Uji Fungsi'
];

export async function recordActivityHistory(
  db,
  { activityId, action, fromStatus = null, toStatus = null, scheduleStatus = null, note = null, snapshot = {}, actorId = null }
) {
  await db.query(
    `INSERT INTO inspection_activity_history
       (activity_id, action, from_status, to_status, schedule_status, note, snapshot, actor_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      activityId,
      action,
      fromStatus,
      toStatus,
      scheduleStatus,
      note,
      JSON.stringify(snapshot || {}),
      actorId
    ]
  );
}

export function deriveUnitStatusFromActivities(activities = []) {
  if (!activities.length) return null;
  const statuses = activities.filter((a) => a.status !== 'DIBATALKAN').map((a) => a.status);
  if (!statuses.length) return 'DIBATALKAN';
  if (statuses.every((s) => s === 'SELESAI')) return 'SELESAI';
  if (statuses.some((s) => s === 'SEDANG_DIPERIKSA')) return 'SEDANG_DIPERIKSA';
  if (statuses.some((s) => s === 'DITUGASKAN')) return 'DITUGASKAN';
  if (statuses.some((s) => s === 'TERJADWAL')) return 'TERJADWAL';
  if (statuses.some((s) => s === 'MENUNGGU_PERSETUJUAN')) return 'MENUNGGU_PERSETUJUAN';
  return 'BELUM_DIJADWALKAN';
}

// Sinkronkan ringkasan status unit dari aktivitasnya, tanpa menimpa status
// dokumen yang lebih lanjut (LHPP/BAP menangani statusnya sendiri).
export async function syncUnitStatusFromActivities(db, { orderId, objectId, actorId = null }) {
  const { rows: activityRows } = await db.query(
    'SELECT status FROM inspection_activities WHERE order_id = $1 AND object_id = $2',
    [orderId, objectId]
  );
  const derived = deriveUnitStatusFromActivities(activityRows);
  if (!derived) return;

  const { rows: unitRows } = await db.query(
    'SELECT unit_status FROM order_objects WHERE order_id = $1 AND object_id = $2',
    [orderId, objectId]
  );
  const current = unitRows[0]?.unit_status;
  if (!current || !EARLY_UNIT_STATUSES.has(current)) return;
  if (current === derived) return;

  const { syncOrderUnitStatus } = await import('./workflow.js');
  await syncOrderUnitStatus(db, {
    orderId,
    objectId,
    unitStatus: derived,
    actorId
  });
}

export function assertScheduleWithinPoValidity(order, startAt, endAt = null) {
  if (!startAt || (!order?.valid_from && !order?.valid_until)) return;
  const dateOnly = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
  const start = dateOnly(startAt);
  const end = dateOnly(endAt || startAt);
  const validFrom = order.valid_from ? dateOnly(order.valid_from) : null;
  const validUntil = order.valid_until ? dateOnly(order.valid_until) : null;
  if (validFrom && start < validFrom) {
    throw new AppError(
      400,
      'SCHEDULE_OUTSIDE_PO_VALIDITY',
      `Jadwal aktivitas (${start}) berada sebelum masa berlaku PO (${validFrom}).`
    );
  }
  if (validUntil && end > validUntil) {
    throw new AppError(
      400,
      'SCHEDULE_OUTSIDE_PO_VALIDITY',
      `Jadwal aktivitas (${end}) melewati masa berlaku PO (${validUntil}).`
    );
  }
}

export async function findInspectorScheduleConflicts(
  db,
  { inspectorId, startAt, endAt, excludeActivityId = null, excludeOrderId = null }
) {
  const params = [inspectorId, startAt, endAt, excludeActivityId || null, excludeOrderId || null];
  const { rows } = await db.query(
    `SELECT 'AKTIVITAS' AS source, ia.id AS activity_id, ia.order_id,
            o.order_no, o.po_number, c.name AS client_name,
            ia.planned_start_at AS start_at, ia.planned_end_at AS end_at
     FROM inspection_activities ia
     JOIN orders o ON o.id = ia.order_id
     JOIN clients c ON c.id = o.client_id
     WHERE ia.inspector_id = $1
       AND ia.status NOT IN ('DIBATALKAN', 'SELESAI')
       AND ($4::uuid IS NULL OR ia.id <> $4::uuid)
       AND ($5::uuid IS NULL OR ia.order_id <> $5::uuid)
       AND ia.planned_start_at IS NOT NULL
       AND ia.planned_end_at IS NOT NULL
       AND tstzrange(ia.planned_start_at, ia.planned_end_at) && tstzrange($2::timestamptz, $3::timestamptz)
     UNION ALL
     SELECT 'ORDER' AS source, NULL AS activity_id, a.order_id,
            o.order_no, o.po_number, c.name AS client_name,
            s.start_at, s.end_at
     FROM assignments a
     JOIN orders o ON o.id = a.order_id
     JOIN clients c ON c.id = o.client_id
     JOIN schedules s ON s.order_id = o.id
     WHERE a.inspector_id = $1
       AND a.status IN ('MENUNGGU', 'DITERIMA')
       AND o.status NOT IN ('SELESAI', 'DIBATALKAN')
       AND ($5::uuid IS NULL OR a.order_id <> $5::uuid)
       AND tstzrange(s.start_at, s.end_at) && tstzrange($2::timestamptz, $3::timestamptz)`,
    params
  );
  return rows;
}
