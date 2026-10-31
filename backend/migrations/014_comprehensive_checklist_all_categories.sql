-- Migrasi 014: Penyesuaian Ceklist Teknisi dan Spesifikasi Teknis Seluruh Bidang K3
-- Mengacu pada Template LHPP Resmi PT Upaya Riksa Daya:
-- 1. PUBT: Permenaker No. 37/2016, ASME VIII Div. 1 (Air Pressure Tank / Bejana Tekan)
-- 2. IPP: Permenaker No. 02/MEN/1989 & No. 31/2015 (Instalasi Penyalur Petir)
-- 3. PTP: Permenaker No. 38/2016 (Mesin Produksi & Motor Diesel Genset)
-- 4. LIS: Permenaker No. 12/2015 & PUIL 2011 (Instalasi Listrik & Panel)
-- 5. IPK: Permenaker No. 02/MEN/1983 & No. 04/1980 (Fire Alarm & Proteksi Kebakaran)
-- 6. LE: Permenaker No. 06/2017 (Lift dan Eskalator)

-- 1. Perbarui attribute_schema pada seluruh kategori
UPDATE object_categories
SET attribute_schema = '[
  {"key": "item_no", "label": "No. Tag / Item No Klien", "unit": "kode", "placeholder": "Contoh: K3 BTU 001"},
  {"key": "jenis_bejana", "label": "Jenis Bejana / Tangki", "unit": "tipe", "placeholder": "Contoh: Air Pressure Tank / Bejana Tekan"},
  {"key": "bentuk_bejana", "label": "Bentuk / Posisi Bejana", "unit": "tipe", "placeholder": "Contoh: Silinder Tegak / Horizontal"},
  {"key": "tekanan_desain", "label": "Tekanan Desain (DP)", "unit": "kg/cm2", "placeholder": "Contoh: 11 kg/cm2"},
  {"key": "tekanan_kerja", "label": "Tekanan Kerja Maksimum (WP)", "unit": "kg/cm2", "placeholder": "Contoh: 10 kg/cm2"},
  {"key": "tekanan_uji", "label": "Tekanan Uji Hidrostatik (TP)", "unit": "kg/cm2", "placeholder": "Contoh: 14 kg/cm2"},
  {"key": "kapasitas_volume", "label": "Kapasitas / Volume Tangki", "unit": "liter", "placeholder": "Contoh: 3.000 Liter"},
  {"key": "dimensi_bejana", "label": "Dimensi (Panjang x Diameter)", "unit": "mm", "placeholder": "Contoh: 2260 mm x 550 mm"},
  {"key": "media_fluida", "label": "Media yang Digunakan", "unit": "fluida", "placeholder": "Contoh: Udara Tekan / Gas / Cairan"},
  {"key": "material_shell", "label": "Material Shell & Head", "unit": "spesifikasi", "placeholder": "Contoh: SA 516 Gr 70"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 37 Tahun 2016, ASME VIII Div.1"}
]'::jsonb
WHERE code = 'PUBT';

UPDATE object_categories
SET attribute_schema = '[
  {"key": "item_no", "label": "No. Tag / Item No Klien", "unit": "kode", "placeholder": "Contoh: K3 DC IPP 107"},
  {"key": "jenis_penangkal", "label": "Jenis Sistem Penyalur Petir", "unit": "tipe", "placeholder": "Contoh: Konvensional / Elektrostatis"},
  {"key": "tinggi_tiang", "label": "Tinggi Tiang Air Terminal", "unit": "meter", "placeholder": "Contoh: 6 meter"},
  {"key": "hantaran_penyalur", "label": "Luas Penampang Down Conductor", "unit": "mm2", "placeholder": "Contoh: BC 50 mm2"},
  {"key": "jenis_elektroda", "label": "Jenis Elektroda Bumi", "unit": "tipe", "placeholder": "Contoh: Batang / Rod Tembaga (Copper Rod)"},
  {"key": "kedalaman_elektroda", "label": "Kedalaman Elektroda Tanah", "unit": "meter", "placeholder": "Contoh: 12 meter"},
  {"key": "jumlah_bak_kontrol", "label": "Jumlah Kotak Hubung / Bak Kontrol", "unit": "unit", "placeholder": "Contoh: 1 buah"},
  {"key": "standar_tahanan", "label": "Batas Tahanan Sebaran Maksimum", "unit": "Ohm", "placeholder": "Maks. 5.00 Ohm"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 02/MEN/1989 & No. 31/2015"}
]'::jsonb
WHERE code = 'IPP';

UPDATE object_categories
SET attribute_schema = '[
  {"key": "item_no", "label": "No. Tag / Item No Klien", "unit": "kode", "placeholder": "Contoh: K3 PTP 08 / LINE 8"},
  {"key": "jenis_pesawat", "label": "Jenis Mesin / Peralatan", "unit": "tipe", "placeholder": "Contoh: Mesin Produksi / Motor Diesel Genset"},
  {"key": "pabrik_pembuat", "label": "Pabrik Pembuat / Pemasang", "unit": "pabrik", "placeholder": "Contoh: KHS AG / Cummins India"},
  {"key": "kapasitas_daya", "label": "Kapasitas / Daya Mesin", "unit": "kapasitas", "placeholder": "Contoh: 1.256 kVA / 15000 bottles/hour"},
  {"key": "tegangan_operasi", "label": "Tegangan & Frekuensi Kerja", "unit": "voltase", "placeholder": "Contoh: 380 V / 3 Phase / 50 Hz"},
  {"key": "kecepatan_putaran", "label": "Putaran Mesin (RPM)", "unit": "RPM", "placeholder": "Contoh: 1.500 RPM"},
  {"key": "peredam_getaran", "label": "Peredam Getaran Pondasi", "unit": "material", "placeholder": "Contoh: Karet Elastis / Pegas Baja"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 38 Tahun 2016"}
]'::jsonb
WHERE code = 'PTP';

UPDATE object_categories
SET attribute_schema = '[
  {"key": "sumber_listrik", "label": "Sumber Tenaga Listrik", "unit": "sumber", "placeholder": "Contoh: PLN / Genset Mandiri"},
  {"key": "daya_tersambung", "label": "Total Daya Tersambung", "unit": "kVA", "placeholder": "Contoh: 4.330 kVA"},
  {"key": "tegangan_sistem", "label": "Tegangan & Frekuensi Sistem", "unit": "voltase", "placeholder": "Contoh: 3 Phase, 50 Hz, 220/380 Volt"},
  {"key": "daya_tenaga", "label": "Beban Daya Tenaga (Power)", "unit": "kVA", "placeholder": "Contoh: 1.750 kVA"},
  {"key": "daya_penerangan", "label": "Beban Daya Penerangan", "unit": "kVA", "placeholder": "Contoh: 46 kVA"},
  {"key": "nama_panel_utama", "label": "Nama / Kode Panel Terperiksa", "unit": "kode", "placeholder": "Contoh: LVMSB-1 / MDB-BLD 1"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 12/2015 & PUIL 2011"}
]'::jsonb
WHERE code = 'LIS';

UPDATE object_categories
SET attribute_schema = '[
  {"key": "jenis_sistem_fire", "label": "Jenis Sistem Proteksi Kebakaran", "unit": "tipe", "placeholder": "Contoh: Instalasi Alarm Kebakaran Otomatik / Hydrant"},
  {"key": "merk_mcfa", "label": "Merk & Tipe Panel Kontrol (MCFA)", "unit": "merk", "placeholder": "Contoh: Edward 10 Series / Simplex"},
  {"key": "jumlah_zona", "label": "Jumlah Zona Proteksi", "unit": "zona", "placeholder": "Contoh: 4 Zona Lantai"},
  {"key": "jumlah_smoke_detector", "label": "Jumlah Detektor Asap (Smoke)", "unit": "titik", "placeholder": "Contoh: 73 titik"},
  {"key": "jumlah_heat_detector", "label": "Jumlah Detektor Panas (ROR/Fix)", "unit": "titik", "placeholder": "Contoh: 4 titik"},
  {"key": "jumlah_mcp", "label": "Jumlah Tombol Manual (MCP / Breakglass)", "unit": "titik", "placeholder": "Contoh: 5 titik"},
  {"key": "jumlah_alarm_bell", "label": "Jumlah Alarm Bell & Strobe Lamp", "unit": "titik", "placeholder": "Contoh: 5 titik"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 02/MEN/1983 & No. 04/MEN/1980"}
]'::jsonb
WHERE code = 'IPK';

UPDATE object_categories
SET attribute_schema = '[
  {"key": "jenis_pesawat", "label": "Jenis Lift / Elevator", "unit": "tipe", "placeholder": "Contoh: Lift Penumpang / Lift Barang / Service Lift"},
  {"key": "merk_model", "label": "Merk & Tipe Mesin Lift", "unit": "merk", "placeholder": "Contoh: Mitsubishi / Otis / Kone"},
  {"key": "kapasitas_angkut", "label": "Kapasitas Angkut Maksimum", "unit": "kg/orang", "placeholder": "Contoh: 1.000 kg / 15 Orang"},
  {"key": "kecepatan_nominal", "label": "Kecepatan Nominal Kereta", "unit": "m/s", "placeholder": "Contoh: 1.75 m/s"},
  {"key": "jumlah_lantai", "label": "Jumlah Lantai Pemberhentian", "unit": "opening", "placeholder": "Contoh: 10 Lantai / 10 Opening"},
  {"key": "sistem_traksi", "label": "Sistem Penggerak / Traksi", "unit": "tipe", "placeholder": "Contoh: Gearless Traction Machine"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 06 Tahun 2017"}
]'::jsonb
WHERE code = 'LE';

-- 2. Perbarui Checklist Teknisi Lapangan pada inspection_template_items untuk setiap kategori
DO $$
DECLARE
  v_admin_id uuid;
  v_cat record;
  v_tpl_id uuid;
  v_current_ver int;
  v_new_ver_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE role = 'ADMIN_SISTEM' LIMIT 1;

  FOR v_cat IN SELECT id, code, name FROM object_categories WHERE code != 'PAA' ORDER BY id ASC LOOP
    -- Cari template
    SELECT id INTO v_tpl_id FROM inspection_templates WHERE category_id = v_cat.id LIMIT 1;

    IF v_tpl_id IS NOT NULL THEN
      -- Ambil nomor versi terakhir
      SELECT COALESCE(MAX(version), 0) INTO v_current_ver
      FROM inspection_template_versions
      WHERE template_id = v_tpl_id;

      -- Arsipkan versi lama
      UPDATE inspection_template_versions
      SET status = 'ARSIP'
      WHERE template_id = v_tpl_id AND status = 'AKTIF';

      -- Buat versi baru aktif
      INSERT INTO inspection_template_versions
        (template_id, version, status, is_validated, published_at, created_by)
      VALUES
        (v_tpl_id, v_current_ver + 1, 'AKTIF', false, now(), v_admin_id)
      RETURNING id INTO v_new_ver_id;

      -- ==================== BIDANG PUBT ====================
      IF v_cat.code = 'PUBT' THEN
        INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required) VALUES
          (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Keterangan / Izin Pemakaian K3 sebelumnya dan dokumen legalitas unit', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Gambar konstruksi pabrik pembuat, sertifikat bahan plat (mill cert), dan manual operasi', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Lisensi Operator K3 Boiler/Bejana Tekan (SIO) dan catatan logbook pemeliharaan', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 4, 'Pemeriksaan Visual Shell & Head', 'Kondisi plat badan (shell) bejana: kelurusan, bebas deformasi tonjolan/dent, dan bebas retak', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 5, 'Pemeriksaan Visual Shell & Head', 'Kondisi tutup ujung (head/end plate): bentuk lengkungan elipsoidal, bebas lekukan tajam dan korosi', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 6, 'Pemeriksaan Visual Shell & Head', 'Kondisi nozzle/sambungan pipa masuk (inlet), pipa keluar (outlet), dan lubang orang (manhole)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 7, 'Pemeriksaan Visual Shell & Head', 'Kondisi struktur kaki penyangga (support), plat dasar (base plate), dan baut angkur', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 8, 'Alat Pengaman & Perlengkapan', 'Kondisi pedoman tekanan (pressure gauge): kalibrasi berlaku, penunjuk jelas, ada tanda batas aman merah', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 9, 'Alat Pengaman & Perlengkapan', 'Katup pengaman (safety valve / tingkap pengaman): fungsi pegas, tuas pembuang bebas macet', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 10, 'Alat Pengaman & Perlengkapan', 'Keran pembuang (drain valve) dan keran ventilasi: fungsi buka-tutup lancar, tidak ada rembesan', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 11, 'Alat Pengaman & Perlengkapan', 'Kondisi pelat nama (nameplate pabrik) dan rambu peringatan bahaya K3 terbaca jelas', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 12, 'Pemeriksaan NDT Sambungan Las', 'Pengujian NDT Magnetic Particle (MPI) / Penetrant pada sambungan las T-Joint dan Butt-Joint', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 13, 'Pengukuran Tebal Dinding (UT Thickness)', 'Hasil pengukuran ketebalan plat shell/badan tertipis', 'NUMBER', 'mm', 0, NULL, true),
          (v_new_ver_id, 14, 'Pengukuran Tebal Dinding (UT Thickness)', 'Hasil pengukuran ketebalan plat head atas / depan tertipis', 'NUMBER', 'mm', 0, NULL, true),
          (v_new_ver_id, 15, 'Pengukuran Tebal Dinding (UT Thickness)', 'Hasil pengukuran ketebalan plat head bawah / belakang tertipis', 'NUMBER', 'mm', 0, NULL, true),
          (v_new_ver_id, 16, 'Pengujian Tekanan & Safety Valve', 'Catatan hasil pengujian pemadatan hidrostatik (Hydrostatic Test) dan penahanan tekanan', 'TEXT', NULL, NULL, NULL, true),
          (v_new_ver_id, 17, 'Pengujian Tekanan & Safety Valve', 'Nilai tekanan uji hidrostatik (TP) yang diterapkan', 'NUMBER', 'kg/cm2', 0, NULL, true),
          (v_new_ver_id, 18, 'Pengujian Tekanan & Safety Valve', 'Tekanan buang saat katup pengaman membuka (pop-up pressure setting)', 'NUMBER', 'kg/cm2', 0, NULL, true);

      -- ==================== BIDANG IPP ====================
      ELSIF v_cat.code = 'IPP' THEN
        INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required) VALUES
          (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Pengesahan / Izin Pemakaian Instalasi Penyalur Petir terdahulu dan dokumen legalitas', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Gambar diagram pengkabelan instalasi petir (SLD), gambar situasi tapak, dan gambar rencana', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Buku logbook pemeliharaan dan riwayat pengukuran tahanan pembumian sebelumnya', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 4, 'Pemeriksaan Air Terminal (Kepala Penangkal)', 'Kondisi fisik jarum/kepala air terminal: bebas korosi/karat, keruncingan ujung, dan posisi tegak', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 5, 'Pemeriksaan Air Terminal (Kepala Penangkal)', 'Kekuatan tiang penyangga air terminal, klem pengikat, dan kawat penegang tiang (guy wire)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 6, 'Pemeriksaan Hantaran Turun (Down Conductor)', 'Kondisi kabel penghantar penyalur petir daerah atap: klem pengikat kuat, tidak kendur/putus', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 7, 'Pemeriksaan Hantaran Turun (Down Conductor)', 'Hantaran turun ke tanah: jalur lurus, bebas lekukan tajam, dan terlindung pipa isolasi mekanik', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 8, 'Bak Kontrol & Sambungan Ukur', 'Kondisi kotak hubung / bak kontrol (test box): kering, bersih, dan bebas genangan air/sampah', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 9, 'Bak Kontrol & Sambungan Ukur', 'Sambungan ukur (test joint): klem baut tembaga kuat, bersih tanpa karat, dan mudah dilepas saat uji', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 10, 'Pemeriksaan Elektroda Pembumian (Ground Rod)', 'Kondisi batang elektroda bumi (copper rod): tertanam tegak lurus ke dalam tanah sesuai standar', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 11, 'Pengujian Tahanan Pembumian (Grounding Test)', 'Metode pengujian pengukuran (metode garis lurus 3 titik E-P-C dengan Earth Tester)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 12, 'Pengujian Tahanan Pembumian (Grounding Test)', 'Nilai tahanan sebaran pembumian aktual (Standar Permenaker R < 5.00 Ohm)', 'NUMBER', 'Ohm', 0, 100, true),
          (v_new_ver_id, 13, 'Pengujian Tahanan Pembumian (Grounding Test)', 'Catatan pengamatan kondisi tanah dan lingkungan sekitar elektroda pembumian', 'TEXT', NULL, NULL, NULL, true);

      -- ==================== BIDANG PTP ====================
      ELSIF v_cat.code = 'PTP' THEN
        INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required) VALUES
          (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Keterangan / Izin Pemakaian K3 sebelumnya dan dokumen legalitas unit', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Buku petunjuk operasi (manual book), SOP operasional mesin, dan diagram pengawatan listrik', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Lisensi Operator K3 Penggerak Mula / Pesawat Tenaga dan Produksi (SIO) dan logbook perawatan', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 4, 'Konstruksi & Rangka Mesin', 'Kondisi pondasi dasar mesin: tidak ada retakan, peredam getaran (karet/pegas) berfungsi baik', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 5, 'Konstruksi & Rangka Mesin', 'Kekencangan baut angkur (anchor bolts) dan dudukan rangka mesin (base plate)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 6, 'Konstruksi & Rangka Mesin', 'Kondisi struktur rangka utama, tiang penopang, dan bebas dari korosi struktural', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 7, 'Mekanisme Transmisi & Bagian Berputar', 'Pelindung bagian berputar (safety guarding) pada puli, sabuk v-belt, roda gigi, dan rantai', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 8, 'Mekanisme Transmisi & Bagian Berputar', 'Kondisi rumah transmisi, bantalan poros (bearing), pelumasan oli/gemuk, dan kekedapan seal', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 9, 'Sistem Penunjang (Bahan Bakar/Pendingin/Udara)', 'Kondisi sistem bahan bakar / pemipaan / hidrolik / pneumatik: tidak ada kebocoran fluida', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 10, 'Sistem Penunjang (Bahan Bakar/Pendingin/Udara)', 'Sistem pendingin (radiator / water cooling) dan peredam gas buang (muffler/silencer)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 11, 'Panel Elektrikal & Safety Devices', 'Tombol darurat (emergency stop button): pemutusan arus daya seketika saat ditekan', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 12, 'Panel Elektrikal & Safety Devices', 'Saklar pembatas (limit switch), sensor interlock pintu pelindung, dan lampu indikator operasi', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 13, 'Panel Elektrikal & Safety Devices', 'Kondisi kabel penghantar, pentanahan (grounding bodi), dan rambu peringatan bahaya K3', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 14, 'Pengujian Operasional & Beban', 'Uji fungsi operasional tombol start/stop, kelancaran putaran mesin tanpa suara abnormal', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 15, 'Pengujian Operasional & Beban', 'Catatan hasil pengamatan uji fungsi beban kerja dan kestabilan sistem', 'TEXT', NULL, NULL, NULL, true),
          (v_new_ver_id, 16, 'Pengukuran Lingkungan & Parameter Kerja', 'Pengukuran tingkat kebisingan di area tempat kerja operator (Standar NAB 85 dB)', 'NUMBER', 'dB', 0, 150, true),
          (v_new_ver_id, 17, 'Pengukuran Lingkungan & Parameter Kerja', 'Pengukuran intensitas penerangan di area kerja mesin (Standar min 100-200 Lux)', 'NUMBER', 'Lux', 0, 2000, true),
          (v_new_ver_id, 18, 'Pengukuran Lingkungan & Parameter Kerja', 'Pengukuran nilai tahanan pembumian bodi mesin (Grounding bodi)', 'NUMBER', 'Ohm', 0, 50, true);

      -- ==================== BIDANG LIS ====================
      ELSIF v_cat.code = 'LIS' THEN
        INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required) VALUES
          (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Keterangan / Izin Pemakaian Instalasi Listrik sebelumnya dan dokumen legalitas', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Single Line Diagram (SLD) lengkap dengan besaran nominal pemutus dan layout distribusi', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Diagram pengawatan (wiring diagram), daftar komponen panel, dan logbook pemeliharaan', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 4, 'Konstruksi Fisik Panel & Switchgear', 'Konstruksi bodi panel (LVMSB/MDB/DB): kokoh, dudukan rapi, bebas korosi dan debu kotoran', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 5, 'Konstruksi Fisik Panel & Switchgear', 'Pintu panel dilengkapi penahan posisi terbuka, kunci panel berfungsi baik, dan penutup cover', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 6, 'Konstruksi Fisik Panel & Switchgear', 'Perlindungan terhadap sentuh langsung dan sentuh tidak langsung (IP rating penutup memadai)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 7, 'Sistem Busbar & Pengkabelan', 'Kondisi busbar (Phasa R, S, T, N): terisolasi kuat, penandaan warna standar PUIL, baut koneksi kencang', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 8, 'Sistem Busbar & Pengkabelan', 'Pemasangan kabel feeder dan incoming: susunan kabel rapi, pengikat kabel utuh, dan sepatu kabel (skun)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 9, 'Sistem Busbar & Pengkabelan', 'Terminal kabel dilengkapi pelindung, kode nomor kabel, dan nama indikasi beban terbaca jelas', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 10, 'Sistem Pembumian (Grounding & Bonding)', 'Kabel bonding fleksibel terpasang antara pintu panel dan bodi rangka panel', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 11, 'Sistem Pembumian (Grounding & Bonding)', 'Busbar pembumian (grounding bar): tersambung kuat ke elektroda pembumian tanah', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 12, 'Proteksi & Keselamatan Ruang Panel', 'Fungsi pemutus tenaga utama (ACB/MCCB/MCB) dan tombol trip manual/otomatis', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 13, 'Proteksi & Keselamatan Ruang Panel', 'Kelengkapan tanda peringatan bahaya listrik tegangan tinggi dan ketersediaan APAR khusus listrik', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 14, 'Pengujian & Pengukuran Listrik', 'Pengujian thermovisi / thermal infrared pada sambungan busbar dan terminal pemutus', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 15, 'Pengujian & Pengukuran Listrik', 'Suhu temperatur tertinggi terukur pada busbar/koneksi saat berbeban (Batas maks 70°C)', 'NUMBER', '°C', 0, 150, true),
          (v_new_ver_id, 16, 'Pengujian & Pengukuran Listrik', 'Pengukuran nilai tahanan pembumian panel listrik (Standar PUIL R < 5.00 Ohm)', 'NUMBER', 'Ohm', 0, 50, true),
          (v_new_ver_id, 17, 'Pengujian & Pengukuran Listrik', 'Catatan hasil pengujian keseimbangan beban phasa dan kondisi operasi panel', 'TEXT', NULL, NULL, NULL, true);

      -- ==================== BIDANG IPK ====================
      ELSIF v_cat.code = 'IPK' THEN
        INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required) VALUES
          (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Pengesahan / Izin Pemakaian Instalasi Proteksi Kebakaran sebelumnya dan dokumen legalitas', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Gambar layout penempatan detektor, manual call point, alarm bell, dan jalur pemipaan/kabel', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Dokumen spesifikasi teknis peralatan alarm/hydrant dan buku catatan pemeliharaan berkala', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 4, 'Pemeriksaan Panel Kontrol Utama (MCFA)', 'Kondisi fisik panel Master Control Fire Alarm (MCFA): bersih, terawat, dan indikator fungsi standby', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 5, 'Pemeriksaan Panel Kontrol Utama (MCFA)', 'Kondisi baterai darurat (battery backup) dan modul pengisian otomatis (automatic charger)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 6, 'Pemeriksaan Inisiasi & Detektor', 'Kondisi fisik dan kebersihan detektor asap (smoke detector) di seluruh zona terpasang', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 7, 'Pemeriksaan Inisiasi & Detektor', 'Kondisi fisik detektor panas (heat detector / ROR) pada ruang genset/trafo/dapur', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 8, 'Pemeriksaan Inisiasi & Detektor', 'Kondisi tombol manual (Manual Call Point / Breakglass): mudah dijangkau, penutup utuh, tidak terhalang', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 9, 'Pemeriksaan Notifikasi & Output', 'Kondisi lonceng alarm (alarm bell) dan lampu tanda bahaya (strobe / visual indicator)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 10, 'Pengujian Fungsi Sistem Alarm', 'Uji fungsi aktivasi detektor asap sampel menggunakan smoke tester canister (kecepatan respon)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 11, 'Pengujian Fungsi Sistem Alarm', 'Waktu respon aktif panel MCFA setelah detektor diaktifkan (Standar respon < 10 detik)', 'NUMBER', 'detik', 0, 60, true),
          (v_new_ver_id, 12, 'Pengujian Fungsi Sistem Alarm', 'Kesesuaian penunjukan alamat zona pada layar panel MCFA dengan lokasi fisik detektor yang diuji', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 13, 'Pengujian Fungsi Sistem Alarm', 'Uji fungsi tombol manual call point dan bunyi audible alarm bell terdengar jelas di area kerja', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 14, 'Pengujian Catu Daya & Interkoneksi', 'Uji peralihan otomatis ke sumber baterai cadangan saat sumber daya utama PLN diputus', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 15, 'Pengujian Catu Daya & Interkoneksi', 'Catatan evaluasi hasil uji fungsi alarm, jumlah titik sampel diuji, dan kesiapan proteksi', 'TEXT', NULL, NULL, NULL, true);

      -- ==================== BIDANG LE ====================
      ELSIF v_cat.code = 'LE' THEN
        INSERT INTO inspection_template_items (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required) VALUES
          (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Izin Pemakaian Lift / Suket K3 sebelumnya dan dokumen legalitas unit', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Gambar instalasi tata letak ruang mesin, sangkar, hoistway, dan sertifikat tali baja / sabuk', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Lisensi K3 Teknisi Lift / Operator Lift dan logbook riwayat perawatan berkala', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 4, 'Pemeriksaan Ruang Mesin (Machine Room)', 'Kondisi fisik mesin traksi (motor penggerak, gearbox/gearless, dan kebocoran pelumas)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 5, 'Pemeriksaan Ruang Mesin (Machine Room)', 'Sistem pengereman mekanik/elektromagnetik: celah kanvas rem, keausan lining, dan fungsi penahanan', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 6, 'Pemeriksaan Ruang Mesin (Machine Room)', 'Kondisi governor pembatas kecepatan lebih (overspeed governor) dan switch pengamannya', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 7, 'Tali Kawat Baja / Sabuk Penarik', 'Kondisi tali baja penarik (hoisting wire rope): keausan diameter, bebas kawat putus dan korosi', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 8, 'Pemeriksaan Kereta / Sangkar', 'Struktur rangka sangkar, plat dinding, langit-langit, dan pintu darurat atas sangkar (trap door)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 9, 'Pemeriksaan Kereta / Sangkar', 'Pintu sangkar dan sensor pengaman pintu (safety edge / photoelectric door sensor)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 10, 'Pemeriksaan Kereta / Sangkar', 'Intercom komunikasi darurat 2 arah, bel alarm, dan lampu penerangan darurat di dalam sangkar', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 11, 'Pemeriksaan Ruang Luncur (Hoistway) & Pit', 'Kondisi rel pemandu (guide rail) sangkar dan bobot imbang (counterweight) serta pelumasannya', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 12, 'Pemeriksaan Ruang Luncur (Hoistway) & Pit', 'Kunci kait pengunci pintu lantai (interlock pintu lantai): sangkar tidak dapat bergerak saat pintu terbuka', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 13, 'Pemeriksaan Ruang Luncur (Hoistway) & Pit', 'Saklar pembatas gerak akhir (final limit switch) terminal atas dan terminal bawah', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 14, 'Pemeriksaan Ruang Luncur (Hoistway) & Pit', 'Kondisi peredam tumbukan (buffer) sangkar dan counterweight di dalam pit (bebas banjir/kotoran)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 15, 'Pengujian Operasi & Perangkat Pengaman', 'Uji fungsi operasional naik/turun tanpa beban dan dengan beban kerja penuh', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 16, 'Pengujian Operasi & Perangkat Pengaman', 'Uji fungsi pengaman pesawat penahan jatuh (safety gear test saat overspeed)', 'CHOICE', NULL, NULL, NULL, true),
          (v_new_ver_id, 17, 'Pengujian Operasi & Perangkat Pengaman', 'Nilai pengukuran kecepatan laju kereta aktual', 'NUMBER', 'm/s', 0, 10, true),
          (v_new_ver_id, 18, 'Pengujian Operasi & Perangkat Pengaman', 'Catatan hasil pengujian leveling lantai, kenyamanan jalan kereta, dan fungsi darurat', 'TEXT', NULL, NULL, NULL, true);
      END IF;

      -- Update inspeksi yang berstatus 'DRAF' pada kategori terkait agar menggunakan versi baru
      UPDATE inspections i
      SET template_version_id = v_new_ver_id
      FROM test_objects o
      WHERE i.object_id = o.id
        AND o.category_id = v_cat.id
        AND i.status = 'DRAF';

    END IF;
  END LOOP;
END $$;

