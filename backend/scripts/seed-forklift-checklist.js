import { pool, withTransaction } from '../src/database/pool.js';

const FORKLIFT_NAME_ID = '02f4971d-23cc-4c44-8378-3574dbb30302';
const FORKLIFT_GROUP_ID = '11000000-0000-0000-0000-000000000001';

const ITEMS = [
  // ==========================================
  // 1. DATA UMUM (17 butir standar URD)
  // ==========================================
  { section: '1. Data Umum', label: 'Pemilik', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Alamat', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Pemakai', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Alamat', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Pengurus / Penanggung Jawab', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Lokasi Unit', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Jenis Pesawat', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Nomor Seri Unit', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Merk / Model', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Tahun', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Kapasitas Angkat', input_type: 'NUMBER', unit: 'kg', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Standar Yang Dipakai', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Digunakan Untuk', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Tanggal Diperiksa', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Jenis Pemeriksaan', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Nomor Ijin Pemakai', input_type: 'TEXT', is_required: false, requires_note: false, requires_photo: false },
  { section: '1. Data Umum', label: 'Diperiksa Oleh', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },

  // ==========================================
  // 2. DATA TEKNIS (Spesifikasi & Uji Teknis)
  // ==========================================
  { section: '2. Data Teknis', label: 'Perlengkapan / Attachment', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Kecepatan Angkat (Lifting Speed)', input_type: 'NUMBER', unit: 'm/s', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Kecepatan Turun (Lowering Speed)', input_type: 'NUMBER', unit: 'm/s', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Kecepatan Jalan (Travelling Speed)', input_type: 'NUMBER', unit: 'km/h', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Jenis Penggerak Utama', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Merk / Tipe Mesin Penggerak', input_type: 'TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Nomor Seri Mesin / Engine', input_type: 'TEXT', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Daya Mesin', input_type: 'NUMBER', unit: 'kW', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Putaran Mesin (Rpm)', input_type: 'NUMBER', unit: 'rpm', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Jumlah Silinder', input_type: 'NUMBER', unit: 'silinder', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Dimensi Panjang Unit', input_type: 'NUMBER', unit: 'mm', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Dimensi Lebar Unit', input_type: 'NUMBER', unit: 'mm', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Dimensi Tinggi Unit', input_type: 'NUMBER', unit: 'mm', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Tinggi Angkat Garpu Maksimal', input_type: 'NUMBER', unit: 'mm', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Tekanan Roda Depan', input_type: 'NUMBER', unit: 'kPa', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Tekanan Roda Belakang', input_type: 'NUMBER', unit: 'kPa', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Ukuran & Tipe Roda Depan', input_type: 'TEXT', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Ukuran & Tipe Roda Belakang', input_type: 'TEXT', is_required: false, requires_note: false, requires_photo: false },
  { section: '2. Data Teknis', label: 'Uji Beban & Defleksi Garpu (Permenaker 08/2020)', input_type: 'CHOICE', is_required: true, requires_note: true, requires_photo: true },

  // ==========================================
  // 3. DOKUMENTASI (Sesuai Permintaan User 3.1 - 3.5)
  // ==========================================
  { section: '3. Dokumentasi', label: '3.1 Foto Unit', input_type: 'PHOTO', is_required: true, requires_note: true, requires_photo: true },
  { section: '3. Dokumentasi', label: '3.2 Foto Pemeriksaan Visual', input_type: 'PHOTO', is_required: true, requires_note: true, requires_photo: true },
  { section: '3. Dokumentasi', label: '3.3 Foto Uji Fungsi', input_type: 'PHOTO', is_required: true, requires_note: true, requires_photo: true },
  { section: '3. Dokumentasi', label: '3.4 Foto Uji Beban', input_type: 'PHOTO', is_required: true, requires_note: true, requires_photo: true },
  { section: '3. Dokumentasi', label: '3.5 Foto Stiker', input_type: 'PHOTO', is_required: true, requires_note: false, requires_photo: true },

  // ==========================================
  // 4. TEMUAN / FINDING (Sesuai Permintaan User 4)
  // ==========================================
  { section: '4. Temuan / Finding', label: 'Temuan Lapangan / Finding', input_type: 'LONG_TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '4. Temuan / Finding', label: 'Rekomendasi Teknis K3', input_type: 'LONG_TEXT', is_required: true, requires_note: false, requires_photo: false },
  { section: '4. Temuan / Finding', label: 'Kesimpulan Kelayakan Teknis K3', input_type: 'CHOICE', is_required: true, requires_note: true, requires_photo: false }
];

async function seed() {
  console.log('Seeding Forklift checklist template...');
  await withTransaction(async (db) => {
    // 1. Get or create template
    let { rows: tpls } = await db.query(
      `SELECT * FROM inspection_templates WHERE equipment_name_id = $1 OR name ILIKE '%forklift%'`,
      [FORKLIFT_NAME_ID]
    );

    let templateId;
    if (tpls.length > 0) {
      templateId = tpls[0].id;
      console.log('Found existing template:', tpls[0].name, templateId);
    } else {
      const { rows: insertedTpl } = await db.query(
        `INSERT INTO inspection_templates
           (category_id, domain_code, equipment_group_id, equipment_type_id, equipment_name_id, name)
         VALUES (1, 'PAPA', $1, $2, $2, 'Checklist Riksa Uji FORKLIFT')
         RETURNING *`,
        [FORKLIFT_GROUP_ID, FORKLIFT_NAME_ID]
      );
      templateId = insertedTpl[0].id;
      console.log('Created template:', templateId);
    }

    // 2. Get or create active version
    let { rows: versions } = await db.query(
      `SELECT * FROM inspection_template_versions WHERE template_id = $1 AND status = 'AKTIF' ORDER BY version DESC LIMIT 1`,
      [templateId]
    );

    let versionId;
    if (versions.length > 0) {
      versionId = versions[0].id;
      console.log('Found active version:', versions[0].version, versionId);
    } else {
      const { rows: insertedVer } = await db.query(
        `INSERT INTO inspection_template_versions
           (template_id, version, status, is_validated, published_at)
         VALUES ($1, 1, 'AKTIF', true, now())
         RETURNING *`,
        [templateId]
      );
      versionId = insertedVer[0].id;
      console.log('Created active version 1:', versionId);
    }

    // 3. Clear existing items for this version
    await db.query(`DELETE FROM inspection_template_items WHERE version_id = $1`, [versionId]);

    // 4. Insert items
    for (let i = 0; i < ITEMS.length; i++) {
      const it = ITEMS[i];
      await db.query(
        `INSERT INTO inspection_template_items
           (version_id, seq, section, label, input_type, unit, is_required, requires_note, requires_photo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          versionId,
          i + 1,
          it.section,
          it.label,
          it.input_type,
          it.unit || null,
          it.is_required,
          it.requires_note,
          it.requires_photo
        ]
      );
    }
    console.log(`Successfully inserted ${ITEMS.length} checklist items into version ${versionId}!`);

    // 5. Update existing Forklift inspections so they use this active version
    const { rowCount } = await db.query(
      `UPDATE inspections i
       SET template_version_id = $1
       FROM test_objects o
       WHERE o.id = i.object_id
         AND (LOWER(o.name) LIKE '%forklift%' OR o.equipment_name_id = $2 OR o.equipment_type_id = $2)
         AND i.status = 'DRAF'`,
      [versionId, FORKLIFT_NAME_ID]
    );
    console.log(`Updated ${rowCount} active DRAF inspection(s) to use this template version.`);
  });

  await pool.end();
  console.log('Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

