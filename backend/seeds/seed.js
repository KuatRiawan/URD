import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { runMigrations } from '../src/database/migrate.js';
import { pool, withTransaction } from '../src/database/pool.js';
import { dispatchDueReminders } from '../src/modules/reminders/routes.js';

export async function seedDatabase({ password } = {}) {
  if (env.isProd && !password && !env.seedDefaultPassword) {
    throw new Error('SEED_DEFAULT_PASSWORD wajib disetel untuk menjalankan seed di produksi.');
  }

  const seedPassword =
    password ||
    env.seedDefaultPassword ||
    `DevURD-${crypto.randomBytes(4).toString('hex')}!`;

  await runMigrations();
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await withTransaction(async (db) => {
    const accounts = [
      {
        email: 'admin.sistem@upayariksadaya.com',
        fullName: 'Administrator Sistem URD',
        role: 'ADMIN_SISTEM',
        phone: '021-4891409'
      },
      {
        email: 'marketing@upayariksadaya.com',
        fullName: 'Siti Rahmawati (Marketing)',
        role: 'MARKETING',
        phone: '0812-8000-1101'
      },
      {
        email: 'ahlik3.paa@upayariksadaya.com',
        fullName: 'Ir. Budi Santoso (Ahli K3 Spesialis)',
        role: 'INSPECTOR',
        phone: '0812-8000-1102',
        employeeNo: 'URD-AK3-001'
      },
      {
        email: 'pimpinan@upayariksadaya.com',
        fullName: 'Kuat Riawan (Pimpinan)',
        role: 'PIMPINAN',
        phone: '0812-8000-1100'
      },
      ...(env.isTest
        ? [
            {
              email: 'admin.kantor@upayariksadaya.com',
              fullName: 'Siti Rahmawati (Marketing / PO Officer)',
              role: 'MARKETING',
              phone: '0812-8000-1101'
            },
            {
              email: 'ahlik3.listrik@upayariksadaya.com',
              fullName: 'Rizky Pratama, S.T. (Inspector Listrik & Petir)',
              role: 'INSPECTOR',
              phone: '0812-8000-1103',
              employeeNo: 'URD-AK3-002'
            }
          ]
        : [])
    ];

    const userByEmail = {};
    for (const acc of accounts) {
      const { rows } = await db.query(
        `INSERT INTO users (email, full_name, role, phone, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (email) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash
         RETURNING *`,
        [acc.email, acc.fullName, acc.role, acc.phone, passwordHash]
      );
      userByEmail[acc.email] = rows[0];
      if (acc.role === 'INSPECTOR' || acc.role === 'AHLI_K3') {
        await db.query(
          `INSERT INTO inspectors (user_id, employee_no)
           VALUES ($1, $2)
           ON CONFLICT (user_id) DO UPDATE SET employee_no = EXCLUDED.employee_no`,
          [rows[0].id, acc.employeeNo]
        );
      }
    }

    const { rows: cats } = await db.query('SELECT * FROM object_categories ORDER BY id ASC');
    const catByCode = Object.fromEntries(cats.map((c) => [c.code, c.id]));

    // Sertifikat kompetensi Ahli K3 untuk seluruh bidang K3
    const inspector = userByEmail['ahlik3.paa@upayariksadaya.com'];
    if (inspector) {
      const allCompetencies = [
        { categoryId: catByCode.PAA, certNo: 'SKP-AK3-PAA/2025/0192', validFrom: '2025-01-10', validUntil: '2028-01-10' },
        { categoryId: catByCode.PTP, certNo: 'SKP-AK3-PTP/2025/0318', validFrom: '2025-01-10', validUntil: '2028-01-10' },
        { categoryId: catByCode.PUBT, certNo: 'SKP-AK3-PUBT/2024/0441', validFrom: '2024-06-01', validUntil: '2028-06-01' },
        { categoryId: catByCode.LIS, certNo: 'SKP-AK3-LIS/2024/0815', validFrom: '2024-11-15', validUntil: '2028-11-15' },
        { categoryId: catByCode.IPP, certNo: 'SKP-AK3-IPP/2025/0210', validFrom: '2025-02-01', validUntil: '2028-02-01' },
        { categoryId: catByCode.LE, certNo: 'SKP-AK3-LE/2025/0112', validFrom: '2025-01-15', validUntil: '2028-01-15' },
        { categoryId: catByCode.IPK, certNo: 'SKP-AK3-IPK/2025/0209', validFrom: '2025-01-15', validUntil: '2028-01-15' }
      ];

      for (const c of allCompetencies) {
        if (c.categoryId) {
          await db.query(
            `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (inspector_id, category_id, certificate_no) DO UPDATE SET valid_until = EXCLUDED.valid_until`,
            [inspector.id, c.categoryId, c.certNo, c.validFrom, c.validUntil]
          );
        }
      }
    }

    // Tambahan kompetensi untuk akun test fixture saat test suite berjalan
    if (env.isTest && userByEmail['ahlik3.listrik@upayariksadaya.com']) {
      const u = userByEmail['ahlik3.listrik@upayariksadaya.com'];
      for (const code of ['LIS', 'IPP']) {
        if (catByCode[code]) {
          await db.query(
            `INSERT INTO inspector_competencies (inspector_id, category_id, certificate_no, valid_from, valid_until)
             VALUES ($1, $2, $3, '2025-01-01', '2028-12-31')
             ON CONFLICT (inspector_id, category_id, certificate_no) DO UPDATE SET valid_until = EXCLUDED.valid_until`,
            [u.id, catByCode[code], `SKP-TEST-${code}/2025`]
          );
        }
      }
    }
    // template contoh yang belum divalidasi tim Ahli K3 perusahaan wajib ditandai jelas di antarmuka)
    for (const cat of cats) {
      const tplName = `Form Pemeriksaan & Pengujian ${cat.name}`;
      const { rows: tplRows } = await db.query(
        `INSERT INTO inspection_templates (category_id, name, created_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (category_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING *`,
        [cat.id, tplName, userByEmail['admin.sistem@upayariksadaya.com'].id]
      );
      const tpl = tplRows[0];

      const { rows: existingVer } = await db.query(
        "SELECT * FROM inspection_template_versions WHERE template_id = $1 AND status = 'AKTIF'",
        [tpl.id]
      );

      if (!existingVer[0]) {
        const { rows: verRows } = await db.query(
          `INSERT INTO inspection_template_versions
             (template_id, version, status, is_validated, published_at, created_by)
           VALUES ($1, 1, 'AKTIF', false, now(), $2)
           RETURNING *`,
          [tpl.id, userByEmail['admin.sistem@upayariksadaya.com'].id]
        );
        const ver = verRows[0];

        const specificLabelByCat = {
          PAA: 'Pemeriksaan wire rope / rantai, kait (hook), limit switch, rem, dan defleksi girder saat uji beban',
          PTP: 'Pemeriksaan pelindung bagian berputar (guarding), tombol emergency stop, sistem pelumasan, dan tingkat getaran',
          PUBT: 'Pemeriksaan ketebalan dinding (UT Thickness), safety valve, pressure gauge, dan hasil pengujian hidrostatik',
          LIS: 'Pemeriksaan panel distribusi, kesamaan fasa, tahanan isolasi (Megger), dan tahanan pembumian (grounding)',
          IPP: 'Pemeriksaan penerima petir (air terminal), penghantar turun (down conductor), sambungan ukur, dan tahanan tanah',
          LE: 'Pemeriksaan ruang mesin, tali baja / sabuk, governor & safety gear, interlock pintu, dan komunikasi darurat',
          IPK: 'Pemeriksaan pompa kebakaran, jockey pump, tekanan jaringan hidran, alarm kebakaran, dan kelengkapan APAR'
        };

        let baseItems;
        if (cat.code === 'PAA') {
          baseItems = [
            { seq: 1, section: 'Pemeriksaan Dokumen', label: 'Surat Keterangan / Izin Pemakaian K3 sebelumnya dan dokumen legalitas unit', inputType: 'CHOICE' },
            { seq: 2, section: 'Pemeriksaan Dokumen', label: 'Gambar konstruksi / diagram teknis dan buku petunjuk operasi (manual book)', inputType: 'CHOICE' },
            { seq: 3, section: 'Pemeriksaan Dokumen', label: 'Lisensi K3 Operator Pesawat Angkat Angkut (SIO) dan logbook riwayat pemeliharaan', inputType: 'CHOICE' },
            { seq: 4, section: 'Pemeriksaan Visual Konstruksi & Rangka', label: 'Kondisi tiang kolom / kaki penopang struktur (kelurusan, korosi, dan deformasi)', inputType: 'CHOICE' },
            { seq: 5, section: 'Pemeriksaan Visual Konstruksi & Rangka', label: 'Kondisi balok girder utama (main girder) dan sambungan pengelasan struktur', inputType: 'CHOICE' },
            { seq: 6, section: 'Pemeriksaan Visual Konstruksi & Rangka', label: 'Kondisi baut pengikat struktural (high-strength bolts) dan kekencangan sambungan', inputType: 'CHOICE' },
            { seq: 7, section: 'Pemeriksaan Visual Konstruksi & Rangka', label: 'Kondisi rel lintasan (runway rail / trolley track), kelurusan sambungan rel, dan stopper', inputType: 'CHOICE' },
            { seq: 8, section: 'Mekanisme Angkat & Transmisi', label: 'Kondisi rumah gigi (gearbox) hoist/trolley, pelumasan, dan kekedapan seal dari kebocoran oli', inputType: 'CHOICE' },
            { seq: 9, section: 'Mekanisme Angkat & Transmisi', label: 'Roda jalan travelling & traversing (kondisi tapak roda, flens roda, dan kebebasan putaran)', inputType: 'CHOICE' },
            { seq: 10, section: 'Mekanisme Angkat & Transmisi', label: 'Sistem pengereman hoist (Mechanical / Electromagnetic Brake, keausan lining dan daya cengkeram)', inputType: 'CHOICE' },
            { seq: 11, section: 'Mekanisme Angkat & Transmisi', label: 'Sprocket / drum penggulung rantai atau tali kawat baja (alur drum, pemandu rantai, klem pengunci)', inputType: 'CHOICE' },
            { seq: 12, section: 'Alat Pengait & Media Angkat', label: 'Kondisi fisik kait utama (swivel hook): keausan mulut kait, bebas deformasi puntir, dan putaran bearing', inputType: 'CHOICE' },
            { seq: 13, section: 'Alat Pengait & Media Angkat', label: 'Pengaman kait (safety latch): pegas pengembali otomatis berfungsi sempurna menutup mulut kait', inputType: 'CHOICE' },
            { seq: 14, section: 'Alat Pengait & Media Angkat', label: 'Media angkat rantai beban (load chain) / wire rope: keausan diameter link, elongasi pitch, dan bebas cacat', inputType: 'CHOICE' },
            { seq: 15, section: 'Alat Pengait & Media Angkat', label: 'Pengujian NDT (Non-Destructive Testing) Magnetic Particle / Dye Penetrant pada area kritis Hook', inputType: 'CHOICE' },
            { seq: 16, section: 'Pengendali & Safety Devices', label: 'Tombol pengendali (pendant switch / radio remote): tanda arah gerak jelas dan isolasi kabel utuh', inputType: 'CHOICE' },
            { seq: 17, section: 'Pengendali & Safety Devices', label: 'Tombol darurat (emergency stop switch): pemutusan arus daya seketika saat ditekan', inputType: 'CHOICE' },
            { seq: 18, section: 'Pengendali & Safety Devices', label: 'Saklar pembatas gerak angkat (limit switch) posisi tertinggi dan terendah', inputType: 'CHOICE' },
            { seq: 19, section: 'Pengendali & Safety Devices', label: 'Penandaan kapasitas angkat aman (SWL Mark) dan rambu keselamatan K3 terbaca jelas pada unit', inputType: 'CHOICE' },
            { seq: 20, section: 'Pengujian Operasi & Beban', label: 'Uji fungsi operasional tanpa beban (no-load test): kelancaran gerak hoisting, traversing, dan travelling', inputType: 'CHOICE' },
            { seq: 21, section: 'Pengujian Operasi & Beban', label: 'Catatan hasil uji beban kerja dinamis / statis (100% - 125% SWL)', inputType: 'TEXT' },
            { seq: 22, section: 'Pengujian Operasi & Beban', label: 'Nilai beban uji yang diterapkan di lapangan', inputType: 'NUMBER', unit: 'kg', minValue: 0 },
            { seq: 23, section: 'Pengujian Operasi & Beban', label: 'Pengukuran lendutan / defleksi girder saat beban penuh (Toleransi delta <= L/888)', inputType: 'NUMBER', unit: 'mm', minValue: 0 }
          ];
        } else {
          baseItems = [
            {
              seq: 1,
              section: 'Pemeriksaan Dokumen',
              label: 'Kelengkapan gambar teknis, manual operasi, dan riwayat pemeriksaan sebelumnya',
              inputType: 'CHOICE'
            },
            {
              seq: 2,
              section: 'Pemeriksaan Visual',
              label: 'Kondisi papan nama (nameplate), penandaan kapasitas, dan rambu keselamatan',
              inputType: 'CHOICE'
            },
            {
              seq: 3,
              section: 'Pemeriksaan Teknis Spesifik Kategori',
              label:
                specificLabelByCat[cat.code] ||
                'Kondisi struktur utama, sambungan, dan perlengkapan pengaman (safety device)',
              inputType: 'CHOICE'
            },
            {
              seq: 4,
              section: 'Pengujian & Pengukuran',
              label: 'Catatan hasil pengujian fungsi tanpa beban dan dengan beban kerja',
              inputType: 'TEXT'
            },
            {
              seq: 5,
              section: 'Pengujian & Pengukuran',
              label: 'Nilai pengukuran parameter utama di lapangan',
              inputType: 'NUMBER',
              unit:
                cat.code === 'PUBT' || cat.code === 'IPK'
                  ? 'bar'
                  : cat.code === 'LIS' || cat.code === 'IPP'
                  ? 'Ohm'
                  : cat.code === 'PTP'
                  ? 'kW'
                  : 'kg',
              minValue: 0,
              maxValue: null
            }
          ];
        }

        for (const item of baseItems) {
          await db.query(
            `INSERT INTO inspection_template_items
               (version_id, seq, section, label, input_type, unit, min_value, max_value, is_required)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
            [
              ver.id,
              item.seq,
              item.section,
              item.label,
              item.inputType,
              item.unit || null,
              item.minValue ?? null,
              item.maxValue ?? null
            ]
          );
        }
      }
    }
  });

  await dispatchDueReminders();
  return { seedPassword };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(({ seedPassword }) => {
      console.log('Seed data awal PT Upaya Riksa Daya berhasil dijalankan.');
      if (!env.isProd) {
        console.log('Akun pengembangan:');
        console.log('  - admin.sistem@upayariksadaya.com (ADMIN_SISTEM)');
        console.log('  - marketing@upayariksadaya.com    (MARKETING)');
        console.log('  - inspector.paa@upayariksadaya.com(INSPECTOR)');
        console.log('  - pimpinan@upayariksadaya.com     (PIMPINAN / Manager Monitoring)');
        console.log(`Kata sandi pengembangan saat ini: ${seedPassword}`);
      }
      return pool.end();
    })
    .catch((err) => {
      console.error('Gagal menjalankan seed:', err);
      process.exit(1);
    });
}
