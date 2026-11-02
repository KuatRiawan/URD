-- Simpan token portal baru sebagai hash; token lama tetap dapat dipakai selama transisi.
ALTER TABLE client_portal_tokens
  ALTER COLUMN token DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS client_portal_tokens_hash_uq
  ON client_portal_tokens(token_hash)
  WHERE token_hash IS NOT NULL;
