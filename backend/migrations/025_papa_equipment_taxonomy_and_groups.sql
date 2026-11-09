-- Migrasi 025: PAPA Equipment Taxonomy & Editable Equipment Groups
-- Menghubungkan Domain -> Kelompok Alat (Groups) -> Jenis Unit (Types) -> Subtipe

-- 1. Tabel Kelompok Alat (Equipment Groups)
CREATE TABLE IF NOT EXISTS equipment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_code text NOT NULL REFERENCES inspection_domains(code) ON UPDATE CASCADE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_groups_domain ON equipment_groups(domain_code);
CREATE INDEX IF NOT EXISTS idx_equipment_groups_active ON equipment_groups(is_active);

-- 2. Tambah relasi group_id pada equipment_types
ALTER TABLE equipment_types
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES equipment_groups(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_equipment_types_group ON equipment_types(group_id);

-- 3. Tambah relasi equipment_group_id pada test_objects
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS equipment_group_id uuid REFERENCES equipment_groups(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_test_objects_group ON test_objects(equipment_group_id);

-- 4. Tambah relasi equipment_group_id pada inspection_templates & lhpp_templates
ALTER TABLE inspection_templates
  ADD COLUMN IF NOT EXISTS equipment_group_id uuid REFERENCES equipment_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inspection_templates_group ON inspection_templates(equipment_group_id);

ALTER TABLE lhpp_templates
  ADD COLUMN IF NOT EXISTS equipment_group_id uuid REFERENCES equipment_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lhpp_templates_group ON lhpp_templates(equipment_group_id);

-- 5. Seed 11 Kelompok Alat (Equipment Groups) Resmi Bidang PAPA
INSERT INTO equipment_groups (id, domain_code, code, name, description, is_active, display_order)
VALUES
  ('11000000-0000-0000-0000-000000000001', 'PAPA', 'GRP_PAPA_FORKLIFT', 'Forklift', 'Kelompok alat angkat dan angkut forklift dan penanganan material', true, 1),
  ('11000000-0000-0000-0000-000000000002', 'PAPA', 'GRP_PAPA_MOBILE_CRANE', 'Mobile Crane', 'Kelompok derek berpindah, crawler crane, truck crane, dan floating crane', true, 2),
  ('11000000-0000-0000-0000-000000000003', 'PAPA', 'GRP_PAPA_DONGKRAK', 'Dongkrak', 'Kelompok peralatan dongkrak hidrolik, pneumatik, dan post/truck lift', true, 3),
  ('11000000-0000-0000-0000-000000000004', 'PAPA', 'GRP_PAPA_POSISI_BENDA', 'Alat Angkat Pengatur Posisi Benda Kerja', 'Kelompok alat penata posisi benda kerja, rotator/robotik, dan takel', true, 4),
  ('11000000-0000-0000-0000-000000000005', 'PAPA', 'GRP_PAPA_PERSONAL_PLATFORM', 'Personal Platform', 'Kelompok gondola gantung dan passenger hoist untuk personil', true, 5),
  ('11000000-0000-0000-0000-000000000006', 'PAPA', 'GRP_PAPA_ALAT_BERAT', 'Alat Berat', 'Kelompok alat berat konstruksi, excavator, dozer, paver, roller, dan tambang', true, 6),
  ('11000000-0000-0000-0000-000000000007', 'PAPA', 'GRP_PAPA_KERETA', 'Kereta', 'Kelompok sarana angkut rel, kereta gantung, kereta ayun, ladel, dan lokomotif', true, 7),
  ('11000000-0000-0000-0000-000000000008', 'PAPA', 'GRP_PAPA_PERSONAL_BASKET', 'Personal Basket', 'Kelompok platform kerja terangkat, boom lift, manlift, scissor lift, dan tangga hidrolik', true, 8),
  ('11000000-0000-0000-0000-000000000009', 'PAPA', 'GRP_PAPA_ROBOTIK', 'Robotik', 'Kelompok sistem pemindahan dan pengangkutan berpemandu otomatis (AGV)', true, 9),
  ('11000000-0000-0000-0000-000000000010', 'PAPA', 'GRP_PAPA_TOWER_CRANE', 'TOWER CRANE', 'Kelompok tower crane konstruksi dan fabrikasi bertingkat', true, 10),
  ('11000000-0000-0000-0000-000000000011', 'PAPA', 'GRP_PAPA_OVERHEAD_CRANE', 'Overhead Crane', 'Kelompok overhead travelling crane, gantry, jib, hoist, dan container crane', true, 11)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order;

-- 6. Seed Kelompok Induk Default untuk 6 Bidang Lainnya
INSERT INTO equipment_groups (id, domain_code, code, name, description, is_active, display_order)
VALUES
  ('21000000-0000-0000-0000-000000000001', 'PUBT', 'GRP_PUBT_BEJANA_BOILER', 'Bejana Tekan & Boiler', 'Kelompok ketel uap, bejana tekan udara, dan tangki timbun', true, 1),
  ('31000000-0000-0000-0000-000000000001', 'PTP', 'GRP_PTP_TENAGA_PRODUKSI', 'Pesawat Tenaga & Produksi', 'Kelompok motor diesel genset, mesin produksi, dan kompresor', true, 1),
  ('41000000-0000-0000-0000-000000000001', 'ILPP', 'GRP_ILPP_LISTRIK_PETIR', 'Instalasi Listrik & Petir', 'Kelompok penyalur petir, instalasi listrik panel, dan transformator', true, 1),
  ('51000000-0000-0000-0000-000000000001', 'IPK', 'GRP_IPK_PROTEKSI_KEBAKARAN', 'Instalasi Proteksi Kebakaran', 'Kelompok fire alarm, hydrant sprinkler, dan APAR', true, 1),
  ('61000000-0000-0000-0000-000000000001', 'ELEVATOR_ESKALATOR', 'GRP_ELEVATOR_ESKALATOR', 'Elevator & Eskalator', 'Kelompok lift penumpang, cargo lift, dan eskalator', true, 1),
  ('71000000-0000-0000-0000-000000000001', 'ANCHOR_LIFELINE', 'GRP_ANCHOR_LIFELINE', 'Anchor & Lifeline', 'Kelompok anchor point, horizontal dan vertical lifeline', true, 1)
ON CONFLICT (code) DO NOTHING;

-- 7. Hubungkan jenis unit eksisting pada 6 bidang lain ke grup induknya
UPDATE equipment_types SET group_id = '21000000-0000-0000-0000-000000000001' WHERE domain_code = 'PUBT' AND group_id IS NULL;
UPDATE equipment_types SET group_id = '31000000-0000-0000-0000-000000000001' WHERE domain_code = 'PTP' AND group_id IS NULL;
UPDATE equipment_types SET group_id = '41000000-0000-0000-0000-000000000001' WHERE domain_code = 'ILPP' AND group_id IS NULL;
UPDATE equipment_types SET group_id = '51000000-0000-0000-0000-000000000001' WHERE domain_code = 'IPK' AND group_id IS NULL;
UPDATE equipment_types SET group_id = '61000000-0000-0000-0000-000000000001' WHERE domain_code = 'ELEVATOR_ESKALATOR' AND group_id IS NULL;
UPDATE equipment_types SET group_id = '71000000-0000-0000-0000-000000000001' WHERE domain_code = 'ANCHOR_LIFELINE' AND group_id IS NULL;

-- 8. Hubungkan atau sinkronkan jenis unit eksisting PAPA ke grup yang sesuai
UPDATE equipment_types SET group_id = '11000000-0000-0000-0000-000000000001' WHERE id = 'a1000000-0000-0000-0000-000000000001'; -- Forklift
UPDATE equipment_types SET group_id = '11000000-0000-0000-0000-000000000002' WHERE id = 'a1000000-0000-0000-0000-000000000004'; -- Mobile Crane
UPDATE equipment_types SET group_id = '11000000-0000-0000-0000-000000000005' WHERE id = 'a1000000-0000-0000-0000-000000000008'; -- Gondola
UPDATE equipment_types SET group_id = '11000000-0000-0000-0000-000000000006' WHERE id = 'a1000000-0000-0000-0000-000000000009'; -- Excavator
UPDATE equipment_types SET group_id = '11000000-0000-0000-0000-000000000010' WHERE id = 'a1000000-0000-0000-0000-000000000005'; -- Tower Crane
UPDATE equipment_types SET group_id = '11000000-0000-0000-0000-000000000011' WHERE id IN ('a1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000007'); -- Overhead, Gantry, Hoist

-- 9. Seed 100 Jenis Unit Resmi PAPA (Exact Casing & Names)
INSERT INTO equipment_types (domain_code, group_id, parent_id, code, name, description, is_active, display_order, attribute_schema)
VALUES
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_CONTAINER_HANDLER', 'CONTAINER HANDLER', 'Jenis unit riksa uji K3 CONTAINER HANDLER pada kelompok Forklift', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_FORKLIFT', 'FORKLIFT', 'Jenis unit riksa uji K3 FORKLIFT pada kelompok Forklift', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_LIFTTRUCK', 'LIFTTRUCK', 'Jenis unit riksa uji K3 LIFTTRUCK pada kelompok Forklift', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_PALLET_MOVER_HAND_PALLET', 'PALLET MOVER /HAND PALLET', 'Jenis unit riksa uji K3 PALLET MOVER /HAND PALLET pada kelompok Forklift', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_REACH_STACKER', 'REACH STACKER', 'Jenis unit riksa uji K3 REACH STACKER pada kelompok Forklift', true, 5, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_REACH_RACK_STACKER', 'REACH/RACK STACKER', 'Jenis unit riksa uji K3 REACH/RACK STACKER pada kelompok Forklift', true, 6, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000001', NULL, 'ET_PAPA_TELEHANDLER', 'TELEHANDLER', 'Jenis unit riksa uji K3 TELEHANDLER pada kelompok Forklift', true, 7, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_BARGE_CRANE', 'BARGE CRANE', 'Jenis unit riksa uji K3 BARGE CRANE pada kelompok Mobile Crane', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_BORE_PILE', 'BORE PILE', 'Jenis unit riksa uji K3 BORE PILE pada kelompok Mobile Crane', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_CARGO_CRANE', 'CARGO CRANE', 'Jenis unit riksa uji K3 CARGO CRANE pada kelompok Mobile Crane', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_CRAWLER_CRANE', 'CRAWLER CRANE', 'Jenis unit riksa uji K3 CRAWLER CRANE pada kelompok Mobile Crane', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_DERRICK_CRANE', 'DERRICK CRANE', 'Jenis unit riksa uji K3 DERRICK CRANE pada kelompok Mobile Crane', true, 5, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_DERRICK_SHIP_CRANE', 'DERRICK SHIP CRANE', 'Jenis unit riksa uji K3 DERRICK SHIP CRANE pada kelompok Mobile Crane', true, 6, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_DREDGING_CRANE', 'DREDGING CRANE', 'Jenis unit riksa uji K3 DREDGING CRANE pada kelompok Mobile Crane', true, 7, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_FLOATING_CRANE', 'FLOATING CRANE', 'Jenis unit riksa uji K3 FLOATING CRANE pada kelompok Mobile Crane', true, 8, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_FLOATING_DERRICK_CRANE', 'FLOATING DERRICK CRANE', 'Jenis unit riksa uji K3 FLOATING DERRICK CRANE pada kelompok Mobile Crane', true, 9, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_FLOATING_SHIP_CRANE', 'FLOATING SHIP CRANE', 'Jenis unit riksa uji K3 FLOATING SHIP CRANE pada kelompok Mobile Crane', true, 10, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_HYDRAULIC_DRILLING_RIG', 'HYDRAULIC DRILLING RIG', 'Jenis unit riksa uji K3 HYDRAULIC DRILLING RIG pada kelompok Mobile Crane', true, 11, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_HYDRAULIC_STATIC_PILE_DRIVER', 'HYDRAULIC STATIC PILE DRIVER', 'Jenis unit riksa uji K3 HYDRAULIC STATIC PILE DRIVER pada kelompok Mobile Crane', true, 12, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_KANGGURU_CRANE', 'KANGGURU CRANE', 'Jenis unit riksa uji K3 KANGGURU CRANE pada kelompok Mobile Crane', true, 13, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_LOCOMOTIVE_CRANE', 'LOCOMOTIVE CRANE', 'Jenis unit riksa uji K3 LOCOMOTIVE CRANE pada kelompok Mobile Crane', true, 14, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_LUFFING_CRANE', 'LUFFING CRANE', 'Jenis unit riksa uji K3 LUFFING CRANE pada kelompok Mobile Crane', true, 15, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_MOBILE_CRANE', 'MOBILE CRANE', 'Jenis unit riksa uji K3 MOBILE CRANE pada kelompok Mobile Crane', true, 16, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_PEDESTAL_CRANE', 'PEDESTAL CRANE', 'Jenis unit riksa uji K3 PEDESTAL CRANE pada kelompok Mobile Crane', true, 17, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_PILE_DRIVER', 'PILE DRIVER', 'Jenis unit riksa uji K3 PILE DRIVER pada kelompok Mobile Crane', true, 18, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_PONTON_CRANE', 'PONTON CRANE', 'Jenis unit riksa uji K3 PONTON CRANE pada kelompok Mobile Crane', true, 19, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_PORTAL_CRANE', 'PORTAL CRANE', 'Jenis unit riksa uji K3 PORTAL CRANE pada kelompok Mobile Crane', true, 20, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_RAILWAY_CRANE', 'RAILWAY CRANE', 'Jenis unit riksa uji K3 RAILWAY CRANE pada kelompok Mobile Crane', true, 21, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_SHIP_CRANE', 'SHIP CRANE', 'Jenis unit riksa uji K3 SHIP CRANE pada kelompok Mobile Crane', true, 22, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_SIDE_BOOM_CRANE_CRAB_CRANE', 'SIDE BOOM CRANE/CRAB CRANE', 'Jenis unit riksa uji K3 SIDE BOOM CRANE/CRAB CRANE pada kelompok Mobile Crane', true, 23, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_SPIDER_CRANE', 'SPIDER CRANE', 'Jenis unit riksa uji K3 SPIDER CRANE pada kelompok Mobile Crane', true, 24, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_STACKER_CRANE', 'STACKER CRANE', 'Jenis unit riksa uji K3 STACKER CRANE pada kelompok Mobile Crane', true, 25, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_TRACTOR_CRANE', 'TRACTOR CRANE', 'Jenis unit riksa uji K3 TRACTOR CRANE pada kelompok Mobile Crane', true, 26, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000002', NULL, 'ET_PAPA_TRUCK_CRANE', 'TRUCK CRANE', 'Jenis unit riksa uji K3 TRUCK CRANE pada kelompok Mobile Crane', true, 27, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000003', NULL, 'ET_PAPA_DONGKRAK_HIDROLIK', 'DONGKRAK HIDROLIK', 'Jenis unit riksa uji K3 DONGKRAK HIDROLIK pada kelompok Dongkrak', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000003', NULL, 'ET_PAPA_DONGKRAK_PNEUMATIK', 'DONGKRAK PNEUMATIK', 'Jenis unit riksa uji K3 DONGKRAK PNEUMATIK pada kelompok Dongkrak', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000003', NULL, 'ET_PAPA_DONGKRAK_POST_LIFT', 'DONGKRAK POST LIFT', 'Jenis unit riksa uji K3 DONGKRAK POST LIFT pada kelompok Dongkrak', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000003', NULL, 'ET_PAPA_DONGKRAK_TRUCK_CAR_LIFT', 'DONGKRAK TRUCK/CAR LIFT', 'Jenis unit riksa uji K3 DONGKRAK TRUCK/CAR LIFT pada kelompok Dongkrak', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000003', NULL, 'ET_PAPA_LIER', 'LIER', 'Jenis unit riksa uji K3 LIER pada kelompok Dongkrak', true, 5, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000004', NULL, 'ET_PAPA_ROTATOR_ROBOTIK', 'ROTATOR/ROBOTIK', 'Jenis unit riksa uji K3 ROTATOR/ROBOTIK pada kelompok Alat Angkat Pengatur Posisi Benda Kerja', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000004', NULL, 'ET_PAPA_TAKEL', 'TAKEL', 'Jenis unit riksa uji K3 TAKEL pada kelompok Alat Angkat Pengatur Posisi Benda Kerja', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000005', NULL, 'ET_PAPA_GONDOLA', 'GONDOLA', 'Jenis unit riksa uji K3 GONDOLA pada kelompok Personal Platform', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000005', NULL, 'ET_PAPA_PASSENGER_HOIST', 'PASSENGER HOIST', 'Jenis unit riksa uji K3 PASSENGER HOIST pada kelompok Personal Platform', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_ASPHALT_FINISHER', 'ASPHALT FINISHER', 'Jenis unit riksa uji K3 ASPHALT FINISHER pada kelompok Alat Berat', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_ASPHALT_PAVER', 'ASPHALT PAVER', 'Jenis unit riksa uji K3 ASPHALT PAVER pada kelompok Alat Berat', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_ASPHALT_SPRAYER', 'ASPHALT SPRAYER', 'Jenis unit riksa uji K3 ASPHALT SPRAYER pada kelompok Alat Berat', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_BACKHOE', 'BACKHOE', 'Jenis unit riksa uji K3 BACKHOE pada kelompok Alat Berat', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_BULLDOZER', 'BULLDOZER', 'Jenis unit riksa uji K3 BULLDOZER pada kelompok Alat Berat', true, 5, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_COLD_MILLING_MACHINE', 'Cold Milling Machine', 'Jenis unit riksa uji K3 Cold Milling Machine pada kelompok Alat Berat', true, 6, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_COMPACTOR_ROLLER', 'COMPACTOR ROLLER', 'Jenis unit riksa uji K3 COMPACTOR ROLLER pada kelompok Alat Berat', true, 7, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_CONCRETE_PAVER', 'CONCRETE PAVER', 'Jenis unit riksa uji K3 CONCRETE PAVER pada kelompok Alat Berat', true, 8, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_CRANK_LOGGER', 'Crank Logger', 'Jenis unit riksa uji K3 Crank Logger pada kelompok Alat Berat', true, 9, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_EXCAVATOR', 'EXCAVATOR', 'Jenis unit riksa uji K3 EXCAVATOR pada kelompok Alat Berat', true, 10, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_EXCAVATOR_GRAPPLE', 'EXCAVATOR GRAPPLE', 'Jenis unit riksa uji K3 EXCAVATOR GRAPPLE pada kelompok Alat Berat', true, 11, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_GRADER', 'GRADER', 'Jenis unit riksa uji K3 GRADER pada kelompok Alat Berat', true, 12, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_HORIZONTAL_DIRECTIONAL_DRILLING', 'HORIZONTAL DIRECTIONAL DRILLING', 'Jenis unit riksa uji K3 HORIZONTAL DIRECTIONAL DRILLING pada kelompok Alat Berat', true, 13, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_LOADER', 'LOADER', 'Jenis unit riksa uji K3 LOADER pada kelompok Alat Berat', true, 14, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_MACHINERY_CAR', 'MACHINERY CAR', 'Jenis unit riksa uji K3 MACHINERY CAR pada kelompok Alat Berat', true, 15, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_PAVER', 'PAVER', 'Jenis unit riksa uji K3 PAVER pada kelompok Alat Berat', true, 16, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_PNEUMATIC_TIRE_ROLLER', 'Pneumatic Tire Roller', 'Jenis unit riksa uji K3 Pneumatic Tire Roller pada kelompok Alat Berat', true, 17, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_RECYCLER', 'RECYCLER', 'Jenis unit riksa uji K3 RECYCLER pada kelompok Alat Berat', true, 18, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_SCREEDER', 'Screeder', 'Jenis unit riksa uji K3 Screeder pada kelompok Alat Berat', true, 19, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_SOIL_STABILIZER', 'SOIL STABILIZER', 'Jenis unit riksa uji K3 SOIL STABILIZER pada kelompok Alat Berat', true, 20, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_STACKER_RECLAIMER', 'STACKER RECLAIMER', 'Jenis unit riksa uji K3 STACKER RECLAIMER pada kelompok Alat Berat', true, 21, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_SURFACE_MINER', 'SURFACE MINER', 'Jenis unit riksa uji K3 SURFACE MINER pada kelompok Alat Berat', true, 22, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_TRACTOR', 'TRACTOR', 'Jenis unit riksa uji K3 TRACTOR pada kelompok Alat Berat', true, 23, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_VACUUM_SWEEPERS', 'VACUUM SWEEPERS', 'Jenis unit riksa uji K3 VACUUM SWEEPERS pada kelompok Alat Berat', true, 24, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000006', NULL, 'ET_PAPA_VIBRATOR_ROLLER', 'VIBRATOR ROLLER', 'Jenis unit riksa uji K3 VIBRATOR ROLLER pada kelompok Alat Berat', true, 25, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_AYUN', 'KERETA AYUN', 'Jenis unit riksa uji K3 KERETA AYUN pada kelompok Kereta', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_GANTUNG', 'KERETA GANTUNG', 'Jenis unit riksa uji K3 KERETA GANTUNG pada kelompok Kereta', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_LADEL', 'KERETA LADEL', 'Jenis unit riksa uji K3 KERETA LADEL pada kelompok Kereta', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_LONTAR', 'KERETA LONTAR', 'Jenis unit riksa uji K3 KERETA LONTAR pada kelompok Kereta', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_LUNCUR', 'KERETA LUNCUR', 'Jenis unit riksa uji K3 KERETA LUNCUR pada kelompok Kereta', true, 5, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_PRODUKSI', 'KERETA PRODUKSI', 'Jenis unit riksa uji K3 KERETA PRODUKSI pada kelompok Kereta', true, 6, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_PUTAR_VERTICAL_HORIZONTAL', 'KERETA PUTAR VERTICAL/HORIZONTAL', 'Jenis unit riksa uji K3 KERETA PUTAR VERTICAL/HORIZONTAL pada kelompok Kereta', true, 7, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_KERETA_TROLI', 'KERETA TROLI', 'Jenis unit riksa uji K3 KERETA TROLI pada kelompok Kereta', true, 8, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000007', NULL, 'ET_PAPA_LOKOMOTIF', 'LOKOMOTIF', 'Jenis unit riksa uji K3 LOKOMOTIF pada kelompok Kereta', true, 9, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000008', NULL, 'ET_PAPA_BOOM_LIFT', 'BOOM LIFT', 'Jenis unit riksa uji K3 BOOM LIFT pada kelompok Personal Basket', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000008', NULL, 'ET_PAPA_HYDRAULIC_STAIRS', 'HYDRAULIC STAIRS', 'Jenis unit riksa uji K3 HYDRAULIC STAIRS pada kelompok Personal Basket', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000008', NULL, 'ET_PAPA_MANLIFT', 'MANLIFT', 'Jenis unit riksa uji K3 MANLIFT pada kelompok Personal Basket', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000008', NULL, 'ET_PAPA_SCISSOR_LIFT', 'SCISSOR LIFT', 'Jenis unit riksa uji K3 SCISSOR LIFT pada kelompok Personal Basket', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000009', NULL, 'ET_PAPA_AUTOMATED_GUIDED_VEHICLE', 'AUTOMATED GUIDED VEHICLE', 'Jenis unit riksa uji K3 AUTOMATED GUIDED VEHICLE pada kelompok Robotik', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000010', NULL, 'ET_PAPA_TOWER_CRANE', 'TOWER CRANE', 'Jenis unit riksa uji K3 TOWER CRANE pada kelompok TOWER CRANE', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_CARGO_HOIST_CRANE', 'CARGO HOIST CRANE', 'Jenis unit riksa uji K3 CARGO HOIST CRANE pada kelompok Overhead Crane', true, 1, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_CHAIN_BLOCK', 'CHAIN BLOCK', 'Jenis unit riksa uji K3 CHAIN BLOCK pada kelompok Overhead Crane', true, 2, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_CONTAINER_CRANE', 'CONTAINER CRANE', 'Jenis unit riksa uji K3 CONTAINER CRANE pada kelompok Overhead Crane', true, 3, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_GANTRY_CRANE', 'GANTRY CRANE', 'Jenis unit riksa uji K3 GANTRY CRANE pada kelompok Overhead Crane', true, 4, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_GANTRY_LUFFING_CRANE', 'GANTRY LUFFING CRANE', 'Jenis unit riksa uji K3 GANTRY LUFFING CRANE pada kelompok Overhead Crane', true, 5, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_HOIST_CRANE', 'HOIST CRANE', 'Jenis unit riksa uji K3 HOIST CRANE pada kelompok Overhead Crane', true, 6, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_JIB_CRANE', 'JIB CRANE', 'Jenis unit riksa uji K3 JIB CRANE pada kelompok Overhead Crane', true, 7, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_LAUNCHER_GANTRY_CRANE', 'LAUNCHER GANTRY CRANE', 'Jenis unit riksa uji K3 LAUNCHER GANTRY CRANE pada kelompok Overhead Crane', true, 8, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_MONORAIL_CRANE', 'MONORAIL CRANE', 'Jenis unit riksa uji K3 MONORAIL CRANE pada kelompok Overhead Crane', true, 9, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_OVERHEAD_CRANE', 'OVERHEAD CRANE', 'Jenis unit riksa uji K3 OVERHEAD CRANE pada kelompok Overhead Crane', true, 10, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_OVERHEAD_TRAVELLING_CRANE', 'OVERHEAD TRAVELLING CRANE', 'Jenis unit riksa uji K3 OVERHEAD TRAVELLING CRANE pada kelompok Overhead Crane', true, 11, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_RAIL_MOUNTED_GANTRY_CRANE', 'RAIL MOUNTED GANTRY CRANE', 'Jenis unit riksa uji K3 RAIL MOUNTED GANTRY CRANE pada kelompok Overhead Crane', true, 12, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_ROLLER_GANTRY_CRANE', 'ROLLER GANTRY CRANE', 'Jenis unit riksa uji K3 ROLLER GANTRY CRANE pada kelompok Overhead Crane', true, 13, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_RUBBER_TIRE_GANTRY_CRANE', 'RUBBER TIRE GANTRY CRANE', 'Jenis unit riksa uji K3 RUBBER TIRE GANTRY CRANE pada kelompok Overhead Crane', true, 14, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_SEMI_GANTRY_CRANE', 'SEMI GANTRY CRANE', 'Jenis unit riksa uji K3 SEMI GANTRY CRANE pada kelompok Overhead Crane', true, 15, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_SHIP_UNLOADER_CRANE', 'SHIP UNLOADER CRANE', 'Jenis unit riksa uji K3 SHIP UNLOADER CRANE pada kelompok Overhead Crane', true, 16, '[]'::jsonb),
  ('PAPA', '11000000-0000-0000-0000-000000000011', NULL, 'ET_PAPA_WALL_CRANE', 'WALL CRANE', 'Jenis unit riksa uji K3 WALL CRANE pada kelompok Overhead Crane', true, 17, '[]'::jsonb)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    group_id = EXCLUDED.group_id,
    domain_code = EXCLUDED.domain_code,
    display_order = EXCLUDED.display_order;

-- 10. Update test_objects, inspection_templates, dan lhpp_templates agar memiliki equipment_group_id
UPDATE test_objects o
SET equipment_group_id = et.group_id
FROM equipment_types et
WHERE o.equipment_type_id = et.id AND o.equipment_group_id IS NULL;

UPDATE inspection_templates t
SET equipment_group_id = et.group_id
FROM equipment_types et
WHERE t.equipment_type_id = et.id AND t.equipment_group_id IS NULL;

UPDATE lhpp_templates lt
SET equipment_group_id = et.group_id
FROM equipment_types et
WHERE lt.equipment_type_id = et.id AND lt.equipment_group_id IS NULL;
