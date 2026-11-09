-- Migrasi 023: Dynamic Equipment Master & Dynamic Checklist Engine
-- Multi-Domain Equipment Classification, Editable Unit Types, Subtypes, and Dynamic Inspection Templates

-- 1. Pastikan kategori Anchor & Lifeline ada di object_categories jika belum ada
INSERT INTO object_categories (code, name, attribute_schema)
VALUES ('ANCHOR', 'Anchor dan Lifeline', '[]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2. Tabel Bidang Riksa Uji Resmi URD (7 Inspection Domains)
CREATE TABLE IF NOT EXISTS inspection_domains (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  legacy_category_id smallint REFERENCES object_categories(id),
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed 7 Bidang Riksa Uji Resmi URD
INSERT INTO inspection_domains (code, name, description, legacy_category_id, is_active, display_order)
VALUES
  ('PAPA', 'Pesawat Angkat & Pesawat Angkut', 'Regulasi Permenaker No. 08/2020: Alat angkat seperti forklift, crane, hoist, gondola, excavator, dsb.', (SELECT id FROM object_categories WHERE code = 'PAA'), true, 1),
  ('PUBT', 'Pesawat Uap & Bejana Tekan', 'Regulasi Permenaker No. 37/2016: Boiler uap, bejana tekan udara, tangki timbun cairan/gas.', (SELECT id FROM object_categories WHERE code = 'PUBT'), true, 2),
  ('PTP', 'Pesawat Tenaga & Produksi', 'Regulasi Permenaker No. 38/2016: Genset diesel, turbin, kompresor, mesin perkakas & lini produksi.', (SELECT id FROM object_categories WHERE code = 'PTP'), true, 3),
  ('ILPP', 'Instalasi Listrik & Penyalur Petir', 'Regulasi Permenaker No. 12/2015 (PUIL 2011) & Permenaker No. 31/2015: Penyalur petir, transformator & panel.', (SELECT id FROM object_categories WHERE code = 'LIS'), true, 4),
  ('IPK', 'Instalasi Proteksi Kebakaran', 'Regulasi Permenaker No. 02/1983 & No. 04/1980: Fire alarm, hydrant, sprinkler, dan APAR.', (SELECT id FROM object_categories WHERE code = 'IPK'), true, 5),
  ('ELEVATOR_ESKALATOR', 'Elevator & Eskalator', 'Regulasi Permenaker No. 06/2017: Lift penumpang, lift barang/servis, eskalator, dan travelator.', (SELECT id FROM object_categories WHERE code = 'LE'), true, 6),
  ('ANCHOR_LIFELINE', 'Anchor & Lifeline', 'Regulasi Permenaker No. 09/2016: Angkur permanen, tali pengaman horizontal & vertikal bekerja di ketinggian.', (SELECT id FROM object_categories WHERE code = 'ANCHOR'), true, 7)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    legacy_category_id = EXCLUDED.legacy_category_id,
    display_order = EXCLUDED.display_order;

-- 3. Tabel Jenis Pemeriksaan (Inspection Types)
CREATE TABLE IF NOT EXISTS inspection_types (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO inspection_types (code, name, description, is_active, display_order)
VALUES
  ('PERTAMA', 'Pemeriksaan Pertama', 'Riksa uji unit baru dipasang atau baru pertama kali disertifikasi K3', true, 1),
  ('BERKALA', 'Pemeriksaan Berkala', 'Riksa uji rutin berkala sesuai masa berlaku Surat Keterangan K3', true, 2),
  ('KHUSUS', 'Pemeriksaan Khusus', 'Riksa uji pasca perbaikan besar, modifikasi spesifikasi teknis, atau evaluasi pasca insiden', true, 3),
  ('ULANG', 'Pemeriksaan Ulang', 'Riksa uji verifikasi temuan perbaikan syarat teknis K3 yang belum memenuhi syarat', true, 4)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 4. Tabel Master Jenis Unit (Equipment Types & Subtypes)
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_code text NOT NULL REFERENCES inspection_domains(code) ON UPDATE CASCADE,
  parent_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  attribute_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_types_domain ON equipment_types(domain_code);
CREATE INDEX IF NOT EXISTS idx_equipment_types_parent ON equipment_types(parent_id);
CREATE INDEX IF NOT EXISTS idx_equipment_types_active ON equipment_types(is_active);

-- Seed Master Jenis Unit untuk 7 Bidang
-- A. PAPA (Pesawat Angkat & Pesawat Angkut)
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'PAPA', NULL, 'FORKLIFT', 'Forklift', 'Forklift diesel, elektrik, LPG, reach truck', true, 1,
   '[{"key":"swl","label":"Kapasitas Angkat (SWL)","unit":"ton"},{"key":"lifting_height","label":"Tinggi Angkat Maksimum","unit":"meter"},{"key":"mast_type","label":"Tipe Mast","unit":"tipe"},{"key":"fork_length","label":"Panjang Garpu (Fork)","unit":"mm"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000002', 'PAPA', NULL, 'CRANE', 'Crane (Alat Angkat)', 'Kategori induk berbagai jenis derek / crane riksa uji K3', true, 2,
   '[{"key":"swl","label":"SWL Maksimum","unit":"ton"},{"key":"span","label":"Bentang Span","unit":"meter"},{"key":"hoisting_speed","label":"Kecepatan Angkat","unit":"m/min"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000003', 'PAPA', 'a1000000-0000-0000-0000-000000000002', 'CRANE_OVERHEAD', 'Overhead Crane', 'Overhead Travelling Crane (Single/Double Girder)', true, 3,
   '[{"key":"swl","label":"SWL Maksimum","unit":"ton"},{"key":"span","label":"Bentang Girder","unit":"meter"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000004', 'PAPA', 'a1000000-0000-0000-0000-000000000002', 'CRANE_MOBILE', 'Mobile Crane', 'Mobile Crane roda ban / crawler crane', true, 4,
   '[{"key":"swl","label":"SWL Maksimum","unit":"ton"},{"key":"boom_length","label":"Panjang Boom Maksimum","unit":"meter"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000005', 'PAPA', 'a1000000-0000-0000-0000-000000000002', 'CRANE_TOWER', 'Tower Crane', 'Tower Crane proyek konstruksi & fabrikasi', true, 5,
   '[{"key":"swl","label":"SWL Tip / Radius Maksimum","unit":"ton"},{"key":"jib_length","label":"Panjang Jib","unit":"meter"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000006', 'PAPA', 'a1000000-0000-0000-0000-000000000002', 'CRANE_GANTRY', 'Gantry Crane', 'Portal Gantry & Semi-Gantry Crane', true, 6,
   '[{"key":"swl","label":"SWL Maksimum","unit":"ton"},{"key":"span","label":"Bentang Span","unit":"meter"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000007', 'PAPA', NULL, 'HOIST', 'Passenger & Material Hoist', 'Hoist elektrik, rantai, sling kawat baja', true, 7,
   '[{"key":"swl","label":"Kapasitas Beban","unit":"kg"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000008', 'PAPA', NULL, 'GONDOLA', 'Gondola', 'Gondola gantung perawatan gedung bertingkat', true, 8,
   '[{"key":"swl","label":"Kapasitas Keranjang","unit":"orang / kg"}]'::jsonb),
  ('a1000000-0000-0000-0000-000000000009', 'PAPA', NULL, 'EXCAVATOR', 'Excavator & Loader', 'Alat berat penggali dan pemindah tanah', true, 9,
   '[{"key":"bucket_capacity","label":"Kapasitas Bucket","unit":"m3"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- B. PUBT (Pesawat Uap & Bejana Tekan)
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'PUBT', NULL, 'BEJANA_TEKAN', 'Air Pressure Tank / Bejana Tekan', 'Bejana tekan udara, tangki penampung gas', true, 1,
   '[{"key":"working_pressure","label":"Tekanan Kerja (WP)","unit":"bar"},{"key":"design_pressure","label":"Tekanan Desain (DP)","unit":"bar"},{"key":"volume","label":"Volume Tangki","unit":"liter"}]'::jsonb),
  ('b1000000-0000-0000-0000-000000000002', 'PUBT', NULL, 'KETEL_UAP', 'Ketel Uap / Boiler', 'Steam Boiler pipa api / pipa air industri', true, 2,
   '[{"key":"steam_capacity","label":"Kapasitas Uap","unit":"ton/jam"},{"key":"max_pressure","label":"Tekanan Maksimum","unit":"kg/cm2"}]'::jsonb),
  ('b1000000-0000-0000-0000-000000000003', 'PUBT', NULL, 'TANGKI_TIMBUN', 'Tangki Timbun', 'Tangki timbun bahan bakar & bahan kimia cair', true, 3,
   '[{"key":"capacity","label":"Kapasitas Penyimpanan","unit":"kL"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- C. PTP (Pesawat Tenaga & Produksi)
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'PTP', NULL, 'MOTOR_DIESEL', 'Motor Diesel Genset', 'Genset pembangkit tenaga listrik mandiri', true, 1,
   '[{"key":"power_output","label":"Daya Keluaran (Power)","unit":"kVA"},{"key":"rpm","label":"Putaran Mesin","unit":"RPM"}]'::jsonb),
  ('c1000000-0000-0000-0000-000000000002', 'PTP', NULL, 'MESIN_PRODUKSI', 'Mesin Produksi', 'Mesin bubut, stamping, press, conveying line', true, 2,
   '[{"key":"motor_power","label":"Daya Penggerak","unit":"kW"}]'::jsonb),
  ('c1000000-0000-0000-0000-000000000003', 'PTP', NULL, 'KOMPRESOR', 'Kompresor Udara Pabrik', 'Air compressor screw & reciprocating', true, 3,
   '[{"key":"flow_rate","label":"Debit Aliran","unit":"m3/min"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- D. ILPP (Instalasi Listrik & Penyalur Petir)
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'ILPP', NULL, 'PENYALUR_PETIR', 'Instalasi Penyalur Petir', 'Sistem penangkal petir elektrostatis / konvensional', true, 1,
   '[{"key":"grounding_resistance","label":"Batas Tahanan Pembumian","unit":"Ohm"},{"key":"mast_height","label":"Tinggi Tiang Terminal","unit":"meter"}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000002', 'ILPP', NULL, 'INSTALASI_LISTRIK', 'Instalasi Listrik & Panel Distribusi', 'Main Distribution Panel (MDP) & Sub Distribution Panel', true, 2,
   '[{"key":"connected_power","label":"Total Daya Tersambung","unit":"kVA"}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000003', 'ILPP', NULL, 'TRANSFORMATOR', 'Transformator (Trafo)', 'Trafo step-down / step-up tegangan menengah', true, 3,
   '[{"key":"capacity_trafo","label":"Kapasitas Trafo","unit":"kVA"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- E. IPK (Instalasi Proteksi Kebakaran)
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'IPK', NULL, 'FIRE_ALARM', 'Sistem Fire Alarm', 'Master Control Fire Alarm (MCFA) & detector loop', true, 1,
   '[{"key":"zone_count","label":"Jumlah Zona / Loop","unit":"zona"}]'::jsonb),
  ('e1000000-0000-0000-0000-000000000002', 'IPK', NULL, 'HYDRANT_SPRINKLER', 'Instalasi Hydrant & Sprinkler', 'Pompa jockey, electric, diesel & pilar hydrant', true, 2,
   '[{"key":"pump_pressure","label":"Tekanan Pompa Kerja","unit":"bar"}]'::jsonb),
  ('e1000000-0000-0000-0000-000000000003', 'IPK', NULL, 'APAR', 'Alat Pemadam Api Ringan (APAR)', 'Tabung APAR dry chemical, CO2, clean agent', true, 3,
   '[{"key":"capacity_kg","label":"Kapasitas Tabung","unit":"kg"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- F. ELEVATOR_ESKALATOR (Lift & Eskalator)
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('f1000000-0000-0000-0000-000000000001', 'ELEVATOR_ESKALATOR', NULL, 'PASSENGER_ELEVATOR', 'Lift Penumpang (Passenger Elevator)', 'Elevator penumpang gedung bertingkat', true, 1,
   '[{"key":"passenger_capacity","label":"Kapasitas Penumpang","unit":"orang / kg"},{"key":"landing_floors","label":"Jumlah Lantai Layanan","unit":"lantai"},{"key":"speed","label":"Kecepatan Sangkar","unit":"m/s"}]'::jsonb),
  ('f1000000-0000-0000-0000-000000000002', 'ELEVATOR_ESKALATOR', NULL, 'SERVICE_ELEVATOR', 'Lift Barang / Servis (Cargo Elevator)', 'Elevator khusus kargo barang & rumah sakit', true, 2,
   '[{"key":"rated_load","label":"Beban Nominal","unit":"kg"}]'::jsonb),
  ('f1000000-0000-0000-0000-000000000003', 'ELEVATOR_ESKALATOR', NULL, 'ESCALATOR', 'Eskalator (Tangga Berjalan)', 'Eskalator komersial & fasilitas publik', true, 3,
   '[{"key":"inclination","label":"Sudut Kemiringan","unit":"derajat"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- G. ANCHOR_LIFELINE
INSERT INTO equipment_types (id, domain_code, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'ANCHOR_LIFELINE', NULL, 'ANCHOR_POINT', 'Anchor Point (Titik Angkur)', 'Titik tambat jatuh perorangan dan beban gantung', true, 1,
   '[{"key":"pull_test_load","label":"Beban Uji Tarik (Pull Test)","unit":"kN"}]'::jsonb),
  ('71000000-0000-0000-0000-000000000002', 'ANCHOR_LIFELINE', NULL, 'HORIZONTAL_LIFELINE', 'Horizontal Lifeline System', 'Lintasan tali kawat baja penahan jatuh mendatar', true, 2,
   '[{"key":"span_length","label":"Panjang Bentang","unit":"meter"},{"key":"max_users","label":"Maksimum Pengguna Simultan","unit":"orang"}]'::jsonb),
  ('71000000-0000-0000-0000-000000000003', 'ANCHOR_LIFELINE', NULL, 'VERTICAL_LIFELINE', 'Vertical Lifeline System', 'Lintasan pengaman vertikal tangga monyet & tower', true, 3,
   '[{"key":"cable_diameter","label":"Diameter Kawat Baja","unit":"mm"}]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 5. Tambah kolom relasi pada test_objects
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS equipment_type_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS equipment_subtype_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS inspection_type_code text REFERENCES inspection_types(code) DEFAULT 'BERKALA';

CREATE INDEX IF NOT EXISTS idx_test_objects_equipment_type ON test_objects(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_test_objects_inspection_type ON test_objects(inspection_type_code);

-- 6. Tambah kolom relasi pada inspection_templates
ALTER TABLE inspection_templates
  ADD COLUMN IF NOT EXISTS domain_code text REFERENCES inspection_domains(code) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS equipment_type_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS subtype_id uuid REFERENCES equipment_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS inspection_type_code text REFERENCES inspection_types(code);

CREATE INDEX IF NOT EXISTS idx_templates_domain_code ON inspection_templates(domain_code);
CREATE INDEX IF NOT EXISTS idx_templates_equipment_type ON inspection_templates(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_templates_subtype ON inspection_templates(subtype_id);

-- 7. Sinkronisasi Data Existing:
-- Hubungkan domain_code pada inspection_templates berdasarkan category_id
UPDATE inspection_templates t
SET domain_code = d.code
FROM inspection_domains d
WHERE d.legacy_category_id = t.category_id AND t.domain_code IS NULL;

-- Hubungkan equipment_type_id pada inspection_templates yang sudah ada
UPDATE inspection_templates
SET equipment_type_id = 'a1000000-0000-0000-0000-000000000001' -- Forklift
WHERE (name ILIKE '%forklift%' OR name ILIKE '%paa%') AND equipment_type_id IS NULL;

UPDATE inspection_templates
SET equipment_type_id = 'b1000000-0000-0000-0000-000000000001' -- Bejana Tekan
WHERE (name ILIKE '%bejana%' OR name ILIKE '%pubt%') AND equipment_type_id IS NULL;

UPDATE inspection_templates
SET equipment_type_id = 'c1000000-0000-0000-0000-000000000001' -- Motor Diesel
WHERE (name ILIKE '%diesel%' OR name ILIKE '%ptp%') AND equipment_type_id IS NULL;

UPDATE inspection_templates
SET equipment_type_id = 'd1000000-0000-0000-0000-000000000001' -- Penyalur Petir
WHERE (name ILIKE '%petir%' OR name ILIKE '%ipp%') AND equipment_type_id IS NULL;

UPDATE inspection_templates
SET equipment_type_id = 'd1000000-0000-0000-0000-000000000002' -- Instalasi Listrik
WHERE (name ILIKE '%listrik%' OR name ILIKE '%lis%') AND equipment_type_id IS NULL;

UPDATE inspection_templates
SET equipment_type_id = 'e1000000-0000-0000-0000-000000000001' -- Fire Alarm
WHERE (name ILIKE '%fire%' OR name ILIKE '%ipk%') AND equipment_type_id IS NULL;

UPDATE inspection_templates
SET equipment_type_id = 'f1000000-0000-0000-0000-000000000001' -- Lift
WHERE (name ILIKE '%lift%' OR name ILIKE '%le%') AND equipment_type_id IS NULL;

-- Hubungkan equipment_type_id pada test_objects existing berdasarkan nama & kategori
UPDATE test_objects
SET equipment_type_id = 'a1000000-0000-0000-0000-000000000001'
WHERE name ILIKE '%forklift%' AND equipment_type_id IS NULL;

UPDATE test_objects
SET equipment_type_id = 'a1000000-0000-0000-0000-000000000003'
WHERE (name ILIKE '%crane%' OR name ILIKE '%ohc%') AND equipment_type_id IS NULL;

UPDATE test_objects
SET equipment_type_id = 'b1000000-0000-0000-0000-000000000001'
WHERE (name ILIKE '%bejana%' OR name ILIKE '%pressure%' OR name ILIKE '%tangki%') AND equipment_type_id IS NULL;

UPDATE test_objects
SET equipment_type_id = 'c1000000-0000-0000-0000-000000000001'
WHERE (name ILIKE '%diesel%' OR name ILIKE '%genset%') AND equipment_type_id IS NULL;

UPDATE test_objects
SET equipment_type_id = 'd1000000-0000-0000-0000-000000000001'
WHERE (name ILIKE '%petir%' OR name ILIKE '%penangkal%') AND equipment_type_id IS NULL;

-- Fallback test_objects by category_id jika belum terhubung
UPDATE test_objects o
SET equipment_type_id = et.id
FROM equipment_types et
JOIN inspection_domains d ON d.code = et.domain_code
WHERE o.equipment_type_id IS NULL
  AND d.legacy_category_id = o.category_id
  AND et.parent_id IS NULL;
