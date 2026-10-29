-- 006_po_bap_unit_workflow.sql
-- Integrasi penuh PO Multi-Unit, Status per Unit, Berita Acara Riksa Uji (BAP),
-- Template LHPP Spesifik Kategori Objek K3, Riwayat Pengujian, dan Pengingat Masa Berlaku.

-- 0. Perluas jenis pemilik lampiran berkas (file_attachments) untuk mendukung BAP_SIGNATURE, BAP_PDF, dan PO_ATTACHMENT
ALTER TABLE file_attachments DROP CONSTRAINT IF EXISTS file_attachments_owner_type_check;
ALTER TABLE file_attachments ADD CONSTRAINT file_attachments_owner_type_check
  CHECK (owner_type IN (
    'OBJECT',
    'INSPECTION_FINDING',
    'INSPECTION_SIGNATURE',
    'BAP_SIGNATURE',
    'BAP_PDF',
    'LHPP_PDF',
    'SUKET',
    'PO_ATTACHMENT'
  ));

-- 1. Perluas object_categories dengan ruang lingkup BAP default & skema teknis LHPP per jenis objek
ALTER TABLE object_categories
  ADD COLUMN IF NOT EXISTS default_bap_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS lhpp_schema jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE object_categories
SET attribute_schema = '[{"key":"swl","label":"SWL / Kapasitas Angkat","unit":"ton"},{"key":"lifting_height","label":"Tinggi Angkat","unit":"m"},{"key":"span","label":"Bentang / Span","unit":"m"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pengukuran Dimensi","Uji Fungsi","Uji Beban","Pengujian Safety Device","NDT PT/MPI"]'::jsonb,
    lhpp_schema = '[{"key":"konstruksi_utama","label":"Kondisi Konstruksi & Struktur Utama"},{"key":"sistem_penggerak","label":"Sistem Mekanisme Angkat, Wire Rope / Rantai & Kait"},{"key":"uji_beban_dinamis","label":"Hasil Uji Beban Dinamis & Statis (Defleksi)"},{"key":"safety_device_paa","label":"Fungsi Limit Switch, Rem & Overload Limiter"}]'::jsonb
WHERE code = 'PAA';

UPDATE object_categories
SET attribute_schema = '[{"key":"power_kw","label":"Daya Penggerak / Kapasitas","unit":"kW"},{"key":"rpm","label":"Putaran Mesin","unit":"RPM"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pemeriksaan Area/Lokasi","Uji Fungsi","Pengukuran Kebisingan","Pengukuran Getaran","Pengukuran Pencahayaan","Pengujian Safety Device"]'::jsonb,
    lhpp_schema = '[{"key":"kondisi_mesin","label":"Kondisi Fisik Mesin, Pondasi & Transmisi Sabuk/Roda Gigi"},{"key":"pengukuran_lingkungan","label":"Hasil Pengukuran Kebisingan, Getaran & Pencahayaan Area"},{"key":"sistem_proteksi","label":"Pelindung Bagian Berputar, Emergency Stop & Safety Device"}]'::jsonb
WHERE code = 'PTP';

UPDATE object_categories
SET attribute_schema = '[{"key":"working_pressure","label":"Tekanan Kerja Maksimum","unit":"bar"},{"key":"design_pressure","label":"Tekanan Desain","unit":"bar"},{"key":"volume_liter","label":"Volume / Kapasitas","unit":"liter"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pengukuran Dimensi","Pengujian Wall Thickness","NDT PT/MPI","Uji Fungsi","Pengujian Safety Device"]'::jsonb,
    lhpp_schema = '[{"key":"ketebalan_dinding","label":"Hasil Pengukuran Ketebalan Dinding (Ultrasonic Wall Thickness)"},{"key":"pengujian_ndt","label":"Hasil Pemeriksaan NDT Sambungan Las & Shell"},{"key":"safety_valve_pubt","label":"Pengujian Katup Pengaman (Safety Valve), Pressure Gauge & Hydrotest"}]'::jsonb
WHERE code = 'PUBT';

UPDATE object_categories
SET attribute_schema = '[{"key":"installed_power","label":"Daya Terpasang","unit":"kVA"},{"key":"voltage","label":"Tegangan Sistem","unit":"Volt"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pemeriksaan Area/Lokasi","Pengukuran Grounding","Pengukuran Thermal","Uji Fungsi","Pengujian Safety Device"]'::jsonb,
    lhpp_schema = '[{"key":"panel_dan_proteksi","label":"Kondisi Panel LVMDP/SDP, Busbar & Sistem Proteksi Arus Lebih"},{"key":"tahanan_isolasi_grounding","label":"Hasil Pengukuran Tahanan Isolasi & Tahanan Pembumian (Grounding)"},{"key":"termografi_listrik","label":"Hasil Pemeriksaan Suhu Sambungan (Thermal Imaging)"}]'::jsonb
WHERE code = 'LIS';

UPDATE object_categories
SET attribute_schema = '[{"key":"air_terminal_type","label":"Jenis Penerima Petir (Air Terminal)","unit":"tipe"},{"key":"building_height","label":"Tinggi Bangunan / Struktur","unit":"m"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pemeriksaan Air Terminal","Pemeriksaan Down Conductor","Pengukuran Grounding"]'::jsonb,
    lhpp_schema = '[{"key":"air_terminal_detail","label":"Kondisi Air Terminal & Tiang Penyangga Atap"},{"key":"down_conductor_detail","label":"Kontinuitas Hantaran Turun (Down Conductor) & Sambungan Ukur"},{"key":"grounding_petir","label":"Hasil Pengukuran Tahanan Pembumian Elektrode Penyalur Petir (Ohm)"}]'::jsonb
WHERE code = 'IPP';

UPDATE object_categories
SET attribute_schema = '[{"key":"capacity_kg","label":"Kapasitas Angkut","unit":"kg"},{"key":"floors_served","label":"Jumlah Lantai Dilayani","unit":"lantai"},{"key":"speed_mps","label":"Kecepatan Nominal","unit":"m/s"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pemeriksaan Ruang Mesin","Pemeriksaan Ruang Luncur","Pemeriksaan Atas Sangkar","Pemeriksaan Pit","Pemeriksaan ARD","Uji Fungsi","Pengujian Safety Device"]'::jsonb,
    lhpp_schema = '[{"key":"ruang_mesin_dan_luncur","label":"Pemeriksaan Ruang Mesin, Mesin Tarik, Tali Baja & Ruang Luncur"},{"key":"sangkar_dan_pintu","label":"Kondisi Atas Sangkar, Interlock Pintu Lantai & Kabin"},{"key":"pit_ard_governor","label":"Pemeriksaan Pit, Buffer, Speed Governor & Pengujian Fungsi ARD"}]'::jsonb
WHERE code = 'LE';

UPDATE object_categories
SET attribute_schema = '[{"key":"hydrant_pump_gpm","label":"Kapasitas Pompa Hydrant","unit":"GPM"},{"key":"zone_count","label":"Jumlah Zona Alarm / Proteksi","unit":"zona"}]'::jsonb,
    default_bap_scopes = '["Pemeriksaan Data & Gambar","Pemeriksaan Visual","Pemeriksaan Panel MCFA","Pengujian Alarm Kebakaran","Pengujian Sprinkler","Pengujian Hydrant","Pemeriksaan Pillar & Nozzle","Pengujian APAR","Uji Fungsi"]'::jsonb,
    lhpp_schema = '[{"key":"sistem_deteksi_mcfa","label":"Pemeriksaan Panel MCFA, Detektor Asap/Panas & Alarm Kebakaran"},{"key":"sistem_hydrant_sprinkler","label":"Pengujian Tekanan & Aliran Pompa Hydrant, Pillar, Nozzle & Sprinkler"},{"key":"apar_dan_evakuasi","label":"Pemeriksaan Sebaran APAR & Sarana Proteksi Aktif"}]'::jsonb
WHERE code = 'IPK';

-- 2. Perluas test_objects untuk menyimpan pabrik pembuat, satuan kapasitas, dan tanggal pemeriksaan berikutnya yang sah
ALTER TABLE test_objects
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS capacity_unit text,
  ADD COLUMN IF NOT EXISTS next_inspection_date date,
  ADD COLUMN IF NOT EXISTS validity_notes text;

-- 3. Perluas orders untuk mendukung atribut Purchase Order (PO) pelanggan secara eksplisit
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS po_number text,
  ADD COLUMN IF NOT EXISTS po_date date,
  ADD COLUMN IF NOT EXISTS po_attachment_id uuid REFERENCES file_attachments(id),
  ADD COLUMN IF NOT EXISTS po_revision_no integer NOT NULL DEFAULT 1;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE orders ADD CONSTRAINT orders_source_check
  CHECK (source IN ('TELEPON', 'EMAIL', 'WHATSAPP', 'LANGSUNG', 'DOKUMEN_PO', 'LAINNYA'));

CREATE UNIQUE INDEX IF NOT EXISTS orders_po_number_uq
  ON orders (lower(btrim(po_number)))
  WHERE po_number IS NOT NULL AND btrim(po_number) <> '';

-- 4. Perluas order_objects (po_items / inspection_units) agar setiap unit dalam PO memiliki progres, ruang lingkup, dan status mandiri
ALTER TABLE order_objects
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN IF NOT EXISTS unit_status text NOT NULL DEFAULT 'BELUM_DIJADWALKAN'
    CHECK (unit_status IN (
      'BELUM_DIJADWALKAN',
      'TERJADWAL',
      'DITUGASKAN',
      'SEDANG_DIPERIKSA',
      'FORM_TERKIRIM',
      'BAP_DRAF',
      'BAP_FINAL',
      'LHPP_DRAF',
      'MENUNGGU_REVIEW',
      'PERLU_REVISI',
      'DISETUJUI',
      'LHPP_TERBIT',
      'SELESAI',
      'DIBATALKAN'
    )),
  ADD COLUMN IF NOT EXISTS scope_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS proposed_date date,
  ADD COLUMN IF NOT EXISTS unit_notes text,
  ADD COLUMN IF NOT EXISTS cancel_reason text,
  ADD COLUMN IF NOT EXISTS inspector_id uuid REFERENCES inspectors(user_id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS order_objects_id_uq ON order_objects(id);

-- 5. Tabel Berita Acara Riksa Uji (BAP) & Riwayat Revisi BAP
CREATE SEQUENCE IF NOT EXISTS bap_no_seq;

CREATE TABLE IF NOT EXISTS bap_documents (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id               uuid NOT NULL UNIQUE REFERENCES inspections(id) ON DELETE CASCADE,
  order_id                    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  object_id                   uuid NOT NULL REFERENCES test_objects(id),
  bap_no                      text NOT NULL UNIQUE,
  version                     integer NOT NULL DEFAULT 1,
  status                      text NOT NULL DEFAULT 'DRAF'
    CHECK (status IN ('DRAF', 'MENUNGGU_TANDA_TANGAN', 'FINAL', 'REVISI')),
  inspection_date             date NOT NULL DEFAULT CURRENT_DATE,
  scope_items                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  conclusion                  text CHECK (conclusion IN ('MEMENUHI_SYARAT', 'MEMENUHI_SYARAT_DENGAN_CATATAN', 'TIDAK_MEMENUHI_SYARAT')),
  notes                       text,
  inspector_signer_name       text,
  inspector_signer_title      text,
  inspector_signature_file_id uuid REFERENCES file_attachments(id),
  inspector_signed_at         timestamptz,
  client_signer_name          text,
  client_signer_title         text,
  client_signature_file_id    uuid REFERENCES file_attachments(id),
  client_signed_at            timestamptz,
  pdf_file_id                 uuid REFERENCES file_attachments(id),
  finalized_by                uuid REFERENCES users(id),
  finalized_at                timestamptz,
  created_by                  uuid REFERENCES users(id),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bap_documents_order_idx ON bap_documents(order_id);
CREATE INDEX IF NOT EXISTS bap_documents_object_idx ON bap_documents(object_id);
CREATE INDEX IF NOT EXISTS bap_documents_status_idx ON bap_documents(status);

CREATE TABLE IF NOT EXISTS bap_revisions (
  id          bigserial PRIMARY KEY,
  bap_id      uuid NOT NULL REFERENCES bap_documents(id) ON DELETE CASCADE,
  version     integer NOT NULL,
  action      text NOT NULL,
  reason      text NOT NULL,
  snapshot    jsonb NOT NULL,
  actor_id    uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bap_revisions_bap_idx ON bap_revisions(bap_id);

-- 6. Hubungkan lhpp_documents dengan bap_documents, data teknis per jenis objek, dan tanggal masa berlaku rekomendasi
ALTER TABLE lhpp_documents
  ADD COLUMN IF NOT EXISTS bap_id uuid REFERENCES bap_documents(id),
  ADD COLUMN IF NOT EXISTS technical_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS recommended_valid_until date;

-- 7. Izinkan tindak lanjut pengingat perpanjangan merujuk langsung ke unit (test_objects) apabila Suket belum diterbitkan
ALTER TABLE renewal_followups
  ALTER COLUMN suket_id DROP NOT NULL,
  ALTER COLUMN status TYPE text USING status::text,
  ALTER COLUMN note SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS object_id uuid REFERENCES test_objects(id) ON DELETE CASCADE;
