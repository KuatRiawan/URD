-- 009_client_portal.sql
-- Portal Klien Terproteksi Token Akses Aman

-- Token Akses Portal Klien (Secure Read-Only Access Token)
CREATE TABLE IF NOT EXISTS client_portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  label text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_portal_tokens_token ON client_portal_tokens(token);
