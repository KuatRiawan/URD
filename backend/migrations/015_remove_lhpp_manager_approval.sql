-- Remove workflow lama REVIEW_TEKNIS / PERSETUJUAN_PIMPINAN.
-- Riwayat pada lhpp_revisions dan order_status_history tetap dipertahankan.

UPDATE lhpp_documents
SET status = 'SIAP_PREVIEW', updated_at = now()
WHERE status IN ('REVIEW_TEKNIS', 'PERSETUJUAN_PIMPINAN');

UPDATE order_objects oo
SET unit_status = 'LHPP_SIAP_PREVIEW', updated_at = now()
WHERE oo.unit_status IN ('MENUNGGU_REVIEW', 'DISETUJUI');

UPDATE orders o
SET status = 'MENUNGGU_DOKUMEN', updated_at = now()
WHERE o.status = 'MENUNGGU_REVIEW';

ALTER TABLE lhpp_documents DROP CONSTRAINT IF EXISTS lhpp_documents_status_check;
ALTER TABLE lhpp_documents ADD CONSTRAINT lhpp_documents_status_check
  CHECK (status IN (
    'DRAF', 'SIAP_PREVIEW', 'FINAL', 'TERBIT', 'DIKEMBALIKAN',
    'PERLU_REVISI', 'DIBATALKAN'
  ));

ALTER TABLE order_objects DROP CONSTRAINT IF EXISTS order_objects_unit_status_check;
ALTER TABLE order_objects ADD CONSTRAINT order_objects_unit_status_check
  CHECK (unit_status IN (
    'BELUM_DIJADWALKAN', 'TERJADWAL', 'DITUGASKAN', 'SEDANG_DIPERIKSA',
    'CHECKLIST_BELUM_LENGKAP', 'MENUNGGU_TTD', 'PEMERIKSAAN_TERKIRIM',
    'FORM_TERKIRIM', 'LHPP_DRAF', 'LHPP_DIPROSES', 'LHPP_SIAP_PREVIEW',
    'LHPP_FINAL', 'LHPP_TERBIT', 'BAP_DRAF', 'BAP_DIPROSES',
    'BAP_SIAP_PREVIEW', 'BAP_FINAL', 'SIAP_DISTRIBUSI',
    'SEBAGIAN_DOKUMEN_DIKIRIM', 'SELESAI', 'PERLU_REVISI', 'DIBATALKAN'
  ));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'DRAFT', 'TERDAFTAR', 'DIJADWALKAN', 'TERJADWAL', 'DITUGASKAN',
    'BERLANGSUNG', 'SEDANG_DIPERIKSA', 'SEBAGIAN_SELESAI',
    'MENUNGGU_DOKUMEN', 'MENUNGGU_LAPORAN', 'SELESAI', 'DIBATALKAN',
    'ORDER_BARU', 'PENUGASAN', 'PENJADWALAN', 'INSPEKSI_LAPANGAN',
    'BAP_SELESAI', 'LHPP_TERBIT', 'SUKET_TERBIT'
  ));
