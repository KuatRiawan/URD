CREATE SEQUENCE operational_issue_no_seq;

CREATE TABLE operational_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_no text NOT NULL UNIQUE,
  issue_type text NOT NULL CHECK (issue_type IN (
    'UNIT_MISMATCH', 'UNIT_UNAVAILABLE', 'UNSAFE_CONDITION', 'CHECKLIST_GAP',
    'MEASURING_TOOL', 'PIC_ABSENT', 'SIGNATURE_DECLINED', 'NETWORK_OR_RECOVERY',
    'UNIT_ADDITIONAL', 'RESCHEDULE', 'INSPECTOR_UNAVAILABLE', 'PO_CHANGE',
    'DOCUMENT_DELAY', 'OTHER'
  )),
  priority text NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('RENDAH', 'NORMAL', 'TINGGI')),
  status text NOT NULL DEFAULT 'DILAPORKAN' CHECK (status IN (
    'DILAPORKAN', 'MENUNGGU_TINDAK_LANJUT', 'SEDANG_DITANGANI', 'MENUNGGU_INFORMASI',
    'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'
  )),
  order_id uuid NOT NULL REFERENCES orders(id),
  object_id uuid REFERENCES test_objects(id),
  inspection_id uuid REFERENCES inspections(id),
  reported_by uuid NOT NULL REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 5 AND 160),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 5 AND 3000),
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
CREATE INDEX operational_issues_order_idx ON operational_issues(order_id, created_at DESC);
CREATE INDEX operational_issues_status_idx ON operational_issues(status, priority, updated_at DESC);
CREATE INDEX operational_issues_reporter_idx ON operational_issues(reported_by, created_at DESC);

CREATE TABLE operational_issue_events (
  id bigserial PRIMARY KEY,
  issue_id uuid NOT NULL REFERENCES operational_issues(id),
  event_type text NOT NULL CHECK (event_type IN ('DILAPORKAN', 'STATUS_DIUBAH', 'DITUGASKAN', 'BUKTI_DITAMBAHKAN')),
  from_status text,
  to_status text,
  note text NOT NULL DEFAULT '',
  actor_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operational_issue_events_issue_idx ON operational_issue_events(issue_id, created_at ASC);

CREATE TABLE operational_issue_evidence (
  issue_id uuid NOT NULL REFERENCES operational_issues(id),
  file_id uuid NOT NULL UNIQUE REFERENCES file_attachments(id),
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(issue_id, file_id)
);

ALTER TABLE file_attachments DROP CONSTRAINT IF EXISTS file_attachments_owner_type_check;
ALTER TABLE file_attachments ADD CONSTRAINT file_attachments_owner_type_check
  CHECK (owner_type IN (
    'OBJECT', 'INSPECTION_FINDING', 'INSPECTION_SIGNATURE', 'BAP_SIGNATURE', 'BAP_PDF',
    'LHPP_PDF', 'LHPP_PHOTO', 'SUKET', 'PO_ATTACHMENT', 'DISTRIBUTION_PROOF', 'OPERATIONAL_ISSUE'
  ));

CREATE TABLE order_revisions (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  version integer NOT NULL,
  reason text NOT NULL,
  snapshot jsonb NOT NULL,
  actor_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, version)
);
CREATE INDEX order_revisions_order_idx ON order_revisions(order_id, version DESC);
