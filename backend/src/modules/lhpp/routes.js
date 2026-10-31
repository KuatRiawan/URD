import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { notifyRoles } from '../../services/notify.js';
import { generateLhppPdfBuffer } from '../../services/pdf-generator.js';
import { syncOrderUnitStatus } from '../../services/workflow.js';
import { resolveAttachmentPath, saveUploadedFile, uploadMiddleware } from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

const updateDraftSchema = Joi.object({
  methodSummary: Joi.string().min(5).max(3000).required(),
  technicalNotes: Joi.string().max(4000).allow('', null),
  recommendations: Joi.string().max(4000).allow('', null),
  technicalData: Joi.object().default({}),
  recommendedValidUntil: Joi.date().iso().allow('', null)
});

const finalizeLhppSchema = Joi.object({
  note: Joi.string().max(1500).allow('', null)
}).default({});

const deliverySchema = Joi.object({
  deliveredAt: Joi.date().iso().required(),
  channel: Joi.string()
    .valid('EMAIL', 'WHATSAPP', 'KURIR', 'SERAH_TERIMA_LANGSUNG', 'LAINNYA')
    .required(),
  recipientName: Joi.string().min(2).max(160).required(),
  recipientEmail: Joi.string().email().allow('', null),
  notes: Joi.string().max(1000).allow('', null)
});

async function fetchFullLhppContext(db, id) {
  const runner = typeof db === 'function' ? db : (db?.query ? db.query.bind(db) : query);
  const { rows } = await runner(
    `SELECT l.*,
            i.order_id, i.object_id, i.inspector_id, i.conclusion, i.conclusion_notes,
            i.inspected_at, i.submitted_at, i.template_version_id,
            o.order_no, o.po_number, o.po_date,
            b.id AS bap_id, b.bap_no, b.status AS bap_status, b.finalized_at AS bap_finalized_at,
            c.name AS client_name, c.address AS client_address,
            t.name AS object_name, t.brand, t.manufacturer, t.model, t.serial_number,
            t.manufacture_year, t.capacity, t.capacity_unit, t.install_location, t.previous_permit_no,
            t.attributes AS object_attributes,
            oc.code AS category_code, oc.name AS category_name, oc.lhpp_schema,
            u_insp.full_name AS inspector_name,
            u_rev.full_name AS reviewer_name,
            u_app.full_name AS approver_name
     FROM lhpp_documents l
     JOIN inspections i ON i.id = l.inspection_id
     JOIN orders o ON o.id = i.order_id
     LEFT JOIN bap_documents b ON b.inspection_id = i.id
     JOIN clients c ON c.id = o.client_id
     JOIN test_objects t ON t.id = i.object_id
     JOIN object_categories oc ON oc.id = t.category_id
     JOIN users u_insp ON u_insp.id = i.inspector_id
     LEFT JOIN users u_rev ON u_rev.id = l.reviewed_by
     LEFT JOIN users u_app ON u_app.id = l.approved_by
     WHERE l.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const base = rows[0];

  const results = await runner(
    `SELECT r.*, it.seq, it.section, it.label, it.input_type, it.unit
     FROM inspection_template_items it
     LEFT JOIN inspection_results r
       ON r.item_id = it.id
      AND r.inspection_id = $1
     WHERE it.version_id = (
       SELECT i.template_version_id FROM inspections i WHERE i.id = $1
     )
     ORDER BY it.seq ASC`,
    [base.inspection_id]
  );
  const findings = await runner(
    'SELECT * FROM inspection_findings WHERE inspection_id = $1 ORDER BY created_at ASC',
    [base.inspection_id]
  );
  const revisions = await runner(
    `SELECT r.*, u.full_name AS actor_name
     FROM lhpp_revisions r
     LEFT JOIN users u ON u.id = r.actor_id
     WHERE r.lhpp_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  );
  const deliveries = await runner(
    `SELECT d.*, u.full_name AS recorded_by_name
     FROM delivery_logs d
     LEFT JOIN users u ON u.id = d.recorded_by
     WHERE d.lhpp_id = $1
     ORDER BY d.delivered_at DESC`,
    [id]
  );
  const photos = await runner(
    `SELECT id, original_name AS "originalName", caption, mime_type AS "mimeType",
            size_bytes AS "sizeBytes", storage_key AS "storageKey", created_at AS "createdAt"
     FROM file_attachments
     WHERE deleted_at IS NULL
       AND (
         (owner_type = 'LHPP_PHOTO' AND owner_id = $1)
         OR (owner_type = 'INSPECTION_FINDING' AND (owner_id = $2 OR owner_id IN (SELECT id FROM inspection_findings WHERE inspection_id = $2)))
       )
     ORDER BY created_at ASC`,
    [id, base.inspection_id]
  );

  return {
    ...base,
    technical_data: {
      ...(typeof base.object_attributes === 'object' && base.object_attributes !== null ? base.object_attributes : {}),
      ...(typeof base.technical_data === 'object' && base.technical_data !== null ? base.technical_data : {})
    },
    results: results.rows,
    findings: findings.rows,
    revisions: revisions.rows,
    deliveries: deliveries.rows,
    photos: photos.rows
  };
}

export async function canAccessLhpp(db, lhpp, user) {
  if (!user) return false;
  if (['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN'].includes(user.role)) return true;
  if (!['AHLI_K3', 'INSPECTOR'].includes(user.role)) return false;
  if (lhpp.inspector_id === user.id) return true;
  const runner = typeof db === 'function' ? db : (db?.query ? db.query.bind(db) : query);
  const { rows } = await runner(
    `SELECT 1 FROM assignments
     WHERE order_id = $1 AND inspector_id = $2 AND status IN ('MENUNGGU','DITERIMA')
     LIMIT 1`,
    [lhpp.order_id, user.id]
  );
  return Boolean(rows[0]);
}

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = (req.query.status || '').trim();
    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`i.inspector_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conds.push(`l.status = $${params.length}`);
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM lhpp_documents l
       JOIN inspections i ON i.id = l.inspection_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT l.*, o.order_no, o.po_number, c.name AS client_name,
              t.name AS object_name, t.serial_number,
              oc.code AS category_code, oc.name AS category_name,
              b.id AS bap_id_ref, b.bap_no, b.status AS bap_status,
              u.full_name AS inspector_name,
              i.conclusion
       FROM lhpp_documents l
       JOIN inspections i ON i.id = l.inspection_id
       JOIN orders o ON o.id = i.order_id
       LEFT JOIN bap_documents b ON b.inspection_id = i.id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       ${whereSql}
       ORDER BY l.updated_at DESC
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
    const data = await fetchFullLhppContext({ query }, req.params.id);
    if (!data) throw new AppError(404, 'LHPP_NOT_FOUND', 'Dokumen LHPP tidak ditemukan.');
    const hasAccess = await canAccessLhpp({ query }, data, req.user);
    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat melihat LHPP milik sendiri.');
    }
    return res.json({ lhpp: data });
  } catch (err) {
    return next(err);
  }
});

// Ahli K3 menyusun / memperbarui draf LHPP
router.put(
  '/:id/draft',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'),
  validate(updateDraftSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { methodSummary, technicalNotes, recommendations, technicalData, recommendedValidUntil } = req.body;

      const updated = await withTransaction(async (db) => {
        const cur = await fetchFullLhppContext(db, id);
        if (!cur) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
        const hasAccess = await canAccessLhpp(db, cur, req.user);
        if (!hasAccess) {
          throw new AppError(403, 'FORBIDDEN', 'Hanya Ahli K3 / Inspector penyusun yang dapat mengubah draf ini.');
        }
        if (!['DRAF', 'SIAP_PREVIEW', 'DIKEMBALIKAN'].includes(cur.status)) {
          throw new AppError(
            409,
            'LHPP_LOCKED',
            `LHPP berstatus ${cur.status} tidak dapat diubah langsung.`
          );
        }

        const { rows } = await db.query(
          `UPDATE lhpp_documents
           SET method_summary = $1,
               technical_notes = $2,
               recommendations = $3,
               technical_data = COALESCE($4::jsonb, technical_data),
               recommended_valid_until = $5,
               updated_at = now()
           WHERE id = $6
           RETURNING *`,
          [
            methodSummary.trim(),
            technicalNotes || null,
            recommendations || null,
            technicalData ? JSON.stringify(technicalData) : null,
            recommendedValidUntil || cur.recommended_valid_until || null,
            id
          ]
        );

        if (recommendedValidUntil) {
          await db.query(
            `UPDATE test_objects
             SET next_inspection_date = $1, updated_at = now()
             WHERE id = $2`,
            [recommendedValidUntil, cur.object_id]
          );
        }

        await syncOrderUnitStatus(db, {
          orderId: cur.order_id,
          objectId: cur.object_id,
          unitStatus: 'LHPP_DRAF',
          actorId: req.user.id
        });

        return rows[0];
      });

      return res.json({ lhpp: updated });
    } catch (err) {
      return next(err);
    }
  }
);

// Unggah foto dokumentasi hasil riksa uji untuk lampiran LHPP
router.post(
  '/:id/photos',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'),
  uploadMiddleware.single('photo'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!req.file) throw new AppError(400, 'NO_FILE', 'Foto dokumentasi hasil riksa uji wajib dipilih.');
      const cur = await fetchFullLhppContext(query, id);
      if (!cur) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
      const hasAccess = await canAccessLhpp(query, cur, req.user);
      if (!hasAccess) {
        throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengelola foto LHPP milik sendiri.');
      }
      if (cur.status === 'TERBIT') {
        throw new AppError(409, 'LHPP_LOCKED', 'LHPP yang telah terbit terkunci dan tidak dapat ditambah foto.');
      }
      const saved = await saveUploadedFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerType: 'LHPP_PHOTO',
        ownerId: id,
        caption: req.body?.caption || 'Dokumentasi Foto Riksa Uji K3',
        uploadedBy: req.user.id
      });
      return res.status(201).json({ photo: saved });
    } catch (err) {
      return next(err);
    }
  }
);

// Hapus foto dokumentasi dari LHPP
router.delete(
  '/:id/photos/:photoId',
  authorize('AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id, photoId } = req.params;
      const cur = await fetchFullLhppContext(query, id);
      if (!cur) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
      const hasAccess = await canAccessLhpp(query, cur, req.user);
      if (!hasAccess) {
        throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengelola foto LHPP milik sendiri.');
      }
      if (cur.status === 'TERBIT') {
        throw new AppError(409, 'LHPP_LOCKED', 'LHPP yang telah terbit terkunci.');
      }
      await query(
        `UPDATE file_attachments
         SET deleted_at = now()
         WHERE id = $1
           AND deleted_at IS NULL
           AND ((owner_type = 'LHPP_PHOTO' AND owner_id = $2)
             OR (owner_type = 'INSPECTION_FINDING' AND (
               owner_id = $3
               OR owner_id IN (SELECT id FROM inspection_findings WHERE inspection_id = $3)
             )))`,
        [photoId, id, cur.inspection_id]
      );
      return res.json({ success: true, message: 'Foto dokumentasi berhasil dihapus.' });
    } catch (err) {
      return next(err);
    }
  }
);

// Inspector mengirim draf LHPP kepada Marketing untuk pratinjau dan finalisasi.
router.post('/:id/submit-finalization', authorize('INSPECTOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const submitted = await withTransaction(async (db) => {
      const cur = await fetchFullLhppContext(db, id);
      if (!cur) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
      const hasAccess = await canAccessLhpp(db, cur, req.user);
      if (!hasAccess) {
        throw new AppError(403, 'FORBIDDEN', 'Hanya Ahli K3 / Inspector penyusun yang dapat mengajukan LHPP ini.');
      }
      if (!['DRAF', 'SIAP_PREVIEW', 'DIKEMBALIKAN'].includes(cur.status)) {
        throw new AppError(400, 'INVALID_STATE', 'LHPP tidak berada pada status yang dapat dikirim untuk finalisasi.');
      }

      const nextVer = cur.status === 'DIKEMBALIKAN' ? cur.version + 1 : cur.version;
      const { rows } = await db.query(
        `UPDATE lhpp_documents
         SET status = 'SIAP_PREVIEW', version = $1, updated_at = now()
         WHERE id = $2
         RETURNING *`,
        [nextVer, id]
      );

      await db.query(
        `INSERT INTO lhpp_revisions (lhpp_id, version, action, note, snapshot, actor_id)
         VALUES ($1, $2, 'SUBMIT_FINALIZATION', 'Diajukan ke Marketing untuk pratinjau dan finalisasi', $3, $4)`,
        [
          id,
          nextVer,
          {
            method_summary: cur.method_summary,
            technical_notes: cur.technical_notes,
            recommendations: cur.recommendations,
            technical_data: cur.technical_data
          },
          req.user.id
        ]
      );

      await syncOrderUnitStatus(db, {
        orderId: cur.order_id,
        objectId: cur.object_id,
        unitStatus: 'LHPP_SIAP_PREVIEW',
        actorId: req.user.id
      });

      await db.query(
        "UPDATE orders SET status = 'MENUNGGU_DOKUMEN', updated_at = now() WHERE id = $1 AND status <> 'SELESAI'",
        [cur.order_id]
      );

      await notifyRoles(
        {
          roles: ['MARKETING'],
          type: 'LHPP_READY_TO_FINALIZE',
          title: `LHPP Siap Difinalisasi: ${cur.object_name}`,
          body: `Order ${cur.order_no} (${cur.client_name}) siap dipratinjau dan difinalisasi.`,
          link: `/app/lhpp`
        },
        db
      );

      await recordAudit(
        {
          userId: req.user.id,
          action: 'LHPP_SUBMIT_REVIEW',
          entity: 'lhpp_documents',
          entityId: id,
          summary: { version: nextVer, orderNo: cur.order_no },
          ip: req.ip
        },
        db
      );

      return rows[0];
    });

    return res.json({ lhpp: submitted });
  } catch (err) {
    return next(err);
  }
});

// Marketing mempratinjau dan memfinalisasi LHPP setelah Inspector mengirim hasil pemeriksaan.
router.post(
  '/:id/finalize',
  authorize('MARKETING', 'ADMIN_SISTEM'),
  validate(finalizeLhppSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { note } = req.body || {};

      const result = await withTransaction(async (db) => {
        const cur = await fetchFullLhppContext(db, id);
        if (!cur) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
        if (cur.status === 'TERBIT' || cur.status === 'FINAL') {
          return { lhpp: cur, bap: null, message: 'LHPP sudah dalam status final.' };
        }
        if (cur.status !== 'SIAP_PREVIEW') {
          throw new AppError(409, 'LHPP_NOT_READY', 'LHPP harus berada pada status Siap Pratinjau sebelum finalisasi.');
        }

        const seqRes = await db.query("SELECT nextval('lhpp_no_seq') AS seq");
        const now = new Date();
        const romanMonth = ROMAN_MONTHS[now.getMonth()];
        const year = now.getFullYear();
        const seqStr = String(seqRes.rows[0].seq).padStart(4, '0');
        const lhppNo = `${seqStr}/INSP-${cur.category_code}/PJK3-URD/${romanMonth}/${year}`;
        const verificationCode = `URD-${crypto
          .randomBytes(5)
          .toString('hex')
          .toUpperCase()}`;

        const fullForPdf = {
          ...cur,
          lhpp_no: lhppNo,
          status: 'TERBIT',
          verification_code: verificationCode,
          reviewer_name: cur.reviewer_name || req.user.fullName,
          approver_name: req.user.fullName,
          published_at: now.toISOString()
        };

        const pdfBuffer = await generateLhppPdfBuffer(fullForPdf);
        const docHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
        const savedPdf = await saveUploadedFile(
          {
            buffer: pdfBuffer,
            originalName: `${lhppNo.replace(/\//g, '-')}.pdf`,
            mimeType: 'application/pdf',
            ownerType: 'LHPP_PDF',
            ownerId: id,
            caption: `Dokumen Resmi ${lhppNo}`,
            uploadedBy: req.user.id
          },
          db
        );

        const { rows: lhppRows } = await db.query(
          `UPDATE lhpp_documents
           SET lhpp_no = $1,
               status = 'FINAL',
               verification_code = $2,
               document_hash = $3,
               finalized_by = $4,
               finalized_at = now(),
               published_at = now(),
               pdf_file_id = $5,
               updated_at = now()
           WHERE id = $6
           RETURNING *`,
          [lhppNo, verificationCode, docHash, req.user.id, savedPdf.id, id]
        );

        await db.query(
          `INSERT INTO lhpp_revisions (lhpp_id, version, action, note, snapshot, actor_id)
           VALUES ($1, $2, 'FINALIZED', $3, $4, $5)`,
          [
            id,
            cur.version,
            note || 'LHPP difinalisasi dan siap diterbitkan',
            { lhpp_no: lhppNo, verification_code: verificationCode },
            req.user.id
          ]
        );

        if (cur.recommended_valid_until) {
          await db.query(
            `UPDATE test_objects
             SET next_inspection_date = COALESCE(next_inspection_date, $1), updated_at = now()
             WHERE id = $2`,
            [cur.recommended_valid_until, cur.object_id]
          );
        }

        // TERBITKAN BAP SECARA OTOMATIS SETELAH LHPP SELESAI
        const seqBapRes = await db.query("SELECT nextval('bap_no_seq') AS seq");
        const rmBap = ROMAN_MONTHS[now.getMonth()];
        const generatedBapNo = `BAP/URD/${rmBap}/${year}/${String(seqBapRes.rows[0].seq).padStart(4, '0')}`;

        const { rows: sigRows } = await db.query(
          'SELECT * FROM inspection_signatures WHERE inspection_id = $1',
          [cur.inspection_id]
        );
        const inspSig = sigRows.find((s) => ['INSPECTOR', 'AHLI_K3'].includes(s.signer_role));
        const clientSig = sigRows.find((s) => ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role));

        const { rows: scopeRows } = await db.query(
          `SELECT oo.scope_items, oc.default_bap_scopes
           FROM order_objects oo
           JOIN test_objects t ON t.id = oo.object_id
           JOIN object_categories oc ON oc.id = t.category_id
           WHERE oo.order_id = $1 AND oo.object_id = $2`,
          [cur.order_id, cur.object_id]
        );
        const bapScopes = Array.isArray(scopeRows[0]?.scope_items) && scopeRows[0].scope_items.length
          ? scopeRows[0].scope_items
          : Array.isArray(scopeRows[0]?.default_bap_scopes)
          ? scopeRows[0].default_bap_scopes
          : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

        const { rows: bapRows } = await db.query(
          `INSERT INTO bap_documents
             (bap_no, inspection_id, lhpp_id, order_id, object_id, status, inspection_date, scope_items,
              conclusion, notes,
              inspector_signer_name, inspector_signer_title, inspector_signature_file_id, inspector_signed_at,
              client_signer_name, client_signer_title, client_signature_file_id, client_signed_at,
              created_by)
           VALUES ($1, $2, $3, $4, $5, 'DRAF', CURRENT_DATE, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
           ON CONFLICT (inspection_id) DO UPDATE SET
             lhpp_id = EXCLUDED.lhpp_id,
             scope_items = EXCLUDED.scope_items,
             conclusion = EXCLUDED.conclusion,
             notes = COALESCE(bap_documents.notes, EXCLUDED.notes),
             inspector_signer_name = COALESCE(EXCLUDED.inspector_signer_name, bap_documents.inspector_signer_name),
             inspector_signature_file_id = COALESCE(EXCLUDED.inspector_signature_file_id, bap_documents.inspector_signature_file_id),
             inspector_signed_at = COALESCE(EXCLUDED.inspector_signed_at, bap_documents.inspector_signed_at),
             client_signer_name = COALESCE(EXCLUDED.client_signer_name, bap_documents.client_signer_name),
             client_signature_file_id = COALESCE(EXCLUDED.client_signature_file_id, bap_documents.client_signature_file_id),
             client_signed_at = COALESCE(EXCLUDED.client_signed_at, bap_documents.client_signed_at),
             updated_at = now()
           RETURNING *`,
          [
            generatedBapNo,
            cur.inspection_id,
            id,
            cur.order_id,
            cur.object_id,
            JSON.stringify(bapScopes),
            cur.conclusion || 'MEMENUHI_SYARAT',
            cur.technical_notes || 'Pemeriksaan riksa uji selesai dan LHPP telah difinalisasi.',
            inspSig?.signer_name || cur.inspector_name || req.user.fullName,
            inspSig?.signer_title || 'Inspector K3',
            inspSig?.file_id || null,
            inspSig?.signed_at || now,
            clientSig?.signer_name || null,
            clientSig?.signer_title || 'PIC / Pemilik Unit',
            clientSig?.file_id || null,
            clientSig?.signed_at || null,
            req.user.id
          ]
        );

        await syncOrderUnitStatus(db, {
          orderId: cur.order_id,
          objectId: cur.object_id,
          unitStatus: 'BAP_DIPROSES',
          actorId: req.user.id
        });

        await recordAudit(
          {
            userId: req.user.id,
            action: 'LHPP_FINALIZE',
            entity: 'lhpp_documents',
            entityId: id,
            summary: { lhppNo, bapId: bapRows[0].id, bapNo: bapRows[0].bap_no },
            ip: req.ip
          },
          db
        );

        return { lhpp: lhppRows[0], bap: bapRows[0] };
      });

      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
);

// Endpoint approval lama dinonaktifkan agar keputusan review/reject tidak dapat dipicu lewat API.
router.post('/:id/review', authorize('ADMIN_SISTEM', 'MARKETING'), (_req, _res, next) => {
  next(new AppError(410, 'LEGACY_REVIEW_REMOVED', 'Alur review dan approval LHPP telah dihapus. Gunakan pratinjau dan finalisasi Marketing.'));
});
router.post('/:id/submit-review', authorize('INSPECTOR'), (_req, _res, next) => {
  next(new AppError(410, 'LEGACY_REVIEW_REMOVED', 'Gunakan alur kirim finalisasi LHPP yang baru.'));
});

// M4-05: Unduh LHPP PDF
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const cur = await fetchFullLhppContext({ query }, req.params.id);
    if (!cur) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
    const hasAccess = await canAccessLhpp({ query }, cur, req.user);
    if (!hasAccess) {
      throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengunduh LHPP milik sendiri.');
    }

    let pdfBuffer;
    if (cur.pdf_file_id) {
      const { rows } = await query(
        `SELECT storage_key FROM file_attachments
         WHERE id = $1 AND owner_type = 'LHPP_PDF' AND owner_id = $2 AND deleted_at IS NULL`,
        [cur.pdf_file_id, cur.id]
      );
      if (!rows[0]) throw new AppError(404, 'LHPP_PDF_NOT_FOUND', 'Berkas LHPP final tidak ditemukan.');
      pdfBuffer = await readFile(resolveAttachmentPath(rows[0].storage_key));
    } else {
      pdfBuffer = await generateLhppPdfBuffer(cur);
    }
    await recordAudit({
      userId: req.user.id,
      action: 'LHPP_DOWNLOAD_PDF',
      entity: 'lhpp_documents',
      entityId: cur.id,
      summary: { lhppNo: cur.lhpp_no || 'DRAF' },
      ip: req.ip
    });

    const filename = cur.lhpp_no ? `${cur.lhpp_no.replace(/\//g, '-')}.pdf` : `Draf-LHPP-${cur.id.slice(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
});

// M4-07: Pencatatan pengiriman LHPP ke klien
router.post(
  '/:id/deliveries',
  authorize('ADMIN_SISTEM', 'ADMIN_KANTOR'),
  validate(deliverySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { deliveredAt, channel, recipientName, recipientEmail, notes } = req.body;

      const delivery = await withTransaction(async (db) => {
        const { rows: lhpp } = await db.query(
          `SELECT l.*, i.order_id, i.object_id
           FROM lhpp_documents l
           JOIN inspections i ON i.id = l.inspection_id
           WHERE l.id = $1`,
          [id]
        );
        if (!lhpp[0]) throw new AppError(404, 'LHPP_NOT_FOUND', 'LHPP tidak ditemukan.');
        if (lhpp[0].status !== 'TERBIT' && lhpp[0].status !== 'FINAL') {
          throw new AppError(
            400,
            'LHPP_NOT_PUBLISHED',
            'Hanya LHPP yang sudah berstatus FINAL atau TERBIT yang dapat dicatat pengirimannya ke klien.'
          );
        }

        const { rows } = await db.query(
          `INSERT INTO delivery_logs
             (lhpp_id, delivered_at, channel, recipient_name, recipient_email, notes, recorded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            id,
            deliveredAt,
            channel,
            recipientName.trim(),
            recipientEmail || null,
            notes || null,
            req.user.id
          ]
        );

        await syncOrderUnitStatus(db, {
          orderId: lhpp[0].order_id,
          objectId: lhpp[0].object_id,
          unitStatus: 'SELESAI',
          actorId: req.user.id
        });

        await recordAudit(
          {
            userId: req.user.id,
            action: 'LHPP_RECORD_DELIVERY',
            entity: 'delivery_logs',
            entityId: rows[0].id,
            summary: { lhppId: id, channel, recipientName },
            ip: req.ip
          },
          db
        );
        return rows[0];
      });

      return res.status(201).json({ delivery });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
