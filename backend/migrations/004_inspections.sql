-- Template inspeksi berversi dan hasil inspeksi lapangan.

CREATE TABLE inspection_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id smallint NOT NULL REFERENCES object_categories(id),
  name        text NOT NULL,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

CREATE TABLE inspection_template_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   uuid NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
  version       integer NOT NULL,
  status        text NOT NULL DEFAULT 'DRAF' CHECK (status IN ('DRAF', 'AKTIF', 'ARSIP')),
  -- Template wajib divalidasi tim Ahli K3 sebelum dipakai produksi (PRD 6.5).
  is_validated  boolean NOT NULL DEFAULT false,
  validated_by  uuid REFERENCES users(id),
  validated_at  timestamptz,
  published_at  timestamptz,
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
-- Hanya satu versi aktif per template.
CREATE UNIQUE INDEX template_versions_active_uq ON inspection_template_versions(template_id) WHERE status = 'AKTIF';

CREATE TABLE inspection_template_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  uuid NOT NULL REFERENCES inspection_template_versions(id) ON DELETE CASCADE,
  seq         integer NOT NULL,
  section     text NOT NULL,
  label       text NOT NULL,
  input_type  text NOT NULL CHECK (input_type IN ('CHOICE', 'NUMBER', 'TEXT', 'DATE')),
  unit        text,
  min_value   numeric,
  max_value   numeric,
  is_required boolean NOT NULL DEFAULT true,
  UNIQUE (version_id, seq)
);

CREATE TYPE inspection_status AS ENUM ('DRAF', 'TERKIRIM');

CREATE TABLE inspections (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id),
  object_id            uuid NOT NULL REFERENCES test_objects(id),
  template_version_id  uuid NOT NULL REFERENCES inspection_template_versions(id),
  inspector_id         uuid NOT NULL REFERENCES users(id),
  status               inspection_status NOT NULL DEFAULT 'DRAF',
  conclusion           text CHECK (conclusion IN ('MEMENUHI_SYARAT', 'MEMENUHI_SYARAT_DENGAN_CATATAN', 'TIDAK_MEMENUHI_SYARAT')),
  conclusion_notes     text,
  inspected_at         timestamptz,
  submitted_at         timestamptz,
  revision_no          integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, object_id)
);
CREATE INDEX inspections_inspector_idx ON inspections(inspector_id);

CREATE TABLE inspection_results (
  inspection_id  uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_id        uuid NOT NULL REFERENCES inspection_template_items(id),
  choice_value   text CHECK (choice_value IN ('SESUAI', 'TIDAK_SESUAI', 'TIDAK_BERLAKU')),
  number_value   numeric,
  text_value     text,
  date_value     date,
  note           text,
  out_of_range   boolean NOT NULL DEFAULT false,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (inspection_id, item_id)
);

CREATE TABLE inspection_findings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_id         uuid REFERENCES inspection_template_items(id),
  severity        text NOT NULL CHECK (severity IN ('KRITIS', 'MAYOR', 'MINOR')),
  description     text NOT NULL,
  recommendation  text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inspection_findings_inspection_idx ON inspection_findings(inspection_id);

CREATE TABLE inspection_signatures (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id  uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  signer_role    text NOT NULL CHECK (signer_role IN ('AHLI_K3', 'PERWAKILAN_KLIEN')),
  signer_name    text NOT NULL,
  signer_title   text,
  file_id        uuid NOT NULL REFERENCES file_attachments(id),
  signed_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, signer_role)
);

-- Riwayat revisi form setelah terkirim (M3-11): snapshot sebelum dibuka ulang.
CREATE TABLE inspection_revisions (
  id             bigserial PRIMARY KEY,
  inspection_id  uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  revision_no    integer NOT NULL,
  reason         text NOT NULL,
  snapshot       jsonb NOT NULL,
  opened_by      uuid REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

