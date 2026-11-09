-- Migrasi 024: Dynamic LHPP Document Generation Engine
-- Equipment-Specific Templates, Dynamic Data Mapping, Versioning & Document Integrity

-- 1. Tabel Master Template LHPP
CREATE TABLE IF NOT EXISTS lhpp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  domain_code text NOT NULL REFERENCES inspection_domains(code),
  equipment_type_id uuid REFERENCES equipment_types(id) ON DELETE SET NULL,
  equipment_subtype_id uuid REFERENCES equipment_types(id) ON DELETE SET NULL,
  inspection_type_code text REFERENCES inspection_types(code) ON DELETE SET NULL,
  output_format text NOT NULL DEFAULT 'BOTH' CHECK (output_format IN ('PDF', 'DOCX', 'BOTH')),
  is_active boolean NOT NULL DEFAULT true,
  active_version_id uuid, -- akan di-reference ke lhpp_template_versions
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lhpp_templates_domain ON lhpp_templates(domain_code);
CREATE INDEX IF NOT EXISTS idx_lhpp_templates_eq_type ON lhpp_templates(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_lhpp_templates_eq_subtype ON lhpp_templates(equipment_subtype_id);

-- 2. Tabel Versi Template LHPP (Versioning & Immutability)
CREATE TABLE IF NOT EXISTS lhpp_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES lhpp_templates(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  version_code text NOT NULL,
  title text NOT NULL,
  regulation_reference text,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  layout_config jsonb NOT NULL DEFAULT '{
    "pageSize": "A4",
    "orientation": "portrait",
    "margins": { "top": 40, "bottom": 40, "left": 45, "right": 45 },
    "primaryColor": "#C81E1E",
    "headerTitle": "PT. UPAYA RIKSA DAYA",
    "headerSubtitle": "Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian"
  }'::jsonb,
  field_mappings jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  sample_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  changelog text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_lhpp_template_version UNIQUE (template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_lhpp_tpl_ver_template ON lhpp_template_versions(template_id);

-- Tambahkan foreign key dari lhpp_templates.active_version_id ke lhpp_template_versions(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_lhpp_templates_active_version'
  ) THEN
    ALTER TABLE lhpp_templates
    ADD CONSTRAINT fk_lhpp_templates_active_version
    FOREIGN KEY (active_version_id) REFERENCES lhpp_template_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Perluas Tabel Dokumen LHPP (Snapshot, Template Version, Output DOCX)
ALTER TABLE lhpp_documents
  ADD COLUMN IF NOT EXISTS template_version_id uuid REFERENCES lhpp_template_versions(id),
  ADD COLUMN IF NOT EXISTS equipment_type_id uuid REFERENCES equipment_types(id),
  ADD COLUMN IF NOT EXISTS equipment_subtype_id uuid REFERENCES equipment_types(id),
  ADD COLUMN IF NOT EXISTS inspection_type_code text REFERENCES inspection_types(code),
  ADD COLUMN IF NOT EXISTS data_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS docx_file_id uuid REFERENCES file_attachments(id);

CREATE INDEX IF NOT EXISTS idx_lhpp_docs_tpl_ver ON lhpp_documents(template_version_id);
CREATE INDEX IF NOT EXISTS idx_lhpp_docs_eq_type ON lhpp_documents(equipment_type_id);

-- 4. Seed Template LHPP Resmi Berdasarkan Inventaris Dokumen URD
-- A. Template PAPA: Crane
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-PAPA-CRANE',
  'LHPP Pesawat Angkat & Angkut — Crane & Hoist',
  'Template resmi laporan hasil riksa uji Overhead Crane, Gantry Crane, Mobile Crane, dan Jib Crane (Permenaker No. 08/2020)',
  'PAPA',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- B. Template PAPA: Forklift
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-PAPA-FORKLIFT',
  'LHPP Pesawat Angkat & Angkut — Forklift & Material Handling',
  'Template resmi laporan hasil riksa uji Forklift Diesel, Electric, Reach Truck, dan Stacker (Permenaker No. 08/2020)',
  'PAPA',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- C. Template PUBT: Bejana Tekan & Tangki Timbun
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-PUBT-TANK',
  'LHPP Bejana Tekan & Tangki Timbun — Air Receiver & Storage',
  'Template resmi riksa uji Bejana Tekan Udara, Tangki Timbun, dan Reaktor Tekan (Permenaker No. 37/2016)',
  'PUBT',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- D. Template ILPP: Instalasi Penyalur Petir
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-ILPP-PETIR',
  'LHPP Instalasi Penyalur Petir — Konvensional & ESE',
  'Template resmi riksa uji Instalasi Penyalur Petir eksternal/internal & pembumian (Permenaker No. 31/2015)',
  'ILPP',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- E. Template ILPP: Instalasi Listrik
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-ILPP-LISTRIK',
  'LHPP Instalasi Listrik — Trafo, Switchgear & Distribusi',
  'Template resmi riksa uji Instalasi Listrik tegangan rendah/menengah (Permenaker No. 12/2015 & SNI PUIL 2011)',
  'ILPP',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- F. Template PTP: Motor Diesel / Genset
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-PTP-DIESEL',
  'LHPP Pesawat Tenaga & Produksi — Motor Diesel & Genset',
  'Template resmi riksa uji Penggerak Mula Genset Diesel dan Turbin (Permenaker No. 38/2016)',
  'PTP',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- G. Template PTP: Mesin Produksi & Perkakas
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-PTP-MESIN',
  'LHPP Pesawat Tenaga & Produksi — Mesin & Lini Produksi',
  'Template resmi riksa uji Mesin Perkakas, Press, Conveyor, dan Line Produksi Otomasi (Permenaker No. 38/2016)',
  'PTP',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- H. Template IPK: Fire Alarm System
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-IPK-ALARM',
  'LHPP Proteksi Kebakaran — Sistem Fire Alarm & Deteksi',
  'Template resmi riksa uji Sistem Alarm Kebakaran Otomatik & Manual Call Point (Kepmenaker No. 186/1999)',
  'IPK',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- I. Template IPK: Hydrant & Sprinkler
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-IPK-HYDRANT',
  'LHPP Proteksi Kebakaran — Sistem Hydrant & Sprinkler',
  'Template resmi riksa uji Pompa Hydrant, Pillar, Nozzle, dan Instalasi Sprinkler (Permenaker No. 02/1983)',
  'IPK',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- J. Template Elevator & Eskalator
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-LE-LIFT',
  'LHPP Elevator & Eskalator — Lift Penumpang & Barang',
  'Template resmi riksa uji Lift Penumpang, Lift Barang, dan Eskalator (Permenaker No. 06/2017)',
  'ELEVATOR_ESKALATOR',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- K. Template Anchor & Lifeline
INSERT INTO lhpp_templates (code, name, description, domain_code, output_format, is_active)
VALUES (
  'TPL-LHPP-ANCHOR-LIFELINE',
  'LHPP Anchor & Lifeline — Sistem Proteksi Jatuh Ketinggian',
  'Template resmi riksa uji dan pengujian beban tarik Titik Angkur & Tali Pengaman (Permenaker No. 09/2016)',
  'ANCHOR_LIFELINE',
  'BOTH',
  true
) ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 5. Hubungkan Jenis Unit Spesifik (Equipment Type Mapping)
UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-PAPA-CRANE' AND e.code = 'EQ-PAPA-CRN';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-PAPA-FORKLIFT' AND e.code = 'EQ-PAPA-FKL';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-PUBT-TANK' AND e.code = 'EQ-PUBT-PRS';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-ILPP-PETIR' AND e.code = 'EQ-ILPP-LGT';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-ILPP-LISTRIK' AND e.code = 'EQ-ILPP-PWR';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-PTP-DIESEL' AND e.code = 'EQ-PTP-DSL';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-PTP-MESIN' AND e.code = 'EQ-PTP-PRD';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-IPK-ALARM' AND e.code = 'EQ-IPK-ALM';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-IPK-HYDRANT' AND e.code = 'EQ-IPK-HYD';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-LE-LIFT' AND e.code = 'EQ-LE-PSN';

UPDATE lhpp_templates t
SET equipment_type_id = e.id
FROM equipment_types e
WHERE t.code = 'TPL-LHPP-ANCHOR-LIFELINE' AND e.code = 'EQ-ANC-RIG';

-- 6. Fungsi Helper Seeding Versi Template Default V1
CREATE OR REPLACE FUNCTION seed_default_lhpp_template_version(
  tpl_code text,
  v_title text,
  v_reg text,
  v_sections jsonb,
  v_mappings jsonb
) RETURNS void AS $$
DECLARE
  v_tpl_id uuid;
  v_ver_id uuid;
BEGIN
  SELECT id INTO v_tpl_id FROM lhpp_templates WHERE code = tpl_code;
  IF v_tpl_id IS NULL THEN RETURN; END IF;

  INSERT INTO lhpp_template_versions (
    template_id, version_number, version_code, title,
    regulation_reference, effective_date, is_active,
    sections, field_mappings, changelog
  ) VALUES (
    v_tpl_id, 1, 'V1', v_title,
    v_reg, CURRENT_DATE, true,
    v_sections, v_mappings, 'Versi awal resmi hasil standarisasi audit dokumen URD'
  )
  ON CONFLICT (template_id, version_number) DO UPDATE
  SET title = EXCLUDED.title,
      regulation_reference = EXCLUDED.regulation_reference,
      sections = EXCLUDED.sections,
      field_mappings = EXCLUDED.field_mappings
  RETURNING id INTO v_ver_id;

  UPDATE lhpp_templates
  SET active_version_id = v_ver_id
  WHERE id = v_tpl_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Seed Versi V1 untuk Semua Template Resmi URD
-- Struktur section standar URD:
-- 1. cover
-- 2. identity (Data Umum)
-- 3. technical (Data Teknis Nameplate)
-- 4. checklist (Pemeriksaan Visual)
-- 5. measurements (Pengukuran & Pengujian Khusus)
-- 6. findings (Temuan & Rekomendasi Syarat K3)
-- 7. conclusion (Kesimpulan & Pengesahan)
-- 8. photos (Lampiran Foto)
-- 9. skp (Lampiran SKP & Kalibrasi)

-- A. Versi V1 Crane
SELECT seed_default_lhpp_template_version(
  'TPL-LHPP-PAPA-CRANE',
  'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN PESAWAT ANGKAT DAN PESAWAT ANGKUT (CRANE)',
  'Permenaker No. 08 Tahun 2020 tentang K3 Pesawat Angkat dan Pesawat Angkut',
  '[
    {"key": "cover", "title": "Halaman Sampul Resmi", "type": "COVER", "enabled": true},
    {"key": "identity", "title": "I. DATA UMUM & IDENTITAS UNIT", "type": "IDENTITY_TABLE", "enabled": true},
    {"key": "technical", "title": "II. DATA TEKNIS PESAWAT ANGKAT", "type": "TECHNICAL_TABLE", "enabled": true},
    {"key": "checklist", "title": "III. PEMERIKSAAN VISUAL & KELENGKAPAN", "type": "CHECKLIST_TABLE", "enabled": true},
    {"key": "measurements", "title": "IV. PENGUJIAN DEFLEKSI & BEBAN STATIS/DINAMIS", "type": "MEASUREMENT_TABLE", "enabled": true},
    {"key": "findings", "title": "V. TEMUAN DAN SYARAT-SYARAT K3", "type": "FINDINGS_TABLE", "enabled": true},
    {"key": "conclusion", "title": "VI. KESIMPULAN KELAYAKAN OPERASIONAL", "type": "CONCLUSION", "enabled": true},
    {"key": "photos", "title": "LAMPIRAN FOTO DOKUMENTASI PENGUJIAN", "type": "PHOTOS", "enabled": true},
    {"key": "skp", "title": "LAMPIRAN SERTIFIKAT SKP & KALIBRASI", "type": "APPENDIX_SKP", "enabled": true}
  ]'::jsonb,
  '[
    {"target": "client_name", "source": "client.name", "label": "Perusahaan Pemilik"},
    {"target": "client_address", "source": "client.address", "label": "Alamat Pemilik"},
    {"target": "install_location", "source": "object.install_location", "label": "Lokasi Pemasangan"},
    {"target": "serial_number", "source": "object.serial_number", "label": "Nomor Seri"},
    {"target": "brand", "source": "object.brand", "label": "Merk / Model"},
    {"target": "manufacture_year", "source": "object.manufacture_year", "label": "Tahun Pembuatan"},
    {"target": "swl_tons", "source": "technical.swl_tons", "label": "Kapasitas Angkat (SWL)"},
    {"target": "span_meters", "source": "technical.span_meters", "label": "Bentang Crane (Span)"},
    {"target": "lifting_speed", "source": "technical.lifting_speed", "label": "Kecepatan Angkat"}
  ]'::jsonb
);

-- B. Versi V1 Bejana Tekan
SELECT seed_default_lhpp_template_version(
  'TPL-LHPP-PUBT-TANK',
  'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN BEJANA TEKAN & TANGKI TIMBUN',
  'Permenaker No. 37 Tahun 2016 tentang K3 Bejana Tekanan dan Tangki Timbun',
  '[
    {"key": "cover", "title": "Halaman Sampul Resmi", "type": "COVER", "enabled": true},
    {"key": "identity", "title": "I. DATA UMUM & KEPEMILIKAN BEJANA", "type": "IDENTITY_TABLE", "enabled": true},
    {"key": "technical", "title": "II. DATA TEKNIS & PARAMETER DESAIN", "type": "TECHNICAL_TABLE", "enabled": true},
    {"key": "checklist", "title": "III. LAPORAN PEMERIKSAAN VISUAL & NDT", "type": "CHECKLIST_TABLE", "enabled": true},
    {"key": "measurements", "title": "IV. PENGUKURAN KETEBALAN DINDING & UJI TEKAN", "type": "MEASUREMENT_TABLE", "enabled": true},
    {"key": "findings", "title": "V. TEMUAN DAN SYARAT-SYARAT K3", "type": "FINDINGS_TABLE", "enabled": true},
    {"key": "conclusion", "title": "VI. KESIMPULAN KELAYAKAN BEJANA TEKAN", "type": "CONCLUSION", "enabled": true},
    {"key": "photos", "title": "LAMPIRAN FOTO DOKUMENTASI RIKSA UJI", "type": "PHOTOS", "enabled": true},
    {"key": "skp", "title": "LAMPIRAN SKP & SERTIFIKAT KALIBRASI KAN", "type": "APPENDIX_SKP", "enabled": true}
  ]'::jsonb,
  '[
    {"target": "client_name", "source": "client.name", "label": "Perusahaan Pemilik"},
    {"target": "client_address", "source": "client.address", "label": "Alamat Pabrik"},
    {"target": "serial_number", "source": "object.serial_number", "label": "Nomor Seri"},
    {"target": "design_pressure", "source": "technical.design_pressure", "label": "Tekanan Desain (Bar/Psi)"},
    {"target": "mawp", "source": "technical.mawp", "label": "Tekanan Kerja Maksimum (MAWP)"},
    {"target": "volume_capacity", "source": "technical.volume_capacity", "label": "Volume Kapasitas (Liter/m3)"},
    {"target": "fluid_media", "source": "technical.fluid_media", "label": "Media / Fluida Isinya"}
  ]'::jsonb
);

-- C. Versi V1 Penyalur Petir
SELECT seed_default_lhpp_template_version(
  'TPL-LHPP-ILPP-PETIR',
  'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN INSTALASI PENYALUR PETIR',
  'Permenaker No. 31 Tahun 2015 tentang Perubahan atas Permenaker No. 02/1989 Pengawasan Instalasi Penyalur Petir',
  '[
    {"key": "cover", "title": "Halaman Sampul Resmi", "type": "COVER", "enabled": true},
    {"key": "identity", "title": "I. PEMERIKSAAN DOKUMEN & DATA UMUM", "type": "IDENTITY_TABLE", "enabled": true},
    {"key": "technical", "title": "II. ALAT UKUR & DATA TEKNIS INSTALASI", "type": "TECHNICAL_TABLE", "enabled": true},
    {"key": "checklist", "title": "III. HASIL INSPEKSI VISUAL KOMPONEN PETIR", "type": "CHECKLIST_TABLE", "enabled": true},
    {"key": "measurements", "title": "IV. PENGUKURAN TAHANAN PEMBUMIAN (GROUNDING)", "type": "MEASUREMENT_TABLE", "enabled": true},
    {"key": "findings", "title": "V. TEMUAN DAN SYARAT TEKNIS K3", "type": "FINDINGS_TABLE", "enabled": true},
    {"key": "conclusion", "title": "VI. KESIMPULAN KELAYAKAN INSTALASI PETIR", "type": "CONCLUSION", "enabled": true},
    {"key": "photos", "title": "LAMPIRAN FOTO DOKUMENTASI PENGUKURAN", "type": "PHOTOS", "enabled": true},
    {"key": "skp", "title": "LAMPIRAN SKP & SERTIFIKAT KALIBRASI EARTH TESTER", "type": "APPENDIX_SKP", "enabled": true}
  ]'::jsonb,
  '[
    {"target": "client_name", "source": "client.name", "label": "Nama Perusahaan / Gedung"},
    {"target": "install_location", "source": "object.install_location", "label": "Lokasi Air Terminal"},
    {"target": "air_terminal_type", "source": "technical.air_terminal_type", "label": "Jenis Air Terminal"},
    {"target": "pole_height", "source": "technical.pole_height", "label": "Tinggi Tiang Penyangga (m)"},
    {"target": "grounding_resistance", "source": "technical.grounding_resistance", "label": "Tahanan Pembumian (Ohm)"}
  ]'::jsonb
);

-- D. Versi V1 Motor Diesel
SELECT seed_default_lhpp_template_version(
  'TPL-LHPP-PTP-DIESEL',
  'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN PESAWAT TENAGA DAN PRODUKSI (MOTOR DIESEL)',
  'Permenaker No. 38 Tahun 2016 tentang K3 Pesawat Tenaga dan Produksi',
  '[
    {"key": "cover", "title": "Halaman Sampul Resmi", "type": "COVER", "enabled": true},
    {"key": "identity", "title": "I. DATA UMUM & IDENTITAS GENSET", "type": "IDENTITY_TABLE", "enabled": true},
    {"key": "technical", "title": "II. PEMERIKSAAN DOKUMEN & SPESIFIKASI DIESEL", "type": "TECHNICAL_TABLE", "enabled": true},
    {"key": "checklist", "title": "III. PEMERIKSAAN VISUAL & SISTEM KELISTRIKAN", "type": "CHECKLIST_TABLE", "enabled": true},
    {"key": "measurements", "title": "IV. PENGUJIAN NDT, GETARAN & SAFETY DEVICE", "type": "MEASUREMENT_TABLE", "enabled": true},
    {"key": "findings", "title": "V. TEMUAN DAN SYARAT-SYARAT K3", "type": "FINDINGS_TABLE", "enabled": true},
    {"key": "conclusion", "title": "VI. KESIMPULAN KELAYAKAN OPERASIONAL DIESEL", "type": "CONCLUSION", "enabled": true},
    {"key": "photos", "title": "LAMPIRAN DOKUMENTASI FOTO RIKSA UJI", "type": "PHOTOS", "enabled": true},
    {"key": "skp", "title": "LAMPIRAN SKP AHLI K3 & ALAT UKUR", "type": "APPENDIX_SKP", "enabled": true}
  ]'::jsonb,
  '[
    {"target": "client_name", "source": "client.name", "label": "Perusahaan Pemilik"},
    {"target": "serial_number", "source": "object.serial_number", "label": "Nomor Seri Mesin"},
    {"target": "rated_power", "source": "technical.rated_power", "label": "Daya Kapasitas (kVA/kW)"},
    {"target": "engine_rpm", "source": "technical.engine_rpm", "label": "Putaran Mesin (RPM)"},
    {"target": "cylinder_count", "source": "technical.cylinder_count", "label": "Jumlah Silinder"}
  ]'::jsonb
);

-- E. Versi V1 Fire Alarm
SELECT seed_default_lhpp_template_version(
  'TPL-LHPP-IPK-ALARM',
  'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN SISTEM ALARM KEBAKARAN OTOMATIK',
  'Kepmenaker No. Kep.186/MEN/1999 & Permenaker No. Per.02/MEN/1983',
  '[
    {"key": "cover", "title": "Halaman Sampul Resmi", "type": "COVER", "enabled": true},
    {"key": "identity", "title": "I. DASAR HUKUM & DATA UMUM GEDUNG", "type": "IDENTITY_TABLE", "enabled": true},
    {"key": "technical", "title": "II. DATA TEKNIS PANEL MCFA & DETEKTOR", "type": "TECHNICAL_TABLE", "enabled": true},
    {"key": "checklist", "title": "III. PENGUJIAN FUNGSI ALARM, DETEKTOR & BELL", "type": "CHECKLIST_TABLE", "enabled": true},
    {"key": "measurements", "title": "IV. PENGUKURAN TEGANGAN & RESPON BATERAI CADANGAN", "type": "MEASUREMENT_TABLE", "enabled": true},
    {"key": "findings", "title": "V. TEMUAN DAN SYARAT PROTEKSI KEBAKARAN", "type": "FINDINGS_TABLE", "enabled": true},
    {"key": "conclusion", "title": "VI. KESIMPULAN KELAYAKAN SISTEM ALARM", "type": "CONCLUSION", "enabled": true},
    {"key": "photos", "title": "LAMPIRAN FOTO DOKUMENTASI PENGUJIAN", "type": "PHOTOS", "enabled": true},
    {"key": "skp", "title": "LAMPIRAN SKP AHLI K3 SPESIALIS IPK", "type": "APPENDIX_SKP", "enabled": true}
  ]'::jsonb,
  '[
    {"target": "client_name", "source": "client.name", "label": "Nama Pemilik Gedung"},
    {"target": "building_name", "source": "object.object_name", "label": "Nama Gedung / Fasilitas"},
    {"target": "mcfa_brand", "source": "technical.mcfa_brand", "label": "Merk / Tipe Panel MCFA"},
    {"target": "zone_count", "source": "technical.zone_count", "label": "Jumlah Zona / Loop"}
  ]'::jsonb
);

-- Bersihkan fungsi helper
DROP FUNCTION seed_default_lhpp_template_version(text, text, text, jsonb, jsonb);

