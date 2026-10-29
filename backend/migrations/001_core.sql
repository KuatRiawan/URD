-- Inti: pengguna, sesi, berkas, notifikasi, audit.
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  full_name     text   NOT NULL CHECK (length(full_name) BETWEEN 2 AND 120),
  role          user_role NOT NULL,
  phone         text,
  password_hash text   NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Refresh token disimpan sebagai hash SHA-256; token mentah hanya ada di cookie HttpOnly.
CREATE TABLE refresh_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id    uuid NOT NULL,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  replaced_by  uuid REFERENCES refresh_sessions(id),
  user_agent   text,
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_sessions_user_idx ON refresh_sessions(user_id);
CREATE INDEX refresh_sessions_family_idx ON refresh_sessions(family_id);

CREATE TABLE file_attachments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type    text NOT NULL CHECK (owner_type IN
                  ('OBJECT', 'INSPECTION_FINDING', 'INSPECTION_SIGNATURE', 'LHPP_PDF', 'SUKET')),
  owner_id      uuid NOT NULL,
  original_name text NOT NULL,
  mime_type     text NOT NULL,
  size_bytes    integer NOT NULL CHECK (size_bytes > 0),
  storage_key   text NOT NULL UNIQUE,
  caption       text,
  uploaded_by   uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
CREATE INDEX file_attachments_owner_idx ON file_attachments(owner_type, owner_id);

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  link       text,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications(user_id, created_at DESC);

CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id),
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  summary     jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX audit_logs_entity_idx ON audit_logs(entity, entity_id);

-- Log audit hanya boleh ditambah. Trigger ini menolak UPDATE/DELETE dari aplikasi.
-- Superuser database tetap dapat menonaktifkan trigger; itu kontrol infrastruktur, bukan aplikasi.
CREATE FUNCTION audit_logs_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs bersifat append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();

