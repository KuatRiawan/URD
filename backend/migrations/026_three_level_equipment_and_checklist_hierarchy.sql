-- Migrasi 026: Three-Level Equipment Catalog and Equipment-Specific Dynamic Checklists
-- Memperbaiki hierarki klasifikasi resmi:
-- 1. Bidang Riksa Uji (Inspection Domain)
-- 2. Jenis Alat (Equipment Type)
-- 3. Nama Alat (Equipment Name)
-- 4. Checklist Pemeriksaan per Nama Alat (Equipment-Specific Dynamic Checklist)

-- 1. Tambah kolom equipment_name_id pada test_objects (menghubungkan unit fisik ke Nama Alat)
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS equipment_name_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_test_objects_equipment_name ON test_objects(equipment_name_id);

-- Backfill: Jika equipment_name_id masih null, isi dari equipment_type_id (karena tabel equipment_types menyimpan 100 Nama Alat)
UPDATE test_objects
SET equipment_name_id = equipment_type_id
WHERE equipment_name_id IS NULL AND equipment_type_id IS NOT NULL;

-- 2. Tambah kolom equipment_name_id pada inspection_templates (menghubungkan template ke Nama Alat)
ALTER TABLE inspection_templates
  ADD COLUMN IF NOT EXISTS equipment_name_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_inspection_templates_equipment_name ON inspection_templates(equipment_name_id);

-- Backfill: Isi equipment_name_id dari equipment_type_id jika sudah ada
UPDATE inspection_templates
SET equipment_name_id = equipment_type_id
WHERE equipment_name_id IS NULL AND equipment_type_id IS NOT NULL;

-- 3. Tambah kolom equipment_name_id pada lhpp_templates (menghubungkan template LHPP ke Nama Alat)
ALTER TABLE lhpp_templates
  ADD COLUMN IF NOT EXISTS equipment_name_id uuid REFERENCES equipment_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lhpp_templates_equipment_name ON lhpp_templates(equipment_name_id);

UPDATE lhpp_templates
SET equipment_name_id = equipment_type_id
WHERE equipment_name_id IS NULL AND equipment_type_id IS NOT NULL;

-- 4. Perluas kapabilitas butir checklist pada inspection_template_items
-- Mendukung input type kaya: CHOICE/CONFORMITY, YES_NO, TEXT, LONG_TEXT, NUMBER, MEASUREMENT, SINGLE_SELECT, MULTI_SELECT, DATE, PHOTO, FILE
ALTER TABLE inspection_template_items
  ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS requires_note boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_photo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS condition_parent_seq integer,
  ADD COLUMN IF NOT EXISTS condition_expected_value text,
  ADD COLUMN IF NOT EXISTS validation_rules jsonb DEFAULT '{}'::jsonb;

-- 5. Buat View Katalog Resmi 3 Level untuk Integritas Query
CREATE OR REPLACE VIEW v_equipment_types AS
  SELECT 
    id,
    domain_code,
    code,
    name,
    description,
    is_active,
    display_order,
    created_at,
    updated_at
  FROM equipment_groups;

CREATE OR REPLACE VIEW v_equipment_names AS
  SELECT 
    et.id,
    et.domain_code,
    et.group_id AS equipment_type_id,
    eg.name AS equipment_type_name,
    eg.code AS equipment_type_code,
    et.code AS equipment_name_code,
    et.name AS equipment_name,
    et.description,
    et.attribute_schema,
    et.is_active,
    et.display_order,
    et.created_at,
    et.updated_at
  FROM equipment_types et
  LEFT JOIN equipment_groups eg ON eg.id = et.group_id;

-- 6. Seed Checklist Khusus untuk Sample Nama Alat PAPA (FORKLIFT vs REACH STACKER) jika belum ada
-- A. Checklist Khusus FORKLIFT
DO $$
DECLARE
  v_forklift_name_id uuid;
  v_forklift_type_id uuid;
  v_tpl_id uuid;
  v_ver_id uuid;
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'ADMIN_SISTEM' LIMIT 1;
  SELECT id INTO v_forklift_type_id FROM equipment_groups WHERE code = 'GRP_PAPA_FORKLIFT' LIMIT 1;
  SELECT id INTO v_forklift_name_id FROM equipment_types WHERE code = 'ET_PAPA_FORKLIFT' LIMIT 1;

  IF v_forklift_name_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    -- Periksa apakah template checklist FORKLIFT sudah ada
    SELECT id INTO v_tpl_id FROM inspection_templates WHERE equipment_name_id = v_forklift_name_id LIMIT 1;

    IF v_tpl_id IS NULL THEN
      INSERT INTO inspection_templates (category_id, domain_code, equipment_group_id, equipment_type_id, equipment_name_id, inspection_type_code, name, created_by)
      VALUES (1, 'PAPA', v_forklift_type_id, v_forklift_name_id, v_forklift_name_id, 'BERKALA', 'Checklist Pemeriksaan Berkala Forklift', v_admin_id)
      RETURNING id INTO v_tpl_id;

      INSERT INTO inspection_template_versions (template_id, version, status, is_validated, validated_by, validated_at, published_at, created_by)
      VALUES (v_tpl_id, 1, 'AKTIF', true, v_admin_id, now(), now(), v_admin_id)
      RETURNING id INTO v_ver_id;

      INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required, requires_note, requires_photo)
      VALUES
        (v_ver_id, 1, 'Pemeriksaan Dokumen & Legalitas', 'Buku manual operasi, logbook perawatan berkala, dan Surat Keterangan K3 sebelumnya', 'CHOICE', NULL, NULL, NULL, true, true, false),
        (v_ver_id, 2, 'Pemeriksaan Visual Konstruksi & Rangka', 'Kondisi sasis, overhead guard (pelindung atas pengemudi), dan load backrest', 'CHOICE', NULL, NULL, NULL, true, true, true),
        (v_ver_id, 3, 'Sistem Mast & Garpu (Fork)', 'Kondisi garpu angkat (fork), ketebalan tumit garpu, dan rantai pengangkat mast', 'CHOICE', NULL, NULL, NULL, true, true, true),
        (v_ver_id, 4, 'Pengujian & Pengukuran Dimensi Garpu', 'Pengukuran ketebalan tumit garpu (Fork Heel Thickness)', 'NUMBER', 'mm', 20, 100, true, false, false),
        (v_ver_id, 5, 'Sistem Kemudi & Pengereman', 'Fungsi rem dinamis, rem parkir (hand brake), dan power steering', 'CHOICE', NULL, NULL, NULL, true, true, false),
        (v_ver_id, 6, 'Perlengkapan Pengaman & Indikator', 'Klakson, lampu kerja, lampu sein, rotary beacon, dan alarm mundur', 'CHOICE', NULL, NULL, NULL, true, false, false);
    END IF;
  END IF;
END $$;

-- B. Checklist Khusus REACH STACKER
DO $$
DECLARE
  v_rs_name_id uuid;
  v_rs_type_id uuid;
  v_tpl_id uuid;
  v_ver_id uuid;
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'ADMIN_SISTEM' LIMIT 1;
  SELECT id INTO v_rs_type_id FROM equipment_groups WHERE code = 'GRP_PAPA_FORKLIFT' LIMIT 1;
  SELECT id INTO v_rs_name_id FROM equipment_types WHERE code = 'ET_PAPA_REACH_STACKER' LIMIT 1;

  IF v_rs_name_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    SELECT id INTO v_tpl_id FROM inspection_templates WHERE equipment_name_id = v_rs_name_id LIMIT 1;

    IF v_tpl_id IS NULL THEN
      INSERT INTO inspection_templates (category_id, domain_code, equipment_group_id, equipment_type_id, equipment_name_id, inspection_type_code, name, created_by)
      VALUES (1, 'PAPA', v_rs_type_id, v_rs_name_id, v_rs_name_id, 'BERKALA', 'Checklist Pemeriksaan Berkala Reach Stacker', v_admin_id)
      RETURNING id INTO v_tpl_id;

      INSERT INTO inspection_template_versions (template_id, version, status, is_validated, validated_by, validated_at, published_at, created_by)
      VALUES (v_tpl_id, 1, 'AKTIF', true, v_admin_id, now(), now(), v_admin_id)
      RETURNING id INTO v_ver_id;

      INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required, requires_note, requires_photo)
      VALUES
        (v_ver_id, 1, 'Pemeriksaan Dokumen & Sertifikasi Kontainer', 'Manual pengoperasian spreader, riwayat load test teleskopik boom, dan suket K3', 'CHOICE', NULL, NULL, NULL, true, true, false),
        (v_ver_id, 2, 'Pemeriksaan Telescopic Boom & Silinder Hidrolik', 'Kondisi struktur boom teleskopik, keausan wear pad, dan kebocoran silinder luffing', 'CHOICE', NULL, NULL, NULL, true, true, true),
        (v_ver_id, 3, 'Pemeriksaan Spreader & Twistlock', 'Kondisi twistlock pin, mekanisme penguncian kontainer 20ft/40ft, dan sensor kontak', 'CHOICE', NULL, NULL, NULL, true, true, true),
        (v_ver_id, 4, 'Pengukuran Keausan Twistlock Pin', 'Ketebalan / diameter twistlock pin penahan kontainer', 'NUMBER', 'mm', 35, 75, true, false, false),
        (v_ver_id, 5, 'Sistem Indikator Momen Beban (LMI / Safe Load Indicator)', 'Akurasi sensor sudut boom, sensor panjang boom, dan pemutus gerakan otomatis saat overload', 'CHOICE', NULL, NULL, NULL, true, true, true),
        (v_ver_id, 6, 'Sistem Stabilizer & Counterweight', 'Kondisi outrigger / stabilizer jack depan dan penguncian ballast counterweight', 'CHOICE', NULL, NULL, NULL, true, false, false);
    END IF;
  END IF;
END $$;

