-- 027_inspection_activities_and_schedule_approval.sql
-- Satu PO dapat berisi banyak unit, banyak jenis pemeriksaan, dan banyak jadwal.
-- Aktivitas pemeriksaan menjadi entitas mandiri dengan status, jadwal, penugasan,
-- dan persetujuan jadwal oleh Pimpinan/Manager.

-- 1. Masa berlaku PO terpisah dari jadwal pemeriksaan.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS valid_from date,
  ADD COLUMN IF NOT EXISTS valid_until date;

UPDATE orders
SET valid_from = COALESCE(valid_from, po_date, created_at::date),
    valid_until = COALESCE(valid_until, (COALESCE(po_date, created_at::date) + interval '1 year')::date)
WHERE valid_until IS NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_validity_check;
ALTER TABLE orders ADD CONSTRAINT orders_validity_check
  CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from);

-- 1b. Status unit mengenali tahap menunggu persetujuan jadwal Manager.
ALTER TABLE order_objects DROP CONSTRAINT IF EXISTS order_objects_unit_status_check;
ALTER TABLE order_objects ADD CONSTRAINT order_objects_unit_status_check
  CHECK (unit_status IN (
    'BELUM_DIJADWALKAN', 'MENUNGGU_PERSETUJUAN', 'TERJADWAL', 'DITUGASKAN',
    'SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP', 'MENUNGGU_TTD',
    'PEMERIKSAAN_TERKIRIM', 'FORM_TERKIRIM', 'LHPP_DRAF', 'LHPP_DIPROSES',
    'LHPP_SIAP_PREVIEW', 'LHPP_FINAL', 'LHPP_TERBIT', 'BAP_DRAF', 'BAP_DIPROSES',
    'BAP_SIAP_PREVIEW', 'BAP_FINAL', 'SIAP_DISTRIBUSI',
    'SEBAGIAN_DOKUMEN_DIKIRIM', 'SELESAI', 'PERLU_REVISI', 'DIBATALKAN'
  ));

-- 2. Aktivitas pemeriksaan per unit.
CREATE TABLE IF NOT EXISTS inspection_activities (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_object_id    uuid NOT NULL REFERENCES order_objects(id) ON DELETE CASCADE,
  object_id          uuid NOT NULL REFERENCES test_objects(id),
  inspection_type_code text NOT NULL REFERENCES inspection_types(code) ON UPDATE CASCADE,
  sequence_no        integer NOT NULL DEFAULT 1,
  planned_start_at   timestamptz,
  planned_end_at     timestamptz,
  schedule_status    text NOT NULL DEFAULT 'BELUM_DIUSULKAN'
    CHECK (schedule_status IN ('BELUM_DIUSULKAN', 'DIUSULKAN', 'DISETUJUI', 'DITOLAK')),
  rejection_reason   text,
  proposed_by        uuid REFERENCES users(id),
  proposed_at        timestamptz,
  approved_by        uuid REFERENCES users(id),
  approved_at        timestamptz,
  inspector_id       uuid REFERENCES inspectors(user_id),
  status             text NOT NULL DEFAULT 'BELUM_DIJADWALKAN'
    CHECK (status IN (
      'BELUM_DIJADWALKAN', 'MENUNGGU_PERSETUJUAN', 'TERJADWAL', 'DITUGASKAN',
      'SEDANG_DIPERIKSA', 'SELESAI', 'DIBATALKAN'
    )),
  notes              text,
  cancel_reason      text,
  created_by         uuid REFERENCES users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (planned_end_at IS NULL OR planned_start_at IS NULL OR planned_end_at > planned_start_at)
);

CREATE INDEX IF NOT EXISTS inspection_activities_order_idx
  ON inspection_activities(order_id, planned_start_at);
CREATE INDEX IF NOT EXISTS inspection_activities_unit_idx
  ON inspection_activities(order_object_id);
CREATE INDEX IF NOT EXISTS inspection_activities_inspector_idx
  ON inspection_activities(inspector_id, planned_start_at);
CREATE INDEX IF NOT EXISTS inspection_activities_schedule_status_idx
  ON inspection_activities(schedule_status);

-- Cegah aktivitas duplikat untuk unit, jenis pemeriksaan, dan jadwal yang sama.
CREATE UNIQUE INDEX IF NOT EXISTS inspection_activities_schedule_uq
  ON inspection_activities(order_object_id, inspection_type_code, planned_start_at)
  WHERE planned_start_at IS NOT NULL;

-- Riwayat perubahan jadwal, persetujuan, penugasan, dan status aktivitas.
CREATE TABLE IF NOT EXISTS inspection_activity_history (
  id             bigserial PRIMARY KEY,
  activity_id    uuid NOT NULL REFERENCES inspection_activities(id) ON DELETE CASCADE,
  action         text NOT NULL,
  from_status    text,
  to_status      text,
  schedule_status text,
  note           text,
  snapshot       jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id       uuid REFERENCES users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inspection_activity_history_idx
  ON inspection_activity_history(activity_id, created_at ASC);

-- 3. Hubungkan pemeriksaan lapangan ke aktivitas pemeriksaan.
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS activity_id uuid REFERENCES inspection_activities(id) ON DELETE SET NULL;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_order_id_object_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS inspections_activity_uq
  ON inspections(activity_id) WHERE activity_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS inspections_legacy_unit_uq
  ON inspections(order_id, object_id) WHERE activity_id IS NULL;

-- 4. Migrasi data lama: satu aktivitas untuk setiap unit yang sudah terdaftar.
INSERT INTO inspection_activities (
  order_id, order_object_id, object_id, inspection_type_code, sequence_no,
  planned_start_at, planned_end_at, schedule_status, inspector_id,
  status, notes, created_by, created_at, updated_at
)
SELECT
  oo.order_id,
  oo.id,
  oo.object_id,
  COALESCE(
    t.inspection_type_code,
    CASE o.service_type
      WHEN 'PEMERIKSAAN_PERTAMA' THEN 'PERTAMA'
      WHEN 'PEMERIKSAAN_ULANG' THEN 'ULANG'
      WHEN 'PERPANJANGAN' THEN 'BERKALA'
      ELSE 'BERKALA'
    END
  ),
  1,
  s.start_at,
  s.end_at,
  CASE WHEN s.start_at IS NOT NULL THEN 'DISETUJUI' ELSE 'BELUM_DIUSULKAN' END,
  oo.inspector_id,
  CASE
    WHEN oo.unit_status = 'DIBATALKAN' THEN 'DIBATALKAN'
    WHEN oo.unit_status IN ('SELESAI', 'LHPP_TERBIT', 'SIAP_DISTRIBUSI', 'SEBAGIAN_DOKUMEN_DIKIRIM')
      THEN 'SELESAI'
    WHEN oo.unit_status IN ('SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP', 'MENUNGGU_TTD')
      THEN 'SEDANG_DIPERIKSA'
    WHEN oo.unit_status IN ('DITUGASKAN') THEN 'DITUGASKAN'
    WHEN oo.unit_status IN ('TERJADWAL') THEN 'TERJADWAL'
    ELSE 'BELUM_DIJADWALKAN'
  END,
  oo.unit_notes,
  o.created_by,
  COALESCE(oo.updated_at, o.created_at),
  COALESCE(oo.updated_at, now())
FROM order_objects oo
JOIN orders o ON o.id = oo.order_id
JOIN test_objects t ON t.id = oo.object_id
LEFT JOIN schedules s ON s.order_id = oo.order_id
WHERE NOT EXISTS (
  SELECT 1 FROM inspection_activities ia WHERE ia.order_object_id = oo.id
);

UPDATE inspections i
SET activity_id = ia.id
FROM inspection_activities ia
WHERE ia.order_id = i.order_id
  AND ia.object_id = i.object_id
  AND i.activity_id IS NULL;

-- 5. Unggahan dokumen LHPP revisi (sebelum finalisasi) agar Inspector dapat
--    mengunduh, mengubah, dan mengunggah kembali dokumen yang belum final.
ALTER TABLE lhpp_documents
  ADD COLUMN IF NOT EXISTS source_file_id uuid REFERENCES file_attachments(id);

ALTER TABLE file_attachments DROP CONSTRAINT IF EXISTS file_attachments_owner_type_check;
ALTER TABLE file_attachments ADD CONSTRAINT file_attachments_owner_type_check
  CHECK (owner_type IN (
    'OBJECT', 'INSPECTION_FINDING', 'INSPECTION_SIGNATURE', 'BAP_SIGNATURE', 'BAP_PDF',
    'LHPP_PDF', 'LHPP_DOCX', 'LHPP_PHOTO', 'LHPP_SOURCE', 'SUKET', 'PO_ATTACHMENT',
    'DISTRIBUTION_PROOF', 'OPERATIONAL_ISSUE'
  ));
