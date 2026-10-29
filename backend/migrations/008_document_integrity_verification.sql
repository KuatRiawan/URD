-- 008_document_integrity_verification.sql
-- Integritas dokumen digital (BAP & LHPP): SHA-256 Hash sidik jari berkas,
-- kode verifikasi unik, dan pelacakan keaslian dokumen resmi PT Upaya Riksa Daya.

-- 1. Tambahkan kolom integrity pada bap_documents
ALTER TABLE bap_documents
  ADD COLUMN IF NOT EXISTS document_hash text,
  ADD COLUMN IF NOT EXISTS verification_code text UNIQUE;

-- 2. Tambahkan kolom document_hash pada lhpp_documents (verification_code sudah ada dari migration 005)
ALTER TABLE lhpp_documents
  ADD COLUMN IF NOT EXISTS document_hash text;

-- 3. Indeks pencarian kode verifikasi publik
CREATE INDEX IF NOT EXISTS idx_bap_verification_code ON bap_documents (verification_code);
CREATE INDEX IF NOT EXISTS idx_lhpp_verification_code ON lhpp_documents (verification_code);

