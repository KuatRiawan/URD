import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const clientSchema = Joi.object({
  name: Joi.string().min(2).max(160).required(),
  npwp: Joi.string().max(40).allow('', null),
  address: Joi.string().max(400).allow('', null),
  industry: Joi.string().max(120).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(40).allow('', null),
  isActive: Joi.boolean()
});

const locationSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  address: Joi.string().min(3).max(400).required(),
  city: Joi.string().max(100).allow('', null)
});

const contactSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  position: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(40).allow('', null),
  email: Joi.string().email().allow('', null)
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = (req.query.q || '').trim();
    const isActive = req.query.isActive;

    const conds = [];
    const params = [];

    if (req.user.role === 'AHLI_K3') {
      params.push(req.user.id);
      conds.push(`c.id IN (
        SELECT o.client_id FROM orders o
        JOIN assignments a ON a.order_id = o.id
        WHERE a.inspector_id = $${params.length} AND a.status IN ('MENUNGGU', 'DITERIMA')
      )`);
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(c.name) LIKE $${params.length} OR lower(coalesce(c.industry,'')) LIKE $${params.length} OR lower(coalesce(c.npwp,'')) LIKE $${params.length})`
      );
    }

    if (isActive !== undefined && isActive !== '') {
      params.push(isActive === 'true');
      conds.push(`c.is_active = $${params.length}`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(`SELECT count(*)::int AS total FROM clients c ${whereSql}`, params);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT c.*,
              (SELECT count(*)::int FROM test_objects t WHERE t.client_id = c.id) AS object_count,
              (SELECT count(*)::int FROM client_locations l WHERE l.client_id = c.id) AS location_count
       FROM clients c
       ${whereSql}
       ORDER BY c.name ASC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({ items: rows, page, limit, total: countRes.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'AHLI_K3') {
      const { rows: allowed } = await query(
        `SELECT 1 FROM orders o
         JOIN assignments a ON a.order_id = o.id
         WHERE o.client_id = $1 AND a.inspector_id = $2 AND a.status IN ('MENUNGGU', 'DITERIMA')
         LIMIT 1`,
        [id, req.user.id]
      );
      if (!allowed[0]) {
        throw new AppError(403, 'FORBIDDEN', 'Klien ini tidak termasuk dalam penugasan Anda.');
      }
    }

    const { rows } = await query('SELECT * FROM clients WHERE id = $1', [id]);
    if (!rows[0]) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Data klien tidak ditemukan.');

    const [locations, contacts, objects] = await Promise.all([
      query('SELECT * FROM client_locations WHERE client_id = $1 ORDER BY created_at ASC', [id]),
      query('SELECT * FROM client_contacts WHERE client_id = $1 ORDER BY created_at ASC', [id]),
      query(
        `SELECT t.*, oc.code AS category_code, oc.name AS category_name
         FROM test_objects t
         JOIN object_categories oc ON oc.id = t.category_id
         WHERE t.client_id = $1
         ORDER BY t.created_at DESC`,
        [id]
      )
    ]);

    return res.json({
      client: rows[0],
      locations: locations.rows,
      contacts: contacts.rows,
      objects: objects.rows
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(clientSchema),
  async (req, res, next) => {
    try {
      const { name, npwp, address, industry, email, phone, isActive } = req.body;
      const clientRecord = await withTransaction(async (db) => {
        const { rows } = await db.query(
          `INSERT INTO clients (name, npwp, address, industry, email, phone, is_active, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [
            name.trim(),
            npwp ? npwp.trim() : null,
            address || null,
            industry || null,
            email || null,
            phone || null,
            isActive ?? true,
            req.user.id
          ]
        );
        await recordAudit(
          {
            userId: req.user.id,
            action: 'CLIENT_CREATE',
            entity: 'clients',
            entityId: rows[0].id,
            summary: { name: rows[0].name },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });
      return res.status(201).json({ client: clientRecord });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(clientSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, npwp, address, industry, email, phone, isActive } = req.body;
      const updated = await withTransaction(async (db) => {
        const { rows: cur } = await db.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (!cur[0]) throw new AppError(404, 'CLIENT_NOT_FOUND', 'Data klien tidak ditemukan.');

        const { rows } = await db.query(
          `UPDATE clients
           SET name = $1, npwp = $2, address = $3, industry = $4, email = $5, phone = $6,
               is_active = $7, updated_at = now()
           WHERE id = $8
           RETURNING *`,
          [
            name.trim(),
            npwp ? npwp.trim() : null,
            address || null,
            industry || null,
            email || null,
            phone || null,
            isActive ?? cur[0].is_active,
            id
          ]
        );
        await recordAudit(
          {
            userId: req.user.id,
            action: 'CLIENT_UPDATE',
            entity: 'clients',
            entityId: id,
            summary: { name: rows[0].name, is_active: rows[0].is_active },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });
      return res.json({ client: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/locations',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(locationSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, address, city } = req.body;
      const { rows } = await query(
        `INSERT INTO client_locations (client_id, name, address, city)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [id, name.trim(), address.trim(), city || null]
      );
      await recordAudit({
        userId: req.user.id,
        action: 'CLIENT_LOCATION_ADD',
        entity: 'client_locations',
        entityId: rows[0].id,
        summary: { clientId: id, name },
        ip: req.ip
      });
      return res.status(201).json({ location: rows[0] });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/contacts',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(contactSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, position, phone, email } = req.body;
      const { rows } = await query(
        `INSERT INTO client_contacts (client_id, name, position, phone, email)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, name.trim(), position || null, phone || null, email || null]
      );
      await recordAudit({
        userId: req.user.id,
        action: 'CLIENT_CONTACT_ADD',
        entity: 'client_contacts',
        entityId: rows[0].id,
        summary: { clientId: id, name },
        ip: req.ip
      });
      return res.status(201).json({ contact: rows[0] });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

