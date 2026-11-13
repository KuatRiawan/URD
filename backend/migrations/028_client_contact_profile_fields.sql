-- 028_client_contact_profile_fields.sql
-- Kolom profil PIC klien yang sudah dipakai modul Marketing, dashboard, distribusi,
-- dan pengingat, tetapi belum pernah dibuat oleh migrasi mana pun.

ALTER TABLE client_contacts
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES client_locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_reminder_recipient boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS client_contacts_location_idx ON client_contacts(location_id);
CREATE INDEX IF NOT EXISTS client_contacts_active_idx ON client_contacts(client_id, is_active);

-- Hanya satu PIC utama per klien.
CREATE UNIQUE INDEX IF NOT EXISTS client_contacts_primary_uq
  ON client_contacts(client_id) WHERE is_primary = true;
