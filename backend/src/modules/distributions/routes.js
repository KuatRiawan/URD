import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { pool, query, withTransaction } from '../../database/pool.js';
import { recordAudit } from '../../services/audit.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const createDistributionSchema = Joi.object({
  documentType: Joi.string().valid('BAP', 'LHPP').required(),
  documentId: Joi.string().uuid().required(),
  documentNo: Joi.string().required(),
  orderId: Joi.string().uuid().required(),
  objectId: Joi.string().uuid().required(),
  targetDestination: Joi.string().valid('KLIEN', 'DISNAKER', 'LAINNYA').required(),
  recipientName: Joi.string().required(),
  dispatchDate: Joi.date().iso().default(() => new Date()),
  dispatchMedia: Joi.string()
    .valid('EMAIL', 'WHATSAPP', 'KURIR_FISIK', 'LANGSUNG', 'PORTAL', 'LAINNYA')
    .required(),
  trackingReference: Joi.string().allow('', null),
  status: Joi.string()
    .valid('BELUM_DIKIRIM', 'SIAP_DIKIRIM', 'DIKIRIM', 'DITERIMA', 'PERLU_KIRIM_ULANG')
    .default('SIAP_DIKIRIM'),
  notes: Joi.string().allow('', null)
});

const updateDistributionStatusSchema = Joi.object({
  status: Joi.string()
    .valid('BELUM_DIKIRIM', 'SIAP_DIKIRIM', 'DIKIRIM', 'DITERIMA', 'PERLU_KIRIM_ULANG')
    .required(),
  trackingReference: Joi.string().allow('', null),
  dispatchMedia: Joi.string()
    .valid('EMAIL', 'WHATSAPP', 'KURIR_FISIK', 'LANGSUNG', 'PORTAL', 'LAINNYA'),
  notes: Joi.string().allow('', null)
});

// GET /api/v1/distributions - Daftar pelacakan distribusi dokumen
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;

    const {
      orderId,
      objectId,
      targetDestination,
      documentType,
      status,
      q
    } = req.query;

    const whereClauses = [];
    const params = [];

    if (orderId) {
      params.push(orderId);
      whereClauses.push(`d.order_id = $${params.length}`);
    }

    if (objectId) {
      params.push(objectId);
      whereClauses.push(`d.object_id = $${params.length}`);
    }

    if (targetDestination) {
      params.push(targetDestination);
      whereClauses.push(`d.target_destination = $${params.length}`);
    }

    if (documentType) {
      params.push(documentType);
      whereClauses.push(`d.document_type = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`d.status = $${params.length}`);
    }

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      whereClauses.push(
        `(d.document_no ILIKE $${params.length} OR d.recipient_name ILIKE $${params.length} OR o.po_number ILIKE $${params.length} OR c.name ILIKE $${params.length} OR t.name ILIKE $${params.length} OR t.serial_number ILIKE $${params.length})`
      );
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM document_distributions d
       JOIN orders o ON o.id = d.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = d.object_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT d.*,
              o.order_no, o.po_number,
              c.name AS client_name,
              t.name AS object_name, t.serial_number,
              u.full_name AS dispatched_by_name
       FROM document_distributions d
       JOIN orders o ON o.id = d.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = d.object_id
       LEFT JOIN users u ON u.id = d.dispatched_by
       ${whereSql}
       ORDER BY d.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      items: rows,
      total: countRes.rows[0].total,
      page,
      limit
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/v1/distributions/summary - Ringkasan metrik distribusi
router.get('/summary', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT
         count(*)::int AS total_records,
         count(*) FILTER (WHERE status = 'SIAP_DIKIRIM')::int AS ready_to_dispatch,
         count(*) FILTER (WHERE status = 'DIKIRIM')::int AS dispatched,
         count(*) FILTER (WHERE status = 'DITERIMA')::int AS received,
         count(*) FILTER (WHERE target_destination = 'KLIEN' AND document_type = 'BAP')::int AS bap_client_total,
         count(*) FILTER (WHERE target_destination = 'DISNAKER' AND document_type = 'LHPP')::int AS lhpp_disnaker_total,
         count(*) FILTER (WHERE target_destination = 'DISNAKER' AND document_type = 'BAP')::int AS bap_disnaker_total
       FROM document_distributions`
    );
    return res.json({ summary: rows[0] });
  } catch (err) {
    return next(err);
  }
});

// POST /api/v1/distributions - Catat pengiriman dokumen baru
router.post(
  '/',
  authorize('MARKETING', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(createDistributionSchema),
  async (req, res, next) => {
    try {
      const {
        documentType,
        documentId,
        documentNo,
        orderId,
        objectId,
        targetDestination,
        recipientName,
        dispatchDate,
        dispatchMedia,
        trackingReference,
        status,
        notes
      } = req.body;

      const result = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `INSERT INTO document_distributions
             (document_type, document_id, document_no, order_id, object_id,
              target_destination, recipient_name, dispatch_date, dispatch_media,
              tracking_reference, status, notes, dispatched_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING *`,
          [
            documentType,
            documentId,
            documentNo,
            orderId,
            objectId,
            targetDestination,
            recipientName,
            dispatchDate || new Date(),
            dispatchMedia,
            trackingReference || null,
            status || 'SIAP_DIKIRIM',
            notes || null,
            req.user.id
          ]
        );

        // Update status unit jika dokumen mulai didistribusikan
        if (status === 'DIKIRIM') {
          await db.query(
            `UPDATE order_objects
             SET unit_status = 'SEBAGIAN_DOKUMEN_DIKIRIM', updated_at = now()
             WHERE order_id = $1 AND object_id = $2 AND unit_status IN ('BAP_FINAL', 'SIAP_DISTRIBUSI')`,
            [orderId, objectId]
          );
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'DOCUMENT_DISTRIBUTION_CREATE',
            entity: 'document_distributions',
            entityId: rows[0].id,
            summary: {
              documentType,
              documentNo,
              targetDestination,
              status
            },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.status(201).json({ distribution: result });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /api/v1/distributions/:id/status - Perbarui status pengiriman
router.patch(
  '/:id/status',
  authorize('MARKETING', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(updateDistributionStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, trackingReference, dispatchMedia, notes } = req.body;

      const result = await withTransaction(async (db) => {
        const cur = await db.query(
          'SELECT * FROM document_distributions WHERE id = $1',
          [id]
        );
        if (!cur.rows.length) {
          throw new AppError(404, 'DISTRIBUTION_NOT_FOUND', 'Catatan distribusi tidak ditemukan.');
        }

        const { rows } = await db.query(
          `UPDATE document_distributions
           SET status = $1,
               tracking_reference = COALESCE($2, tracking_reference),
               dispatch_media = COALESCE($3, dispatch_media),
               notes = COALESCE($4, notes),
               updated_at = now()
           WHERE id = $5
           RETURNING *`,
          [status, trackingReference || null, dispatchMedia || null, notes || null, id]
        );

        // Jika status menjadi DITERIMA untuk seluruh distribusi wajib suatu unit, cek apakah unit selesai
        if (status === 'DITERIMA') {
          const remaining = await db.query(
            `SELECT count(*) AS remaining_count
             FROM document_distributions
             WHERE order_id = $1 AND object_id = $2 AND status <> 'DITERIMA'`,
            [rows[0].order_id, rows[0].object_id]
          );
          if (Number(remaining.rows[0].remaining_count) === 0) {
            await db.query(
              `UPDATE order_objects
               SET unit_status = 'SELESAI', updated_at = now()
               WHERE order_id = $1 AND object_id = $2`,
              [rows[0].order_id, rows[0].object_id]
            );
          }
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'DOCUMENT_DISTRIBUTION_UPDATE',
            entity: 'document_distributions',
            entityId: id,
            summary: { status, trackingReference },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.json({ distribution: result });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

