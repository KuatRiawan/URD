-- 010_lhpp_photos.sql
-- Menambahkan owner_type LHPP_PHOTO pada file_attachments untuk lampiran dokumentasi foto LHPP
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
    'PO_ATTACHMENT'
  ));

