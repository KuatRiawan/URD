-- Pengingat otomatis perpanjangan riksa uji ke klien (Email dan WhatsApp).
-- Satu baris per unit, masa berlaku, tahap pengingat, dan kanal agar tidak terkirim ganda.
CREATE TABLE client_reminder_log (
  id            bigserial PRIMARY KEY,
  object_id     uuid NOT NULL REFERENCES test_objects(id) ON DELETE CASCADE,
  stage         text NOT NULL CHECK (stage IN ('H90', 'H60', 'H30', 'H14', 'H0')),
  channel       text NOT NULL CHECK (channel IN ('EMAIL', 'WHATSAPP')),
  valid_until   date NOT NULL,
  recipient     text,
  status        text NOT NULL CHECK (status IN ('TERKIRIM', 'SIMULASI', 'GAGAL', 'DILEWATI')),
  error_message text,
  attempts      integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (object_id, valid_until, stage, channel)
);

CREATE INDEX idx_client_reminder_log_created ON client_reminder_log (created_at DESC);

