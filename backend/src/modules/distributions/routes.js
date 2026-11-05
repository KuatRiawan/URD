import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { query, withTransaction } from '../../database/pool.js';
import { recordAudit } from '../../services/audit.js';
import { generateBastPdfBuffer } from '../../services/pdf-generator.js';
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

async function validateDistributionDocument(db, input) {
  const documentQuery =
    input.documentType === 'BAP'
      ? `SELECT b.id, b.bap_no AS document_no, b.order_id, b.object_id
         FROM bap_documents b
         WHERE b.id = $1 AND b.status = 'FINAL'`
      : `SELECT l.id, l.lhpp_no AS document_no, i.order_id, i.object_id
         FROM lhpp_documents l
         JOIN inspections i ON i.id = l.inspection_id
         WHERE l.id = $1 AND l.status IN ('FINAL', 'TERBIT')`;
  const { rows } = await db.query(documentQuery, [input.documentId]);
  const document = rows[0];
  if (!document) {
    throw new AppError(
      400,
      'DOCUMENT_NOT_READY',
      `${input.documentType} tidak ditemukan atau belum berstatus final.`
    );
  }
  if (document.document_no !== input.documentNo) {
    throw new AppError(400, 'DOCUMENT_NUMBER_MISMATCH', 'Nomor dokumen tidak sesuai dengan dokumen yang dipilih.');
  }
  if (document.order_id !== input.orderId || document.object_id !== input.objectId) {
    throw new AppError(400, 'DOCUMENT_REFERENCE_MISMATCH', 'Dokumen tidak sesuai dengan PO atau unit yang dipilih.');
  }
  return document;
}

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
              d.target_destination AS recipient_target,
              d.tracking_reference AS tracking_number,
              d.dispatch_date AS dispatched_at,
              CASE WHEN d.document_type = 'BAP' THEN d.document_no ELSE NULL END AS bap_no,
              CASE WHEN d.document_type = 'LHPP' THEN d.document_no ELSE NULL END AS lhpp_no,
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
  authorize('ADMIN_KANTOR', 'ADMIN_SISTEM'),
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
        await validateDistributionDocument(db, {
          documentType,
          documentId,
          documentNo,
          orderId,
          objectId
        });

        const duplicate = await db.query(
          `SELECT id FROM document_distributions
           WHERE document_id = $1
             AND target_destination = $2
             AND lower(btrim(recipient_name)) = lower(btrim($3))
             AND status <> 'PERLU_KIRIM_ULANG'
           LIMIT 1`,
          [documentId, targetDestination, recipientName]
        );
        if (duplicate.rows[0]) {
          throw new AppError(
            409,
            'DISTRIBUTION_DUPLICATE',
            'Dokumen ini sudah memiliki catatan distribusi aktif untuk penerima tersebut.'
          );
        }

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
  authorize('ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(updateDistributionStatusSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, trackingReference, dispatchMedia, notes } = req.body;

      const result = await withTransaction(async (db) => {
        const cur = await db.query(
          'SELECT * FROM document_distributions WHERE id = $1 FOR UPDATE',
          [id]
        );
        if (!cur.rows.length) {
          throw new AppError(404, 'DISTRIBUTION_NOT_FOUND', 'Catatan distribusi tidak ditemukan.');
        }
        const existing = cur.rows[0];
        const nextMedia = dispatchMedia || existing.dispatch_media;
        const nextRef =
          trackingReference !== undefined && String(trackingReference).trim() !== ''
            ? String(trackingReference).trim()
            : existing.tracking_reference;
        const nextNotes =
          notes !== undefined && String(notes).trim() !== ''
            ? String(notes).trim()
            : existing.notes;

        if (status === 'DITERIMA' && !nextRef && !nextNotes) {
          throw new AppError(
            400,
            'DELIVERY_EVIDENCE_REQUIRED',
            'Cantumkan nomor bukti serah terima / resi atau catatan penerima sebelum menandai dokumen DITERIMA.'
          );
        }
        if (status === 'DIKIRIM' && nextMedia === 'KURIR_FISIK' && !nextRef && !nextNotes) {
          throw new AppError(
            400,
            'TRACKING_REFERENCE_REQUIRED',
            'Pengiriman via Kurir Fisik wajib mencantumkan nomor resi/AWB atau keterangan pengiriman.'
          );
        }

        const { rows } = await db.query(
          `UPDATE document_distributions
           SET status = $1,
               tracking_reference = COALESCE($2, tracking_reference),
               dispatch_media = COALESCE($3, dispatch_media),
               notes = COALESCE($4, notes),
               dispatch_date = CASE WHEN $1 IN ('DIKIRIM', 'DITERIMA') THEN COALESCE(dispatch_date, CURRENT_DATE) ELSE dispatch_date END,
               dispatched_by = $5,
               updated_at = now()
           WHERE id = $6
           RETURNING *,
                     target_destination AS recipient_target,
                     tracking_reference AS tracking_number,
                     dispatch_date AS dispatched_at`,
          [status, nextRef || null, nextMedia || null, nextNotes || null, req.user.id, id]
        );

        if (status === 'DIKIRIM') {
          await db.query(
            `UPDATE order_objects
             SET unit_status = 'SEBAGIAN_DOKUMEN_DIKIRIM', updated_at = now()
             WHERE order_id = $1 AND object_id = $2 AND unit_status IN ('BAP_FINAL', 'SIAP_DISTRIBUSI')`,
            [rows[0].order_id, rows[0].object_id]
          );
        }

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

// GET /api/v1/distributions/orders/:orderId/bast/pdf - Unduh Berita Acara Serah Terima (BAST) untuk Order PO
router.get(
  '/orders/:orderId/bast/pdf',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER', 'MARKETING'),
  async (req, res, next) => {
    try {
      const { orderId } = req.params;

      const orderRes = await query(
        `SELECT o.*, c.name AS client_name, c.address AS client_address,
                coalesce(ct.name, '') AS contact_name,
                coalesce(ct.phone, '') AS contact_phone,
                u.full_name AS dispatched_by_name
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         LEFT JOIN LATERAL (
           SELECT name, phone
           FROM client_contacts
           WHERE client_id = c.id
           ORDER BY is_primary DESC NULLS LAST, created_at ASC
           LIMIT 1
         ) ct ON true
         LEFT JOIN users u ON u.id = $2
         WHERE o.id = $1`,
        [orderId, req.user.id]
      );

      if (!orderRes.rows.length) {
        throw new AppError(404, 'ORDER_NOT_FOUND', 'PO tidak ditemukan.');
      }
      const order = orderRes.rows[0];

      // Ambil seluruh unit di PO beserta nomor LHPP, BAP, dan Suket tanpa duplikasi baris
      const { rows: unitRows } = await query(
        `SELECT oo.unit_status,
                t.id AS object_id, t.name AS object_name, t.serial_number,
                oc.code AS category_code, oc.name AS category_name,
                b.bap_no,
                l.lhpp_no,
                s.suket_no, s.valid_until
         FROM order_objects oo
         JOIN test_objects t ON t.id = oo.object_id
         JOIN object_categories oc ON oc.id = t.category_id
         LEFT JOIN LATERAL (
           SELECT bap_no
           FROM bap_documents
           WHERE order_id = oo.order_id AND object_id = oo.object_id AND status = 'FINAL'
           ORDER BY finalized_at DESC NULLS LAST, updated_at DESC
           LIMIT 1
         ) b ON true
         LEFT JOIN LATERAL (
           SELECT lhpp_doc.lhpp_no
           FROM inspections i
           JOIN lhpp_documents lhpp_doc ON lhpp_doc.inspection_id = i.id
           WHERE i.order_id = oo.order_id
             AND i.object_id = oo.object_id
             AND lhpp_doc.status IN ('FINAL', 'TERBIT')
           ORDER BY lhpp_doc.finalized_at DESC NULLS LAST, lhpp_doc.updated_at DESC
           LIMIT 1
         ) l ON true
         LEFT JOIN LATERAL (
           SELECT suket_no, valid_until
           FROM suket_documents
           WHERE object_id = oo.object_id AND status = 'TERBIT'
           ORDER BY issued_date DESC NULLS LAST, created_at DESC
           LIMIT 1
         ) s ON true
         WHERE oo.order_id = $1
         ORDER BY t.name ASC`,
        [orderId]
      );

      const bastBuffer = await generateBastPdfBuffer({
        id: order.id,
        order_no: order.order_no,
        po_number: order.po_number,
        client_name: order.client_name,
        client_address: order.client_address,
        recipient_name: order.contact_name || order.client_name,
        contact_name: order.contact_name,
        dispatched_by_name: req.user.fullName || 'Admin Operasional PT Upaya Riksa Daya',
        items: unitRows
      });

      await recordAudit({
        userId: req.user.id,
        action: 'BAST_PDF_GENERATE',
        entity: 'orders',
        entityId: order.id,
        summary: { orderNo: order.order_no, unitCount: unitRows.length },
        ip: req.ip
      });

      const filename = `BAST-${(order.po_number || order.order_no).replace(/[/\s]/g, '-')}.pdf`;
      const disposition = req.query.download === '1' ? 'attachment' : 'inline';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      return res.send(bastBuffer);
    } catch (err) {
      return next(err);
    }
  }
);

// GET /api/v1/distributions/:id/bast/pdf - Unduh BAST berdasarkan catatan distribusi
router.get(
  '/:id/bast/pdf',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER', 'MARKETING'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { rows } = await query(
        `SELECT d.*, o.order_no, o.po_number, c.name AS client_name, c.address AS client_address
         FROM document_distributions d
         JOIN orders o ON o.id = d.order_id
         JOIN clients c ON c.id = o.client_id
         WHERE d.id = $1`,
        [id]
      );
      if (!rows.length) {
        throw new AppError(404, 'DISTRIBUTION_NOT_FOUND', 'Distribusi tidak ditemukan.');
      }
      const dist = rows[0];
      return res.redirect(`/api/v1/distributions/orders/${dist.order_id}/bast/pdf`);
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
