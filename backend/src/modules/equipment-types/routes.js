import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { AppError } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

// Skema validasi domain riksa uji
const createDomainSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(40).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0)
});

const updateDomainSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().integer().min(0).optional()
});

// Skema validasi pembuatan jenis alat (Equipment Type / Group)
const createEquipmentGroupSchema = Joi.object({
  domainCode: Joi.string().trim().uppercase().required(),
  code: Joi.string().trim().uppercase().min(2).max(60).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0)
});

// Skema pembaruan jenis alat
const updateEquipmentGroupSchema = Joi.object({
  domainCode: Joi.string().trim().uppercase().optional(),
  code: Joi.string().trim().uppercase().min(2).max(60).optional(),
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().integer().min(0).optional()
});

// Skema validasi pembuatan nama alat (Equipment Name)
const createEquipmentTypeSchema = Joi.object({
  domainCode: Joi.string().trim().uppercase().required(),
  groupId: Joi.string().uuid().allow('', null).optional(),
  typeId: Joi.string().uuid().allow('', null).optional(),
  code: Joi.string().trim().uppercase().min(2).max(60).required(),
  name: Joi.string().trim().min(2).max(120).required(),
  parentId: Joi.string().uuid().allow('', null).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  attributeSchema: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().trim().required(),
        label: Joi.string().trim().required(),
        unit: Joi.string().trim().allow('', null).optional(),
        required: Joi.boolean().default(false)
      })
    )
    .default([]),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().min(0).default(0)
});

// Skema pembaruan nama alat
const updateEquipmentTypeSchema = Joi.object({
  domainCode: Joi.string().trim().uppercase().optional(),
  groupId: Joi.string().uuid().allow('', null).optional(),
  typeId: Joi.string().uuid().allow('', null).optional(),
  code: Joi.string().trim().uppercase().min(2).max(60).optional(),
  name: Joi.string().trim().min(2).max(120).required(),
  parentId: Joi.string().uuid().allow('', null).optional(),
  description: Joi.string().trim().max(500).allow('', null).optional(),
  attributeSchema: Joi.array()
    .items(
      Joi.object({
        key: Joi.string().trim().required(),
        label: Joi.string().trim().required(),
        unit: Joi.string().trim().allow('', null).optional(),
        required: Joi.boolean().default(false)
      })
    )
    .default([]),
  isActive: Joi.boolean().optional(),
  displayOrder: Joi.number().integer().min(0).optional()
});

// 1. Daftar 7 Bidang Riksa Uji (Inspection Domains)
router.get('/domains', async (req, res, next) => {
  try {
    const onlyActive = req.query.active === 'true';
    const whereSql = onlyActive ? 'WHERE d.is_active = true' : '';

    const { rows } = await query(
      `SELECT d.*,
              oc.name AS legacy_category_name,
              oc.code AS legacy_category_code,
              (SELECT count(*)::int FROM equipment_types et WHERE et.domain_code = d.code AND et.is_active = true) AS active_types_count,
              (SELECT count(*)::int FROM equipment_types et WHERE et.domain_code = d.code) AS total_types_count
       FROM inspection_domains d
       LEFT JOIN object_categories oc ON oc.id = d.legacy_category_id
       ${whereSql}
       ORDER BY d.display_order ASC, d.name ASC`
    );

    return res.json({ domains: rows, items: rows });
  } catch (err) {
    return next(err);
  }
});

// POST /domains: Tambah bidang riksa uji baru (Super Admin Only)
router.post(
  '/domains',
  authorize('ADMIN_SISTEM'),
  validate(createDomainSchema),
  async (req, res, next) => {
    try {
      const { code, name, description, isActive, displayOrder } = req.body;
      const { rows: dup } = await query('SELECT code FROM inspection_domains WHERE code = $1', [code]);
      if (dup[0]) {
        throw new AppError(409, 'DUPLICATE_CODE', `Bidang riksa uji "${code}" sudah terdaftar.`);
      }

      const { rows } = await query(
        `INSERT INTO inspection_domains (code, name, description, is_active, display_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [code, name, description || null, isActive ?? true, displayOrder || 0]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'INSPECTION_DOMAIN_CREATE',
        entity: 'inspection_domains',
        entityId: rows[0].code,
        summary: { code, name },
        ip: req.ip
      });

      return res.status(201).json({
        message: `Bidang riksa uji "${name}" berhasil ditambahkan.`,
        domain: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PUT /domains/:code: Update informasi bidang riksa uji (Super Admin Only)
router.put(
  '/domains/:code',
  authorize('ADMIN_SISTEM'),
  validate(updateDomainSchema),
  async (req, res, next) => {
    try {
      const { code } = req.params;
      const { name, description, isActive, displayOrder } = req.body;

      const { rows: existing } = await query('SELECT * FROM inspection_domains WHERE code = $1', [code]);
      if (!existing[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Bidang riksa uji tidak ditemukan.');
      }

      const { rows } = await query(
        `UPDATE inspection_domains
         SET name = $1,
             description = coalesce($2, description),
             is_active = coalesce($3, is_active),
             display_order = coalesce($4, display_order),
             updated_at = now()
         WHERE code = $5
         RETURNING *`,
        [name, description, isActive, displayOrder, code]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'INSPECTION_DOMAIN_UPDATE',
        entity: 'inspection_domains',
        entityId: code,
        summary: { code, name },
        ip: req.ip
      });

      return res.json({
        message: `Bidang riksa uji "${name}" berhasil diperbarui.`,
        domain: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /domains/:code/status: Ubah status aktif bidang (Super Admin Only)
router.patch(
  '/domains/:code/status',
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { code } = req.params;
      const { isActive } = req.body;
      const { rows } = await query(
        `UPDATE inspection_domains
         SET is_active = $1, updated_at = now()
         WHERE code = $2
         RETURNING *`,
        [Boolean(isActive), code]
      );
      if (!rows[0]) throw new AppError(404, 'NOT_FOUND', 'Bidang riksa uji tidak ditemukan.');

      await recordAudit({
        userId: req.user.id,
        action: 'INSPECTION_DOMAIN_STATUS_CHANGE',
        entity: 'inspection_domains',
        entityId: code,
        summary: { code, isActive },
        ip: req.ip
      });

      return res.json({
        message: `Status bidang "${rows[0].name}" diubah menjadi ${rows[0].is_active ? 'Aktif' : 'Nonaktif'}.`,
        domain: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /domains/:code: Hapus bidang riksa uji bila belum digunakan (Super Admin Only)
router.delete(
  '/domains/:code',
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { code } = req.params;
      const { rows: egCount } = await query('SELECT count(*)::int AS count FROM equipment_groups WHERE domain_code = $1', [code]);
      const { rows: etCount } = await query('SELECT count(*)::int AS count FROM equipment_types WHERE domain_code = $1', [code]);
      if ((egCount[0]?.count || 0) > 0 || (etCount[0]?.count || 0) > 0) {
        throw new AppError(409, 'DOMAIN_REFERENCED', `Bidang "${code}" masih menaungi jenis/nama alat aktif. Silakan nonaktifkan bidang.`);
      }

      await query('DELETE FROM inspection_domains WHERE code = $1', [code]);
      return res.json({ message: `Bidang riksa uji "${code}" berhasil dihapus permanen.` });
    } catch (err) {
      return next(err);
    }
  }
);

// 2. Daftar Jenis Pemeriksaan Resmi (Pertama, Berkala, Khusus, Ulang)
router.get('/inspection-types', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM inspection_types ORDER BY display_order ASC`
    );
    return res.json({ inspectionTypes: rows });
  } catch (err) {
    return next(err);
  }
});

// 2b. Kelompok / Jenis Alat (Equipment Types / Groups) Endpoints
// GET /groups atau /types: Daftar Jenis Alat dengan filter domain, status aktif, dan pencarian
router.get(['/groups', '/types'], async (req, res, next) => {
  try {
    const domainCode = (req.query.domainCode || req.query.domain || '').trim().toUpperCase();
    const onlyActive = req.query.active === 'true' || (!['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(req.user.role) && req.query.includeInactive !== 'true');
    const q = (req.query.q || '').trim();

    const conds = [];
    const params = [];

    if (domainCode) {
      params.push(domainCode);
      conds.push(`eg.domain_code = $${params.length}`);
    }

    if (onlyActive) {
      conds.push('eg.is_active = true');
    }

    if (q) {
      params.push(`%${q}%`);
      conds.push(`(eg.name ILIKE $${params.length} OR eg.code ILIKE $${params.length} OR coalesce(eg.description, '') ILIKE $${params.length})`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT eg.*,
              d.name AS domain_name,
              (SELECT count(*)::int FROM equipment_types et WHERE et.group_id = eg.id) AS total_types_count,
              (SELECT count(*)::int FROM equipment_types et WHERE et.group_id = eg.id AND et.is_active = true) AS active_types_count,
              (SELECT count(*)::int FROM test_objects o WHERE o.equipment_group_id = eg.id OR o.equipment_type_id IN (SELECT id FROM equipment_types WHERE group_id = eg.id)) AS usage_count
       FROM equipment_groups eg
       JOIN inspection_domains d ON d.code = eg.domain_code
       ${whereSql}
       ORDER BY d.display_order ASC, eg.display_order ASC, eg.name ASC`,
      params
    );

    const items = rows.map((r) => ({
      ...r,
      type_id: r.id,
      type_name: r.name,
      equipment_type_name: r.name,
      total_names_count: r.total_types_count,
      active_names_count: r.active_types_count
    }));

    return res.json({ items, total: items.length });
  } catch (err) {
    return next(err);
  }
});

// GET /groups/:id atau /types/:id: Detail satu jenis alat beserta daftar nama alat di dalamnya
router.get(['/groups/:id', '/types/:id'], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT eg.*,
              d.name AS domain_name,
              (SELECT count(*)::int FROM equipment_types et WHERE et.group_id = eg.id) AS total_types_count,
              (SELECT count(*)::int FROM equipment_types et WHERE et.group_id = eg.id AND et.is_active = true) AS active_types_count,
              (SELECT count(*)::int FROM test_objects o WHERE o.equipment_group_id = eg.id OR o.equipment_type_id IN (SELECT id FROM equipment_types WHERE group_id = eg.id)) AS usage_count
       FROM equipment_groups eg
       JOIN inspection_domains d ON d.code = eg.domain_code
       WHERE eg.id = $1`,
      [id]
    );

    if (!rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Jenis alat tidak ditemukan.');
    }

    const { rows: childNames } = await query(
      `SELECT et.*,
              (SELECT count(*)::int FROM test_objects o WHERE o.equipment_type_id = et.id OR o.equipment_subtype_id = et.id) AS usage_count,
              (SELECT count(*)::int FROM inspection_templates t WHERE t.equipment_type_id = et.id OR t.subtype_id = et.id) AS templates_count
       FROM equipment_types et
       WHERE et.group_id = $1
       ORDER BY et.display_order ASC, et.name ASC`,
      [id]
    );

    const item = {
      ...rows[0],
      type_id: rows[0].id,
      type_name: rows[0].name,
      equipment_type_name: rows[0].name,
      total_names_count: rows[0].total_types_count,
      active_names_count: rows[0].active_types_count
    };

    return res.json({ item, types: childNames, names: childNames });
  } catch (err) {
    return next(err);
  }
});

// POST /groups atau /types: Tambah jenis alat baru (Super Admin Only)
router.post(
  ['/groups', '/types'],
  authorize('ADMIN_SISTEM'),
  validate(createEquipmentGroupSchema),
  async (req, res, next) => {
    try {
      const { domainCode, code, name, description, isActive, displayOrder } = req.body;

      // Validasi domain
      const { rows: domRows } = await query(
        'SELECT * FROM inspection_domains WHERE code = $1',
        [domainCode]
      );
      if (!domRows[0]) {
        throw new AppError(400, 'INVALID_DOMAIN', 'Bidang riksa uji tidak valid.');
      }

      // Validasi duplikasi kode
      const { rows: dupRows } = await query(
        'SELECT id FROM equipment_groups WHERE code = $1',
        [code]
      );
      if (dupRows[0]) {
        throw new AppError(409, 'DUPLICATE_CODE', `Kode jenis alat "${code}" sudah terdaftar.`);
      }

      const { rows } = await query(
        `INSERT INTO equipment_groups (domain_code, code, name, description, is_active, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [domainCode, code, name, description || null, isActive ?? true, displayOrder || 0]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'EQUIPMENT_GROUP_CREATE',
        entity: 'equipment_groups',
        entityId: rows[0].id,
        summary: { code, name, domainCode },
        ip: req.ip
      });

      return res.status(201).json({
        message: `Jenis alat "${name}" berhasil ditambahkan.`,
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PUT /groups/:id atau /types/:id: Update jenis alat (Super Admin Only)
router.put(
  ['/groups/:id', '/types/:id'],
  authorize('ADMIN_SISTEM'),
  validate(updateEquipmentGroupSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { domainCode, code, name, description, isActive, displayOrder } = req.body;

      const { rows: existing } = await query('SELECT * FROM equipment_groups WHERE id = $1', [id]);
      if (!existing[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Jenis alat tidak ditemukan.');
      }

      const newCode = code ? code.trim().toUpperCase() : existing[0].code;
      if (newCode !== existing[0].code) {
        const { rows: dupRows } = await query(
          'SELECT id FROM equipment_groups WHERE code = $1 AND id != $2',
          [newCode, id]
        );
        if (dupRows[0]) {
          throw new AppError(409, 'DUPLICATE_CODE', `Kode jenis alat "${newCode}" sudah digunakan.`);
        }
      }

      const finalDomainCode = domainCode || existing[0].domain_code;

      const { rows } = await query(
        `UPDATE equipment_groups
         SET domain_code = $1,
             code = $2,
             name = $3,
             description = $4,
             is_active = coalesce($5, is_active),
             display_order = coalesce($6, display_order),
             updated_at = now()
         WHERE id = $7
         RETURNING *`,
        [
          finalDomainCode,
          newCode,
          name,
          description !== undefined ? (description || null) : existing[0].description,
          isActive,
          displayOrder,
          id
        ]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'EQUIPMENT_GROUP_UPDATE',
        entity: 'equipment_groups',
        entityId: id,
        summary: { code: newCode, name, domainCode: finalDomainCode },
        ip: req.ip
      });

      return res.json({
        message: `Jenis alat "${name}" berhasil diperbarui.`,
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// PATCH /groups/:id/status atau /types/:id/status: Toggle status aktif jenis alat
router.patch(
  ['/groups/:id/status', '/types/:id/status'],
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Parameter isActive (boolean) wajib disertakan.');
      }

      const { rows } = await query(
        `UPDATE equipment_groups
         SET is_active = $1,
             updated_at = now()
         WHERE id = $2
         RETURNING *`,
        [isActive, id]
      );

      if (!rows[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Jenis alat tidak ditemukan.');
      }

      await recordAudit({
        userId: req.user.id,
        action: isActive ? 'EQUIPMENT_GROUP_ACTIVATE' : 'EQUIPMENT_GROUP_DEACTIVATE',
        entity: 'equipment_groups',
        entityId: id,
        summary: { name: rows[0].name, code: rows[0].code, isActive },
        ip: req.ip
      });

      return res.json({
        message: `Jenis alat "${rows[0].name}" berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// DELETE /groups/:id atau /types/:id: Hapus jenis alat (Hanya jika belum memiliki nama unit & belum direferensikan)
router.delete(
  ['/groups/:id', '/types/:id'],
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { rows: existing } = await query('SELECT * FROM equipment_groups WHERE id = $1', [id]);
      if (!existing[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Jenis alat tidak ditemukan.');
      }

      // Periksa nama unit di dalam jenis alat ini
      const { rows: typesUsage } = await query(
        'SELECT count(*)::int AS count FROM equipment_types WHERE group_id = $1',
        [id]
      );
      const typesCount = typesUsage[0]?.count || 0;

      // Periksa objek uji
      const { rows: objUsage } = await query(
        `SELECT count(*)::int AS count FROM test_objects
         WHERE equipment_group_id = $1 OR equipment_type_id IN (SELECT id FROM equipment_types WHERE group_id = $1)`,
        [id]
      );
      const objectsCount = objUsage[0]?.count || 0;

      if (typesCount > 0 || objectsCount > 0) {
        throw new AppError(
          409,
          'CANNOT_DELETE_REFERENCED',
          `Jenis alat "${existing[0].name}" tidak dapat dihapus permanen karena masih menaungi ` +
            `${typesCount} nama alat dan direferensikan oleh ${objectsCount} objek uji. ` +
            'Gunakan opsi Nonaktifkan untuk mencegah jenis ini dipilih pada transaksi baru tanpa menghapus data.',
          {
            typesCount,
            objectsCount,
            recommendation: 'DEACTIVATE'
          }
        );
      }

      await query('DELETE FROM equipment_groups WHERE id = $1', [id]);

      await recordAudit({
        userId: req.user.id,
        action: 'EQUIPMENT_GROUP_DELETE',
        entity: 'equipment_groups',
        entityId: id,
        summary: { name: existing[0].name, code: existing[0].code },
        ip: req.ip
      });

      return res.json({
        message: `Jenis alat "${existing[0].name}" (${existing[0].code}) berhasil dihapus permanen.`
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 3. Daftar Katalog Nama Alat (Equipment Names)
router.get(['/', '/names'], async (req, res, next) => {
  try {
    const domainCode = (req.query.domainCode || req.query.domain || '').trim().toUpperCase();
    const groupId = (req.query.groupId || req.query.group || req.query.typeId || req.query.type || '').trim();
    const parentId = req.query.parentId;
    const onlyActive = req.query.active === 'true' || (!['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(req.user.role) && req.query.includeInactive !== 'true');
    const q = (req.query.q || '').trim();

    const conds = [];
    const params = [];

    if (domainCode) {
      params.push(domainCode);
      conds.push(`et.domain_code = $${params.length}`);
    }

    if (groupId) {
      params.push(groupId);
      conds.push(`et.group_id = $${params.length}`);
    }

    if (parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        conds.push('et.parent_id IS NULL');
      } else {
        params.push(parentId);
        conds.push(`et.parent_id = $${params.length}`);
      }
    }

    if (onlyActive) {
      conds.push('et.is_active = true');
    }

    if (q) {
      params.push(`%${q}%`);
      conds.push(`(et.name ILIKE $${params.length} OR et.code ILIKE $${params.length} OR coalesce(et.description, '') ILIKE $${params.length})`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT et.*,
              d.name AS domain_name,
              eg.name AS group_name,
              eg.code AS group_code,
              eg.name AS type_name,
              eg.code AS type_code,
              p.name AS parent_name,
              p.code AS parent_code,
              (SELECT count(*)::int FROM test_objects o WHERE o.equipment_name_id = et.id OR o.equipment_type_id = et.id OR o.equipment_subtype_id = et.id) AS usage_count,
              (SELECT count(*)::int FROM inspection_templates t WHERE t.equipment_name_id = et.id OR t.equipment_type_id = et.id OR t.subtype_id = et.id) AS templates_count,
              (SELECT count(*)::int FROM equipment_types st WHERE st.parent_id = et.id) AS subtypes_count
       FROM equipment_types et
       JOIN inspection_domains d ON d.code = et.domain_code
       LEFT JOIN equipment_groups eg ON eg.id = et.group_id
       LEFT JOIN equipment_types p ON p.id = et.parent_id
       ${whereSql}
       ORDER BY d.display_order ASC, coalesce(eg.display_order, 999) ASC, et.parent_id NULLS FIRST, et.display_order ASC, et.name ASC`,
      params
    );

    const items = rows.map((r) => ({
      ...r,
      name_id: r.id,
      equipment_name: r.name,
      equipment_name_code: r.code,
      type_id: r.group_id,
      type_name: r.group_name || r.type_name,
      equipment_type_name: r.group_name || r.type_name
    }));

    return res.json({ items, total: items.length });
  } catch (err) {
    return next(err);
  }
});

// 4. Detail Satu Nama Alat Lengkap
router.get(['/:id', '/names/:id'], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT et.*,
              d.name AS domain_name,
              eg.name AS group_name,
              eg.code AS group_code,
              eg.name AS type_name,
              eg.code AS type_code,
              p.name AS parent_name,
              p.code AS parent_code,
              (SELECT count(*)::int FROM test_objects o WHERE o.equipment_name_id = et.id OR o.equipment_type_id = et.id OR o.equipment_subtype_id = et.id) AS usage_count,
              (SELECT count(*)::int FROM inspection_templates t WHERE t.equipment_name_id = et.id OR t.equipment_type_id = et.id OR t.subtype_id = et.id) AS templates_count
       FROM equipment_types et
       JOIN inspection_domains d ON d.code = et.domain_code
       LEFT JOIN equipment_groups eg ON eg.id = et.group_id
       LEFT JOIN equipment_types p ON p.id = et.parent_id
       WHERE et.id = $1`,
      [id]
    );

    if (!rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Nama alat tidak ditemukan.');
    }

    // Ambil subjenis jika ada
    const { rows: subtypes } = await query(
      `SELECT * FROM equipment_types WHERE parent_id = $1 ORDER BY display_order ASC, name ASC`,
      [id]
    );

    const item = {
      ...rows[0],
      name_id: rows[0].id,
      equipment_name: rows[0].name,
      equipment_name_code: rows[0].code,
      type_id: rows[0].group_id,
      type_name: rows[0].group_name,
      equipment_type_name: rows[0].group_name
    };

    return res.json({ item, subtypes });
  } catch (err) {
    return next(err);
  }
});

// 5. Tambah Nama Alat Baru (Super Admin Only)
router.post(
  ['/', '/names'],
  authorize('ADMIN_SISTEM'),
  validate(createEquipmentTypeSchema),
  async (req, res, next) => {
    try {
      const {
        domainCode,
        groupId,
        typeId,
        code,
        name,
        parentId,
        description,
        attributeSchema,
        isActive,
        displayOrder
      } = req.body;

      // Validasi Domain Riksa Uji
      const { rows: domRows } = await query(
        'SELECT * FROM inspection_domains WHERE code = $1',
        [domainCode]
      );
      if (!domRows[0]) {
        throw new AppError(400, 'INVALID_DOMAIN', 'Bidang riksa uji tidak valid atau tidak terdaftar.');
      }

      // Validasi Kelompok / Jenis Alat jika disertakan
      let finalGroupId = groupId || typeId || null;
      if (finalGroupId) {
        const { rows: grpRows } = await query(
          'SELECT id, domain_code FROM equipment_groups WHERE id = $1',
          [finalGroupId]
        );
        if (!grpRows[0]) {
          throw new AppError(400, 'INVALID_GROUP', 'Jenis alat tidak ditemukan.');
        }
        if (grpRows[0].domain_code !== domainCode) {
          throw new AppError(400, 'GROUP_DOMAIN_MISMATCH', 'Jenis alat harus berada dalam bidang riksa uji yang sama.');
        }
      }

      // Validasi Duplikasi Kode
      const { rows: dupRows } = await query(
        'SELECT id FROM equipment_types WHERE code = $1',
        [code]
      );
      if (dupRows[0]) {
        throw new AppError(409, 'DUPLICATE_CODE', `Kode nama alat "${code}" sudah terdaftar.`);
      }

      // Validasi Parent jika merupakan subjenis (legacy)
      if (parentId) {
        const { rows: parentRows } = await query(
          'SELECT id, domain_code, group_id FROM equipment_types WHERE id = $1',
          [parentId]
        );
        if (!parentRows[0]) {
          throw new AppError(400, 'INVALID_PARENT', 'Unit induk tidak ditemukan.');
        }
        if (parentRows[0].domain_code !== domainCode) {
          throw new AppError(400, 'DOMAIN_MISMATCH', 'Subjenis harus berada dalam bidang riksa uji yang sama.');
        }
        if (!finalGroupId && parentRows[0].group_id) {
          finalGroupId = parentRows[0].group_id;
        }
      }

      const { rows } = await query(
        `INSERT INTO equipment_types
           (domain_code, group_id, parent_id, code, name, description, attribute_schema, is_active, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          domainCode,
          finalGroupId,
          parentId || null,
          code,
          name,
          description || null,
          JSON.stringify(attributeSchema || []),
          isActive ?? true,
          displayOrder || 0
        ]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'EQUIPMENT_TYPE_CREATE',
        entity: 'equipment_types',
        entityId: rows[0].id,
        summary: { code, name, domainCode, groupId: finalGroupId, parentId },
        ip: req.ip
      });

      return res.status(201).json({
        message: `Nama alat "${name}" berhasil ditambahkan.`,
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 6. Ubah Nama Alat (Super Admin Only)
router.put(
  ['/:id', '/names/:id'],
  authorize('ADMIN_SISTEM'),
  validate(updateEquipmentTypeSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        domainCode,
        groupId,
        typeId,
        code,
        name,
        parentId,
        description,
        attributeSchema,
        isActive,
        displayOrder
      } = req.body;

      const { rows: existing } = await query('SELECT * FROM equipment_types WHERE id = $1', [id]);
      if (!existing[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Nama alat tidak ditemukan.');
      }

      // Jika kode diubah, periksa keunikan
      const newCode = code ? code.trim().toUpperCase() : existing[0].code;
      if (newCode !== existing[0].code) {
        const { rows: dupRows } = await query(
          'SELECT id FROM equipment_types WHERE code = $1 AND id != $2',
          [newCode, id]
        );
        if (dupRows[0]) {
          throw new AppError(409, 'DUPLICATE_CODE', `Kode nama alat "${newCode}" sudah digunakan.`);
        }
      }

      // Validasi relasi parent
      const finalParentId = parentId !== undefined ? (parentId || null) : existing[0].parent_id;
      if (finalParentId && finalParentId === id) {
        throw new AppError(400, 'SELF_PARENT', 'Nama alat tidak dapat menjadi induk bagi dirinya sendiri.');
      }

      const finalDomainCode = domainCode || existing[0].domain_code;

      let finalGroupId = (groupId !== undefined ? groupId : typeId) || existing[0].group_id;
      if (finalGroupId) {
        const { rows: grpRows } = await query(
          'SELECT id, domain_code FROM equipment_groups WHERE id = $1',
          [finalGroupId]
        );
        if (!grpRows[0]) {
          throw new AppError(400, 'INVALID_GROUP', 'Jenis alat tidak ditemukan.');
        }
        if (grpRows[0].domain_code !== finalDomainCode) {
          throw new AppError(400, 'GROUP_DOMAIN_MISMATCH', 'Jenis alat harus berada dalam bidang riksa uji yang sama.');
        }
      }

      const { rows } = await query(
        `UPDATE equipment_types
         SET domain_code = $1,
             group_id = $2,
             code = $3,
             name = $4,
             parent_id = $5,
             description = $6,
             attribute_schema = $7,
             is_active = coalesce($8, is_active),
             display_order = coalesce($9, display_order),
             updated_at = now()
         WHERE id = $10
         RETURNING *`,
        [
          finalDomainCode,
          finalGroupId,
          newCode,
          name,
          finalParentId,
          description !== undefined ? (description || null) : existing[0].description,
          JSON.stringify(attributeSchema || existing[0].attribute_schema || []),
          isActive,
          displayOrder,
          id
        ]
      );

      await recordAudit({
        userId: req.user.id,
        action: 'EQUIPMENT_TYPE_UPDATE',
        entity: 'equipment_types',
        entityId: id,
        summary: { code: newCode, name, domainCode: finalDomainCode, groupId: finalGroupId },
        ip: req.ip
      });

      return res.json({
        message: `Nama alat "${name}" berhasil diperbarui.`,
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 7. Toggle Status Aktif / Nonaktif / Arsip Nama Alat (Super Admin Only)
router.patch(
  ['/:id/status', '/names/:id/status'],
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        throw new AppError(400, 'VALIDATION_ERROR', 'Parameter isActive (boolean) wajib disertakan.');
      }

      const { rows } = await query(
        `UPDATE equipment_types
         SET is_active = $1,
             updated_at = now()
         WHERE id = $2
         RETURNING *`,
        [isActive, id]
      );

      if (!rows[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Nama alat tidak ditemukan.');
      }

      await recordAudit({
        userId: req.user.id,
        action: isActive ? 'EQUIPMENT_TYPE_ACTIVATE' : 'EQUIPMENT_TYPE_DEACTIVATE',
        entity: 'equipment_types',
        entityId: id,
        summary: { name: rows[0].name, code: rows[0].code, isActive },
        ip: req.ip
      });

      return res.json({
        message: `Nama alat "${rows[0].name}" berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
        item: rows[0]
      });
    } catch (err) {
      return next(err);
    }
  }
);

// 8. Hapus Nama Alat (Hanya jika belum direferensikan)
router.delete(
  ['/:id', '/names/:id'],
  authorize('ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const { rows: existing } = await query('SELECT * FROM equipment_types WHERE id = $1', [id]);
      if (!existing[0]) {
        throw new AppError(404, 'NOT_FOUND', 'Nama alat tidak ditemukan.');
      }

      // Pemeriksaan Integritas Referensial
      const { rows: objUsage } = await query(
        `SELECT count(*)::int AS count FROM test_objects
         WHERE equipment_name_id = $1 OR equipment_type_id = $1 OR equipment_subtype_id = $1`,
        [id]
      );
      const objectsCount = objUsage[0]?.count || 0;

      const { rows: tplUsage } = await query(
        `SELECT count(*)::int AS count FROM inspection_templates
         WHERE equipment_name_id = $1 OR equipment_type_id = $1 OR subtype_id = $1`,
        [id]
      );
      const templatesCount = tplUsage[0]?.count || 0;

      const { rows: subtypeUsage } = await query(
        `SELECT count(*)::int AS count FROM equipment_types
         WHERE parent_id = $1`,
        [id]
      );
      const subtypesCount = subtypeUsage[0]?.count || 0;

      if (objectsCount > 0 || templatesCount > 0 || subtypesCount > 0) {
        throw new AppError(
          409,
          'CANNOT_DELETE_REFERENCED',
          `Nama alat "${existing[0].name}" tidak dapat dihapus permanen karena masih direferensikan oleh ` +
            `${objectsCount} objek uji, ${templatesCount} template inspeksi, dan ${subtypesCount} turunan. ` +
            'Gunakan opsi Nonaktifkan untuk mencegah unit dipilih pada transaksi baru tanpa merusak data historis.',
          {
            objectsCount,
            templatesCount,
            subtypesCount,
            recommendation: 'DEACTIVATE'
          }
        );
      }

      await query('DELETE FROM equipment_types WHERE id = $1', [id]);

      await recordAudit({
        userId: req.user.id,
        action: 'EQUIPMENT_TYPE_DELETE',
        entity: 'equipment_types',
        entityId: id,
        summary: { name: existing[0].name, code: existing[0].code },
        ip: req.ip
      });

      return res.json({
        message: `Nama alat "${existing[0].name}" (${existing[0].code}) berhasil dihapus permanen.`
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;

