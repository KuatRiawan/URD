-- 036_file_attachment_doc_category.sql
-- Kode dokumentasi foto LHPP (FOTO_UNIT, FOTO_VISUAL, FOTO_FUNGSI, FOTO_BEBAN, FOTO_STIKER)
-- disimpan per lampiran. Kolom ini dipakai file-storage.js, modul inspeksi, LHPP, serta
-- generator DOCX/PDF, tetapi belum pernah dibuat oleh migrasi sebelumnya sehingga setiap
-- upload dokumentasi gagal dengan error 500 (column "doc_category" does not exist).
ALTER TABLE file_attachments
  ADD COLUMN IF NOT EXISTS doc_category text;

CREATE INDEX IF NOT EXISTS file_attachments_owner_doc_category_idx
  ON file_attachments(owner_type, owner_id, doc_category);
