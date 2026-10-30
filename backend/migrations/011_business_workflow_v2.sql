-- 011_business_workflow_v2.sql
-- Penyesuaian Alur Bisnis PT Upaya Riksa Daya:
-- 1. Peran Pengguna Baru: MARKETING, INSPECTOR, PIMPINAN (Monitoring Read-Only), ADMIN_SISTEM
-- 2. Inversi Alur Dokumen: LHPP dibuat terlebih dahulu setelah inspeksi, baru kemudian BAP
-- 3. Penghapusan Workflow Approval Pimpinan pada Dokumen Teknis
-- 4. Modul Pelacakan Distribusi Dokumen (BAP ke Klien, LHPP & BAP ke Disnaker)

-- 1. Ubah tipe kolom role pada tabel users menjadi text dengan CHECK constraint fleksibel
ALTER TABLE users ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN_SISTEM', 'MARKETING', 'INSPECTOR', 'PIMPINAN', 'ADMIN_KANTOR', 'AHLI_K3'));

-- Migrasi peran pengguna eksisting secara aman
UPDATE users SET role = 'MARKETING' WHERE role = 'ADMIN_KANTOR';
UPDATE users SET role = 'INSPECTOR' WHERE role = 'AHLI_K3';

-- 2. Perluas batasan signer_role pada inspection_signatures
ALTER TABLE inspection_signatures DROP CONSTRAINT IF EXISTS inspection_signatures_signer_role_check;
ALTER TABLE inspection_signatures ADD CONSTRAINT inspection_signatures_signer_role_check
  CHECK (signer_role IN ('INSPECTOR', 'AHLI_K3', 'PERWAKILAN_KLIEN', 'PIC_KLIEN'));

-- 3. Perluas status lhpp_documents untuk mendukung alur langsung tanpa approval Pimpinan
-- Ubah tipe kolom lhpp_documents.status menjadi text agar fleksibel dan aman
ALTER TABLE lhpp_documents ALTER COLUMN status DROP DEFAULT;
ALTER TABLE lhpp_documents ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE lhpp_documents ALTER COLUMN status SET DEFAULT 'DRAF';

ALTER TABLE lhpp_documents DROP CONSTRAINT IF EXISTS lhpp_documents_status_check;
ALTER TABLE lhpp_documents ADD CONSTRAINT lhpp_documents_status_check
  CHECK (status IN ('DRAF', 'SIAP_PREVIEW', 'FINAL', 'TERBIT', 'REVIEW_TEKNIS', 'PERSETUJUAN_PIMPINAN', 'DIKEMBALIKAN', 'PERLU_REVISI', 'DIBATALKAN'));

ALTER TABLE lhpp_documents
  ADD COLUMN IF NOT EXISTS finalized_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS finalized_at timestamptz;

-- 4. Hubungkan bap_documents ke lhpp_documents (Inversi: BAP diterbitkan setelah LHPP)
ALTER TABLE bap_documents
  ADD COLUMN IF NOT EXISTS lhpp_id uuid REFERENCES lhpp_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_after_lhpp boolean NOT NULL DEFAULT true;

-- Perbarui status BAP jika diperlukan
ALTER TABLE bap_documents DROP CONSTRAINT IF EXISTS bap_documents_status_check;
ALTER TABLE bap_documents ADD CONSTRAINT bap_documents_status_check
  CHECK (status IN ('DRAF', 'SIAP_PREVIEW', 'MENUNGGU_TANDA_TANGAN', 'FINAL', 'REVISI', 'DIBATALKAN'));

-- 5. Perluas unit_status pada order_objects agar mencerminkan alur bisnis aktual
ALTER TABLE order_objects DROP CONSTRAINT IF EXISTS order_objects_unit_status_check;
ALTER TABLE order_objects ADD CONSTRAINT order_objects_unit_status_check
  CHECK (unit_status IN (
    'BELUM_DIJADWALKAN',
    'TERJADWAL',
    'DITUGASKAN',
    'SEDANG_DIPERIKSA',
    'CHECKLIST_BELUM_LENGKAP',
    'MENUNGGU_TTD',
    'PEMERIKSAAN_TERKIRIM',
    'FORM_TERKIRIM',
    'LHPP_DRAF',
    'LHPP_DIPROSES',
    'LHPP_SIAP_PREVIEW',
    'LHPP_FINAL',
    'LHPP_TERBIT',
    'BAP_DRAF',
    'BAP_DIPROSES',
    'BAP_SIAP_PREVIEW',
    'BAP_FINAL',
    'SIAP_DISTRIBUSI',
    'SEBAGIAN_DOKUMEN_DIKIRIM',
    'SELESAI',
    'MENUNGGU_REVIEW',
    'DISETUJUI',
    'PERLU_REVISI',
    'DIBATALKAN'
  ));

-- 6. Ubah kolom status pada orders dan order_status_history menjadi text agar mendukung status PO baru
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'TERDAFTAR';

ALTER TABLE order_status_history ALTER COLUMN from_status TYPE text USING from_status::text;
ALTER TABLE order_status_history ALTER COLUMN to_status TYPE text USING to_status::text;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'DRAFT',
    'TERDAFTAR',
    'DIJADWALKAN',
    'TERJADWAL',
    'DITUGASKAN',
    'BERLANGSUNG',
    'SEDANG_DIPERIKSA',
    'SEBAGIAN_SELESAI',
    'MENUNGGU_DOKUMEN',
    'MENUNGGU_LAPORAN',
    'MENUNGGU_REVIEW',
    'SELESAI',
    'DIBATALKAN',
    'ORDER_BARU',
    'PENUGASAN',
    'PENJADWALAN',
    'INSPEKSI_LAPANGAN',
    'BAP_SELESAI',
    'LHPP_TERBIT',
    'SUKET_TERBIT'
  ));

-- 7. Tabel Pelacakan Distribusi Dokumen (Document Distribution Tracker)
CREATE TABLE IF NOT EXISTS document_distributions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type       text NOT NULL CHECK (document_type IN ('BAP', 'LHPP')),
  document_id         uuid NOT NULL,
  document_no         text NOT NULL,
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  object_id           uuid NOT NULL REFERENCES test_objects(id) ON DELETE CASCADE,
  target_destination  text NOT NULL CHECK (target_destination IN ('KLIEN', 'DISNAKER', 'LAINNYA')),
  recipient_name      text NOT NULL,
  dispatch_date       date NOT NULL DEFAULT CURRENT_DATE,
  dispatch_media      text NOT NULL CHECK (dispatch_media IN ('EMAIL', 'WHATSAPP', 'KURIR_FISIK', 'LANGSUNG', 'PORTAL', 'LAINNYA')),
  tracking_reference  text,
  status              text NOT NULL DEFAULT 'SIAP_DIKIRIM'
    CHECK (status IN ('BELUM_DIKIRIM', 'SIAP_DIKIRIM', 'DIKIRIM', 'DITERIMA', 'PERLU_KIRIM_ULANG')),
  notes               text,
  proof_file_id       uuid REFERENCES file_attachments(id),
  dispatched_by       uuid NOT NULL REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doc_dist_order_idx ON document_distributions(order_id);
CREATE INDEX IF NOT EXISTS doc_dist_object_idx ON document_distributions(object_id);
CREATE INDEX IF NOT EXISTS doc_dist_doc_idx ON document_distributions(document_type, document_id);
CREATE INDEX IF NOT EXISTS doc_dist_target_idx ON document_distributions(target_destination);
CREATE INDEX IF NOT EXISTS doc_dist_status_idx ON document_distributions(status);

-- Tambahkan tipe pemilik berkas PROOF_DISTRIBUSI pada file_attachments
ALTER TABLE file_attachments DROP CONSTRAINT IF EXISTS file_attachments_owner_type_check;
ALTER TABLE file_attachments ADD CONSTRAINT file_attachments_owner_type_check
  CHECK (owner_type IN (
    'OBJECT',
    'INSPECTION_FINDING',
    'INSPECTION_SIGNATURE',
    'BAP_SIGNATURE',
    'BAP_PDF',
    'LHPP_PDF',
    'LHPP_PHOTO',
    'SUKET',
    'PO_ATTACHMENT',
    'DISTRIBUTION_PROOF'
  ));
