import crypto from 'node:crypto';
import { Router } from 'express';
import Joi from 'joi';
import { query, withTransaction } from '../../database/pool.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { recordAudit } from '../../services/audit.js';
import { notifyRoles } from '../../services/notify.js';
import { generateBapPdfBuffer } from '../../services/pdf-generator.js';
import { BAP_SCOPE_CATALOG, syncOrderUnitStatus } from '../../services/workflow.js';
import {
  resolveAttachmentPath,
  saveDataUrlPng,
  saveUploadedFile
} from '../../storage/file-storage.js';
import { AppError, parsePagination } from '../../utils/http.js';

const router = Router();
router.use(authenticate);

const updateBapDraftSchema = Joi.object({
  inspectionDate: Joi.date().iso().allow('', null),
  scopeItems: Joi.array().items(Joi.string().max(160)).min(1).required(),
  conclusion: Joi.string()
    .valid('MEMENUHI_SYARAT', 'MEMENUHI_SYARAT_DENGAN_CATATAN', 'TIDAK_MEMENUHI_SYARAT')
    .allow('', null),
  isCompliant: Joi.boolean().allow(null),
  notes: Joi.string().max(4000).allow('', null),
  inspectionNotes: Joi.string().max(4000).allow('', null),
  visualCheckNotes: Joi.string().max(2000).allow('', null),
  dimensionMeasurementNotes: Joi.string().max(2000).allow('', null),
  ndtTestingNotes: Joi.string().max(2000).allow('', null),
  loadFunctionTestNotes: Joi.string().max(2000).allow('', null),
  safetyDeviceCheckNotes: Joi.string().max(2000).allow('', null)
});

const bapSignatureSchema = Joi.object({
  signerRole: Joi.string().valid('AHLI_K3', 'PERWAKILAN_KLIEN').required(),
  signerName: Joi.string().min(2).max(160).required(),
  signerTitle: Joi.string().max(160).allow('', null),
  dataUrl: Joi.string().min(20).required()
});

const reopenBapSchema = Joi.object({
  reason: Joi.string().min(3).max(1000).required()
});

export async function fetchFullBapContext(db, id) {
  const { rows } = await db.query(
    `SELECT b.*,
            i.inspector_id, i.conclusion_notes, i.inspected_at, i.submitted_at,
            o.order_no, o.po_number, o.po_date, o.service_type,
            c.name AS client_name, c.address AS client_address, c.phone AS client_phone,
            cl.name AS location_name, cl.address AS location_address, cl.city AS location_city,
            t.name AS object_name, t.brand, t.model, t.manufacturer,
            t.serial_number, t.manufacture_year, t.capacity, t.capacity_unit,
            t.install_location, t.previous_permit_no, t.attributes,
            oc.code AS category_code, oc.name AS category_name,
            oc.default_bap_scopes, oc.lhpp_schema,
            u_insp.full_name AS inspector_name,
            f_insp.storage_key AS inspector_sig_storage_key,
            f_cli.storage_key AS client_sig_storage_key,
            l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
     FROM bap_documents b
     JOIN inspections i ON i.id = b.inspection_id
     JOIN orders o ON o.id = b.order_id
     JOIN clients c ON c.id = o.client_id
     LEFT JOIN client_locations cl ON cl.id = o.location_id
     JOIN test_objects t ON t.id = b.object_id
     JOIN object_categories oc ON oc.id = t.category_id
     JOIN users u_insp ON u_insp.id = i.inspector_id
     LEFT JOIN file_attachments f_insp ON f_insp.id = b.inspector_signature_file_id
     LEFT JOIN file_attachments f_cli ON f_cli.id = b.client_signature_file_id
     LEFT JOIN lhpp_documents l ON l.inspection_id = b.inspection_id
     WHERE b.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const bap = rows[0];
  return {
    ...bap,
    is_compliant: bap.conclusion !== 'TIDAK_MEMENUHI_SYARAT',
    inspection_notes: bap.notes || '',
    inspector_sig_file_id: bap.inspector_signature_file_id,
    client_sig_file_id: bap.client_signature_file_id,
    inspector_signature_path: bap.inspector_sig_storage_key
      ? resolveAttachmentPath(bap.inspector_sig_storage_key)
      : null,
    client_signature_path: bap.client_sig_storage_key
      ? resolveAttachmentPath(bap.client_sig_storage_key)
      : null
  };
}

router.get('/scopes', async (_req, res, next) => {
  try {
    const { rows: categories } = await query(
      'SELECT id, code, name, default_bap_scopes, lhpp_schema FROM object_categories ORDER BY id ASC'
    );
    return res.json({ catalog: BAP_SCOPE_CATALOG, scopes: BAP_SCOPE_CATALOG, categories });
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const status = (req.query.status || '').trim();
    const orderId = (req.query.orderId || '').trim();
    const search = (req.query.q || '').trim();

    const conds = [];
    const params = [];

    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role)) {
      params.push(req.user.id);
      conds.push(`i.inspector_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conds.push(`b.status = $${params.length}`);
    }
    if (orderId) {
      params.push(orderId);
      conds.push(`b.order_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conds.push(
        `(lower(b.bap_no) LIKE $${params.length} OR lower(o.order_no) LIKE $${params.length} OR lower(coalesce(o.po_number,'')) LIKE $${params.length} OR lower(c.name) LIKE $${params.length} OR lower(t.name) LIKE $${params.length})`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countRes = await query(
      `SELECT count(*)::int AS total
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       JOIN orders o ON o.id = b.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = b.object_id
       ${whereSql}`,
      params
    );

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT b.*,
              o.order_no, o.po_number,
              c.name AS client_name,
              t.name AS object_name, t.serial_number, t.capacity,
              oc.code AS category_code, oc.name AS category_name,
              u.full_name AS inspector_name,
              l.id AS lhpp_id, l.lhpp_no, l.status AS lhpp_status
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       JOIN orders o ON o.id = b.order_id
       JOIN clients c ON c.id = o.client_id
       JOIN test_objects t ON t.id = b.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN users u ON u.id = i.inspector_id
       LEFT JOIN lhpp_documents l ON l.inspection_id = b.inspection_id
       ${whereSql}
       ORDER BY b.updated_at DESC
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
    const bap = await fetchFullBapContext({ query }, req.params.id);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && bap.inspector_id !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengakses BAP milik penugasan Anda.');
    }
    const { rows: revisions } = await query(
      `SELECT r.*, u.full_name AS actor_name
       FROM bap_revisions r
       LEFT JOIN users u ON u.id = r.actor_id
       WHERE r.bap_id = $1
       ORDER BY r.created_at DESC`,
      [bap.id]
    );
    return res.json({ bap, revisions, scopeCatalog: BAP_SCOPE_CATALOG });
  } catch (err) {
    return next(err);
  }
});

router.put(
  '/:id/draft',
  authorize('AHLI_K3', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(updateBapDraftSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { inspectionDate, scopeItems, conclusion, isCompliant, notes, inspectionNotes } = req.body;
      const resolvedConclusion =
        conclusion || (isCompliant === false ? 'TIDAK_MEMENUHI_SYARAT' : 'MEMENUHI_SYARAT');
      const resolvedNotes = notes !== undefined ? notes : inspectionNotes;

      const updated = await withTransaction(async (db) => {
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && cur.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat mengubah BAP milik penugasan Anda.');
        }
        if (cur.status === 'FINAL') {
          throw new AppError(
            409,
            'BAP_LOCKED',
            'BAP yang sudah difinalisasi terkunci. Gunakan fitur Revisi BAP untuk membuka kunci dengan alasan tercatat.'
          );
        }

        const { rows } = await db.query(
          `UPDATE bap_documents
           SET inspection_date = COALESCE($1::date, inspection_date),
               scope_items = $2::jsonb,
               conclusion = $3,
               notes = $4,
               updated_at = now()
           WHERE id = $5
           RETURNING *`,
          [
            inspectionDate || null,
            JSON.stringify(scopeItems),
            resolvedConclusion,
            resolvedNotes || null,
            id
          ]
        );

        await db.query(
          `UPDATE order_objects
           SET scope_items = $1::jsonb, updated_at = now()
           WHERE order_id = $2 AND object_id = $3`,
          [JSON.stringify(scopeItems), cur.order_id, cur.object_id]
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'BAP_UPDATE_DRAFT',
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, scopeCount: scopeItems.length, conclusion: resolvedConclusion },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.json({ bap: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/signatures',
  authorize('AHLI_K3', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  validate(bapSignatureSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { signerRole, signerName, signerTitle, dataUrl } = req.body;

      const updated = await withTransaction(async (db) => {
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && cur.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat menandatangani BAP penugasan Anda.');
        }
        if (cur.status === 'FINAL') {
          throw new AppError(409, 'BAP_LOCKED', 'BAP sudah difinalisasi dan tidak dapat diubah.');
        }

        const file = await saveDataUrlPng(
          {
            dataUrl,
            ownerType: 'BAP_SIGNATURE',
            ownerId: id,
            originalName: `ttd-bap-${signerRole.toLowerCase()}.png`,
            uploadedBy: req.user.id
          },
          db
        );

        // Simpan juga ke inspection_signatures untuk pemeriksaan terkait
        await db.query(
          `INSERT INTO inspection_signatures (inspection_id, signer_role, signer_name, signer_title, file_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (inspection_id, signer_role) DO UPDATE SET
             signer_name = EXCLUDED.signer_name,
             signer_title = EXCLUDED.signer_title,
             file_id = EXCLUDED.file_id,
             signed_at = now()`,
          [cur.inspection_id, signerRole, signerName.trim(), signerTitle || null, file.id]
        );

        let updQuery;
        if (signerRole === 'AHLI_K3') {
          updQuery = `
            UPDATE bap_documents
            SET inspector_signer_name = $1,
                inspector_signer_title = $2,
                inspector_signature_file_id = $3,
                inspector_signed_at = now(),
                updated_at = now()
            WHERE id = $4
            RETURNING *`;
        } else {
          updQuery = `
            UPDATE bap_documents
            SET client_signer_name = $1,
                client_signer_title = $2,
                client_signature_file_id = $3,
                client_signed_at = now(),
                updated_at = now()
            WHERE id = $4
            RETURNING *`;
        }

        const { rows } = await db.query(updQuery, [
          signerName.trim(),
          signerTitle || null,
          file.id,
          id
        ]);

        await recordAudit(
          {
            userId: req.user.id,
            action: `BAP_SIGN_${signerRole}`,
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, signerRole, signerName: signerName.trim() },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.status(201).json({ bap: updated });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/finalize',
  authorize('AHLI_K3', 'ADMIN_KANTOR', 'ADMIN_SISTEM'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await withTransaction(async (db) => {
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && cur.inspector_id !== req.user.id) {
          throw new AppError(403, 'FORBIDDEN', 'Anda hanya dapat memfinalisasi BAP penugasan Anda.');
        }
        if (cur.status === 'FINAL') {
          throw new AppError(400, 'BAP_ALREADY_FINAL', 'Dokumen BAP sudah berstatus FINAL.');
        }

        const scopes = Array.isArray(cur.scope_items) ? cur.scope_items : [];
        if (scopes.length === 0) {
          throw new AppError(
            400,
            'BAP_SCOPE_REQUIRED',
            'Pilih minimal satu butir Ruang Lingkup Riksa Uji yang dilaksanakan sebelum memfinalisasi BAP.'
          );
        }
        if (!cur.conclusion) {
          throw new AppError(
            400,
            'BAP_CONCLUSION_REQUIRED',
            'Kesimpulan hasil riksa uji pada BAP wajib ditetapkan.'
          );
        }
        if (!cur.inspector_signature_file_id || !cur.inspector_signer_name) {
          throw new AppError(
            400,
            'BAP_INSPECTOR_SIGNATURE_REQUIRED',
            'Tanda tangan Inspector / Ahli K3 wajib dilengkapi sebelum BAP difinalisasi.'
          );
        }
        if (!cur.client_signature_file_id || !cur.client_signer_name) {
          throw new AppError(
            400,
            'BAP_CLIENT_SIGNATURE_REQUIRED',
            'Tanda tangan Pemilik Alat / Perwakilan Klien wajib dilengkapi sebelum BAP difinalisasi.'
          );
        }

        const verificationCode = cur.verification_code || `URD-BAP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const pdfBuffer = await generateBapPdfBuffer({ ...cur, status: 'FINAL', verification_code: verificationCode });
        const docHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
        const savedPdf = await saveUploadedFile(
          {
            buffer: pdfBuffer,
            originalName: `${cur.bap_no.replace(/\//g, '-')}.pdf`,
            mimeType: 'application/pdf',
            ownerType: 'BAP_PDF',
            ownerId: id,
            caption: `Berita Acara Riksa Uji ${cur.bap_no}`,
            uploadedBy: req.user.id
          },
          db
        );

        const { rows: bapRows } = await db.query(
          `UPDATE bap_documents
           SET status = 'FINAL',
               verification_code = $1,
               document_hash = $2,
               pdf_file_id = $3,
               finalized_by = $4,
               finalized_at = now(),
               updated_at = now()
           WHERE id = $5
           RETURNING *`,
          [verificationCode, docHash, savedPdf.id, req.user.id, id]
        );

        await db.query(
          `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
           VALUES ($1, $2, 'FINALIZED', 'BAP difinalisasi dan siap dicetak', $3, $4)`,
          [
            id,
            cur.version,
            {
              bap_no: cur.bap_no,
              scope_items: cur.scope_items,
              conclusion: cur.conclusion,
              inspector_signer_name: cur.inspector_signer_name,
              client_signer_name: cur.client_signer_name
            },
            req.user.id
          ]
        );

        // Status unit setelah BAP difinalisasi menjadi SIAP_DISTRIBUSI
        await syncOrderUnitStatus(db, {
          orderId: cur.order_id,
          objectId: cur.object_id,
          unitStatus: 'SIAP_DISTRIBUSI',
          actorId: req.user.id
        });

        // Daftarkan otomatis antrean distribusi dokumen wajib:
        // 1. BAP ke Klien
        await db.query(
          `INSERT INTO document_distributions
             (document_type, document_id, document_no, order_id, object_id,
              target_destination, recipient_name, dispatch_date, dispatch_media, status, dispatched_by)
           VALUES ('BAP', $1, $2, $3, $4, 'KLIEN', $5, CURRENT_DATE, 'PORTAL', 'SIAP_DIKIRIM', $6)
           ON CONFLICT DO NOTHING`,
          [id, cur.bap_no, cur.order_id, cur.object_id, cur.client_name, req.user.id]
        );

        // 2. BAP ke Disnaker
        await db.query(
          `INSERT INTO document_distributions
             (document_type, document_id, document_no, order_id, object_id,
              target_destination, recipient_name, dispatch_date, dispatch_media, status, dispatched_by)
           VALUES ('BAP', $1, $2, $3, $4, 'DISNAKER', 'Seksi Pengawasan K3 Disnaker', CURRENT_DATE, 'KURIR_FISIK', 'SIAP_DIKIRIM', $5)
           ON CONFLICT DO NOTHING`,
          [id, cur.bap_no, cur.order_id, cur.object_id, req.user.id]
        );

        // 3. LHPP ke Disnaker
        if (cur.lhpp_id && cur.lhpp_no) {
          await db.query(
            `INSERT INTO document_distributions
               (document_type, document_id, document_no, order_id, object_id,
                target_destination, recipient_name, dispatch_date, dispatch_media, status, dispatched_by)
             VALUES ('LHPP', $1, $2, $3, $4, 'DISNAKER', 'Seksi Pengawasan K3 Disnaker', CURRENT_DATE, 'KURIR_FISIK', 'SIAP_DIKIRIM', $5)
             ON CONFLICT DO NOTHING`,
            [cur.lhpp_id, cur.lhpp_no, cur.order_id, cur.object_id, req.user.id]
          );
        }

        await notifyRoles(
          {
            roles: ['MARKETING', 'ADMIN_KANTOR'],
            type: 'BAP_FINALIZED',
            title: `BAP Selesai Difinalisasi: ${cur.bap_no}`,
            body: `Dokumen BAP & LHPP untuk unit ${cur.object_name} (${cur.client_name}) siap dicetak dan didistribusikan.`,
            link: `/app/bap`
          },
          db
        );

        await recordAudit(
          {
            userId: req.user.id,
            action: 'BAP_FINALIZE',
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, lhppId: cur.lhpp_id },
            ip: req.ip
          },
          db
        );

        return { bap: bapRows[0] };
      });

      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/:id/reopen',
  authorize('ADMIN_SISTEM', 'PIMPINAN', 'AHLI_K3'),
  validate(reopenBapSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const reopened = await withTransaction(async (db) => {
        const cur = await fetchFullBapContext(db, id);
        if (!cur) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
        if (cur.lhpp_status === 'TERBIT') {
          throw new AppError(
            409,
            'LHPP_ALREADY_PUBLISHED',
            'LHPP terkait sudah terbit sehingga BAP tidak dapat dibuka ulang.'
          );
        }

        const nextVer = cur.version + 1;
        await db.query(
          `INSERT INTO bap_revisions (bap_id, version, action, reason, snapshot, actor_id)
           VALUES ($1, $2, 'REOPENED', $3, $4, $5)`,
          [
            id,
            nextVer,
            reason.trim(),
            {
              bap_no: cur.bap_no,
              scope_items: cur.scope_items,
              conclusion: cur.conclusion,
              notes: cur.notes
            },
            req.user.id
          ]
        );

        const { rows } = await db.query(
          `UPDATE bap_documents
           SET status = 'REVISI', version = $1, updated_at = now()
           WHERE id = $2
           RETURNING *`,
          [nextVer, id]
        );

        await syncOrderUnitStatus(db, {
          orderId: cur.order_id,
          objectId: cur.object_id,
          unitStatus: 'BAP_DRAF',
          actorId: req.user.id
        });

        await recordAudit(
          {
            userId: req.user.id,
            action: 'BAP_REOPEN',
            entity: 'bap_documents',
            entityId: id,
            summary: { bapNo: cur.bap_no, version: nextVer, reason: reason.trim() },
            ip: req.ip
          },
          db
        );

        return rows[0];
      });

      return res.json({ bap: reopened });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const bap = await fetchFullBapContext({ query }, req.params.id);
    if (!bap) throw new AppError(404, 'BAP_NOT_FOUND', 'Dokumen BAP tidak ditemukan.');
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && bap.inspector_id !== req.user.id) {
      throw new AppError(403, 'FORBIDDEN', 'Akses ditolak.');
    }
    const buf = await generateBapPdfBuffer(bap);
    const filename = `${(bap.bap_no || 'BAP-DRAF').replace(/\//g, '-')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.send(buf);
  } catch (err) {
    return next(err);
  }
});

// Batch print seluruh BAP dalam satu PO (satu halaman per unit tanpa mencampur identitas)
router.get('/order/:orderId/batch-pdf', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { rows } = await query(
      `SELECT b.id, i.inspector_id
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       WHERE b.order_id = $1
       ORDER BY b.created_at ASC`,
      [orderId]
    );
    if (!rows.length) {
      throw new AppError(
        404,
        'NO_BAP_IN_ORDER',
        'Belum ada dokumen BAP yang terbentuk untuk PO/Order ini.'
      );
    }
    if (['AHLI_K3', 'INSPECTOR'].includes(req.user.role) && rows.some((row) => row.inspector_id !== req.user.id)) {
      throw new AppError(403, 'FORBIDDEN', 'Anda tidak memiliki akses ke seluruh BAP dalam order ini.');
    }
    const fullList = [];
    for (const r of rows) {
      const ctx = await fetchFullBapContext({ query }, r.id);
      if (ctx) fullList.push(ctx);
    }
    const buf = await generateBapPdfBuffer(fullList);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Batch-BAP-${orderId.slice(0, 8)}.pdf"`);
    return res.send(buf);
  } catch (err) {
    return next(err);
  }
});

export default router;
