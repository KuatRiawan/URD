import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { createNotification, notifyRoles } from '../../services/notify.js';
import { generateAssignmentLetterPdfBuffer } from '../../services/pdf-generator.js';
import { computePoUnitProgress, syncOrderUnitStatus } from '../../services/workflow.js';
import { saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const ALLOWED_TRANSITIONS = {
  ORDER_BARU: ['TERJADWAL', 'DIBATALKAN'],
  TERJADWAL: ['DITUGASKAN', 'DIBATALKAN'],
  DITUGASKAN: ['SEDANG_DIPERIKSA', 'TERJADWAL', 'DIBATALKAN'],
  SEDANG_DIPERIKSA: ['MENUNGGU_LAPORAN', 'DIBATALKAN'],
  MENUNGGU_LAPORAN: ['MENUNGGU_REVIEW', 'SEDANG_DIPERIKSA'],
  MENUNGGU_REVIEW: ['SELESAI', 'MENUNGGU_LAPORAN'],
  SELESAI: [],
  DIBATALKAN: []
};

const inlineUnitSchema = Joi.object({
  objectId: Joi.string().uuid().allow('', null),
  categoryId: Joi.number().integer().min(1).max(7).allow(null),
  name: Joi.string().min(1).max(160).allow('', null),
  brand: Joi.string().max(120).allow('', null),
  manufacturer: Joi.string().max(160).allow('', null),
  model: Joi.string().max(120).allow('', null),
  serialNumber: Joi.string().max(120).allow('', null),
  manufactureYear: Joi.number().integer().min(1900).max(2100).allow(null),
  capacity: Joi.string().max(100).allow('', null),
  capacityUnit: Joi.string().max(40).allow('', null),
  installLocation: Joi.string().max(200).allow('', null),
  previousPermitNo: Joi.string().max(120).allow('', null),
  quantity: Joi.number().integer().min(1).max(50).default(1),
  scopeItems: Joi.array().items(Joi.string().max(160)).default([]),
  proposedDate: Joi.date().iso().allow('', null),
  unitNotes: Joi.string().max(1000).allow('', null),
  attributes: Joi.object().default({})
});

const createOrderSchema = Joi.object({
  poNumber: Joi.string().max(120).allow('', null),
  poDate: Joi.date().iso().allow('', null),
  clientId: Joi.string().uuid().allow('', null),
  newClient: Joi.object({
    name: Joi.string().min(2).max(200).allow('', null),
    industry: Joi.string().max(120).allow('', null),
    address: Joi.string().max(500).allow('', null),
    phone: Joi.string().max(60).allow('', null),
    email: Joi.string().max(160).allow('', null),
    npwp: Joi.string().max(60).allow('', null)
  }).allow(null),
  locationId: Joi.string().uuid().allow('', null),
  newLocation: Joi.object({
    name: Joi.string().max(200).allow('', null),
    address: Joi.string().max(500).allow('', null),
    city: Joi.string().max(120).allow('', null)
  }).allow(null),
  contactId: Joi.string().uuid().allow('', null),
  newContact: Joi.object({
    name: Joi.string().max(160).allow('', null),
    position: Joi.string().max(120).allow('', null),
    phone: Joi.string().max(60).allow('', null),
    email: Joi.string().max(160).allow('', null)
  }).allow(null),
  serviceType: Joi.string()
    .valid('PEMERIKSAAN_PERTAMA', 'PEMERIKSAAN_BERKALA', 'PERPANJANGAN', 'PEMERIKSAAN_ULANG')
    .required(),
  source: Joi.string()
    .valid('TELEPON', 'EMAIL', 'WHATSAPP', 'LANGSUNG', 'DOKUMEN_PO', 'LAINNYA')
    .required(),
  requestedDate: Joi.date().iso().allow('', null),
  notes: Joi.string().max(1000).allow('', null),
  objectIds: Joi.array().items(Joi.string().uuid()).default([]),
  units: Joi.array().items(inlineUnitSchema).default([]),
  renewalOfSuket: Joi.string().uuid().allow('', null),
  inspectorIds: Joi.array().items(Joi.string().uuid()).default([])
});

const addUnitsSchema = Joi.object({
  units: Joi.array().items(inlineUnitSchema).min(1).required()
});

const updateUnitSchema = Joi.object({
  scopeItems: Joi.array().items(Joi.string().max(160)),
  proposedDate: Joi.date().iso().allow('', null),
  unitNotes: Joi.string().max(1000).allow('', null),
  inspectorId: Joi.string().uuid().allow('', null),
  unitStatus: Joi.string().valid(
    'BELUM_DIJADWALKAN',
    'TERJADWAL',
    'DITUGASKAN',
    'SEDANG_DIPERIKSA',
    'FORM_TERKIRIM',
    'BAP_DRAF',
    'BAP_FINAL',
    'LHPP_DRAF',
    'MENUNGGU_REVIEW',
    'PERLU_REVISI',
    'DISETUJUI',
    'LHPP_TERBIT',
    'SELESAI',
    'DIBATALKAN'
  ),
  cancelReason: Joi.string().max(500).allow('', null)
});

const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(
      'ORDER_BARU',
      'TERJADWAL',
      'DITUGASKAN',
      'SEDANG_DIPERIKSA',
      'MENUNGGU_LAPORAN',
      'MENUNGGU_REVIEW',
      'SELESAI',
      'DIBATALKAN'
    )
    .required(),
  note: Joi.string().max(500).allow('', null)
});

const scheduleSchema = Joi.object({
  startAt: Joi.date().iso().required(),
  endAt: Joi.date().iso().greater(Joi.ref('startAt')).required(),
  notes: Joi.string().max(500).allow('', null),
  reason: Joi.string().max(500).allow('', null)
});

const assignSchema = Joi.object({
  inspectorIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
  objectId: Joi.string().uuid().allow('', null)
});

const respondAssignmentSchema = Joi.object({
  decision: Joi.string().valid('DITERIMA', 'DITOLAK').required(),
  rejectReason: Joi.string().max(500).when('decision', {
    is: 'DITOLAK',
    then: Joi.string().min(3).required(),
    otherwise: Joi.string().allow('', null)
  })
});

async function resolveAndInsertOrderUnits(db, { orderId, clientId, locationId, objectIds = [], units = [], userId }) {
  const { rows: cats } = await db.query('SELECT id, code, default_bap_scopes FROM object_categories');
  const catMap = new Map(cats.map((c) => [Number(c.id), c]));

  const normalizedUnits = [...units];
  for (const objId of objectIds) {
    if (!normalizedUnits.some((u) => u.objectId === objId)) {
      normalizedUnits.push({ objectId: objId, quantity: 1 });
    }
  }

  if (normalizedUnits.length === 0) {
    throw new AppError(400, 'NO_UNITS', 'Minimal 1 unit alat K3 wajib didaftarkan ke dalam PO.');
  }

  const insertedObjectIds = [];

  for (const unit of normalizedUnits) {
    if (unit.objectId) {
      const { rows: existingObj } = await db.query(
        'SELECT * FROM test_objects WHERE id = $1 AND client_id = $2',
        [unit.objectId, clientId]
      );
      if (!existingObj[0]) {
        throw new AppError(
          400,
          'INVALID_ORDER_OBJECTS',
          'Seluruh unit objek uji harus berasal dari klien yang dipilih.'
        );
      }
      const cat = catMap.get(Number(existingObj[0].category_id));
      const defaultScopes = Array.isArray(cat?.default_bap_scopes) ? cat.default_bap_scopes : [];
      const scopeItems = unit.scopeItems?.length ? unit.scopeItems : defaultScopes;

      await db.query(
        `INSERT INTO order_objects
           (order_id, object_id, unit_status, scope_items, proposed_date, unit_notes)
         VALUES ($1, $2, 'BELUM_DIJADWALKAN', $3::jsonb, $4, $5)
         ON CONFLICT (order_id, object_id) DO UPDATE SET
           scope_items = EXCLUDED.scope_items,
           proposed_date = COALESCE(EXCLUDED.proposed_date, order_objects.proposed_date),
           unit_notes = COALESCE(EXCLUDED.unit_notes, order_objects.unit_notes),
           updated_at = now()`,
        [
          orderId,
          existingObj[0].id,
          JSON.stringify(scopeItems),
          unit.proposedDate || null,
          unit.unitNotes || null
        ]
      );
      insertedObjectIds.push(existingObj[0].id);
      continue;
    }

    // Inline new unit registration (supports quantity splitting into individual tracked units)
    if (!unit.categoryId || !unit.name || !unit.name.trim()) {
      throw new AppError(
        400,
        'INCOMPLETE_UNIT_DATA',
        'Unit baru pada PO wajib memiliki kategori dan nama jenis alat.'
      );
    }

    const baseSerial =
      unit.serialNumber && unit.serialNumber.trim()
        ? unit.serialNumber.trim()
        : `SN-PO-${Date.now().toString().slice(-6)}`;
    const qty = Math.max(1, Number(unit.quantity || 1));
    const cat = catMap.get(Number(unit.categoryId));
    const defaultScopes = Array.isArray(cat?.default_bap_scopes) ? cat.default_bap_scopes : [];
    const scopeItems = unit.scopeItems?.length ? unit.scopeItems : defaultScopes;

    for (let idx = 1; idx <= qty; idx += 1) {
      const serialNo =
        qty > 1 ? `${baseSerial}-${String(idx).padStart(2, '0')}` : baseSerial;
      const unitName = qty > 1 ? `${unit.name.trim()} (Unit #${idx})` : unit.name.trim();

      // Cek apakah nomor seri sudah terdaftar pada klien ini; jika sudah ada, gunakan unit tersebut
      const { rows: dup } = await db.query(
        `SELECT * FROM test_objects
         WHERE client_id = $1 AND lower(btrim(serial_number)) = lower(btrim($2))`,
        [clientId, serialNo]
      );

      let objRecord = dup[0];
      if (!objRecord) {
        const { rows: createdObj } = await db.query(
          `INSERT INTO test_objects
             (client_id, location_id, category_id, name, brand, manufacturer, model, serial_number,
              manufacture_year, capacity, capacity_unit, install_location, previous_permit_no, attributes, is_active, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true,$15)
           RETURNING *`,
          [
            clientId,
            locationId || null,
            unit.categoryId,
            unitName,
            unit.brand || unit.manufacturer || null,
            unit.manufacturer || unit.brand || null,
            unit.model || null,
            serialNo,
            unit.manufactureYear || null,
            unit.capacity || null,
            unit.capacityUnit || null,
            unit.installLocation || null,
            unit.previousPermitNo || null,
            unit.attributes || {},
            userId
          ]
        );
        objRecord = createdObj[0];
      }

      await db.query(
        `INSERT INTO order_objects
           (order_id, object_id, unit_status, scope_items, proposed_date, unit_notes)
         VALUES ($1, $2, 'BELUM_DIJADWALKAN', $3::jsonb, $4, $5)
         ON CONFLICT (order_id, object_id) DO UPDATE SET
           scope_items = EXCLUDED.scope_items,
           proposed_date = COALESCE(EXCLUDED.proposed_date, order_objects.proposed_date),
           unit_notes = COALESCE(EXCLUDED.unit_notes, order_objects.unit_notes),
           updated_at = now()`,
        [
          orderId,
          objRecord.id,
          JSON.stringify(scopeItems),
          unit.proposedDate || null,
          unit.unitNotes || null
        ]
      );
      insertedObjectIds.push(objRecord.id);
    }
  }

  return insertedObjectIds;
}

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = (req.query.status || '').trim();
    const search = (req.query.q || '').trim();
    const clientId = (req.query.clientId || '').trim();

    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`o.id IN (
        SELECT order_id FROM assignments WHERE inspector_id = $${params.length}
      )`);
    }
    if (status) {
      params.push(status);
      conds.push(`o.status = $${params.length}`);
    }
    if (clientId) {
      params.push(clientId);
      conds.push(`o.client_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(o.order_no) LIKE $${params.length} OR lower(coalesce(o.po_number,'')) LIKE $${params.length} OR lower(c.name) LIKE $${params.length})`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total FROM orders o JOIN clients c ON c.id = o.client_id ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT o.*, c.name AS client_name,
              s.start_at, s.end_at,
              (SELECT count(*)::int FROM order_objects oo WHERE oo.order_id = o.id) AS object_count,
              coalesce(
                (SELECT json_agg(json_build_object(
                  'object_id', oo.object_id,
                  'unit_status', oo.unit_status
                ))
                FROM order_objects oo WHERE oo.order_id = o.id),
                '[]'::json
              ) AS unit_rows,
              coalesce(
                (SELECT json_agg(json_build_object(
                  'id', a.id,
                  'inspectorId', a.inspector_id,
                  'fullName', u.full_name,
                  'status', a.status
                ))
                FROM assignments a JOIN users u ON u.id = a.inspector_id
                WHERE a.order_id = o.id AND a.status IN ('MENUNGGU','DITERIMA')),
                '[]'::json
              ) AS assignments
       FROM orders o
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN schedules s ON s.order_id = o.id
       ${whereSql}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const enriched = rows.map((r) => {
      const unitProgress = computePoUnitProgress(r.unit_rows || []);
      return {
        ...r,
        unitProgress
      };
    });

    return res.json({ items: enriched, page, limit, total: countRes.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      const { rows: own } = await query(
        'SELECT 1 FROM assignments WHERE order_id = $1 AND inspector_id = $2 LIMIT 1',
        [id, req.user.id]
      );
      if (!own[0]) {
        throw new AppError(403, 'FORBIDDEN', 'Order ini tidak ditugaskan kepada Anda.');
      }
    }

    const { rows } = await query(
      `SELECT o.*, c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
              cl.name AS location_name, cl.address AS location_address, cl.city AS location_city,
              cc.name AS contact_name, cc.phone AS contact_phone, cc.email AS contact_email,
              fa.original_name AS po_attachment_name
       FROM orders o
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_locations cl ON cl.id = o.location_id
       LEFT JOIN client_contacts cc ON cc.id = o.contact_id
       LEFT JOIN file_attachments fa ON fa.id = o.po_attachment_id
       WHERE o.id = $1`,
      [id]
    );
    if (!rows[0]) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');

    const [objects, schedule, assignments, history, inspections] = await Promise.all([
      query(
        `SELECT t.*,
                oc.code AS category_code, oc.name AS category_name, oc.default_bap_scopes,
                oo.id AS order_object_id, oo.unit_status, oo.scope_items, oo.proposed_date,
                oo.unit_notes, oo.cancel_reason AS unit_cancel_reason, oo.inspector_id AS unit_inspector_id,
                u_insp.full_name AS unit_inspector_name,
                i.id AS inspection_id, i.status AS inspection_status, i.conclusion, i.submitted_at,
                b.id AS bap_id, b.bap_no, b.status AS bap_status, b.finalized_at AS bap_finalized_at,
                l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status, l.published_at AS lhpp_published_at
         FROM order_objects oo
         JOIN test_objects t ON t.id = oo.object_id
         JOIN object_categories oc ON oc.id = t.category_id
         LEFT JOIN users u_insp ON u_insp.id = oo.inspector_id
         LEFT JOIN inspections i ON i.order_id = oo.order_id AND i.object_id = oo.object_id
         LEFT JOIN bap_documents b ON b.inspection_id = i.id
         LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
         WHERE oo.order_id = $1
         ORDER BY t.category_id ASC, t.serial_number ASC`,
        [id]
      ),
      query('SELECT * FROM schedules WHERE order_id = $1', [id]),
      query(
        `SELECT a.*, u.full_name, u.email, u.phone
         FROM assignments a
         JOIN users u ON u.id = a.inspector_id
         WHERE a.order_id = $1
         ORDER BY a.created_at DESC`,
        [id]
      ),
      query(
        `SELECT h.*, u.full_name AS actor_name
         FROM order_status_history h
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE h.order_id = $1
         ORDER BY h.created_at ASC`,
        [id]
      ),
      query(
        `SELECT i.id, i.object_id, i.status, i.conclusion, i.submitted_at,
                b.id AS bap_id, b.bap_no, b.status AS bap_status,
                l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
         FROM inspections i
         LEFT JOIN bap_documents b ON b.inspection_id = i.id
         LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
         WHERE i.order_id = $1`,
        [id]
      )
    ]);

    let scheduleChanges = [];
    if (schedule.rows[0]) {
      const ch = await query(
        `SELECT sc.*, u.full_name AS actor_name
         FROM schedule_changes sc
         LEFT JOIN users u ON u.id = sc.changed_by
         WHERE sc.schedule_id = $1
         ORDER BY sc.created_at DESC`,
        [schedule.rows[0].id]
      );
      scheduleChanges = ch.rows;
    }

    const unitProgress = computePoUnitProgress(objects.rows);

    return res.json({
      order: {
        ...rows[0],
        unitProgress
      },
      unitProgress,
      objects: objects.rows,
      schedule: schedule.rows[0] || null,
      scheduleChanges,
      assignments: assignments.rows,
      history: history.rows,
      inspections: inspections.rows
    });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(createOrderSchema),
  async (req, res, next) => {
    try {
      const b = req.body;

      if (b.poNumber && b.poNumber.trim()) {
        const { rows: dupPo } = await query(
          'SELECT id, order_no FROM orders WHERE lower(btrim(po_number)) = lower(btrim($1))',
          [b.poNumber]
        );
        if (dupPo[0]) {
          throw new AppError(
            409,
            'DUPLICATE_PO_NUMBER',
            `Nomor PO "${b.poNumber.trim()}" sudah terdaftar pada order ${dupPo[0].order_no}.`
          );
        }
      }

      const created = await withTransaction(async (db) => {
        let resolvedClientId = b.clientId || null;
        let resolvedLocationId = b.locationId || null;
        let resolvedContactId = b.contactId || null;

        // 1. Jika Admin menginput Klien baru langsung dari form PO
        if (!resolvedClientId && b.newClient?.name && b.newClient.name.trim()) {
          const cleanName = b.newClient.name.trim();
          const { rows: existingCli } = await db.query(
            'SELECT * FROM clients WHERE lower(btrim(name)) = lower(btrim($1)) LIMIT 1',
            [cleanName]
          );
          if (existingCli[0]) {
            resolvedClientId = existingCli[0].id;
            // Perbarui alamat/kontak klien bila sebelumnya kosong
            await db.query(
              `UPDATE clients
               SET address = COALESCE(NULLIF($1, ''), address),
                   industry = COALESCE(NULLIF($2, ''), industry),
                   phone = COALESCE(NULLIF($3, ''), phone),
                   email = COALESCE(NULLIF($4, ''), email),
                   updated_at = now()
               WHERE id = $5`,
              [
                b.newClient.address?.trim() || b.newLocation?.address?.trim() || '',
                b.newClient.industry?.trim() || '',
                b.newClient.phone?.trim() || b.newContact?.phone?.trim() || '',
                b.newClient.email?.trim() || b.newContact?.email?.trim() || '',
                resolvedClientId
              ]
            );
          } else {
            const { rows: newCliRows } = await db.query(
              `INSERT INTO clients (name, npwp, address, industry, email, phone, is_active, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, true, $7)
               RETURNING *`,
              [
                cleanName,
                b.newClient.npwp?.trim() || null,
                b.newClient.address?.trim() || b.newLocation?.address?.trim() || null,
                b.newClient.industry?.trim() || 'Manufaktur & Industri',
                b.newClient.email?.trim() || b.newContact?.email?.trim() || null,
                b.newClient.phone?.trim() || b.newContact?.phone?.trim() || null,
                req.user.id
              ]
            );
            resolvedClientId = newCliRows[0].id;
          }
        }

        if (!resolvedClientId) {
          throw new AppError(
            400,
            'CLIENT_REQUIRED',
            'Pilih perusahaan klien atau isi Nama Perusahaan Klien baru pada form PO.'
          );
        }

        // 2. Jika Admin menginput Lokasi / Site baru di dalam form PO
        if (!resolvedLocationId && (b.newLocation?.name?.trim() || b.newLocation?.address?.trim())) {
          const locName = b.newLocation.name?.trim() || 'Lokasi Utama Pabrik / Site';
          const locAddr =
            b.newLocation.address?.trim() ||
            b.newClient?.address?.trim() ||
            locName;
          const { rows: locRows } = await db.query(
            `INSERT INTO client_locations (client_id, name, address, city)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [resolvedClientId, locName, locAddr, b.newLocation.city?.trim() || null]
          );
          resolvedLocationId = locRows[0].id;
        }

        // 3. Jika Admin menginput Kontak PIC (Nama / No. WA / Email) di dalam form PO
        if (!resolvedContactId && (b.newContact?.name?.trim() || b.newContact?.phone?.trim() || b.newContact?.email?.trim())) {
          const picName = b.newContact.name?.trim() || 'PIC K3 / Operasional';
          const picPhone = b.newContact.phone?.trim() || null;
          const picEmail = b.newContact.email?.trim() || null;
          const { rows: contactRows } = await db.query(
            `INSERT INTO client_contacts (client_id, name, position, phone, email)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
              resolvedClientId,
              picName,
              b.newContact.position?.trim() || 'PIC K3 / HSE',
              picPhone,
              picEmail
            ]
          );
          resolvedContactId = contactRows[0].id;

          // Sinkronkan juga ke kolom phone & email pada clients agar pengingat WA/Email selalu memiliki nomor tujuan
          await db.query(
            `UPDATE clients
             SET phone = COALESCE(NULLIF($1, ''), phone),
                 email = COALESCE(NULLIF($2, ''), email),
                 updated_at = now()
             WHERE id = $3`,
            [picPhone || '', picEmail || '', resolvedClientId]
          );
        }

        const seqRes = await db.query("SELECT nextval('order_no_seq') AS seq");
        const now = new Date();
        const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
        const orderNo = `ORD/${ym}/${String(seqRes.rows[0].seq).padStart(4, '0')}`;
        const poNo = b.poNumber && b.poNumber.trim() ? b.poNumber.trim() : `PO-${orderNo.replace(/\//g, '-')}`;

        const { rows } = await db.query(
          `INSERT INTO orders
             (order_no, po_number, po_date, client_id, location_id, contact_id, service_type, source, requested_date, notes, renewal_of_suket, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
           RETURNING *`,
          [
            orderNo,
            poNo,
            b.poDate || b.requestedDate || now.toISOString().slice(0, 10),
            resolvedClientId,
            resolvedLocationId,
            resolvedContactId,
            b.serviceType,
            b.source,
            b.requestedDate || null,
            b.notes || null,
            b.renewalOfSuket || null,
            req.user.id
          ]
        );
        const order = rows[0];

        // Jika unit belum memiliki installLocation namun Admin mengisi newLocation, gunakan nama/alamat lokasi tersebut
        const enrichedUnits = (b.units || []).map((u) => ({
          ...u,
          installLocation:
            u.installLocation?.trim() ||
            b.newLocation?.name?.trim() ||
            b.newLocation?.address?.trim() ||
            ''
        }));

        const insertedIds = await resolveAndInsertOrderUnits(db, {
          orderId: order.id,
          clientId: resolvedClientId,
          locationId: resolvedLocationId,
          objectIds: b.objectIds || [],
          units: enrichedUnits,
          userId: req.user.id
        });

        await db.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
           VALUES ($1, NULL, 'ORDER_BARU', $2, $3)`,
          [order.id, `PO ${poNo} dicatat dengan ${insertedIds.length} unit alat`, req.user.id]
        );

        // Jika Admin langsung menugaskan Inspector saat membuat PO, buat jadwal otomatis & penugasan
        if (Array.isArray(b.inspectorIds) && b.inspectorIds.length > 0) {
          const baseDateStr = b.requestedDate
            ? b.requestedDate instanceof Date
              ? b.requestedDate.toISOString().slice(0, 10)
              : String(b.requestedDate).slice(0, 10)
            : now.toISOString().slice(0, 10);
          const startIso = new Date(`${baseDateStr}T08:00:00.000Z`).toISOString();
          const endIso = new Date(`${baseDateStr}T16:00:00.000Z`).toISOString();
          await db.query(
            `INSERT INTO schedules (order_id, start_at, end_at, notes, created_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (order_id) DO NOTHING`,
            [order.id, startIso, endIso, b.notes || null, req.user.id]
          );
          for (const inspId of b.inspectorIds) {
            await db.query(
              `INSERT INTO assignments (order_id, inspector_id, status, assigned_by)
               VALUES ($1, $2, 'MENUNGGU', $3)
               ON CONFLICT (order_id, inspector_id) WHERE status IN ('MENUNGGU', 'DITERIMA') DO NOTHING`,
              [order.id, inspId, req.user.id]
            );
            await createNotification(
              {
                userId: inspId,
                type: 'ASSIGNMENT_NEW',
                title: 'Penugasan Baru Riksa Uji',
                body: `Anda ditugaskan pada order ${order.order_no} (PO: ${poNo}). Silakan periksa detailnya.`,
                link: '/app/orders'
              },
              db
            );
          }
          await db.query(
            `UPDATE order_objects
             SET unit_status = 'DITUGASKAN', inspector_id = COALESCE(inspector_id, $1), updated_at = now()
             WHERE order_id = $2`,
            [b.inspectorIds[0], order.id]
          );
          await db.query("UPDATE orders SET status = 'DITUGASKAN', updated_at = now() WHERE id = $1", [
            order.id
          ]);
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'ORDER_CREATE',
            entity: 'orders',
            entityId: order.id,
            summary: { orderNo: order.order_no, poNumber: poNo, objectCount: insertedIds.length },
            ip: req.ip
          },
          db
        );
        const { rows: finalOrderRows } = await db.query('SELECT * FROM orders WHERE id = $1', [
          order.id
        ]);
        const { rows: unitRows } = await db.query(
          'SELECT unit_status FROM order_objects WHERE order_id = $1',
          [order.id]
        );
        const unitProgress = computePoUnitProgress(unitRows);

        return { order: { ...finalOrderRows[0], unitProgress }, unitProgress };
      });

      return res.status(201).json(created);
    } catch (err) {
      return next(err);
    }
  }
);

// Tambah unit ke PO yang sudah berjalan
router.post(
  '/:id/units',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(addUnitsSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { units } = req.body;

      const result = await withTransaction(async (db) => {
        const { rows: ordRows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        const order = ordRows[0];
        if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order PO tidak ditemukan.');
        if (order.status === 'SELESAI' || order.status === 'DIBATALKAN') {
          throw new AppError(400, 'ORDER_CLOSED', 'PO yang sudah selesai atau dibatalkan tidak dapat ditambah unit baru.');
        }

        const insertedIds = await resolveAndInsertOrderUnits(db, {
          orderId: id,
          clientId: order.client_id,
          locationId: order.location_id,
          units,
          userId: req.user.id
        });

        await db.query(
          'UPDATE orders SET po_revision_no = po_revision_no + 1, updated_at = now() WHERE id = $1',
          [id]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'ORDER_ADD_UNITS',
            entity: 'orders',
            entityId: id,
            summary: { addedCount: insertedIds.length },
            ip: req.ip
          },
          db
        );

        return insertedIds;
      });

      return res.status(201).json({ addedObjectIds: result });
    } catch (err) {
      return next(err);
    }
  }
);

// Perbarui detail unit di dalam PO (scope BAP, jadwal usulan, catatan unit, status unit)
router.patch(
  '/:id/units/:objectId',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3'),
  validate(updateUnitSchema),
  async (req, res, next) => {
    try {
      const { id, objectId } = req.params;
      const b = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows: cur } = await db.query(
          'SELECT * FROM order_objects WHERE order_id = $1 AND object_id = $2',
          [id, objectId]
        );
        if (!cur[0]) {
          throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit alat tidak ditemukan di dalam PO ini.');
        }

        const { rows } = await db.query(
          `UPDATE order_objects
           SET scope_items = COALESCE($1::jsonb, scope_items),
               proposed_date = COALESCE($2, proposed_date),
               unit_notes = COALESCE($3, unit_notes),
               inspector_id = COALESCE($4, inspector_id),
               unit_status = COALESCE($5, unit_status),
               cancel_reason = COALESCE($6, cancel_reason),
               updated_at = now()
           WHERE order_id = $7 AND object_id = $8
           RETURNING *`,
          [
            b.scopeItems ? JSON.stringify(b.scopeItems) : null,
            b.proposedDate !== undefined ? b.proposedDate || null : null,
            b.unitNotes !== undefined ? b.unitNotes : null,
            b.inspectorId !== undefined ? b.inspectorId || null : null,
            b.unitStatus || null,
            b.cancelReason !== undefined ? b.cancelReason : null,
            id,
            objectId
          ]
        );

        if (b.unitStatus) {
          await syncOrderUnitStatus(db, {
            orderId: id,
            objectId,
            unitStatus: b.unitStatus,
            inspectorId: b.inspectorId,
            actorId: req.user.id
          });
        }

        return rows[0];
      });

      return res.json({ unit: updated });
    } catch (err) {
      return next(err);
    }
  }
);

// Unggah dokumen lampiran PO resmi
router.post(
  '/:id/po-attachment',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  uploadMiddleware.single('file'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError(400, 'NO_FILE', 'Berkas lampiran PO wajib dipilih.');

      const saved = await withTransaction(async (db) => {
        const file = await saveUploadedFile(
          {
            buffer: req.file.buffer,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            ownerType: 'PO_ATTACHMENT',
            ownerId: id,
            caption: req.body.caption || 'Dokumen Purchase Order (PO)',
            uploadedBy: req.user.id
          },
          db
        );

        await db.query('UPDATE orders SET po_attachment_id = $1, updated_at = now() WHERE id = $2', [
          file.id,
          id
        ]);
        return file;
      });

      return res.status(201).json({ attachment: saved });
    } catch (err) {
      return next(err);
    }
  }
);

// Impor unit alat sekaligus dari CSV ke PO yang sedang dibuat / ditinjau
router.post(
  '/:id/import-units-csv',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { csvText } = req.body;
      if (!csvText || typeof csvText !== 'string') {
        throw new AppError(400, 'CSV_REQUIRED', 'Teks data CSV wajib disertakan.');
      }

      const { rows: ordRows } = await query('SELECT * FROM orders WHERE id = $1', [id]);
      const order = ordRows[0];
      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order PO tidak ditemukan.');
      if (order.status === 'SELESAI' || order.status === 'DIBATALKAN') {
        throw new AppError(400, 'ORDER_CLOSED', 'PO sudah selesai atau dibatalkan.');
      }

      const { rows: cats } = await query('SELECT id, code, default_bap_scopes FROM object_categories');
      const catByCode = Object.fromEntries(cats.map((c) => [c.code.toUpperCase(), c]));

      const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new AppError(400, 'EMPTY_CSV', 'Data CSV harus memiliki header dan minimal 1 baris.');
      }

      const parsedUnits = [];
      const errors = [];
      for (let i = 1; i < lines.length; i += 1) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const [catCode, name, brand, model, serialNo, year, cap, loc, notes] = cols;
        const cat = catByCode[(catCode || '').toUpperCase()];
        if (!cat) {
          errors.push({ row: i + 1, message: `Kode kategori "${catCode}" tidak valid.` });
          continue;
        }
        if (!name || !serialNo) {
          errors.push({ row: i + 1, message: 'Nama unit dan nomor seri wajib diisi.' });
          continue;
        }
        parsedUnits.push({
          categoryId: cat.id,
          name,
          brand: brand || null,
          model: model || null,
          serialNumber: serialNo,
          manufactureYear: year ? Number(year) : null,
          capacity: cap || null,
          installLocation: loc || null,
          unitNotes: notes || null,
          scopeItems: cat.default_bap_scopes || []
        });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: {
            code: 'CSV_VALIDATION_ERROR',
            message: `Terdapat ${errors.length} baris tidak valid dalam berkas CSV.`,
            details: errors
          }
        });
      }

      const insertedIds = await withTransaction(async (db) => {
        return resolveAndInsertOrderUnits(db, {
          orderId: id,
          clientId: order.client_id,
          locationId: order.location_id,
          units: parsedUnits,
          userId: req.user.id
        });
      });

      return res.status(201).json({
        count: insertedIds.length,
        importedCount: insertedIds.length,
        unitIds: insertedIds
      });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/schedule',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(scheduleSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { startAt, endAt, notes, reason } = req.body;

      const result = await withTransaction(async (db) => {
        const { rows: ordRows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        const order = ordRows[0];
        if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');
        if (order.status === 'DIBATALKAN' || order.status === 'SELESAI') {
          throw new AppError(
            400,
            'ORDER_CLOSED',
            'Order yang telah selesai atau dibatalkan tidak dapat dijadwalkan.'
          );
        }

        const { rows: existing } = await db.query('SELECT * FROM schedules WHERE order_id = $1', [id]);
        let sched;

        if (existing[0]) {
          if (!reason || reason.trim().length < 3) {
            throw new AppError(
              400,
              'RESCHEDULE_REASON_REQUIRED',
              'Alasan perubahan jadwal wajib diisi saat menjadwalkan ulang.'
            );
          }
          await db.query(
            `INSERT INTO schedule_changes (schedule_id, old_start, old_end, new_start, new_end, reason, changed_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [existing[0].id, existing[0].start_at, existing[0].end_at, startAt, endAt, reason.trim(), req.user.id]
          );
          const { rows: upd } = await db.query(
            `UPDATE schedules SET start_at = $1, end_at = $2, notes = $3, updated_at = now()
             WHERE id = $4 RETURNING *`,
            [startAt, endAt, notes || null, existing[0].id]
          );
          sched = upd[0];
        } else {
          const { rows: ins } = await db.query(
            `INSERT INTO schedules (order_id, start_at, end_at, notes, created_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [id, startAt, endAt, notes || null, req.user.id]
          );
          sched = ins[0];
        }

        await db.query(
          `UPDATE order_objects
           SET unit_status = 'TERJADWAL',
               proposed_date = COALESCE(proposed_date, $2::date),
               updated_at = now()
           WHERE order_id = $1 AND unit_status = 'BELUM_DIJADWALKAN'`,
          [id, new Date(startAt).toISOString().slice(0, 10)]
        );

        if (order.status === 'ORDER_BARU') {
          await db.query("UPDATE orders SET status = 'TERJADWAL', updated_at = now() WHERE id = $1", [id]);
          await db.query(
            `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
             VALUES ($1, 'ORDER_BARU', 'TERJADWAL', 'Jadwal pemeriksaan ditetapkan', $2)`,
            [id, req.user.id]
          );
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: existing[0] ? 'ORDER_RESCHEDULE' : 'ORDER_SCHEDULE',
            entity: 'schedules',
            entityId: sched.id,
            summary: { orderId: id, startAt, endAt, reason: reason || null },
            ip: req.ip
          },
          db
        );
        return sched;
      });

      return res.json({ schedule: result });
    } catch (err) {
      return next(err);
    }
  }
);

// M2-02, M2-03, M2-04: Penugasan Ahli K3 dengan pemeriksaan kompetensi & konflik jadwal
router.post(
  '/:id/assignments',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(assignSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { inspectorIds, objectId } = req.body;

      const assigned = await withTransaction(async (db) => {
        const { rows: ordRows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        const order = ordRows[0];
        if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');

        const { rows: schedRows } = await db.query('SELECT * FROM schedules WHERE order_id = $1', [id]);
        let schedule = schedRows[0];
        if (!schedule) {
          const baseDate = order.requested_date || order.po_date || new Date().toISOString().slice(0, 10);
          const baseDateStr = new Date(baseDate).toISOString().slice(0, 10);
          const startIso = new Date(`${baseDateStr}T08:00:00.000Z`).toISOString();
          const endIso = new Date(`${baseDateStr}T16:00:00.000Z`).toISOString();
          const { rows: newSched } = await db.query(
            `INSERT INTO schedules (order_id, start_at, end_at, notes, created_by)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (order_id) DO UPDATE SET updated_at = now()
             RETURNING *`,
            [id, startIso, endIso, order.notes || 'Jadwal pemeriksaan operasional', req.user.id]
          );
          schedule = newSched[0];
        }

        const catParams = [id];
        let objFilterSql = '';
        if (objectId) {
          catParams.push(objectId);
          objFilterSql = 'AND oo.object_id = $2';
        }

        const { rows: reqCategories } = await db.query(
          `SELECT DISTINCT t.category_id, oc.code, oc.name
           FROM order_objects oo
           JOIN test_objects t ON t.id = oo.object_id
           JOIN object_categories oc ON oc.id = t.category_id
           WHERE oo.order_id = $1 ${objFilterSql}`,
          catParams
        );

        const schedDate = new Date(schedule.start_at).toISOString().slice(0, 10);
        const createdAssignments = [];

        for (const inspectorId of inspectorIds) {
          const { rows: uRows } = await db.query(
            "SELECT id, full_name FROM users WHERE id = $1 AND role IN ('AHLI_K3', 'INSPECTOR') AND is_active = true",
            [inspectorId]
          );
          if (!uRows[0]) {
            throw new AppError(400, 'INVALID_INSPECTOR', 'Ahli K3 tidak ditemukan atau tidak aktif.');
          }

          // Cek sertifikat kompetensi untuk setiap kategori objek yang ditugaskan
          for (const cat of reqCategories) {
            const { rows: compRows } = await db.query(
              `SELECT id FROM inspector_competencies
               WHERE inspector_id = $1 AND category_id = $2 AND valid_until >= $3::date`,
              [inspectorId, cat.category_id, schedDate]
            );
            if (!compRows[0]) {
              throw new AppError(
                400,
                'COMPETENCY_INVALID',
                `Ahli K3 ${uRows[0].full_name} tidak memiliki sertifikat kompetensi aktif untuk bidang ${cat.code} (${cat.name}) pada tanggal jadwal.`
              );
            }
          }

          // Cek konflik jadwal dengan order lain
          const { rows: conflicts } = await db.query(
            `SELECT o.order_no, s.start_at, s.end_at
             FROM assignments a
             JOIN orders o ON o.id = a.order_id
             JOIN schedules s ON s.order_id = o.id
             WHERE a.inspector_id = $1
               AND a.order_id <> $2
               AND a.status IN ('MENUNGGU', 'DITERIMA')
               AND o.status NOT IN ('SELESAI', 'DIBATALKAN')
               AND tstzrange(s.start_at, s.end_at) && tstzrange($3::timestamptz, $4::timestamptz)`,
            [inspectorId, id, schedule.start_at, schedule.end_at]
          );

          if (conflicts[0]) {
            throw new AppError(
              409,
              'SCHEDULE_CONFLICT',
              `Jadwal bentrok: ${uRows[0].full_name} sudah terjadwal pada order ${conflicts[0].order_no}.`
            );
          }

          const { rows: ins } = await db.query(
            `INSERT INTO assignments (order_id, inspector_id, status, assigned_by)
             VALUES ($1, $2, 'MENUNGGU', $3)
             ON CONFLICT (order_id, inspector_id) WHERE status IN ('MENUNGGU', 'DITERIMA')
             DO UPDATE SET assigned_by = EXCLUDED.assigned_by
             RETURNING *`,
            [id, inspectorId, req.user.id]
          );
          createdAssignments.push(ins[0]);

          await createNotification(
            {
              userId: inspectorId,
              type: 'ASSIGNMENT_NEW',
              title: `Penugasan Baru: ${order.order_no}`,
              body: 'Silakan tinjau dan konfirmasi penugasan pemeriksaan K3 Anda.',
              link: `/app/orders`
            },
            db
          );
        }

        // Update status unit di dalam PO
        const primaryInspectorId = inspectorIds[0];
        if (objectId) {
          await db.query(
            `UPDATE order_objects
             SET inspector_id = $1,
                 unit_status = CASE WHEN unit_status IN ('BELUM_DIJADWALKAN', 'TERJADWAL') THEN 'DITUGASKAN' ELSE unit_status END,
                 updated_at = now()
             WHERE order_id = $2 AND object_id = $3`,
            [primaryInspectorId, id, objectId]
          );
        } else {
          await db.query(
            `UPDATE order_objects
             SET inspector_id = COALESCE(inspector_id, $1),
                 unit_status = CASE WHEN unit_status IN ('BELUM_DIJADWALKAN', 'TERJADWAL') THEN 'DITUGASKAN' ELSE unit_status END,
                 updated_at = now()
             WHERE order_id = $2`,
            [primaryInspectorId, id]
          );
        }

        if (order.status === 'TERJADWAL' || order.status === 'ORDER_BARU') {
          await db.query("UPDATE orders SET status = 'DITUGASKAN', updated_at = now() WHERE id = $1", [id]);
          await db.query(
            `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
             VALUES ($1, $2, 'DITUGASKAN', 'Ahli K3 ditugaskan', $3)`,
            [id, order.status, req.user.id]
          );
        }

        await recordAudit(
          {
            userId: req.user.id,
            action: 'ORDER_ASSIGN_INSPECTORS',
            entity: 'orders',
            entityId: id,
            summary: { inspectorIds, objectId: objectId || null },
            ip: req.ip
          },
          db
        );

        return createdAssignments;
      });

      return res.status(201).json({ assignments: assigned });
    } catch (err) {
      return next(err);
    }
  }
);

// M2-05: Konfirmasi terima atau tolak penugasan oleh Ahli K3
router.post(
  '/:id/assignments/:assignmentId/respond',
  authorize('AHLI_K3'),
  validate(respondAssignmentSchema),
  async (req, res, next) => {
    try {
      const { id, assignmentId } = req.params;
      const { decision, rejectReason } = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows } = await db.query(
          'SELECT * FROM assignments WHERE id = $1 AND order_id = $2',
          [assignmentId, id]
        );
        const asg = rows[0];
        if (!asg) throw new AppError(404, 'ASSIGNMENT_NOT_FOUND', 'Data penugasan tidak ditemukan.');
        if (asg.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengonfirmasi penugasan milik sendiri.');
        }

        const { rows: upd } = await db.query(
          `UPDATE assignments
           SET status = $1, reject_reason = $2, responded_at = now()
           WHERE id = $3
           RETURNING *`,
          [decision, decision === 'DITOLAK' ? rejectReason.trim() : null, assignmentId]
        );

        if (decision === 'DITOLAK') {
          // Kembalikan unit yang dipegang inspector ini ke antrean TERJADWAL bila belum diperiksa
          await db.query(
            `UPDATE order_objects
             SET inspector_id = NULL,
                 unit_status = CASE WHEN unit_status = 'DITUGASKAN' THEN 'TERJADWAL' ELSE unit_status END,
                 updated_at = now()
             WHERE order_id = $1 AND inspector_id = $2`,
            [id, req.user.id]
          );

          const { rows: remainingActive } = await db.query(
            "SELECT 1 FROM assignments WHERE order_id = $1 AND status IN ('MENUNGGU', 'DITERIMA') LIMIT 1",
            [id]
          );
          if (!remainingActive[0]) {
            await db.query(
              "UPDATE orders SET status = 'TERJADWAL', updated_at = now() WHERE id = $1 AND status = 'DITUGASKAN'",
              [id]
            );
          }
        }

        const { rows: ord } = await db.query('SELECT order_no FROM orders WHERE id = $1', [id]);
        await notifyRoles(
          {
            roles: ['ADMIN_KANTOR', 'ADMIN_SISTEM'],
            type: decision === 'DITERIMA' ? 'ASSIGNMENT_ACCEPTED' : 'ASSIGNMENT_REJECTED',
            title: `Penugasan ${decision === 'DITERIMA' ? 'Diterima' : 'Ditolak'}: ${ord[0]?.order_no || ''}`,
            body:
              decision === 'DITOLAK'
                ? `${req.user.fullName} menolak penugasan: ${rejectReason}`
                : `${req.user.fullName} menerima penugasan.`,
            link: `/app/orders`
          },
          db
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: `ASSIGNMENT_${decision}`,
            entity: 'assignments',
            entityId: assignmentId,
            summary: { orderId: id, decision, rejectReason: rejectReason || null },
            ip: req.ip
          },
          db
        );
        return upd[0];
      });

      return res.json({ assignment: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id/status',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(statusUpdateSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const updated = await withTransaction(async (db) => {
        const { rows: curRows } = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        const order = curRows[0];
        if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');

        if (status === 'SELESAI') {
          const { rows: unitRows } = await db.query(
            `SELECT oo.*, l.status AS lhpp_status
             FROM order_objects oo
             LEFT JOIN inspections i ON i.order_id = oo.order_id AND i.object_id = oo.object_id
             LEFT JOIN lhpp_documents l ON l.inspection_id = i.id
             WHERE oo.order_id = $1`,
            [id]
          );
          const normalized = unitRows.map((u) => ({
            ...u,
            unit_status: u.lhpp_status === 'TERBIT' ? 'LHPP_TERBIT' : u.unit_status
          }));
          const progress = computePoUnitProgress(normalized);
          if (!progress.canCompletePo) {
            throw new AppError(
              400,
              'PO_UNITS_INCOMPLETE',
              'PO belum dapat ditandai SELESAI karena masih ada unit alat yang belum menyelesaikan tahapan BAP dan penerbitan LHPP.'
            );
          }
        }

        const allowed = ALLOWED_TRANSITIONS[order.status] || [];
        if (!allowed.includes(status)) {
          throw new AppError(
            400,
            'INVALID_STATUS_TRANSITION',
            `Perubahan status dari ${order.status} ke ${status} tidak diizinkan oleh aturan alur kerja.`
          );
        }

        const { rows } = await db.query(
          `UPDATE orders
           SET status = $1,
               cancel_reason = CASE WHEN $1 = 'DIBATALKAN' THEN $2 ELSE cancel_reason END,
               completed_at = CASE WHEN $1 = 'SELESAI' THEN now() ELSE completed_at END,
               updated_at = now()
           WHERE id = $3
           RETURNING *`,
          [status, note || null, id]
        );

        if (status === 'DIBATALKAN') {
          await db.query(
            `UPDATE order_objects
             SET unit_status = 'DIBATALKAN', cancel_reason = COALESCE($2, cancel_reason), updated_at = now()
             WHERE order_id = $1`,
            [id, note || null]
          );
        }

        await db.query(
          `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, order.status, status, note || null, req.user.id]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'ORDER_STATUS_CHANGE',
            entity: 'orders',
            entityId: id,
            summary: { from: order.status, to: status, note: note || null },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.json({ order: updated });
    } catch (err) {
      return next(err);
    }
  }
);

// M2-08: Surat tugas digital PDF
router.get('/:id/assignment-letter.pdf', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      const { rows: own } = await query(
        'SELECT 1 FROM assignments WHERE order_id = $1 AND inspector_id = $2 LIMIT 1',
        [id, req.user.id]
      );
      if (!own[0]) throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
    }

    const { rows } = await query(
      `SELECT o.*, c.name AS client_name, c.address AS client_address,
              cl.name AS location_name, cl.address AS location_address,
              cc.name AS contact_name, cc.phone AS contact_phone,
              s.start_at, s.end_at
       FROM orders o
       JOIN clients c ON c.id = o.client_id
       LEFT JOIN client_locations cl ON cl.id = o.location_id
       LEFT JOIN client_contacts cc ON cc.id = o.contact_id
       LEFT JOIN schedules s ON s.order_id = o.id
       WHERE o.id = $1`,
      [id]
    );
    if (!rows[0]) throw new AppError(404, 'ORDER_NOT_FOUND', 'Order tidak ditemukan.');

    const [assignments, objects] = await Promise.all([
      query(
        `SELECT a.status, u.full_name, u.email
         FROM assignments a JOIN users u ON u.id = a.inspector_id
         WHERE a.order_id = $1 AND a.status IN ('MENUNGGU', 'DITERIMA')`,
        [id]
      ),
      query(
        `SELECT t.name, t.serial_number, t.brand, t.manufacturer, oc.code AS category_code
         FROM order_objects oo
         JOIN test_objects t ON t.id = oo.object_id
         JOIN object_categories oc ON oc.id = t.category_id
         WHERE oo.order_id = $1`,
        [id]
      )
    ]);

    const pdfBuffer = await generateAssignmentLetterPdfBuffer({
      ...rows[0],
      assignments: assignments.rows,
      objects: objects.rows
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Surat-Tugas-${rows[0].order_no.replace(/\//g, '-')}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
});

export default router;
