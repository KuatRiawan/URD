import fs from 'node:fs';
import { Router } from 'express';
import { query } from '../database/pool.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { resolveAttachmentPath } from '../storage/file-storage.js';
import { AppError } from '../utils/http.js';

const router = Router();
router.use(authenticate);

async function inspectorCanAccessAttachment(file, inspectorId) {
  const accessQueries = {
    OBJECT: `SELECT EXISTS (
      SELECT 1 FROM order_objects oo
      JOIN assignments a ON a.order_id = oo.order_id
      WHERE oo.object_id = $1 AND a.inspector_id = $2 AND a.status IN ('MENUNGGU', 'DITERIMA')
    ) AS allowed`,
    PO_ATTACHMENT: `SELECT EXISTS (
      SELECT 1 FROM assignments
      WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU', 'DITERIMA')
    ) AS allowed`,
    ORDER_PO: `SELECT EXISTS (
      SELECT 1 FROM assignments
      WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU', 'DITERIMA')
    ) AS allowed`,
    INSPECTION_FINDING: `SELECT EXISTS (
      SELECT 1 FROM inspections i
      LEFT JOIN inspection_findings f ON f.inspection_id = i.id
      WHERE (i.id = $1 OR f.id = $1) AND i.inspector_id = $2
    ) AS allowed`,
    INSPECTION_SIGNATURE: `SELECT EXISTS (
      SELECT 1 FROM inspections WHERE id = $1 AND inspector_id = $2
    ) AS allowed`,
    BAP_SIGNATURE: `SELECT EXISTS (
      SELECT 1 FROM bap_documents b
      JOIN inspections i ON i.id = b.inspection_id
      WHERE b.id = $1 AND i.inspector_id = $2
    ) AS allowed`,
    BAP_PDF: `SELECT EXISTS (
      SELECT 1 FROM bap_documents b
      JOIN inspections i ON i.id = b.inspection_id
      WHERE b.id = $1 AND i.inspector_id = $2
    ) AS allowed`,
    LHPP_PDF: `SELECT EXISTS (
      SELECT 1 FROM lhpp_documents l
      JOIN inspections i ON i.id = l.inspection_id
      WHERE l.id = $1 AND i.inspector_id = $2
    ) AS allowed`,
    LHPP_PHOTO: `SELECT EXISTS (
      SELECT 1 FROM lhpp_documents l
      JOIN inspections i ON i.id = l.inspection_id
      WHERE l.id = $1 AND i.inspector_id = $2
    ) AS allowed`
  };
  const sql = accessQueries[file.owner_type];
  if (!sql) return false;
  const { rows } = await query(sql, [file.owner_id, inspectorId]);
  return rows[0].allowed;
}

// MP-01: Dasbor berdasarkan peran dan data aktual dari database (tanpa angka fiktif)
router.get('/summary', async (req, res, next) => {
  try {
    const role = req.user.role;

    if (['AHLI_K3', 'INSPECTOR'].includes(role)) {
      const [myAssignments, myInspections, myLhpp, myBap, assignedUnits, recentActivitiesRes] = await Promise.all([
        query(
          `SELECT a.id, a.status AS assignment_status, a.created_at,
                  o.id AS order_id, o.order_no, o.po_number, o.status AS order_status, o.service_type,
                  c.name AS client_name, c.address AS client_address,
                  cl.name AS location_name, cl.city AS location_city,
                  s.start_at, s.end_at
           FROM assignments a
           JOIN orders o ON o.id = a.order_id
           JOIN clients c ON c.id = o.client_id
           LEFT JOIN client_locations cl ON cl.id = o.location_id
           LEFT JOIN schedules s ON s.order_id = o.id
           WHERE a.inspector_id = $1 AND a.status IN ('MENUNGGU', 'DITERIMA')
           ORDER BY COALESCE(s.start_at, o.created_at) ASC`,
          [req.user.id]
        ),
        query(
          `SELECT count(*)::int AS total,
                  count(*) FILTER (WHERE status = 'DRAF')::int AS draft_count,
                  count(*) FILTER (WHERE status = 'TERKIRIM')::int AS submitted_count
           FROM inspections WHERE inspector_id = $1`,
          [req.user.id]
        ),
        query(
          `SELECT count(*) FILTER (WHERE l.status = 'DIKEMBALIKAN')::int AS returned_count,
                  count(*) FILTER (WHERE l.status IN ('TERBIT', 'FINAL'))::int AS published_count
           FROM lhpp_documents l
           JOIN inspections i ON i.id = l.inspection_id
           WHERE i.inspector_id = $1`,
          [req.user.id]
        ),
        query(
          `SELECT count(*) FILTER (WHERE b.status = 'DRAF')::int AS draft_bap_count,
                  count(*) FILTER (WHERE b.status = 'FINAL')::int AS final_bap_count
           FROM bap_documents b
           JOIN inspections i ON i.id = b.inspection_id
           WHERE i.inspector_id = $1`,
          [req.user.id]
        ),
        query(
          `SELECT oo.order_id, oo.object_id, oo.unit_status, oo.scope_items, oo.proposed_date, oo.unit_notes,
                  o.order_no, o.po_number, o.po_date, o.service_type, o.notes AS order_notes,
                  c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
                  cl.name AS location_name, cl.address AS location_address, cl.city AS location_city,
                  cc.name AS contact_name, cc.phone AS contact_phone, cc.email AS contact_email,
                  t.name AS object_name, t.serial_number, t.capacity, t.install_location,
                  oc.code AS category_code, oc.name AS category_name,
                  s.start_at, s.end_at, s.notes AS schedule_notes,
                  i.id AS inspection_id, i.status AS inspection_status,
                  b.id AS bap_id, b.bap_no, b.status AS bap_status,
                  l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status, l.review_notes
           FROM order_objects oo
           JOIN orders o ON o.id = oo.order_id
           JOIN clients c ON c.id = o.client_id
           LEFT JOIN client_locations cl ON cl.id = o.location_id
           LEFT JOIN client_contacts cc ON cc.id = o.contact_id
           JOIN test_objects t ON t.id = oo.object_id
           JOIN object_categories oc ON oc.id = t.category_id
           LEFT JOIN schedules s ON s.order_id = o.id
           LEFT JOIN inspections i ON i.order_id = oo.order_id AND i.object_id = oo.object_id
           LEFT JOIN bap_documents b ON b.inspection_id = i.id
           LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
           WHERE (oo.inspector_id = $1 OR o.id IN (
             SELECT order_id FROM assignments WHERE inspector_id = $1 AND status IN ('MENUNGGU','DITERIMA')
           ))
           ORDER BY COALESCE(s.start_at, o.created_at) ASC`,
          [req.user.id]
        ),
        query(
          `SELECT a.id, a.action, a.entity, a.entity_id, a.summary, a.created_at,
                  u.full_name AS user_name, u.role AS user_role
           FROM audit_logs a
           LEFT JOIN users u ON u.id = a.user_id
           ORDER BY a.created_at DESC
           LIMIT 8`
        )
      ]);

      return res.json({
        role,
        metrics: {
          activeAssignments: myAssignments.rows.length,
          pendingConfirmation: myAssignments.rows.filter((a) => a.assignment_status === 'MENUNGGU')
            .length,
          draftInspections: myInspections.rows[0].draft_count,
          submittedInspections: myInspections.rows[0].submitted_count,
          draftBap: myBap.rows[0].draft_bap_count,
          finalBap: myBap.rows[0].final_bap_count,
          returnedLhpp: myLhpp.rows[0].returned_count,
          publishedLhpp: myLhpp.rows[0].published_count
        },
        myAssignments: myAssignments.rows,
        assignedUnits: assignedUnits.rows,
        recentActivities: recentActivitiesRes.rows
      });
    }

    const [
      orderCounts,
      lhppCounts,
      expiringCounts,
      clientObjCounts,
      workload,
      recentOrders,
      overdueRes,
      categoryDistributionRes,
      regionalMappingRes,
      monthlyTrendRes,
      recentActivitiesRes
    ] = await Promise.all([
      query(`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE status = 'ORDER_BARU')::int AS new_orders,
               count(*) FILTER (WHERE status IN ('TERJADWAL','DITUGASKAN','SEDANG_DIPERIKSA','MENUNGGU_LAPORAN','MENUNGGU_REVIEW'))::int AS active_orders,
               count(*) FILTER (WHERE status = 'SELESAI')::int AS completed_orders,
               round(avg(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric, 1) AS avg_completion_hours
        FROM orders
      `),
      query(`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE status IN ('REVIEW_TEKNIS','PERSETUJUAN_PIMPINAN'))::int AS waiting_review,
               count(*) FILTER (WHERE status = 'TERBIT')::int AS published,
               count(*) FILTER (WHERE status = 'DIKEMBALIKAN')::int AS returned
        FROM lhpp_documents
      `),
      query(`
        SELECT count(*) FILTER (WHERE (valid_until - CURRENT_DATE) <= 30)::int AS within_30_days,
               count(*) FILTER (WHERE (valid_until - CURRENT_DATE) <= 90)::int AS within_90_days
        FROM suket_documents
        WHERE status = 'TERBIT' AND valid_until IS NOT NULL
      `),
      query(`
        SELECT (SELECT count(*)::int FROM clients WHERE is_active = true) AS active_clients,
               (SELECT count(*)::int FROM test_objects WHERE is_active = true) AS active_objects
      `),
      query(`
        SELECT u.id, u.full_name,
               count(a.id) FILTER (WHERE a.status IN ('MENUNGGU','DITERIMA') AND o.status NOT IN ('SELESAI','DIBATALKAN'))::int AS active_assignments,
               (SELECT count(*)::int FROM inspections i WHERE i.inspector_id = u.id AND i.status = 'TERKIRIM') AS completed_inspections
        FROM users u
        LEFT JOIN assignments a ON a.inspector_id = u.id
        LEFT JOIN orders o ON o.id = a.order_id
        WHERE u.role IN ('AHLI_K3', 'INSPECTOR') AND u.is_active = true
        GROUP BY u.id, u.full_name
        ORDER BY active_assignments DESC, u.full_name ASC
      `),
      query(`
        SELECT o.id, o.order_no, o.status, o.service_type, o.created_at,
               c.name AS client_name
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        ORDER BY o.created_at DESC
        LIMIT 8
      `),
      query(`
        SELECT count(*)::int AS overdue_count
        FROM order_objects oo
        JOIN orders o ON o.id = oo.order_id
        LEFT JOIN schedules s ON s.order_id = o.id
        WHERE oo.unit_status NOT IN ('SELESAI', 'DIBATALKAN')
          AND s.end_at < now()
      `),
      query(`
        SELECT oc.code, oc.name, count(oo.id)::int AS unit_count
        FROM object_categories oc
        LEFT JOIN test_objects t ON t.category_id = oc.id
        LEFT JOIN order_objects oo ON oo.object_id = t.id
        GROUP BY oc.id, oc.code, oc.name
        ORDER BY unit_count DESC, oc.code ASC
      `),
      query(`
        SELECT coalesce(nullif(trim(cl.city), ''), 'Pusat / Jabodetabek') AS region_name,
               count(DISTINCT o.id)::int AS order_count,
               count(oo.id)::int AS unit_count,
               count(DISTINCT c.id)::int AS client_count
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        LEFT JOIN client_locations cl ON cl.id = o.location_id
        LEFT JOIN order_objects oo ON oo.order_id = o.id
        GROUP BY 1
        ORDER BY unit_count DESC, order_count DESC
        LIMIT 8
      `),
      query(`
        SELECT to_char(d, 'YYYY-MM') AS month_key,
               to_char(d, 'Mon') AS month_label,
               coalesce(count(o.id), 0)::int AS order_count,
               coalesce(sum(case when o.status = 'SELESAI' then 1 else 0 end), 0)::int AS completed_count
        FROM generate_series(
          date_trunc('month', now() - interval '5 months'),
          date_trunc('month', now()),
          interval '1 month'
        ) d
        LEFT JOIN orders o ON date_trunc('month', o.created_at) = d
        GROUP BY d
        ORDER BY d ASC
      `),
      query(`
        SELECT a.id, a.action, a.entity, a.entity_id, a.summary, a.created_at,
               u.full_name AS user_name, u.role AS user_role
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 8
      `)
    ]);

    const overdueUnits = overdueRes?.rows?.[0]?.overdue_count || 0;

    return res.json({
      role,
      metrics: {
        activeClients: clientObjCounts.rows[0].active_clients,
        activeObjects: clientObjCounts.rows[0].active_objects,
        totalOrders: orderCounts.rows[0].total,
        newOrders: orderCounts.rows[0].new_orders,
        activeOrders: orderCounts.rows[0].active_orders,
        completedOrders: orderCounts.rows[0].completed_orders,
        avgCompletionHours: orderCounts.rows[0].avg_completion_hours
          ? Number(orderCounts.rows[0].avg_completion_hours)
          : null,
        lhppWaitingReview: lhppCounts.rows[0].waiting_review,
        lhppPublished: lhppCounts.rows[0].published,
        lhppReturned: lhppCounts.rows[0].returned,
        suketExpiring30d: expiringCounts.rows[0].within_30_days,
        suketExpiring90d: expiringCounts.rows[0].within_90_days,
        overdueUnits
      },
      analytics: {
        categoryDistribution: categoryDistributionRes.rows,
        regionalMapping: regionalMappingRes.rows,
        monthlyTrend: monthlyTrendRes.rows
      },
      inspectorWorkload: workload.rows,
      recentOrders: recentOrders.rows,
      recentActivities: recentActivitiesRes.rows
    });
  } catch (err) {
    return next(err);
  }
});

// Fitur 12.B: Unified Work Queue (Antrean Pekerjaan & Tindakan Penting)
router.get('/work-queue', async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const isInspector = role === 'AHLI_K3';
    const queue = [];

    // 1. PO Baru belum dijadwalkan (khusus Admin & Pimpinan)
    if (!isInspector) {
      const { rows: newOrders } = await query(`
        SELECT o.id, o.order_no, o.po_number, o.created_at, c.name AS client_name, o.service_type
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        WHERE o.status = 'ORDER_BARU'
        ORDER BY o.created_at ASC
        LIMIT 10
      `);
      for (const r of newOrders) {
        queue.push({
          id: `po-${r.id}`,
          type: 'ORDER_SCHEDULING',
          urgency: 'TINGGI',
          title: `PO Baru Perlu Penjadwalan: ${r.po_number || r.order_no}`,
          description: `Klien: ${r.client_name} - Layanan: ${r.service_type}`,
          createdAt: r.created_at,
          actionLabel: 'Jadwalkan & Tugaskan',
          link: '/app/orders'
        });
      }
    }

    // 2. Penugasan menunggu konfirmasi
    const assignmentSql = isInspector
      ? `SELECT a.id, a.order_id, a.created_at, o.order_no, o.po_number, c.name AS client_name
         FROM assignments a
         JOIN orders o ON o.id = a.order_id
         JOIN clients c ON c.id = o.client_id
         WHERE a.inspector_id = $1 AND a.status = 'MENUNGGU'
         ORDER BY a.created_at ASC`
      : `SELECT a.id, a.order_id, a.created_at, o.order_no, o.po_number, c.name AS client_name, u.full_name AS inspector_name
         FROM assignments a
         JOIN orders o ON o.id = a.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN users u ON u.id = a.inspector_id
         WHERE a.status = 'MENUNGGU'
         ORDER BY a.created_at ASC
         LIMIT 10`;

    const { rows: pendingAssignments } = await query(
      assignmentSql,
      isInspector ? [userId] : []
    );
    for (const r of pendingAssignments) {
      queue.push({
        id: `asg-${r.id}`,
        type: 'ASSIGNMENT_CONFIRMATION',
        urgency: 'TINGGI',
        title: isInspector
          ? `Konfirmasi Penugasan Order: ${r.po_number || r.order_no}`
          : `Penugasan Menunggu Konfirmasi: ${r.inspector_name} (${r.order_no})`,
        description: `Klien: ${r.client_name}`,
        createdAt: r.created_at,
        actionLabel: isInspector ? 'Tinjau & Terima' : 'Lihat Penugasan',
        link: isInspector ? '/app/dashboard' : '/app/schedule'
      });
    }

    // 3. Form pengujian lapangan masih draf
    const inspectionSql = isInspector
      ? `SELECT i.id, i.order_id, i.created_at, o.order_no, t.name AS object_name, c.name AS client_name
         FROM inspections i
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $1 AND i.status = 'DRAF'
         ORDER BY i.created_at ASC
         LIMIT 10`
      : `SELECT i.id, i.order_id, i.created_at, o.order_no, t.name AS object_name, c.name AS client_name, u.full_name AS inspector_name
         FROM inspections i
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN users u ON u.id = i.inspector_id
         WHERE i.status = 'DRAF'
         ORDER BY i.created_at ASC
         LIMIT 10`;

    const { rows: draftInspections } = await query(
      inspectionSql,
      isInspector ? [userId] : []
    );
    for (const r of draftInspections) {
      queue.push({
        id: `insp-${r.id}`,
        type: 'INSPECTION_DRAFT',
        urgency: 'SEDANG',
        title: `Form Uji Belum Selesai: ${r.object_name}`,
        description: `Klien: ${r.client_name} (Order: ${r.order_no})${!isInspector ? ` - Ahli K3: ${r.inspector_name}` : ''}`,
        createdAt: r.created_at,
        actionLabel: 'Lanjutkan Form',
        link: '/app/inspections'
      });
    }

    // 4. LHPP menunggu review teknis atau persetujuan pimpinan
    const lhppReviewSql = isInspector
      ? `SELECT l.id, l.lhpp_no, l.status, l.created_at, t.name AS object_name, c.name AS client_name
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $1 AND l.status IN ('REVIEW_TEKNIS', 'PERSETUJUAN_PIMPINAN')
         ORDER BY l.created_at ASC`
      : `SELECT l.id, l.lhpp_no, l.status, l.created_at, t.name AS object_name, c.name AS client_name, u.full_name AS inspector_name
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN users u ON u.id = i.inspector_id
         WHERE l.status IN ('REVIEW_TEKNIS', 'PERSETUJUAN_PIMPINAN')
         ORDER BY l.created_at ASC
         LIMIT 10`;

    const { rows: waitingLhpp } = await query(
      lhppReviewSql,
      isInspector ? [userId] : []
    );
    for (const r of waitingLhpp) {
      const isApproval = r.status === 'PERSETUJUAN_PIMPINAN';
      queue.push({
        id: `lhpp-rev-${r.id}`,
        type: 'LHPP_REVIEW',
        urgency: 'TINGGI',
        title: isApproval
          ? `Menunggu Persetujuan Pimpinan: ${r.object_name}`
          : `Menunggu Review Teknis: ${r.object_name}`,
        description: `Klien: ${r.client_name}${!isInspector ? ` - Ahli K3: ${r.inspector_name}` : ''}`,
        createdAt: r.created_at,
        actionLabel: role === 'PIMPINAN' || role === 'ADMIN_KANTOR' ? 'Review & Terbitkan' : 'Pantau Status',
        link: '/app/lhpp'
      });
    }

    // 5. LHPP Dikembalikan dengan Catatan Revisi
    const lhppReturnedSql = isInspector
      ? `SELECT l.id, l.lhpp_no, l.created_at, l.review_notes, t.name AS object_name, c.name AS client_name
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $1 AND l.status = 'DIKEMBALIKAN'
         ORDER BY l.updated_at DESC`
      : `SELECT l.id, l.lhpp_no, l.created_at, l.review_notes, t.name AS object_name, c.name AS client_name, u.full_name AS inspector_name
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN users u ON u.id = i.inspector_id
         WHERE l.status = 'DIKEMBALIKAN'
         ORDER BY l.updated_at DESC
         LIMIT 10`;

    const { rows: returnedLhpp } = await query(
      lhppReturnedSql,
      isInspector ? [userId] : []
    );
    for (const r of returnedLhpp) {
      queue.push({
        id: `lhpp-ret-${r.id}`,
        type: 'LHPP_REVISION',
        urgency: 'TINGGI',
        title: `LHPP Perlu Revisi: ${r.object_name}`,
        description: `Catatan: ${r.review_notes || 'Silakan cek catatan perbaikan.'} (Klien: ${r.client_name})`,
        createdAt: r.created_at,
        actionLabel: 'Buka & Perbaiki',
        link: '/app/lhpp'
      });
    }

    // 6. Suket K3 mendekati kedaluwarsa (<= 30 hari)
    if (!isInspector) {
      const { rows: expiringSuket } = await query(`
        SELECT s.id, s.suket_no, s.valid_until, t.name AS object_name, c.name AS client_name,
               (s.valid_until - CURRENT_DATE)::int AS days_remaining
        FROM suket_documents s
        JOIN lhpp_documents l ON l.id = s.lhpp_id
        JOIN inspections i ON i.id = l.inspection_id
        JOIN test_objects t ON t.id = i.object_id
        JOIN clients c ON c.id = t.client_id
        WHERE s.status = 'TERBIT'
          AND s.valid_until IS NOT NULL
          AND (s.valid_until - CURRENT_DATE) BETWEEN 0 AND 30
        ORDER BY s.valid_until ASC
        LIMIT 8
      `);
      for (const r of expiringSuket) {
        queue.push({
          id: `suket-${r.id}`,
          type: 'SUKET_EXPIRING',
          urgency: r.days_remaining <= 7 ? 'TINGGI' : 'SEDANG',
          title: `Suket K3 Kedaluwarsa dlm ${r.days_remaining} Hari: ${r.suket_no}`,
          description: `Objek: ${r.object_name} - Klien: ${r.client_name}`,
          createdAt: r.valid_until,
          actionLabel: 'Buat Penawaran Ulang',
          link: '/app/suket'
        });
      }
    }

    return res.json({
      total: queue.length,
      items: queue
    });
  } catch (err) {
    return next(err);
  }
});

// M4-12: Ekspor data rekap CSV untuk pelaporan internal dan instansi
router.get(
  '/export-recap.csv',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN'),
  async (_req, res, next) => {
    try {
      const { rows } = await query(`
        SELECT o.order_no, o.status AS order_status, o.service_type,
               c.name AS client_name,
               oc.code AS category_code,
               t.name AS object_name, t.serial_number,
               i.conclusion,
               l.lhpp_no, l.status AS lhpp_status,
               s.suket_no, s.valid_until AS suket_valid_until
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        JOIN order_objects oo ON oo.order_id = o.id
        JOIN test_objects t ON t.id = oo.object_id
        JOIN object_categories oc ON oc.id = t.category_id
        LEFT JOIN inspections i ON i.order_id = o.id AND i.object_id = t.id
        LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
        LEFT JOIN suket_documents s ON s.lhpp_id = l.id
        ORDER BY o.created_at DESC
      `);

      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = [
        'Nomor Order',
        'Status Order',
        'Jenis Layanan',
        'Nama Klien',
        'Kategori',
        'Nama Objek',
        'Nomor Seri',
        'Kesimpulan Inspeksi',
        'Nomor LHPP',
        'Status LHPP',
        'Nomor Suket K3',
        'Masa Berlaku Suket'
      ].join(',');

      const lines = rows.map((r) =>
        [
          r.order_no,
          r.order_status,
          r.service_type,
          r.client_name,
          r.category_code,
          r.object_name,
          r.serial_number,
          r.conclusion || '-',
          r.lhpp_no || '-',
          r.lhpp_status || '-',
          r.suket_no || '-',
          r.suket_valid_until ? new Date(r.suket_valid_until).toISOString().slice(0, 10) : '-'
        ]
          .map(esc)
          .join(',')
      );

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="Rekap-Riksa-Uji-PT-Upaya-Riksa-Daya.csv"'
      );
      return res.send([header, ...lines].join('\n'));
    } catch (err) {
      return next(err);
    }
  }
);

// Unduhan berkas lampiran terotorisasi
router.get('/files/:fileId', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM file_attachments WHERE id = $1 AND deleted_at IS NULL',
      [req.params.fileId]
    );
    const file = rows[0];
    if (!file) throw new AppError(404, 'FILE_NOT_FOUND', 'Berkas tidak ditemukan.');

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && !(await inspectorCanAccessAttachment(file, req.user.id))) {
      throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses pada berkas ini.');
    }

    const fullPath = resolveAttachmentPath(file.storage_key);
    if (!fs.existsSync(fullPath)) {
      throw new AppError(404, 'FILE_MISSING', 'Berkas fisik tidak ditemukan di penyimpanan.');
    }

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${file.original_name.replace(/"/g, '')}"`
    );
    return fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    return next(err);
  }
});

export default router;
