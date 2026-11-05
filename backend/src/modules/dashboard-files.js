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
  if (file.owner_type === 'USER_AVATAR') return true;
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
    ) AS allowed`,
    OPERATIONAL_ISSUE: `SELECT EXISTS (
      SELECT 1 FROM operational_issues oi
      LEFT JOIN assignments a ON a.order_id = oi.order_id AND a.inspector_id = $2 AND a.status IN ('MENUNGGU', 'DITERIMA')
      WHERE oi.id = $1 AND (oi.reported_by = $2 OR a.id IS NOT NULL)
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
                  l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status, l.review_notes,
                  asg.id AS assignment_id, asg.status AS assignment_status, asg.reject_reason
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
           LEFT JOIN LATERAL (
             SELECT id, status, reject_reason
             FROM assignments
             WHERE order_id = o.id AND inspector_id = $1
             ORDER BY created_at DESC
             LIMIT 1
           ) asg ON true
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
           WHERE a.user_id = $1
           ORDER BY a.created_at DESC
           LIMIT 8`,
          [req.user.id]
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

    if (role === 'MARKETING') {
      const [
        clientRes,
        orderStatsRes,
        expiringStatsRes,
        pendingFollowupsRes,
        renewedClientsRes,
        recentOrdersRes,
        urgentExpiringRes,
        recentActivitiesRes,
        regionalMappingRes,
        monthlyTrendRes
      ] = await Promise.all([
        query(`SELECT count(*)::int AS count FROM clients WHERE is_active = true`),
        query(`
          SELECT
            count(*)::int AS total,
            count(*) FILTER (WHERE status IN ('ORDER_BARU', 'TERDAFTAR'))::int AS new_orders,
            count(*) FILTER (WHERE status IN ('TERJADWAL', 'DITUGASKAN', 'SEDANG_DIPERIKSA', 'MENUNGGU_LAPORAN', 'MENUNGGU_DOKUMEN'))::int AS active_orders,
            count(*) FILTER (WHERE status IN ('ORDER_BARU', 'TERDAFTAR'))::int AS awaiting_schedule,
            count(*) FILTER (WHERE status = 'SEDANG_DIPERIKSA')::int AS in_progress_orders,
            count(*) FILTER (WHERE status = 'SELESAI')::int AS completed_orders
          FROM orders
        `),
        query(`
          SELECT
            count(*) FILTER (WHERE days_remaining BETWEEN 0 AND 30)::int AS within_30_days,
            count(*) FILTER (WHERE days_remaining BETWEEN 0 AND 7)::int AS h7_count,
            count(*) FILTER (WHERE days_remaining BETWEEN 8 AND 14)::int AS h14_count,
            count(*) FILTER (WHERE days_remaining BETWEEN 15 AND 30)::int AS h30_count
          FROM (
            SELECT (COALESCE(s.valid_until, t.next_inspection_date) - CURRENT_DATE)::int AS days_remaining
            FROM test_objects t
            LEFT JOIN suket_documents s ON s.object_id = t.id AND s.status = 'TERBIT'
            WHERE t.is_active = true AND COALESCE(s.valid_until, t.next_inspection_date) IS NOT NULL
          ) sub
        `),
        query(`
          SELECT count(DISTINCT t.id)::int AS count
          FROM test_objects t
          JOIN clients c ON c.id = t.client_id
          LEFT JOIN LATERAL (
            SELECT s.valid_until FROM suket_documents s
            WHERE s.object_id = t.id AND s.status = 'TERBIT'
            ORDER BY s.valid_until DESC NULLS LAST LIMIT 1
          ) s ON true
          LEFT JOIN LATERAL (
            SELECT rf.status FROM renewal_followups rf
            WHERE rf.object_id = t.id OR rf.suket_id IN (SELECT id FROM suket_documents WHERE object_id = t.id)
            ORDER BY rf.created_at DESC LIMIT 1
          ) rf ON true
          WHERE t.is_active = true AND c.is_active = true
            AND COALESCE(s.valid_until, t.next_inspection_date) IS NOT NULL
            AND (COALESCE(s.valid_until, t.next_inspection_date) - CURRENT_DATE) <= 90
            AND COALESCE(rf.status, 'BELUM_DITINDAKLANJUTI') NOT IN ('SUDAH_JADI_PO_BARU', 'DITUNDA')
        `),
        query(`
          SELECT count(DISTINCT client_id)::int AS count
          FROM orders
          WHERE service_type = 'PERPANJANGAN' OR renewal_of_suket IS NOT NULL
        `),
        query(`
          SELECT o.id, o.order_no, o.po_number, o.service_type, o.status, o.created_at,
                 c.name AS client_name,
                 (SELECT count(*)::int FROM order_objects oo WHERE oo.order_id = o.id) AS unit_count
          FROM orders o
          JOIN clients c ON c.id = o.client_id
          ORDER BY o.created_at DESC
          LIMIT 6
        `),
        query(`
          SELECT t.id, t.name, t.serial_number, t.capacity, oc.code AS category_code,
                 c.name AS client_name, c.id AS client_id,
                 (SELECT cc.name FROM client_contacts cc WHERE cc.client_id = c.id AND cc.is_active = true ORDER BY cc.is_reminder_recipient DESC, cc.is_primary DESC, cc.created_at DESC LIMIT 1) AS contact_name,
                 (SELECT cc.phone FROM client_contacts cc WHERE cc.client_id = c.id AND cc.is_active = true ORDER BY cc.is_reminder_recipient DESC, cc.is_primary DESC, cc.created_at DESC LIMIT 1) AS contact_phone,
                 COALESCE(s.valid_until, t.next_inspection_date) AS valid_until,
                 (COALESCE(s.valid_until, t.next_inspection_date) - CURRENT_DATE)::int AS days_remaining,
                 COALESCE(rf.status, 'BELUM_DITINDAKLANJUTI') AS followup_status
          FROM test_objects t
          JOIN clients c ON c.id = t.client_id
          JOIN object_categories oc ON oc.id = t.category_id
          LEFT JOIN LATERAL (
            SELECT s1.valid_until FROM suket_documents s1
            WHERE s1.object_id = t.id AND s1.status = 'TERBIT'
            ORDER BY s1.valid_until DESC NULLS LAST LIMIT 1
          ) s ON true
          LEFT JOIN LATERAL (
            SELECT rf1.status FROM renewal_followups rf1
            WHERE rf1.object_id = t.id OR rf1.suket_id IN (SELECT id FROM suket_documents WHERE object_id = t.id)
            ORDER BY rf1.created_at DESC LIMIT 1
          ) rf ON true
          WHERE t.is_active = true
            AND COALESCE(s.valid_until, t.next_inspection_date) IS NOT NULL
            AND (COALESCE(s.valid_until, t.next_inspection_date) - CURRENT_DATE) BETWEEN -30 AND 60
          ORDER BY days_remaining ASC
          LIMIT 8
        `),
        query(`
          SELECT a.id, a.action, a.entity, a.entity_id, a.summary, a.created_at,
                 u.full_name AS user_name, u.role AS user_role
          FROM audit_logs a
          LEFT JOIN users u ON u.id = a.user_id
          WHERE u.role = 'MARKETING' OR a.user_id = $1
          ORDER BY a.created_at DESC
          LIMIT 8
        `, [req.user.id]),
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
        `)
      ]);

      const ordStats = orderStatsRes.rows[0] || {};
      const expStats = expiringStatsRes.rows[0] || {};

      return res.json({
        role,
        metrics: {
          managedClients: clientRes.rows[0]?.count || 0,
          newOrders: ordStats.new_orders || 0,
          activeOrders: ordStats.active_orders || 0,
          awaitingScheduleOrders: ordStats.awaiting_schedule || 0,
          inProgressOrders: ordStats.in_progress_orders || 0,
          completedOrders: ordStats.completed_orders || 0,
          totalOrders: ordStats.total || 0,
          expiringUnitsCount: expStats.within_30_days || 0,
          remindersH7: expStats.h7_count || 0,
          remindersH14: expStats.h14_count || 0,
          remindersH30: expStats.h30_count || 0,
          pendingFollowupsCount: pendingFollowupsRes.rows[0]?.count || 0,
          renewedClientsCount: renewedClientsRes.rows[0]?.count || 0
        },
        recentOrders: recentOrdersRes.rows,
        urgentExpiringUnits: urgentExpiringRes.rows,
        recentActivities: recentActivitiesRes.rows,
        analytics: {
          monthlyTrend: monthlyTrendRes.rows,
          regionalMapping: regionalMappingRes.rows
        }
      });
    }

    const periodParam = String(req.query.period || '').toUpperCase();
    let trendSql = `
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
    `;
    if (periodParam === '7D') {
      trendSql = `
        SELECT to_char(d, 'YYYY-MM-DD') AS month_key,
               to_char(d, 'DD Mon') AS month_label,
               coalesce(count(o.id), 0)::int AS order_count,
               coalesce(sum(case when o.status = 'SELESAI' then 1 else 0 end), 0)::int AS completed_count
        FROM generate_series(
          date_trunc('day', now() - interval '6 days'),
          date_trunc('day', now()),
          interval '1 day'
        ) d
        LEFT JOIN orders o ON date_trunc('day', o.created_at) = d
        GROUP BY d
        ORDER BY d ASC
      `;
    } else if (periodParam === '30D') {
      trendSql = `
        SELECT to_char(d, 'YYYY-MM-DD') AS month_key,
               to_char(d, 'DD Mon') AS month_label,
               coalesce(count(o.id), 0)::int AS order_count,
               coalesce(sum(case when o.status = 'SELESAI' then 1 else 0 end), 0)::int AS completed_count
        FROM generate_series(
          date_trunc('week', now() - interval '4 weeks'),
          date_trunc('week', now()),
          interval '1 week'
        ) d
        LEFT JOIN orders o ON date_trunc('week', o.created_at) = d
        GROUP BY d
        ORDER BY d ASC
      `;
    } else if (periodParam === '90D') {
      trendSql = `
        SELECT to_char(d, 'YYYY-MM') AS month_key,
               to_char(d, 'Mon') AS month_label,
               coalesce(count(o.id), 0)::int AS order_count,
               coalesce(sum(case when o.status = 'SELESAI' then 1 else 0 end), 0)::int AS completed_count
        FROM generate_series(
          date_trunc('month', now() - interval '2 months'),
          date_trunc('month', now()),
          interval '1 month'
        ) d
        LEFT JOIN orders o ON date_trunc('month', o.created_at) = d
        GROUP BY d
        ORDER BY d ASC
      `;
    } else if (periodParam === '1Y') {
      trendSql = `
        SELECT to_char(d, 'YYYY-MM') AS month_key,
               to_char(d, 'Mon YY') AS month_label,
               coalesce(count(o.id), 0)::int AS order_count,
               coalesce(sum(case when o.status = 'SELESAI' then 1 else 0 end), 0)::int AS completed_count
        FROM generate_series(
          date_trunc('month', now() - interval '11 months'),
          date_trunc('month', now()),
          interval '1 month'
        ) d
        LEFT JOIN orders o ON date_trunc('month', o.created_at) = d
        GROUP BY d
        ORDER BY d ASC
      `;
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
      recentActivitiesRes,
      unitStatusRes,
      operationalIssuesRes,
      documentPipelineRes,
      adminStatsRes
    ] = await Promise.all([
      query(`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE status IN ('ORDER_BARU','TERDAFTAR'))::int AS new_orders,
               count(*) FILTER (WHERE status IN ('TERJADWAL','DITUGASKAN','SEDANG_DIPERIKSA','MENUNGGU_LAPORAN','MENUNGGU_DOKUMEN'))::int AS active_orders,
               count(*) FILTER (WHERE status = 'SELESAI')::int AS completed_orders,
               round(avg(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric, 1) AS avg_completion_hours
        FROM orders
      `),
      query(`
        SELECT count(*)::int AS total,
               count(*) FILTER (WHERE status = 'SIAP_PREVIEW')::int AS ready_finalize,
               count(*) FILTER (WHERE status IN ('FINAL', 'TERBIT'))::int AS published,
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
               count(DISTINCT a.id) FILTER (WHERE a.status IN ('MENUNGGU','DITERIMA') AND o.status NOT IN ('SELESAI','DIBATALKAN'))::int AS active_assignments,
               count(DISTINCT a.id) FILTER (WHERE a.status = 'MENUNGGU' AND o.status NOT IN ('SELESAI','DIBATALKAN'))::int AS pending_confirmations,
               (SELECT count(*)::int FROM order_objects oo JOIN orders o2 ON o2.id = oo.order_id WHERE oo.inspector_id = u.id AND oo.unit_status NOT IN ('SELESAI', 'DIBATALKAN') AND o2.status NOT IN ('SELESAI', 'DIBATALKAN')) AS assigned_units,
               (SELECT count(*)::int FROM inspections i WHERE i.inspector_id = u.id AND i.status = 'DRAF') AS draft_inspections,
               (SELECT count(*)::int FROM inspections i WHERE i.inspector_id = u.id AND i.status = 'TERKIRIM') AS completed_inspections,
               (SELECT count(*)::int FROM lhpp_documents l JOIN inspections i2 ON i2.id = l.inspection_id WHERE i2.inspector_id = u.id AND l.status = 'DIKEMBALIKAN') AS revision_count,
               (SELECT count(*)::int FROM inspector_competencies ic WHERE ic.inspector_id = u.id AND ic.valid_until >= CURRENT_DATE) AS valid_skp_count
        FROM users u
        LEFT JOIN assignments a ON a.inspector_id = u.id
        LEFT JOIN orders o ON o.id = a.order_id
        WHERE u.role IN ('AHLI_K3', 'INSPECTOR') AND u.is_active = true
        GROUP BY u.id, u.full_name
        ORDER BY active_assignments DESC, assigned_units DESC, u.full_name ASC
      `),
      query(`
        SELECT o.id, o.order_no, o.po_number, o.po_date, o.status, o.service_type, o.created_at,
               c.name AS client_name,
               count(oo.id) FILTER (WHERE oo.unit_status != 'DIBATALKAN')::int AS object_count,
               count(oo.id) FILTER (WHERE oo.unit_status IN ('LHPP_TERBIT', 'BAP_FINAL', 'SIAP_DISTRIBUSI', 'SEBAGIAN_DOKUMEN_DIKIRIM', 'SELESAI'))::int AS completed_units,
               count(oo.id) FILTER (WHERE oo.unit_status IN ('SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP', 'MENUNGGU_TTD'))::int AS inspecting_units,
               count(oo.id) FILTER (WHERE oo.unit_status IN ('FORM_TERKIRIM', 'PEMERIKSAAN_TERKIRIM', 'LHPP_DRAF', 'LHPP_DIPROSES', 'LHPP_SIAP_PREVIEW', 'LHPP_FINAL', 'BAP_DRAF', 'BAP_DIPROSES', 'BAP_SIAP_PREVIEW', 'MENUNGGU_REVIEW'))::int AS waiting_doc_units,
               count(oo.id) FILTER (WHERE oo.unit_status IN ('PERLU_REVISI', 'REVISI'))::int AS revision_units
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        LEFT JOIN order_objects oo ON oo.order_id = o.id
        GROUP BY o.id, c.name
        ORDER BY o.created_at DESC
        LIMIT 10
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
      query(trendSql),
      query(`
        SELECT a.id, a.action, a.entity, a.entity_id, a.summary, a.ip AS ip_address, a.created_at,
               u.full_name AS user_name, u.role AS user_role
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 8
      `),
      query(`
        SELECT
          count(*) FILTER (WHERE unit_status != 'DIBATALKAN')::int AS total_units,
          count(*) FILTER (WHERE unit_status = 'DIBATALKAN')::int AS cancelled_units,
          count(*) FILTER (WHERE unit_status IN ('BELUM_DIJADWALKAN', 'TERDAFTAR'))::int AS unscheduled_units,
          count(*) FILTER (WHERE unit_status IN ('TERJADWAL', 'DITUGASKAN'))::int AS scheduled_units,
          count(*) FILTER (WHERE unit_status IN ('BELUM_DIJADWALKAN', 'TERDAFTAR', 'TERJADWAL', 'DITUGASKAN'))::int AS waiting_inspection_units,
          count(*) FILTER (WHERE unit_status IN ('SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP', 'MENUNGGU_TTD'))::int AS inspecting_units,
          count(*) FILTER (WHERE unit_status IN ('FORM_TERKIRIM', 'PEMERIKSAAN_TERKIRIM', 'LHPP_DRAF', 'LHPP_DIPROSES', 'LHPP_SIAP_PREVIEW', 'LHPP_FINAL', 'BAP_DRAF', 'BAP_DIPROSES', 'BAP_SIAP_PREVIEW', 'MENUNGGU_REVIEW'))::int AS waiting_doc_units,
          count(*) FILTER (WHERE unit_status IN ('PERLU_REVISI', 'REVISI'))::int AS revision_units,
          count(*) FILTER (WHERE unit_status IN ('LHPP_TERBIT', 'BAP_FINAL', 'SIAP_DISTRIBUSI', 'SEBAGIAN_DOKUMEN_DIKIRIM', 'SELESAI'))::int AS completed_units
        FROM order_objects
      `).catch(() => ({
        rows: [
          {
            total_units: 0,
            cancelled_units: 0,
            unscheduled_units: 0,
            scheduled_units: 0,
            waiting_inspection_units: 0,
            inspecting_units: 0,
            waiting_doc_units: 0,
            revision_units: 0,
            completed_units: 0
          }
        ]
      })),
      query(`
        SELECT
          count(*) FILTER (WHERE status NOT IN ('SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'))::int AS open_issues,
          count(*) FILTER (WHERE status NOT IN ('SELESAI', 'TIDAK_DAPAT_DILANJUTKAN') AND priority = 'TINGGI')::int AS high_priority_issues
        FROM operational_issues
      `).catch(() => ({ rows: [{ open_issues: 0, high_priority_issues: 0 }] })),
      query(`
        SELECT
          (SELECT count(*)::int FROM bap_documents WHERE status = 'DRAF') AS bap_draft,
          (SELECT count(*)::int FROM bap_documents WHERE status = 'FINAL') AS bap_final,
          (SELECT count(*)::int FROM lhpp_documents WHERE status = 'SIAP_PREVIEW') AS lhpp_ready_preview,
          (SELECT count(*)::int FROM lhpp_documents WHERE status IN ('FINAL', 'TERBIT')) AS lhpp_published,
          (SELECT count(*)::int FROM suket_documents WHERE status = 'TERBIT') AS suket_published,
          (SELECT count(*)::int FROM document_distributions WHERE status IN ('BELUM_DIKIRIM', 'SIAP_DIKIRIM')) AS dist_pending,
          (SELECT count(*)::int FROM document_distributions WHERE status = 'DIKIRIM') AS dist_dispatched,
          (SELECT count(*)::int FROM document_distributions WHERE status = 'DITERIMA') AS dist_received
      `).catch(() => ({ rows: [{}] })),
      query(`
        SELECT
          (SELECT count(*)::int FROM users) AS total_users,
          (SELECT count(*)::int FROM users WHERE is_active = true) AS active_users,
          (SELECT count(*)::int FROM users WHERE role IN ('AHLI_K3', 'INSPECTOR') AND is_active = true) AS total_inspectors,
          (SELECT count(*)::int FROM inspector_competencies WHERE valid_until >= CURRENT_DATE) AS valid_skp_count,
          (SELECT count(*)::int FROM inspector_competencies WHERE valid_until >= CURRENT_DATE AND (valid_until - CURRENT_DATE) <= 30) AS expiring_skp_count,
          (SELECT count(*)::int FROM inspector_competencies WHERE valid_until < CURRENT_DATE) AS expired_skp_count,
          (SELECT count(*)::int FROM audit_logs) AS total_audit_logs,
          (SELECT count(*)::int FROM database_backups) AS total_backups,
          pg_size_pretty(pg_database_size(current_database())) AS db_size
      `).catch(() => ({ rows: [{}] }))
    ]);

    const adminStats = adminStatsRes?.rows?.[0] || {};
    const overdueUnits = overdueRes?.rows?.[0]?.overdue_count || 0;
    const enrichedRecentOrders = (recentOrders.rows || []).map((r) => ({
      ...r,
      unitProgress: {
        totalUnits: r.object_count || 0,
        completed: r.completed_units || 0,
        inProgress: r.inspecting_units || 0,
        waitingDocs: r.waiting_doc_units || 0,
        revision: r.revision_units || 0
      }
    }));

    return res.json({
      role,
      metrics: {
        totalUsers: adminStats.total_users ?? 0,
        activeUsers: adminStats.active_users ?? 0,
        totalInspectors: adminStats.total_inspectors ?? 0,
        validSkpCount: adminStats.valid_skp_count ?? 0,
        expiringSkpCount: adminStats.expiring_skp_count ?? 0,
        expiredSkpCount: adminStats.expired_skp_count ?? 0,
        totalAuditLogs: adminStats.total_audit_logs ?? 0,
        totalBackups: adminStats.total_backups ?? 0,
        activeClients: clientObjCounts.rows[0].active_clients,
        activeObjects: clientObjCounts.rows[0].active_objects,
        totalOrders: orderCounts.rows[0].total,
        newOrders: orderCounts.rows[0].new_orders,
        activeOrders: orderCounts.rows[0].active_orders,
        completedOrders: orderCounts.rows[0].completed_orders,
        avgCompletionHours: orderCounts.rows[0].avg_completion_hours
          ? Number(orderCounts.rows[0].avg_completion_hours)
          : null,
        lhppWaitingReview: lhppCounts.rows[0].ready_finalize,
        lhppPublished: lhppCounts.rows[0].published,
        lhppReturned: lhppCounts.rows[0].returned,
        suketExpiring30d: expiringCounts.rows[0].within_30_days,
        suketExpiring90d: expiringCounts.rows[0].within_90_days,
        overdueUnits,
        totalUnits: unitStatusRes?.rows?.[0]?.total_units || 0,
        cancelledUnits: unitStatusRes?.rows?.[0]?.cancelled_units || 0,
        unscheduledUnits: unitStatusRes?.rows?.[0]?.unscheduled_units || 0,
        scheduledUnits: unitStatusRes?.rows?.[0]?.scheduled_units || 0,
        waitingInspectionUnits: unitStatusRes?.rows?.[0]?.waiting_inspection_units || 0,
        inspectingUnits: unitStatusRes?.rows?.[0]?.inspecting_units || 0,
        waitingDocUnits: unitStatusRes?.rows?.[0]?.waiting_doc_units || 0,
        revisionUnits: unitStatusRes?.rows?.[0]?.revision_units || 0,
        completedUnits: unitStatusRes?.rows?.[0]?.completed_units || 0,
        openIssues: operationalIssuesRes?.rows?.[0]?.open_issues || 0,
        highPriorityIssues: operationalIssuesRes?.rows?.[0]?.high_priority_issues || 0,
        documentPipeline: documentPipelineRes?.rows?.[0] || {}
      },
      systemInfo: {
        databaseSize: adminStats.db_size || '14 MB'
      },
      analytics: {
        categoryDistribution: categoryDistributionRes.rows,
        regionalMapping: regionalMappingRes.rows,
        monthlyTrend: monthlyTrendRes.rows
      },
      inspectorWorkload: workload.rows,
      recentOrders: enrichedRecentOrders,
      recentActivities: recentActivitiesRes.rows,
      recentAudits: recentActivitiesRes.rows
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
    const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(role);
    const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(role);
    const isOperationalAdmin = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER'].includes(role);
    const isMarketing = role === 'MARKETING';
    const queue = [];

    // Tiap kategori dibatasi agar widget tetap ringkas. `count(*) OVER()` menghitung
    // seluruh baris yang cocok SEBELUM LIMIT, sehingga jumlah total di UI tidak bohong
    // (sebelumnya `total` hanya menyalin jumlah item yang sudah terpotong).
    let availableTotal = 0;
    const recordTotal = (rows) => {
      availableTotal += Number(rows[0]?.row_total ?? rows.length) || 0;
    };

    // 1. PO Baru belum dijadwalkan (khusus Admin & Pimpinan)
    if (isOperationalAdmin || isMarketing) {
      const { rows: newOrders } = await query(`
        SELECT o.id, o.order_no, o.po_number, o.created_at, c.name AS client_name, o.service_type,
               (count(*) OVER())::int AS row_total
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        WHERE o.status IN ('ORDER_BARU','TERDAFTAR')
        ORDER BY o.created_at ASC
        LIMIT 10
      `);
      recordTotal(newOrders);
      for (const r of newOrders) {
        queue.push({
          id: `po-${r.id}`,
          type: 'ORDER_SCHEDULING',
          urgency: 'TINGGI',
          title: `PO Baru Perlu Penjadwalan: ${r.po_number || r.order_no}`,
          description: `Klien: ${r.client_name} - Layanan: ${r.service_type}`,
          createdAt: r.created_at,
          actionLabel: isPimpinan ? 'Pantau PO' : 'Jadwalkan & Tugaskan',
          link: '/app/orders'
        });
      }
    }

    // 2. Penugasan menunggu konfirmasi
    const assignmentSql = isInspector
      ? `SELECT a.id, a.order_id, a.created_at, o.order_no, o.po_number, o.service_type,
                c.name AS client_name, s.start_at AS schedule_start,
                count(oo.id)::int AS unit_count,
                (count(*) OVER())::int AS row_total
         FROM assignments a
         JOIN orders o ON o.id = a.order_id
         JOIN clients c ON c.id = o.client_id
         LEFT JOIN schedules s ON s.order_id = o.id
         LEFT JOIN order_objects oo ON oo.order_id = o.id
         WHERE a.inspector_id = $1 AND a.status = 'MENUNGGU'
         GROUP BY a.id, a.order_id, a.created_at, o.order_no, o.po_number, o.service_type, c.name, s.start_at
         ORDER BY a.created_at ASC`
      : isOperationalAdmin
        ? `SELECT a.id, a.order_id, a.created_at, o.order_no, o.po_number, c.name AS client_name, u.full_name AS inspector_name,
                (count(*) OVER())::int AS row_total
         FROM assignments a
         JOIN orders o ON o.id = a.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN users u ON u.id = a.inspector_id
         WHERE a.status = 'MENUNGGU'
         ORDER BY a.created_at ASC
         LIMIT 10`
        : null;

    const { rows: pendingAssignments } = assignmentSql
      ? await query(assignmentSql, isInspector ? [userId] : [])
      : { rows: [] };
    recordTotal(pendingAssignments);
    for (const r of pendingAssignments) {
      queue.push({
        id: `asg-${r.id}`,
        type: 'ASSIGNMENT_CONFIRMATION',
        urgency: 'TINGGI',
        title: isInspector
          ? `Konfirmasi Penugasan Order: ${r.po_number || r.order_no}`
          : `Penugasan Menunggu Konfirmasi: ${r.inspector_name} (${r.order_no})`,
        description: `Klien: ${r.client_name}${r.service_type ? ` · ${r.service_type}` : ''}${r.unit_count ? ` · ${r.unit_count} Unit` : ''}`,
        createdAt: r.created_at,
        actionLabel: isInspector ? 'Tinjau & Terima' : 'Lihat Penugasan',
        link: isInspector ? '/app/dashboard' : '/app/schedule',
        orderId: r.order_id,
        assignmentId: r.id,
        orderNo: r.order_no,
        poNumber: r.po_number,
        clientName: r.client_name,
        serviceType: r.service_type,
        scheduleStart: r.schedule_start,
        unitCount: r.unit_count
      });
    }

    // 3. Form pengujian lapangan masih draf
    const inspectionSql = isInspector
      ? `SELECT i.id, i.order_id, i.created_at, o.order_no, t.name AS object_name, c.name AS client_name,
                (count(*) OVER())::int AS row_total
         FROM inspections i
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $1 AND i.status = 'DRAF'
         ORDER BY i.created_at ASC
         LIMIT 10`
      : isOperationalAdmin
        ? `SELECT i.id, i.order_id, i.created_at, o.order_no, t.name AS object_name, c.name AS client_name, u.full_name AS inspector_name,
                (count(*) OVER())::int AS row_total
         FROM inspections i
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN users u ON u.id = i.inspector_id
         WHERE i.status = 'DRAF'
         ORDER BY i.created_at ASC
         LIMIT 10`
        : null;

    const { rows: draftInspections } = inspectionSql
      ? await query(inspectionSql, isInspector ? [userId] : [])
      : { rows: [] };
    recordTotal(draftInspections);
    for (const r of draftInspections) {
      queue.push({
        id: `insp-${r.id}`,
        type: 'INSPECTION_DRAFT',
        urgency: 'SEDANG',
        title: `Form Uji Belum Selesai: ${r.object_name}`,
        description: `Klien: ${r.client_name} (Order: ${r.order_no})${!isInspector ? ` - Ahli K3: ${r.inspector_name}` : ''}`,
        createdAt: r.created_at,
        actionLabel: isPimpinan ? 'Pantau Inspeksi' : 'Lanjutkan Form',
        link: '/app/inspections'
      });
    }

    // 4. LHPP siap dipratinjau dan difinalisasi Marketing
    const lhppReviewSql = isInspector
      ? `SELECT l.id, l.lhpp_no, l.status, l.created_at, t.name AS object_name, c.name AS client_name,
                (count(*) OVER())::int AS row_total
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $1 AND l.status = 'SIAP_PREVIEW'
         ORDER BY l.created_at ASC`
      : isOperationalAdmin
        ? `SELECT l.id, l.lhpp_no, l.status, l.created_at, t.name AS object_name, c.name AS client_name, u.full_name AS inspector_name,
                (count(*) OVER())::int AS row_total
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN users u ON u.id = i.inspector_id
         WHERE l.status = 'SIAP_PREVIEW'
         ORDER BY l.created_at ASC
         LIMIT 10`
        : null;

    const { rows: waitingLhpp } = lhppReviewSql
      ? await query(lhppReviewSql, isInspector ? [userId] : [])
      : { rows: [] };
    recordTotal(waitingLhpp);
    for (const r of waitingLhpp) {
      queue.push({
        id: `lhpp-rev-${r.id}`,
        type: 'LHPP_REVIEW',
        urgency: 'TINGGI',
        title: `LHPP Siap Finalisasi: ${r.object_name}`,
        description: `Klien: ${r.client_name}${!isInspector ? ` - Ahli K3: ${r.inspector_name}` : ''}`,
        createdAt: r.created_at,
        actionLabel: role === 'ADMIN_KANTOR' || role === 'ADMIN_SISTEM' ? 'Pratinjau & Proses' : 'Pantau Status',
        link: '/app/lhpp'
      });
    }

    // 5. LHPP Dikembalikan dengan Catatan Revisi
    const lhppReturnedSql = isInspector
      ? `SELECT l.id, l.lhpp_no, l.created_at, l.review_notes, t.name AS object_name, c.name AS client_name,
                (count(*) OVER())::int AS row_total
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         WHERE i.inspector_id = $1 AND l.status = 'DIKEMBALIKAN'
         ORDER BY l.updated_at DESC`
      : isOperationalAdmin
        ? `SELECT l.id, l.lhpp_no, l.created_at, l.review_notes, t.name AS object_name, c.name AS client_name, u.full_name AS inspector_name,
                (count(*) OVER())::int AS row_total
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         JOIN orders o ON o.id = i.order_id
         JOIN clients c ON c.id = o.client_id
         JOIN test_objects t ON t.id = i.object_id
         JOIN users u ON u.id = i.inspector_id
         WHERE l.status = 'DIKEMBALIKAN'
         ORDER BY l.updated_at DESC
         LIMIT 10`
        : null;

    const { rows: returnedLhpp } = lhppReturnedSql
      ? await query(lhppReturnedSql, isInspector ? [userId] : [])
      : { rows: [] };
    recordTotal(returnedLhpp);
    for (const r of returnedLhpp) {
      queue.push({
        id: `lhpp-ret-${r.id}`,
        type: 'LHPP_REVISION',
        urgency: 'TINGGI',
        title: `LHPP Perlu Revisi: ${r.object_name}`,
        description: `Catatan: ${r.review_notes || 'Silakan cek catatan perbaikan.'} (Klien: ${r.client_name})`,
        createdAt: r.created_at,
        actionLabel: isPimpinan ? 'Pantau Revisi' : 'Buka & Perbaiki',
        link: '/app/lhpp'
      });
    }

    // 6. Suket K3 mendekati kedaluwarsa (<= 30 hari)
    if (!isInspector && (isOperationalAdmin || isMarketing)) {
      const { rows: expiringSuket } = await query(`
        SELECT s.id, s.suket_no, s.valid_until, t.name AS object_name, c.name AS client_name,
               (s.valid_until - CURRENT_DATE)::int AS days_remaining,
               (count(*) OVER())::int AS row_total
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
      recordTotal(expiringSuket);
      for (const r of expiringSuket) {
        queue.push({
          id: `suket-${r.id}`,
          type: 'SUKET_EXPIRING',
          urgency: r.days_remaining <= 7 ? 'TINGGI' : 'SEDANG',
          title: `Suket K3 Kedaluwarsa dlm ${r.days_remaining} Hari: ${r.suket_no}`,
          description: `Objek: ${r.object_name} - Klien: ${r.client_name}`,
          createdAt: r.valid_until,
          actionLabel: isMarketing ? 'Hubungi Klien' : 'Tinjau Suket',
          link: isMarketing ? '/app/reminders' : '/app/suket'
        });
      }
    }

    // 7. BAP draf perlu diproses (Admin Kantor & Admin Sistem)
    if (isOperationalAdmin) {
      const { rows: draftBap } = await query(`
        SELECT b.id, b.bap_no, b.created_at,
               t.name AS object_name, c.name AS client_name, o.order_no, o.po_number,
               (count(*) OVER())::int AS row_total
        FROM bap_documents b
        JOIN inspections i ON i.id = b.inspection_id
        JOIN orders o ON o.id = b.order_id
        JOIN clients c ON c.id = o.client_id
        JOIN test_objects t ON t.id = b.object_id
        WHERE b.status = 'DRAF'
        ORDER BY b.created_at ASC
        LIMIT 10
      `).catch(() => ({ rows: [] }));
      recordTotal(draftBap);
      for (const r of draftBap) {
        queue.push({
          id: `bap-${r.id}`,
          type: 'BAP_PROCESSING',
          urgency: 'TINGGI',
          title: `BAP Perlu Diproses & TTD: ${r.object_name}`,
          description: `Klien: ${r.client_name} (PO: ${r.po_number || r.order_no})`,
          createdAt: r.created_at,
          actionLabel: isPimpinan ? 'Pantau BAP' : 'Buka BAP',
          link: '/app/bap'
        });
      }
    }

    // 8. Suket Disnaker belum dicatat untuk LHPP yang sudah terbit (Admin Kantor & Admin Sistem)
    if (isOperationalAdmin) {
      const { rows: pendingSuket } = await query(`
        SELECT l.id AS lhpp_id, l.lhpp_no, l.created_at,
               t.name AS object_name, c.name AS client_name, o.order_no, o.po_number,
               (count(*) OVER())::int AS row_total
        FROM lhpp_documents l
        JOIN inspections i ON i.id = l.inspection_id
        JOIN orders o ON o.id = i.order_id
        JOIN clients c ON c.id = o.client_id
        JOIN test_objects t ON t.id = i.object_id
        LEFT JOIN suket_documents s ON s.lhpp_id = l.id
        WHERE l.status IN ('FINAL', 'TERBIT') AND s.id IS NULL
        ORDER BY l.created_at ASC
        LIMIT 10
      `).catch(() => ({ rows: [] }));
      recordTotal(pendingSuket);
      for (const r of pendingSuket) {
        queue.push({
          id: `suket-pen-${r.lhpp_id}`,
          type: 'SUKET_RECORDING',
          urgency: 'SEDANG',
          title: `Suket Disnaker Belum Dicatat: ${r.object_name}`,
          description: `LHPP ${r.lhpp_no || '-'} terbit tapi belum memiliki registrasi Suket (Klien: ${r.client_name})`,
          createdAt: r.created_at,
          actionLabel: isPimpinan ? 'Pantau Suket' : 'Catat Suket',
          link: '/app/suket'
        });
      }
    }

    // 9. Dokumen siap didistribusikan (Admin Kantor & Admin Sistem)
    if (isOperationalAdmin) {
      const { rows: pendingDist } = await query(`
        SELECT d.id, d.document_type, d.document_no, d.status AS dist_status,
               d.recipient_name, d.target_destination, d.created_at,
               t.name AS object_name, c.name AS client_name, o.po_number, o.order_no,
               (count(*) OVER())::int AS row_total
        FROM document_distributions d
        JOIN orders o ON o.id = d.order_id
        JOIN clients c ON c.id = o.client_id
        JOIN test_objects t ON t.id = d.object_id
        WHERE d.status IN ('BELUM_DIKIRIM', 'SIAP_DIKIRIM')
        ORDER BY d.created_at ASC
        LIMIT 10
      `).catch(() => ({ rows: [] }));
      recordTotal(pendingDist);
      for (const r of pendingDist) {
        queue.push({
          id: `dist-${r.id}`,
          type: 'DOCUMENT_DISTRIBUTION',
          urgency: 'SEDANG',
          title: `Dokumen Siap Dikirim: ${r.document_type} ${r.document_no}`,
          description: `Tujuan: ${r.target_destination} (${r.recipient_name}) · Klien: ${r.client_name}`,
          createdAt: r.created_at,
          actionLabel: isPimpinan ? 'Pantau Distribusi' : 'Proses Kirim',
          link: '/app/distributions'
        });
      }
    }

    // 10. Kendala operasional lapangan terbuka (Admin Kantor, Marketing & Admin Sistem)
    if (isOperationalAdmin || isMarketing) {
      const { rows: openIssues } = await query(`
        SELECT oi.id, oi.issue_no, oi.issue_type, oi.priority, oi.title, oi.created_at,
               c.name AS client_name, o.po_number, o.order_no,
               (count(*) OVER())::int AS row_total
        FROM operational_issues oi
        JOIN orders o ON o.id = oi.order_id
        JOIN clients c ON c.id = o.client_id
        WHERE oi.status IN ('DILAPORKAN', 'MENUNGGU_TINDAK_LANJUT')
        ORDER BY CASE WHEN oi.priority = 'TINGGI' THEN 0 WHEN oi.priority = 'NORMAL' THEN 1 ELSE 2 END ASC, oi.created_at ASC
        LIMIT 10
      `).catch(() => ({ rows: [] }));
      recordTotal(openIssues);
      for (const r of openIssues) {
        queue.push({
          id: `issue-${r.id}`,
          type: 'OPERATIONAL_ISSUE',
          urgency: r.priority === 'TINGGI' ? 'TINGGI' : 'SEDANG',
          title: `Kendala Lapangan: ${r.title}`,
          description: `${r.issue_type} · Klien: ${r.client_name} (PO: ${r.po_number || r.order_no})`,
          createdAt: r.created_at,
          actionLabel: isPimpinan ? 'Pantau Kendala' : 'Tindak Lanjuti',
          link: '/app/issues'
        });
      }
    }

    // Antrean berlabel "tindakan prioritas": pastikan yang berurgensi TINGGI
    // tampil lebih dulu, lalu yang paling lama menunggu (FIFO) di dalam tiap tingkat.
    const urgencyRank = { TINGGI: 0, SEDANG: 1, RENDAH: 2 };
    queue.sort((a, b) => {
      const byUrgency = (urgencyRank[a.urgency] ?? 9) - (urgencyRank[b.urgency] ?? 9);
      if (byUrgency !== 0) return byUrgency;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

    return res.json({
      total: availableTotal,
      shown: queue.length,
      truncated: availableTotal > queue.length,
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
  async (req, res, next) => {
    try {
      const { status, serviceType, category, search, period } = req.query;
      const conds = [];
      const params = [];

      if (status) {
        params.push(String(status));
        conds.push(`o.status = $${params.length}`);
      }
      if (serviceType) {
        params.push(String(serviceType));
        conds.push(`o.service_type = $${params.length}`);
      }
      if (category) {
        params.push(String(category));
        conds.push(`oc.code = $${params.length}`);
      }
      if (search) {
        params.push(`%${String(search).trim()}%`);
        conds.push(
          `(o.order_no ILIKE $${params.length} OR o.po_number ILIKE $${params.length} OR c.name ILIKE $${params.length} OR t.name ILIKE $${params.length})`
        );
      }
      const p = String(period || '').toUpperCase();
      if (p === '7D') {
        conds.push(`o.created_at >= now() - interval '7 days'`);
      } else if (p === '30D') {
        conds.push(`o.created_at >= now() - interval '30 days'`);
      } else if (p === '90D') {
        conds.push(`o.created_at >= now() - interval '90 days'`);
      } else if (p === '1Y') {
        conds.push(`o.created_at >= now() - interval '1 year'`);
      }

      const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

      const { rows } = await query(
        `
        SELECT o.order_no, o.po_number, o.status AS order_status, o.service_type,
               c.name AS client_name,
               oc.code AS category_code,
               t.name AS object_name, t.serial_number,
               oo.unit_status,
               u.full_name AS inspector_name,
               i.conclusion,
               b.bap_no, b.status AS bap_status,
               l.lhpp_no, l.status AS lhpp_status,
               s.suket_no, s.valid_until AS suket_valid_until
        FROM orders o
        JOIN clients c ON c.id = o.client_id
        JOIN order_objects oo ON oo.order_id = o.id
        JOIN test_objects t ON t.id = oo.object_id
        JOIN object_categories oc ON oc.id = t.category_id
        LEFT JOIN inspections i ON i.order_id = o.id AND i.object_id = t.id
        LEFT JOIN users u ON u.id = COALESCE(i.inspector_id, oo.inspector_id)
        LEFT JOIN bap_documents b ON b.order_id = o.id AND b.object_id = t.id
        LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
        LEFT JOIN suket_documents s ON s.lhpp_id = l.id
        ${whereSql}
        ORDER BY o.created_at DESC
      `,
        params
      );

      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = [
        'Nomor Order',
        'Nomor PO',
        'Status Order',
        'Jenis Layanan',
        'Nama Klien',
        'Kategori',
        'Nama Objek',
        'Nomor Seri',
        'Status Unit',
        'Ahli K3 / Inspektor',
        'Kesimpulan Inspeksi',
        'Nomor BAP',
        'Status BAP',
        'Nomor LHPP',
        'Status LHPP',
        'Nomor Suket K3',
        'Masa Berlaku Suket'
      ].join(',');

      const lines = rows.map((r) =>
        [
          r.order_no,
          r.po_number || '-',
          r.order_status,
          r.service_type,
          r.client_name,
          r.category_code,
          r.object_name,
          r.serial_number,
          r.unit_status || '-',
          r.inspector_name || '-',
          r.conclusion || '-',
          r.bap_no || '-',
          r.bap_status || '-',
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
