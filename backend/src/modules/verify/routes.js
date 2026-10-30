import { Router } from 'express';
import { query } from '../../database/pool.js';
import { AppError } from '../../utils/http.js';

const router = Router();

// Verifikasi publik keaslian dokumen resmi (BAP & LHPP) tanpa login
router.get('/:code', async (req, res, next) => {
  try {
    const rawCode = (req.params.code || '').trim().toUpperCase();
    if (!rawCode || rawCode.length < 5) {
      throw new AppError(400, 'INVALID_VERIFICATION_CODE', 'Kode verifikasi tidak valid.');
    }

    // 1. Cek di tabel lhpp_documents
    const { rows: lhppRows } = await query(
      `SELECT l.id, l.lhpp_no, l.status, l.published_at, l.verification_code, l.document_hash,
              t.name AS object_name, t.serial_number, oc.name AS category_name, oc.code AS category_code,
              c.name AS client_name, u_rev.full_name AS approver_name
       FROM lhpp_documents l
       JOIN inspections i ON i.id = l.inspection_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN clients c ON c.id = t.client_id
       LEFT JOIN users u_rev ON u_rev.id = l.approved_by
       WHERE UPPER(l.verification_code) = $1 AND l.status IN ('TERBIT', 'FINAL')
       LIMIT 1`,
      [rawCode]
    );

    if (lhppRows[0]) {
      const doc = lhppRows[0];
      return res.json({
        verified: true,
        documentType: 'LHPP',
        documentTitle: 'Laporan Hasil Pemeriksaan dan Pengujian (LHPP)',
        documentNo: doc.lhpp_no,
        verificationCode: doc.verification_code,
        documentHash: doc.document_hash,
        publishedAt: doc.published_at,
        issuer: 'PT Upaya Riksa Daya',
        unit: {
          name: doc.object_name,
          serialNumber: doc.serial_number,
          category: `${doc.category_code} - ${doc.category_name}`
        },
        clientName: doc.client_name,
        approverName: doc.approver_name,
        status: 'TERBIT_RESMI'
      });
    }

    // 2. Cek di tabel bap_documents
    const { rows: bapRows } = await query(
      `SELECT b.id, b.bap_no, b.status, b.finalized_at, b.verification_code, b.document_hash,
              b.conclusion, b.inspection_date,
              t.name AS object_name, t.serial_number, oc.name AS category_name, oc.code AS category_code,
              c.name AS client_name, b.inspector_signer_name, b.client_signer_name
       FROM bap_documents b
       JOIN inspections i ON i.id = b.inspection_id
       JOIN test_objects t ON t.id = i.object_id
       JOIN object_categories oc ON oc.id = t.category_id
       JOIN clients c ON c.id = t.client_id
       WHERE UPPER(b.verification_code) = $1 AND b.status = 'FINAL'
       LIMIT 1`,
      [rawCode]
    );

    if (bapRows[0]) {
      const doc = bapRows[0];
      return res.json({
        verified: true,
        documentType: 'BAP',
        documentTitle: 'Berita Acara Riksa Uji (BAP)',
        documentNo: doc.bap_no,
        verificationCode: doc.verification_code,
        documentHash: doc.document_hash,
        finalizedAt: doc.finalized_at,
        inspectionDate: doc.inspection_date,
        conclusion: doc.conclusion,
        issuer: 'PT Upaya Riksa Daya',
        unit: {
          name: doc.object_name,
          serialNumber: doc.serial_number,
          category: `${doc.category_code} - ${doc.category_name}`
        },
        clientName: doc.client_name,
        signers: {
          inspector: doc.inspector_signer_name,
          client: doc.client_signer_name
        },
        status: 'FINAL_RESMI'
      });
    }

    return res.status(404).json({
      verified: false,
      message: 'Dokumen dengan kode verifikasi tersebut tidak ditemukan atau belum resmi diterbitkan.'
    });
  } catch (err) {
    return next(err);
  }
});

export default router;

