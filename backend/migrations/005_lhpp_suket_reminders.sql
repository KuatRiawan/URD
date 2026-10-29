-- LHPP, revisi, pengiriman, Suket K3, tindak lanjut perpanjangan, dan pengingat.

CREATE TYPE lhpp_status AS ENUM ('DRAF', 'REVIEW_TEKNIS', 'PERSETUJUAN_PIMPINAN', 'DIKEMBALIKAN', 'TERBIT');

CREATE SEQUENCE lhpp_no_seq;

CREATE TABLE lhpp_documents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id     uuid NOT NULL UNIQUE REFERENCES inspections(id),
  lhpp_no           text UNIQUE,
  version           integer NOT NULL DEFAULT 1,
  status            lhpp_status NOT NULL DEFAULT 'DRAF',
  technical_notes   text,
  method_summary    text,
  recommendations   text,
  review_notes      text,
  verification_code text UNIQUE,
  prepared_by       uuid REFERENCES users(id),
  reviewed_by       uuid REFERENCES users(id),
  reviewed_at       timestamptz,
  approved_by       uuid REFERENCES users(id),
  approved_at       timestamptz,
  published_at      timestamptz,
  pdf_file_id       uuid REFERENCES file_attachments(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lhpp_status_idx ON lhpp_documents(status);

CREATE TABLE lhpp_revisions (
  id          bigserial PRIMARY KEY,
  lhpp_id     uuid NOT NULL REFERENCES lhpp_documents(id) ON DELETE CASCADE,
  version     integer NOT NULL,
  action      text NOT NULL,
  note        text,
  snapshot    jsonb NOT NULL,
  actor_id    uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lhpp_revisions_lhpp_idx ON lhpp_revisions(lhpp_id);

CREATE TABLE delivery_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lhpp_id         uuid NOT NULL REFERENCES lhpp_documents(id) ON DELETE CASCADE,
  delivered_at    timestamptz NOT NULL,
  channel         text NOT NULL CHECK (channel IN ('EMAIL', 'WHATSAPP', 'KURIR', 'SERAH_TERIMA_LANGSUNG', 'LAINNYA')),
  recipient_name  text NOT NULL,
  recipient_email text,
  notes           text,
  recorded_by     uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delivery_logs_lhpp_idx ON delivery_logs(lhpp_id);

CREATE TYPE suket_status AS ENUM ('BERKAS_DISIAPKAN', 'DIAJUKAN', 'DALAM_PROSES', 'TERBIT', 'PERLU_PERBAIKAN');
CREATE TYPE followup_status AS ENUM ('BELUM_DIHUBUNGI', 'SUDAH_DIHUBUNGI', 'SETUJU_PERPANJANG', 'MENOLAK', 'TERJADWAL');

CREATE TABLE suket_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id       uuid NOT NULL REFERENCES test_objects(id),
  lhpp_id         uuid REFERENCES lhpp_documents(id),
  suket_no        text UNIQUE,
  status          suket_status NOT NULL DEFAULT 'BERKAS_DISIAPKAN',
  submitted_date  date,
  issued_date     date,
  valid_until     date,
  issuer          text NOT NULL DEFAULT 'Dinas Tenaga Kerja / Instansi Berwenang',
  status_notes    text,
  scan_file_id    uuid REFERENCES file_attachments(id),
  followup_status followup_status NOT NULL DEFAULT 'BELUM_DIHUBUNGI',
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX suket_object_idx ON suket_documents(object_id);
CREATE INDEX suket_valid_until_idx ON suket_documents(valid_until) WHERE status = 'TERBIT';

ALTER TABLE orders
  ADD CONSTRAINT orders_renewal_suket_fk
  FOREIGN KEY (renewal_of_suket) REFERENCES suket_documents(id);

CREATE TABLE renewal_followups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suket_id    uuid NOT NULL REFERENCES suket_documents(id) ON DELETE CASCADE,
  status      followup_status NOT NULL,
  note        text NOT NULL,
  contact_pic text,
  recorded_by uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX renewal_followups_suket_idx ON renewal_followups(suket_id, created_at DESC);

-- M5-02 & M5-07: mencatat tahapan pengingat (H90, H60, H30, H14, H0) agar tidak terkirim ganda.
CREATE TABLE reminder_dispatches (
  id          bigserial PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('SUKET', 'KOMPETENSI')),
  target_id   uuid NOT NULL,
  stage       text NOT NULL CHECK (stage IN ('H90', 'H60', 'H30', 'H14', 'H0')),
  sent_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, stage)
);

