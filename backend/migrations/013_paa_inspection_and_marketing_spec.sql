-- Migrasi 013: Penyesuaian Ceklist Teknisi dan Form Marketing Bidang PAA
-- Mengacu pada standar LHPP PT Upaya Riksa Daya (Permenaker No. 8 Tahun 2020)

-- 1. Perbarui attribute_schema pada kategori PAA untuk kebutuhan Marketing & Identitas Alat
UPDATE object_categories
SET attribute_schema = '[
  {"key": "item_no", "label": "No. Tag / Item No Klien", "unit": "kode", "placeholder": "Contoh: K3 CRN TRVL 601"},
  {"key": "jenis_pesawat", "label": "Jenis Pesawat Angkat / Angkut", "unit": "tipe", "placeholder": "Contoh: Manual Gantry Crane / Overhead Crane"},
  {"key": "pabrik_pembuat_hoist", "label": "Pabrik Pembuat Hoist / Unit", "unit": "pabrik", "placeholder": "Contoh: TXK Corp."},
  {"key": "swl", "label": "Kapasitas Angkat Aman (SWL)", "unit": "kg/ton", "placeholder": "Contoh: 1.500 kg / 1.5 Ton"},
  {"key": "span", "label": "Panjang Bentang (Span)", "unit": "mm", "placeholder": "Contoh: 4.000 mm"},
  {"key": "lifting_height", "label": "Tinggi Angkat", "unit": "mm", "placeholder": "Contoh: 3.800 mm"},
  {"key": "runway_length", "label": "Panjang Lintasan (Runway)", "unit": "m", "placeholder": "Contoh: 10 m"},
  {"key": "hoist_speed", "label": "Kecepatan Hoisting", "unit": "m/min", "placeholder": "Contoh: Manual / 8 m/menit"},
  {"key": "travel_speed", "label": "Kecepatan Traversing / Travelling", "unit": "m/min", "placeholder": "Contoh: Manual / 20 m/menit"},
  {"key": "drive_type", "label": "Tipe Penggerak", "unit": "tipe", "placeholder": "Contoh: Manual Hand Chain / Motor Listrik"},
  {"key": "brake_type", "label": "Sistem Rem", "unit": "tipe", "placeholder": "Contoh: Mechanical Brake / Elektromagnetik"},
  {"key": "hook_type", "label": "Tipe & Kapasitas Kait (Hook)", "unit": "tipe", "placeholder": "Contoh: Single Swivel Hook 1.5 Ton"},
  {"key": "lifting_media", "label": "Media Angkat", "unit": "tipe", "placeholder": "Contoh: Rantai Beban Dia 8 mm / Wire Rope"},
  {"key": "standard_ref", "label": "Standar Rujukan K3", "unit": "regulasi", "placeholder": "Permenaker No. 8 Tahun 2020"}
]'::jsonb
WHERE code = 'PAA';

-- 2. Perbarui Checklist Teknisi Lapangan PAA pada inspection_template_items via versioning
DO $$
DECLARE
  v_paa_cat_id smallint;
  v_tpl_id uuid;
  v_admin_id uuid;
  v_current_ver int;
  v_new_ver_id uuid;
BEGIN
  SELECT id INTO v_paa_cat_id FROM object_categories WHERE code = 'PAA';
  SELECT id INTO v_admin_id FROM users WHERE role = 'ADMIN_SISTEM' LIMIT 1;

  IF v_paa_cat_id IS NOT NULL THEN
    -- Cari template untuk PAA
    SELECT id INTO v_tpl_id FROM inspection_templates WHERE category_id = v_paa_cat_id LIMIT 1;

    IF v_tpl_id IS NOT NULL THEN
      -- Dapatkan nomor versi terakhir
      SELECT COALESCE(MAX(version), 0) INTO v_current_ver
      FROM inspection_template_versions
      WHERE template_id = v_tpl_id;

      -- Arsipkan versi aktif sebelumnya
      UPDATE inspection_template_versions
      SET status = 'ARSIP'
      WHERE template_id = v_tpl_id AND status = 'AKTIF';

      -- Buat versi baru aktif
      INSERT INTO inspection_template_versions
        (template_id, version, status, is_validated, published_at, created_by)
      VALUES
        (v_tpl_id, v_current_ver + 1, 'AKTIF', false, now(), v_admin_id)
      RETURNING id INTO v_new_ver_id;

      -- Sisipkan butir checklist teknisi riksa uji PAA komprehensif (23 Butir Uji)
      INSERT INTO inspection_template_items
        (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required)
      VALUES
        -- Seksi 1: Pemeriksaan Dokumen Teknis (Permenaker No. 8/2020)
        (v_new_ver_id, 1, 'Pemeriksaan Dokumen', 'Surat Keterangan / Izin Pemakaian K3 sebelumnya dan dokumen legalitas unit', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 2, 'Pemeriksaan Dokumen', 'Gambar konstruksi / diagram teknis dan buku petunjuk operasi (manual book)', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 3, 'Pemeriksaan Dokumen', 'Lisensi K3 Operator Pesawat Angkat Angkut (SIO) dan logbook riwayat pemeliharaan', 'CHOICE', NULL, NULL, NULL, true),

        -- Seksi 2: Pemeriksaan Visual Konstruksi & Rangka
        (v_new_ver_id, 4, 'Pemeriksaan Visual Konstruksi & Rangka', 'Kondisi tiang kolom / kaki penopang struktur (kelurusan, korosi, dan deformasi)', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 5, 'Pemeriksaan Visual Konstruksi & Rangka', 'Kondisi balok girder utama (main girder) dan sambungan pengelasan struktur', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 6, 'Pemeriksaan Visual Konstruksi & Rangka', 'Kondisi baut pengikat struktural (high-strength bolts) dan kekencangan sambungan', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 7, 'Pemeriksaan Visual Konstruksi & Rangka', 'Kondisi rel lintasan (runway rail / trolley track), kelurusan sambungan rel, dan stopper', 'CHOICE', NULL, NULL, NULL, true),

        -- Seksi 3: Mekanisme Angkat & Transmisi (Hoist & Trolley)
        (v_new_ver_id, 8, 'Mekanisme Angkat & Transmisi', 'Kondisi rumah gigi (gearbox) hoist/trolley, pelumasan, dan kekedapan seal dari kebocoran oli', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 9, 'Mekanisme Angkat & Transmisi', 'Roda jalan travelling & traversing (kondisi tapak roda, flens roda, dan kebebasan putaran)', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 10, 'Mekanisme Angkat & Transmisi', 'Sistem pengereman hoist (Mechanical / Electromagnetic Brake, keausan lining dan daya cengkeram)', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 11, 'Mekanisme Angkat & Transmisi', 'Sprocket / drum penggulung rantai atau tali kawat baja (alur drum, pemandu rantai, klem pengunci)', 'CHOICE', NULL, NULL, NULL, true),

        -- Seksi 4: Alat Pengait (Hook) & Media Angkat
        (v_new_ver_id, 12, 'Alat Pengait & Media Angkat', 'Kondisi fisik kait utama (swivel hook): keausan mulut kait, bebas deformasi puntir, dan putaran bearing', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 13, 'Alat Pengait & Media Angkat', 'Pengaman kait (safety latch): pegas pengembali otomatis berfungsi sempurna menutup mulut kait', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 14, 'Alat Pengait & Media Angkat', 'Media angkat rantai beban (load chain) / wire rope: keausan diameter link, elongasi pitch, dan bebas cacat', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 15, 'Alat Pengait & Media Angkat', 'Pengujian NDT (Non-Destructive Testing) Magnetic Particle / Dye Penetrant pada area kritis Hook', 'CHOICE', NULL, NULL, NULL, true),

        -- Seksi 5: Pengendali & Perangkat Keselamatan (Safety Devices)
        (v_new_ver_id, 16, 'Pengendali & Safety Devices', 'Tombol pengendali (pendant switch / radio remote): tanda arah gerak jelas dan isolasi kabel utuh', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 17, 'Pengendali & Safety Devices', 'Tombol darurat (emergency stop switch): pemutusan arus daya seketika saat ditekan', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 18, 'Pengendali & Safety Devices', 'Saklar pembatas gerak angkat (limit switch) posisi tertinggi dan terendah', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 19, 'Pengendali & Safety Devices', 'Penandaan kapasitas angkat aman (SWL Mark) dan rambu keselamatan K3 terbaca jelas pada unit', 'CHOICE', NULL, NULL, NULL, true),

        -- Seksi 6: Pengujian Operasi & Beban (Function & Load Test)
        (v_new_ver_id, 20, 'Pengujian Operasi & Beban', 'Uji fungsi operasional tanpa beban (no-load test): kelancaran gerak hoisting, traversing, dan travelling', 'CHOICE', NULL, NULL, NULL, true),
        (v_new_ver_id, 21, 'Pengujian Operasi & Beban', 'Catatan hasil uji beban kerja dinamis / statis (100% - 125% SWL)', 'TEXT', NULL, NULL, NULL, true),
        (v_new_ver_id, 22, 'Pengujian Operasi & Beban', 'Nilai beban uji yang diterapkan di lapangan', 'NUMBER', 'kg', 0, NULL, true),
        (v_new_ver_id, 23, 'Pengujian Operasi & Beban', 'Pengukuran lendutan / defleksi girder saat beban penuh (Toleransi delta <= L/888)', 'NUMBER', 'mm', 0, NULL, true);

      -- Update inspeksi yang berstatus 'DRAF' pada kategori PAA agar menggunakan template versi baru
      UPDATE inspections i
      SET template_version_id = v_new_ver_id
      FROM test_objects o
      WHERE i.object_id = o.id
        AND o.category_id = v_paa_cat_id
        AND i.status = 'DRAF';

    END IF;
  END IF;
END $$;
