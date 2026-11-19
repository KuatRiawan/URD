-- Migrasi 034: Tanda Tangan Digital Tersimpan pada Profil Pengguna
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_file_id uuid REFERENCES file_attachments(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signer_title varchar(160);

ALTER TABLE file_attachments DROP CONSTRAINT IF EXISTS file_attachments_owner_type_check;
ALTER TABLE file_attachments ADD CONSTRAINT file_attachments_owner_type_check
  CHECK (owner_type IN (
    'OBJECT', 'INSPECTION_FINDING', 'INSPECTION_SIGNATURE', 'BAP_SIGNATURE', 'BAP_PDF',
    'LHPP_PDF', 'LHPP_DOCX', 'LHPP_PHOTO', 'SUKET', 'PO_ATTACHMENT', 'DISTRIBUTION_PROOF', 'OPERATIONAL_ISSUE',
    'USER_AVATAR', 'USER_SIGNATURE'
  ));

