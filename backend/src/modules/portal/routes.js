import crypto from 'node:crypto';
import Joi from 'joi';
import { Router } from 'express';
import { query } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../utils/http.js';

const router = Router();

const createTokenSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  label: Joi.string().max(100).allow('', null),
  expiresInDays: Joi.number().integer().min(1).max(365).default(90)
});

// 1. Admin membuat token portal klien (Authenticated)
router.post('/tokens', authenticate, authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'), async (req, res, next) => {
  try {
    const { error, value } = createTokenSchema.validate(req.body);
    if (error) throw new AppError(400, 'VALIDATION_ERROR', error.details[0].message);

    const { clientId, label, expiresInDays } = value;
    const { rows: clientRows } = await query('SELECT id, name FROM clients WHERE id = $1', [clientId]);
    if (!clientRows[0]) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Klien tidak ditemukan.');

    // Token acak 32 bytes hex
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const { rows } = await query(
      `INSERT INTO client_portal_tokens (client_id, token, label, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, client_id, token, label, expires_at, is_active, created_at`,
      [clientId, token, label || `Portal Akses - ${clientRows[0].name}`, expiresAt, req.user.id]
    );

    return res.status(201).json({
      message: 'Token portal klien berhasil dibuat.',
      portalToken: rows[0],
      portalUrl: `/portal/${token}`
    });
  } catch (err) {
    return next(err);
  }
});

// 2. Daftar token portal untuk klien tertentu (Authenticated)
router.get('/tokens/client/:clientId', authenticate, authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN'), async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { rows } = await query(
      `SELECT t.*, u.full_name AS created_by_name
       FROM client_portal_tokens t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.client_id = $1
       ORDER BY t.created_at DESC`,
      [clientId]
    );
    return res.json({ items: rows });
  } catch (err) {
    return next(err);
  }
});

// 3. Akses Publik Terproteksi Token untuk Klien (Unauthenticated, aman read-only)
router.get('/access/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) throw new AppError(400, 'TOKEN_REQUIRED', 'Token portal wajib disertakan.');

    const { rows: tokRows } = await query(
      `SELECT t.*, c.name AS client_name, c.email AS client_email, c.phone AS client_phone, c.address AS client_address
       FROM client_portal_tokens t
       JOIN clients c ON c.id = t.client_id
       WHERE t.token = $1 AND t.is_active = true`,
      [token]
    );
    const tokenData = tokRows[0];
    if (!tokenData) {
      throw new AppError(404, 'PORTAL_NOT_FOUND', 'Tautan portal klien tidak valid atau sudah dinonaktifkan.');
    }

    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      throw new AppError(403, 'PORTAL_EXPIRED', 'Masa berlaku tautan portal klien ini telah berakhir.');
    }

    const clientId = tokenData.client_id;

    // Ambil order riksa uji klien beserta unit dan dokumen final
    const { rows: orders } = await query(
      `SELECT o.id, o.order_no, o.po_number, o.po_date, o.service_type, o.status, o.created_at,
              cl.name AS location_name, cl.city AS location_city,
              s.start_at, s.end_at,
              coalesce(
                (SELECT json_agg(json_build_object(
                  'objectId', t.id,
                  'name', t.name,
                  'serialNumber', t.serial_number,
                  'brand', t.brand,
                  'categoryCode', oc.code,
                  'categoryName', oc.name,
                  'unitStatus', oo.unit_status,
                  'bapNo', b.bap_no,
                  'bapStatus', b.status,
                  'bapVerificationCode', b.verification_code,
                  'lhppNo', l.lhpp_no,
                  'lhppStatus', l.status,
                  'lhppVerificationCode', l.verification_code,
                  'conclusion', i.conclusion
                ))
                FROM order_objects oo
                JOIN test_objects t ON t.id = oo.object_id
                JOIN object_categories oc ON oc.id = t.category_id
                LEFT JOIN inspections i ON i.order_id = oo.order_id AND i.object_id = oo.object_id
                LEFT JOIN bap_documents b ON b.inspection_id = i.id
                LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
                WHERE oo.order_id = o.id),
                '[]'::json
              ) AS objects
       FROM orders o
       LEFT JOIN client_locations cl ON cl.id = o.location_id
       LEFT JOIN schedules s ON s.order_id = o.id
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [clientId]
    );

    return res.json({
      client: {
        id: tokenData.client_id,
        name: tokenData.client_name,
        email: tokenData.client_email,
        phone: tokenData.client_phone,
        address: tokenData.client_address
      },
      token: {
        label: tokenData.label,
        expiresAt: tokenData.expires_at
      },
      orders
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

