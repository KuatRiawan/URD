-- Migrasi 022: Menambahkan kolom avatar_url untuk foto profil pengguna dan tipe berkas USER_AVATAR
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE file_attachments DROP CONSTRAINT IF EXISTS file_attachments_owner_type_check;
ALTER TABLE file_attachments ADD CONSTRAINT file_attachments_owner_type_check
  CHECK (owner_type IN (
    'OBJECT', 'INSPECTION_FINDING', 'INSPECTION_SIGNATURE', 'BAP_SIGNATURE', 'BAP_PDF',
    'LHPP_PDF', 'LHPP_PHOTO', 'SUKET', 'PO_ATTACHMENT', 'DISTRIBUTION_PROOF', 'OPERATIONAL_ISSUE',
    'USER_AVATAR'
  ));
