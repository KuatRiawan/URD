import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { createNotification, notifyRoles } from '../../services/notify.js';
import { saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const ISSUE_TYPES = [
  'UNIT_MISMATCH', 'UNIT_UNAVAILABLE', 'UNSAFE_CONDITION', 'CHECKLIST_GAP',
  'MEASURING_TOOL', 'PIC_ABSENT', 'SIGNATURE_DECLINED', 'NETWORK_OR_RECOVERY',
  'UNIT_ADDITIONAL', 'RESCHEDULE', 'INSPECTOR_UNAVAILABLE', 'PO_CHANGE',
  'DOCUMENT_DELAY', 'OTHER'
];
const ISSUE_STATUSES = [
  'DILAPORKAN', 'MENUNGGU_TINDAK_LANJUT', 'SEDANG_DITANGANI', 'MENUNGGU_INFORMASI',
  'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'
];
const TRANSITIONS = {
  DILAPORKAN: ['MENUNGGU_TINDAK_LANJUT', 'SEDANG_DITANGANI', 'MENUNGGU_INFORMASI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  MENUNGGU_TINDAK_LANJUT: ['SEDANG_DITANGANI', 'MENUNGGU_INFORMASI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  SEDANG_DITANGANI: ['MENUNGGU_INFORMASI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  MENUNGGU_INFORMASI: ['SEDANG_DITANGANI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  SIAP_DILANJUTKAN: ['SEDANG_DITANGANI', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  SELESAI: [],
  TIDAK_DAPAT_DILANJUTKAN: []
};

const createSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  objectId: Joi.string().uuid().allow('', null),
  inspectionId: Joi.string().uuid().allow('', null),
  issueType: Joi.string().valid(...ISSUE_TYPES).required(),
  priority: Joi.string().valid('RENDAH', 'NORMAL', 'TINGGI').default('NORMAL'),
  title: Joi.string().min(5).max(160).required(),
  description: Joi.string().min(5).max(3000).required()
});
const updateSchema = Joi.object({
  status: Joi.string().valid(...ISSUE_STATUSES),
  assignedTo: Joi.string().uuid().allow(null),
  actionNote: Joi.string().min(3).max(1000).required()
}).min(1);
const listSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  q: Joi.string().max(160).allow(''),
  status: Joi.string().valid(...ISSUE_STATUSES),
  orderId: Joi.string().uuid()
});
const idSchema = Joi.object({ id: Joi.string().uuid().required() });

const canManage = (role) => ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR'].includes(role);
const isInspector = (role) => ['INSPECTOR', 'AHLI_K3'].includes(role);

async function assertIssueAccess(issue, user) {
  if (canManage(user.role) || ['PIMPINAN', 'MANAGER'].includes(user.role)) return;
  if (issue.reported_by === user.id) return;
  if (isInspector(user.role)) {
    const { rows } = await query(
      `SELECT 1 FROM assignments
       WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU', 'DITERIMA') LIMIT 1`,
      [issue.order_id, user.id]
    );
    if (rows[0]) return;
  }
  throw new AppError(404, 'ISSUE_NOT_FOUND', 'Laporan kendala tidak ditemukan.');
}

router.get('/', async (req, res, next) => {
  try {
    const { error: queryError, value: filters } = listSchema.validate(req.query);
    if (queryError) throw new AppError(400, 'VALIDATION_ERROR', queryError.details[0].message);
    const { page, limit, offset } = parsePagination(filters, 20, 100);
    const conditions = [];
    const params = [];
    if (isInspector(req.user.role)) {
      params.push(req.user.id);
      conditions.push(`(oi.reported_by = $${params.length} OR EXISTS (
        SELECT 1 FROM assignments ax WHERE ax.order_id = oi.order_id AND ax.inspector_id = $${params.length}
          AND ax.status IN ('MENUNGGU','DITERIMA')
      ))`);
    }
    if (filters.status) {
      params.push(filters.status);
      conditions.push(`oi.status = $${params.length}`);
    }
    if (filters.orderId) {
      params.push(filters.orderId);
      conditions.push(`oi.order_id = $${params.length}`);
    }
    if (filters.q?.trim()) {
      params.push(`%${filters.q.trim().toLowerCase()}%`);
      conditions.push(`(lower(oi.issue_no) LIKE $${params.length} OR lower(oi.title) LIKE $${params.length}
        OR lower(o.po_number) LIKE $${params.length} OR lower(c.name) LIKE $${params.length}
        OR lower(coalesce(t.serial_number, '')) LIKE $${params.length})`);
    }
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const count = await query(
      `SELECT count(*)::int AS total FROM operational_issues oi
       JOIN orders o ON o.id = oi.order_id JOIN clients c ON c.id = o.client_id
       LEFT JOIN test_objects t ON t.id = oi.object_id ${whereSql}`,
      params
    );
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT oi.*, o.order_no, o.po_number, c.name AS client_name,
              t.name AS object_name, t.serial_number, reporter.full_name AS reporter_name,
              assignee.full_name AS assignee_name
       FROM operational_issues oi
       JOIN orders o ON o.id = oi.order_id JOIN clients c ON c.id = o.client_id
       LEFT JOIN test_objects t ON t.id = oi.object_id
       JOIN users reporter ON reporter.id = oi.reported_by
       LEFT JOIN users assignee ON assignee.id = oi.assigned_to
       ${whereSql}
       ORDER BY CASE oi.priority WHEN 'TINGGI' THEN 0 ELSE 1 END, oi.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return res.json({ items: rows, page, limit, total: count.rows[0].total });
  } catch (err) {
    return next(err);
  }
});

router.post('/', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR'), validate(createSchema), async (req, res, next) => {
  try {
    const input = req.body;
    const issue = await withTransaction(async (db) => {
      const { rows: orders } = await db.query('SELECT id, order_no, po_number FROM orders WHERE id = $1', [input.orderId]);
      const order = orders[0];
      if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'PO tidak ditemukan.');
      if (isInspector(req.user.role)) {
        const { rows: assigned } = await db.query(
          "SELECT 1 FROM assignments WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU','DITERIMA') LIMIT 1",
          [input.orderId, req.user.id]
        );
        if (!assigned[0]) throw new AppError(403, 'ORDER_NOT_ASSIGNED', 'Kendala hanya dapat dilaporkan untuk PO yang ditugaskan kepada Anda.');
      }
      if (input.objectId) {
        const { rows: object } = await db.query('SELECT 1 FROM order_objects WHERE order_id = $1 AND object_id = $2', [input.orderId, input.objectId]);
        if (!object[0]) throw new AppError(400, 'OBJECT_NOT_IN_ORDER', 'Unit tersebut tidak tercantum pada PO.');
      }
      if (input.inspectionId) {
        const { rows: inspection } = await db.query(
          'SELECT 1 FROM inspections WHERE id = $1 AND order_id = $2 AND ($3::uuid IS NULL OR object_id = $3)',
          [input.inspectionId, input.orderId, input.objectId || null]
        );
        if (!inspection[0]) throw new AppError(400, 'INSPECTION_MISMATCH', 'Pemeriksaan tidak sesuai dengan PO atau unit.');
      }
      const { rows: seq } = await db.query("SELECT nextval('operational_issue_no_seq') AS value");
      const now = new Date();
      const issueNo = `KDL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(seq[0].value).padStart(5, '0')}`;
      const priority = input.issueType === 'UNSAFE_CONDITION' ? 'TINGGI' : input.priority;
      const { rows } = await db.query(
        `INSERT INTO operational_issues
          (issue_no, issue_type, priority, order_id, object_id, inspection_id, reported_by, title, description)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [issueNo, input.issueType, priority, input.orderId, input.objectId || null, input.inspectionId || null, req.user.id, input.title.trim(), input.description.trim()]
      );
      const created = rows[0];
      await db.query(
        `INSERT INTO operational_issue_events (issue_id, event_type, to_status, note, actor_id)
         VALUES ($1, 'DILAPORKAN', $2, $3, $4)`,
        [created.id, created.status, 'Laporan kendala dibuat.', req.user.id]
      );
      await notifyRoles({
        roles: ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR'],
        type: 'OPERATIONAL_ISSUE',
        title: `Kendala baru ${issueNo}`,
        body: `${created.title} · PO ${order.po_number || order.order_no}`,
        link: `/app/issues?issueId=${created.id}`
      }, db);
      await recordAudit({
        userId: req.user.id, action: 'OPERATIONAL_ISSUE_CREATE', entity: 'operational_issues',
        entityId: created.id, summary: { issueNo, issueType: created.issue_type, orderId: input.orderId }, ip: req.ip
      }, db);
      return created;
    });
    return res.status(201).json({ issue });
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', validate(idSchema, 'params'), async (req, res, next) => {
  try {
    const [{ rows: issues }, { rows: events }, { rows: evidence }] = await Promise.all([
      query(`SELECT oi.*, o.order_no, o.po_number, c.name AS client_name, t.name AS object_name,
                    t.serial_number, reporter.full_name AS reporter_name, assignee.full_name AS assignee_name
             FROM operational_issues oi JOIN orders o ON o.id = oi.order_id JOIN clients c ON c.id = o.client_id
             LEFT JOIN test_objects t ON t.id = oi.object_id JOIN users reporter ON reporter.id = oi.reported_by
             LEFT JOIN users assignee ON assignee.id = oi.assigned_to
             WHERE oi.id = $1`, [req.params.id]),
      query(`SELECT e.*, u.full_name AS actor_name FROM operational_issue_events e
             LEFT JOIN users u ON u.id = e.actor_id WHERE e.issue_id = $1 ORDER BY e.created_at ASC`, [req.params.id]),
      query(`SELECT a.id, a.original_name, a.mime_type, a.size_bytes, a.created_at
             FROM operational_issue_evidence e JOIN file_attachments a ON a.id = e.file_id
             WHERE e.issue_id = $1 ORDER BY e.created_at ASC`, [req.params.id])
    ]);
    if (!issues[0]) throw new AppError(404, 'ISSUE_NOT_FOUND', 'Laporan kendala tidak ditemukan.');
    await assertIssueAccess(issues[0], req.user);
    return res.json({ issue: issues[0], events, evidence });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:id', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'), validate(idSchema, 'params'), validate(updateSchema), async (req, res, next) => {
  try {
    const updated = await withTransaction(async (db) => {
      const { rows: found } = await db.query('SELECT * FROM operational_issues WHERE id = $1 FOR UPDATE', [req.params.id]);
      const current = found[0];
      if (!current) throw new AppError(404, 'ISSUE_NOT_FOUND', 'Laporan kendala tidak ditemukan.');
      let nextStatus = req.body.status || current.status;
      let nextAssignee = req.body.assignedTo === undefined ? current.assigned_to : req.body.assignedTo;
      if (req.body.status && !TRANSITIONS[current.status]?.includes(req.body.status)) {
        throw new AppError(409, 'INVALID_ISSUE_TRANSITION', `Status ${current.status} tidak dapat diubah menjadi ${req.body.status}.`);
      }
      if (nextAssignee) {
        const { rows: assignee } = await db.query(
          "SELECT id FROM users WHERE id = $1 AND is_active = true AND role IN ('ADMIN_SISTEM','MARKETING','ADMIN_KANTOR')",
          [nextAssignee]
        );
        if (!assignee[0]) throw new AppError(400, 'INVALID_ISSUE_ASSIGNEE', 'Penanggung jawab harus akun operasional aktif.');
      }
      const closes = ['SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'].includes(nextStatus);
      const { rows } = await db.query(
        `UPDATE operational_issues SET status = $1, assigned_to = $2,
             resolution_note = CASE WHEN $3 THEN $4 ELSE resolution_note END,
             closed_at = CASE WHEN $3 THEN now() WHEN $5 THEN NULL ELSE closed_at END,
             updated_at = now() WHERE id = $6 RETURNING *`,
        [nextStatus, nextAssignee, closes, closes ? req.body.actionNote : null, Boolean(req.body.status && !closes && current.closed_at), req.params.id]
      );
      const assignmentChanged = nextAssignee !== current.assigned_to;
      const statusChanged = nextStatus !== current.status;
      await db.query(
        `INSERT INTO operational_issue_events (issue_id, event_type, from_status, to_status, note, actor_id)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, assignmentChanged && !statusChanged ? 'DITUGASKAN' : 'STATUS_DIUBAH', current.status, nextStatus, req.body.actionNote.trim(), req.user.id]
      );
      await createNotification({
        userId: current.reported_by, type: 'OPERATIONAL_ISSUE_UPDATE', title: `Pembaruan kendala ${current.issue_no}`,
        body: `Status: ${nextStatus.replaceAll('_', ' ')}. ${req.body.actionNote.trim()}`,
        link: `/app/issues?issueId=${current.id}`
      }, db);
      await recordAudit({
        userId: req.user.id, action: 'OPERATIONAL_ISSUE_UPDATE', entity: 'operational_issues', entityId: current.id,
        summary: { issueNo: current.issue_no, fromStatus: current.status, toStatus: nextStatus, assignedTo: nextAssignee }, ip: req.ip
      }, db);
      return rows[0];
    });
    return res.json({ issue: updated });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/evidence', authorize('ADMIN_SISTEM', 'ADMIN_KANTOR', 'INSPECTOR'), validate(idSchema, 'params'), uploadMiddleware.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'NO_FILE', 'Pilih foto atau dokumen bukti terlebih dahulu.');
    const result = await withTransaction(async (db) => {
      const { rows } = await db.query('SELECT * FROM operational_issues WHERE id = $1 FOR UPDATE', [req.params.id]);
      const issue = rows[0];
      if (!issue) throw new AppError(404, 'ISSUE_NOT_FOUND', 'Laporan kendala tidak ditemukan.');
      if (!canManage(req.user.role) && issue.reported_by !== req.user.id) {
        throw new AppError(403, 'FORBIDDEN', 'Hanya pelapor atau petugas operasional yang dapat menambah bukti.');
      }
      const file = await saveUploadedFile({
        buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype,
        ownerType: 'OPERATIONAL_ISSUE', ownerId: issue.id, caption: issue.issue_no, uploadedBy: req.user.id
      }, db);
      await db.query('INSERT INTO operational_issue_evidence (issue_id, file_id, uploaded_by) VALUES ($1,$2,$3)', [issue.id, file.id, req.user.id]);
      await db.query('UPDATE operational_issues SET updated_at = now() WHERE id = $1', [issue.id]);
      await db.query(
        `INSERT INTO operational_issue_events (issue_id, event_type, from_status, to_status, note, actor_id)
         VALUES ($1,'BUKTI_DITAMBAHKAN',$2,$2,$3,$4)`,
        [issue.id, issue.status, `Bukti ditambahkan: ${file.original_name}`, req.user.id]
      );
      await recordAudit({ userId: req.user.id, action: 'OPERATIONAL_ISSUE_EVIDENCE', entity: 'operational_issues', entityId: issue.id, summary: { issueNo: issue.issue_no }, ip: req.ip }, db);
      return file;
    });
    return res.status(201).json({ evidence: result });
  } catch (err) {
    return next(err);
  }
});

export default router;
