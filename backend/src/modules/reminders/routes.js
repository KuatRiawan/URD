import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { dispatchClientReminders } from '../../services/client-reminders.js';
import { channelStatus } from '../../services/notifier.js';
import { notifyRoles } from '../../services/notify.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate, authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN'));

const STAGES = [
  { code: 'H0', maxDays: 0, label: 'Kedaluwarsa / Hari Ini' },
  { code: 'H14', maxDays: 14, label: 'H-14' },
  { code: 'H30', maxDays: 30, label: 'H-30' },
  { code: 'H60', maxDays: 60, label: 'H-60' },
  { code: 'H90', maxDays: 90, label: 'H-90' }
];

const unitValiditySchema = Joi.object({
  nextInspectionDate: Joi.date().iso().allow('', null),
  validityNotes: Joi.string().max(500).allow('', null),
  followupStatus: Joi.string()
    .valid('BELUM_DITINDAKLANJUTI', 'SUDAH_DIHUBUNGI', 'MENUNGGU_KONFIRMASI_KLIEN', 'SUDAH_JADI_PO_BARU', 'TERJADWAL', 'DITUNDA')
    .allow('', null),
  note: Joi.string().max(500).allow('', null)
});

export function resolveStage(daysRemaining) {
  if (daysRemaining === null || daysRemaining === undefined || daysRemaining > 90) return null;
  if (daysRemaining <= 0) return STAGES[0];
  if (daysRemaining <= 14) return STAGES[1];
  if (daysRemaining <= 30) return STAGES[2];
  if (daysRemaining <= 60) return STAGES[3];
  return STAGES[4];
}

export function resolveExpiryState(daysRemaining, windowDays = 90) {
  if (daysRemaining === null || daysRemaining === undefined) {
    return 'DATA_MASA_BERLAKU_BELUM_LENGKAP';
  }
  if (daysRemaining < 0) return 'SUDAH_KEDALUWARSA';
  if (daysRemaining === 0) return 'JATUH_TEMPO_PEMERIKSAAN';
  if (daysRemaining <= windowDays) return 'AKAN_KEDALUWARSA';
  return 'MASIH_BERLAKU';
}

export async function dispatchDueReminders() {
  return withTransaction(async (db) => {
    const { rows: sukets } = await db.query(
      `SELECT s.id, s.suket_no, s.valid_until,
              (s.valid_until - CURRENT_DATE)::int AS days_remaining,
              t.name AS object_name, c.name AS client_name
       FROM suket_documents s
       JOIN test_objects t ON t.id = s.object_id
       JOIN clients c ON c.id = t.client_id
       WHERE s.status = 'TERBIT'
         AND s.valid_until IS NOT NULL
         AND (s.valid_until - CURRENT_DATE) <= 90`
    );

    const dispatched = [];

    for (const s of sukets) {
      const stage = resolveStage(s.days_remaining);
      if (!stage) continue;

      const { rowCount } = await db.query(
        `INSERT INTO reminder_dispatches (target_type, target_id, stage)
         VALUES ('SUKET', $1, $2)
         ON CONFLICT (target_type, target_id, stage) DO NOTHING`,
        [s.id, stage.code]
      );

      if (rowCount > 0) {
        dispatched.push({ targetType: 'SUKET', targetId: s.id, stage: stage.code });
        await notifyRoles(
          {
            roles: ['ADMIN_KANTOR', 'PIMPINAN'],
            type: `REMINDER_SUKET_${stage.code}`,
            title: `[${stage.label}] Perpanjangan Suket K3: ${s.object_name}`,
            body: `Klien: ${s.client_name} | Nomor Suket: ${s.suket_no} | Berlaku s/d ${
              new Date(s.valid_until).toISOString().slice(0, 10)
            }`,
            link: `/app/reminders`
          },
          db
        );
      }
    }

    // M5-07: Pengingat sertifikat kompetensi Ahli K3 yang akan kedaluwarsa
    const { rows: comps } = await db.query(
      `SELECT ic.id, ic.certificate_no, ic.valid_until,
              (ic.valid_until - CURRENT_DATE)::int AS days_remaining,
              u.full_name, oc.code AS category_code
       FROM inspector_competencies ic
       JOIN users u ON u.id = ic.inspector_id
       JOIN object_categories oc ON oc.id = ic.category_id
       WHERE (ic.valid_until - CURRENT_DATE) <= 90`
    );

    for (const c of comps) {
      const stage = resolveStage(c.days_remaining);
      if (!stage) continue;

      const { rowCount } = await db.query(
        `INSERT INTO reminder_dispatches (target_type, target_id, stage)
         VALUES ('KOMPETENSI', $1, $2)
         ON CONFLICT (target_type, target_id, stage) DO NOTHING`,
        [c.id, stage.code]
      );
      if (rowCount > 0) {
        dispatched.push({ targetType: 'KOMPETENSI', targetId: c.id, stage: stage.code });
        await notifyRoles(
          {
            roles: ['ADMIN_KANTOR', 'PIMPINAN'],
            type: `REMINDER_KOMPETENSI_${stage.code}`,
            title: `[${stage.label}] Sertifikat Ahli K3 (${c.category_code}): ${c.full_name}`,
            body: `No. Sertifikat: ${c.certificate_no} berakhir pada ${
              new Date(c.valid_until).toISOString().slice(0, 10)
            }`,
            link: `/app/schedule`
          },
          db
        );
      }
    }

    return dispatched;
  });
}

// M5-04 & Bagian 10: Dasbor Pengingat Perpanjangan & Masa Berlaku Unit
router.get('/', async (req, res, next) => {
  try {
    const windowDays = Number(req.query.days || 90);
    const clientId = (req.query.clientId || '').trim();
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const followupStatus = (req.query.followupStatus || '').trim();

    const conds = ["s.status = 'TERBIT'", 's.valid_until IS NOT NULL'];
    const params = [windowDays];
    conds.push(`(s.valid_until - CURRENT_DATE) <= $1`);

    if (clientId) {
      params.push(clientId);
      conds.push(`c.id = $${params.length}`);
    }
    if (categoryId) {
      params.push(categoryId);
      conds.push(`t.category_id = $${params.length}`);
    }
    if (followupStatus) {
      params.push(followupStatus);
      conds.push(`s.followup_status = $${params.length}`);
    }

    const { rows: suketItems } = await query(
      `SELECT s.*,
              (s.valid_until - CURRENT_DATE)::int AS days_remaining,
              t.name AS object_name, t.serial_number, t.category_id,
              oc.code AS category_code, oc.name AS category_name,
              c.id AS client_id, c.name AS client_name, c.phone AS client_phone,
              (SELECT rf.note FROM renewal_followups rf WHERE rf.suket_id = s.id ORDER BY rf.created_at DESC LIMIT 1) AS last_followup_note
       FROM suket_documents s
       JOIN test_objects t ON t.id = s.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN clients c ON c.id = t.client_id
       WHERE ${conds.join(' AND ')}
       ORDER BY s.valid_until ASC`,
      params
    );

    // Query unit reminders termasuk unit yang belum memiliki tanggal masa berlaku (Bagian 10)
    const unitConds = ['t.is_active = true'];
    const unitParams = [];
    if (clientId) {
      unitParams.push(clientId);
      unitConds.push(`c.id = $${unitParams.length}`);
    }
    if (categoryId) {
      unitParams.push(categoryId);
      unitConds.push(`t.category_id = $${unitParams.length}`);
    }

    const { rows: rawUnits } = await query(
      `SELECT t.id AS object_id, t.name AS object_name, t.serial_number, t.brand, t.manufacturer,
              t.capacity, t.install_location, t.next_inspection_date, t.validity_notes,
              oc.id AS category_id, oc.code AS category_code, oc.name AS category_name,
              c.id AS client_id, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
              (SELECT cc.name FROM client_contacts cc WHERE cc.client_id = c.id ORDER BY cc.created_at DESC LIMIT 1) AS contact_name,
              COALESCE((SELECT cc.phone FROM client_contacts cc WHERE cc.client_id = c.id ORDER BY cc.created_at DESC LIMIT 1), c.phone) AS contact_phone,
              COALESCE((SELECT cc.email FROM client_contacts cc WHERE cc.client_id = c.id ORDER BY cc.created_at DESC LIMIT 1), c.email) AS contact_email,
              lat_suket.id AS suket_id, lat_suket.suket_no, lat_suket.valid_until AS suket_valid_until,
              lat_suket.followup_status AS suket_followup_status,
              lat_insp.id AS last_inspection_id, lat_insp.inspected_at AS last_inspected_at,
              lat_insp.order_no AS last_order_no, lat_insp.po_number AS last_po_number,
              lat_insp.lhpp_no AS last_lhpp_no, lat_insp.recommended_valid_until,
              COALESCE(lat_suket.valid_until, t.next_inspection_date, lat_insp.recommended_valid_until) AS effective_valid_until,
              (COALESCE(lat_suket.valid_until, t.next_inspection_date, lat_insp.recommended_valid_until) - CURRENT_DATE)::int AS days_remaining,
              COALESCE(
                (SELECT rf.status::text FROM renewal_followups rf WHERE rf.object_id = t.id OR rf.suket_id = lat_suket.id ORDER BY rf.created_at DESC LIMIT 1),
                lat_suket.followup_status::text,
                'BELUM_DIHUBUNGI'
              ) AS followup_status,
              (SELECT rf.note FROM renewal_followups rf WHERE rf.object_id = t.id OR rf.suket_id = lat_suket.id ORDER BY rf.created_at DESC LIMIT 1) AS last_followup_note
       FROM test_objects t
       JOIN clients c ON c.id = t.client_id
       JOIN object_categories oc ON oc.id = t.category_id
       LEFT JOIN LATERAL (
         SELECT s.*
         FROM suket_documents s
         WHERE s.object_id = t.id AND s.status = 'TERBIT'
         ORDER BY s.valid_until DESC NULLS LAST, s.created_at DESC
         LIMIT 1
       ) lat_suket ON true
       LEFT JOIN LATERAL (
         SELECT i.id, i.inspected_at, o.order_no, o.po_number, l.lhpp_no, l.recommended_valid_until
         FROM inspections i
         JOIN orders o ON o.id = i.order_id
         LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
         WHERE i.object_id = t.id
         ORDER BY i.created_at DESC
         LIMIT 1
       ) lat_insp ON true
       WHERE ${unitConds.join(' AND ')}
       ORDER BY effective_valid_until ASC NULLS FIRST, t.created_at DESC`,
      unitParams
    );

    const unitReminders = rawUnits
      .map((u) => {
        const expiryState = resolveExpiryState(u.days_remaining, windowDays);
        return {
          ...u,
          stage: resolveStage(u.days_remaining)?.code || null,
          expiryState,
          urgency: expiryState
        };
      })
      .filter((u) => {
        if (followupStatus && u.followup_status !== followupStatus) return false;
        return (
          u.expiryState === 'DATA_MASA_BERLAKU_BELUM_LENGKAP' ||
          u.days_remaining === null ||
          u.days_remaining <= windowDays
        );
      });

    const missingValidityItems = unitReminders.filter(
      (u) => u.expiryState === 'DATA_MASA_BERLAKU_BELUM_LENGKAP'
    );

    const { rows: competencyItems } = await query(
      `SELECT ic.*,
              (ic.valid_until - CURRENT_DATE)::int AS days_remaining,
              u.full_name AS inspector_name,
              oc.code AS category_code, oc.name AS category_name
       FROM inspector_competencies ic
       JOIN users u ON u.id = ic.inspector_id
       JOIN object_categories oc ON oc.id = ic.category_id
       WHERE (ic.valid_until - CURRENT_DATE) <= $1
       ORDER BY ic.valid_until ASC`,
      [windowDays]
    );

    return res.json({
      suketItems: suketItems.map((item) => ({
        ...item,
        stage: resolveStage(item.days_remaining)?.code || null,
        expiryState: resolveExpiryState(item.days_remaining, windowDays)
      })),
      unitReminders,
      missingValidityItems,
      competencyItems: competencyItems.map((item) => ({
        ...item,
        stage: resolveStage(item.days_remaining)?.code || null
      }))
    });
  } catch (err) {
    return next(err);
  }
});

// Perbarui tanggal masa berlaku resmi atau status tindak lanjut pada unit alat
router.patch(
  '/units/:objectId/validity',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(unitValiditySchema),
  async (req, res, next) => {
    try {
      const { objectId } = req.params;
      const { nextInspectionDate, validityNotes, followupStatus, note } = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `UPDATE test_objects
           SET next_inspection_date = COALESCE($1, next_inspection_date),
               validity_notes = COALESCE($2, validity_notes),
               updated_at = now()
           WHERE id = $3
           RETURNING *`,
          [nextInspectionDate || null, validityNotes || null, objectId]
        );
        if (!rows[0]) throw new AppError(404, 'OBJECT_NOT_FOUND', 'Unit alat tidak ditemukan.');

        if (followupStatus) {
          await db.query(
            `INSERT INTO renewal_followups (object_id, status, note, recorded_by)
             VALUES ($1, $2, $3, $4)`,
            [objectId, followupStatus, note || validityNotes || null, req.user.id]
          );
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'UNIT_VALIDITY_UPDATE',
            entity: 'test_objects',
            entityId: objectId,
            summary: { nextInspectionDate, followupStatus },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.json({ object: updated });
    } catch (err) {
      return next(err);
    }
  }
);

// Buat PO / Order Perpanjangan langsung dari unit alat
router.post(
  '/units/:objectId/create-renewal-order',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  async (req, res, next) => {
    try {
      const { objectId } = req.params;
      const poNumberInput = req.body?.poNumber ? String(req.body.poNumber).trim() : null;

      const createdOrder = await withTransaction(async (db) => {
        const { rows: objRows } = await db.query(
          `SELECT t.*, oc.default_bap_scopes
           FROM test_objects t
           JOIN object_categories oc ON oc.id = t.category_id
           WHERE t.id = $1`,
          [objectId]
        );
        const obj = objRows[0];
        if (!obj) throw new AppError(404, 'OBJECT_NOT_FOUND', 'Unit alat tidak ditemukan.');

        const seqRes = await db.query("SELECT nextval('order_no_seq') AS seq");
        const now = new Date();
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const orderNo = `ORD/${ym}/${String(seqRes.rows[0].seq).padStart(4, '0')}`;
        const poNumber = poNumberInput || `PO-RENEW-${orderNo.replace(/\//g, '-')}`;

        const { rows } = await db.query(
          `INSERT INTO orders
             (order_no, po_number, po_date, client_id, location_id, service_type, source, requested_date, notes, created_by)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, 'PERPANJANGAN', 'TELEPON', $5, $6, $7)
           RETURNING *`,
          [
            orderNo,
            poNumber,
            obj.client_id,
            obj.location_id || null,
            obj.next_inspection_date || now.toISOString().slice(0, 10),
            `PO Perpanjangan Riksa Uji untuk unit ${obj.name} (${obj.serial_number})`,
            req.user.id
          ]
        );
        const order = rows[0];

        const defaultScopes = Array.isArray(obj.default_bap_scopes) ? obj.default_bap_scopes : [];
        await db.query(
          `INSERT INTO order_objects (order_id, object_id, unit_status, scope_items)
           VALUES ($1, $2, 'BELUM_DIJADWALKAN', $3::jsonb)`,
          [order.id, obj.id, JSON.stringify(defaultScopes)]
        );

        await db.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
           VALUES ($1, NULL, 'ORDER_BARU', 'PO perpanjangan dibuat dari pengingat masa berlaku unit', $2)`,
          [order.id, req.user.id]
        );

        await db.query(
          `INSERT INTO renewal_followups (object_id, status, note, recorded_by)
           VALUES ($1, 'SUDAH_JADI_PO_BARU', $2, $3)`,
          [obj.id, `PO perpanjangan dibuat: ${order.po_number} (${order.order_no})`, req.user.id]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'UNIT_RENEWAL_ORDER_CREATE',
            entity: 'orders',
            entityId: order.id,
            summary: { orderNo: order.order_no, poNumber: order.po_number, objectId },
            ip: req.ip
          },
          db
        );

        return order;
      });

      return res.status(201).json({ order: createdOrder });
    } catch (err) {
      return next(err);
    }
  }
);

// Jalankan evaluasi pengingat (idempoten, anti-duplikasi)
router.post('/run-dispatch', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'), async (_req, res, next) => {
  try {
    const dispatched = await dispatchDueReminders();
    const clientReminders = await dispatchClientReminders();
    return res.json({ dispatchedCount: dispatched.length, dispatched, clientReminders });
  } catch (err) {
    return next(err);
  }
});

// Status kanal pengiriman ke klien (AKTIF bila kredensial terpasang, selain itu SIMULASI)
router.get('/client-channels', (_req, res) => res.json(channelStatus()));

// Riwayat pengiriman pengingat otomatis ke klien
router.get('/client-log', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const { rows } = await query(
      `SELECT l.id, l.stage, l.channel, l.status, l.recipient, l.error_message, l.attempts,
              l.valid_until, l.created_at, l.updated_at,
              t.name AS object_name, t.serial_number, c.name AS client_name
       FROM client_reminder_log l
       JOIN test_objects t ON t.id = l.object_id
       JOIN clients c ON c.id = t.client_id
       ORDER BY l.updated_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.json({ items: rows });
  } catch (err) {
    return next(err);
  }
});

// M5-05: Tombol cepat membuat order perpanjangan dari pengingat Suket K3
router.post(
  '/:suketId/create-renewal-order',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  async (req, res, next) => {
    try {
      const { suketId } = req.params;
      const createdOrder = await withTransaction(async (db) => {
        const { rows: sRows } = await db.query(
          `SELECT s.*, t.client_id, t.location_id, oc.default_bap_scopes
           FROM suket_documents s
           JOIN test_objects t ON t.id = s.object_id
           JOIN object_categories oc ON oc.id = t.category_id
           WHERE s.id = $1`,
          [suketId]
        );
        const suket = sRows[0];
        if (!suket) throw new AppError(404, 'SUKET_NOT_FOUND', 'Data Suket K3 tidak ditemukan.');

        const seqRes = await db.query("SELECT nextval('order_no_seq') AS seq");
        const now = new Date();
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const orderNo = `ORD/${ym}/${String(seqRes.rows[0].seq).padStart(4, '0')}`;
        const poNumber = `PO-RENEW-${orderNo.replace(/\//g, '-')}`;

        const { rows } = await db.query(
          `INSERT INTO orders
             (order_no, po_number, po_date, client_id, location_id, service_type, source, requested_date, notes, renewal_of_suket, created_by)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, 'PERPANJANGAN', 'TELEPON', $5, $6, $7, $8)
           RETURNING *`,
          [
            orderNo,
            poNumber,
            suket.client_id,
            suket.location_id || null,
            suket.valid_until || null,
            `Order perpanjangan dari Suket K3 ${suket.suket_no || ''}`.trim(),
            suket.id,
            req.user.id
          ]
        );
        const order = rows[0];

        const defaultScopes = Array.isArray(suket.default_bap_scopes) ? suket.default_bap_scopes : [];
        await db.query(
          `INSERT INTO order_objects (order_id, object_id, unit_status, scope_items)
           VALUES ($1, $2, 'BELUM_DIJADWALKAN', $3::jsonb)`,
          [order.id, suket.object_id, JSON.stringify(defaultScopes)]
        );
        await db.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
           VALUES ($1, NULL, 'ORDER_BARU', 'Order perpanjangan dibuat dari dasbor pengingat', $2)`,
          [order.id, req.user.id]
        );
        await db.query(
          "UPDATE suket_documents SET followup_status = 'TERJADWAL', updated_at = now() WHERE id = $1",
          [suket.id]
        );
        await db.query(
          `INSERT INTO renewal_followups (suket_id, object_id, status, note, recorded_by)
           VALUES ($1, $2, 'TERJADWAL', $3, $4)`,
          [suket.id, suket.object_id, `Order perpanjangan dibuat: ${order.order_no}`, req.user.id]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'RENEWAL_ORDER_CREATE',
            entity: 'orders',
            entityId: order.id,
            summary: { orderNo: order.order_no, suketId },
            ip: req.ip
          },
          db
        );
        return order;
      });

      return res.status(201).json({ order: createdOrder });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
