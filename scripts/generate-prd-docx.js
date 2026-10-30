// scripts/generate-prd-docx.js
// Generator Dokumen Word (.docx) & Markdown Resmi:
// PRODUCT REQUIREMENTS DOCUMENT (PRD) V2.0 - PT UPAYA RIKSA DAYA
// Mematuhi seluruh aturan AGENTS.md, anti-slop, dan petunjuk docx-js.

const fs = require('fs');
const path = require('path');
const docx = require('../backend/node_modules/docx');

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  PageBreak
} = docx;

const BRAND_RED = 'C81E1E';
const BRAND_DARK = '0F172A';
const BRAND_MUTED = '475569';
const BORDER_COLOR = 'CBD5E1';
const BG_HEADER = 'F1F5F9';
const BG_ACCENT = 'FEF2F2';

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

function createCell(text, widthDxa, { isHeader = false, isBold = false, align = AlignmentType.LEFT, bg = null, fontColor = null } = {}) {
  const effectiveBg = bg || (isHeader ? BG_HEADER : null);
  const effectiveColor = fontColor || (isHeader ? BRAND_DARK : '1E293B');
  return new TableCell({
    borders: cellBorders,
    width: { size: widthDxa, type: WidthType.DXA },
    shading: effectiveBg ? { fill: effectiveBg, type: ShadingType.CLEAR } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold: isHeader || isBold,
            size: isHeader ? 19 : 18,
            color: effectiveColor,
            font: 'Arial'
          })
        ]
      })
    ]
  });
}

function createParagraph(text, { bold = false, italic = false, size = 22, color = '1E293B', before = 100, after = 100, align = AlignmentType.LEFT } = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before, after },
    children: [
      new TextRun({
        text,
        bold,
        italics: italic,
        size,
        color,
        font: 'Arial'
      })
    ]
  });
}

function createHeading1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 30,
        color: BRAND_RED,
        font: 'Arial'
      })
    ]
  });
}

function createHeading2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24,
        color: BRAND_DARK,
        font: 'Arial'
      })
    ]
  });
}

function createHeading3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 20,
        color: '334155',
        font: 'Arial'
      })
    ]
  });
}

function createBulletItem(refName, text, { boldPrefix = '', level = 0 } = {}) {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix, bold: true, size: 21, color: '1E293B', font: 'Arial' }));
  }
  children.push(new TextRun({ text, size: 21, color: '334155', font: 'Arial' }));
  return new Paragraph({
    numbering: { reference: refName, level },
    spacing: { before: 60, after: 60 },
    children
  });
}

async function generatePrdDocx() {
  console.log('Generating PRD v2.0 Word Document (.docx)...');

  const logoPath = path.resolve(__dirname, '../logo-urd.png');
  let logoBuffer = null;
  if (fs.existsSync(logoPath)) {
    logoBuffer = fs.readFileSync(logoPath);
  }

  const numberingConfig = [
    {
      reference: 'bullet-list',
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } }
        },
        {
          level: 1,
          format: LevelFormat.BULLET,
          text: '–',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 280 } } }
        }
      ]
    },
    {
      reference: 'num-list-main',
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } }
        }
      ]
    },
    {
      reference: 'num-list-sec',
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } }
        }
      ]
    }
  ];

  const content = [];

  // ===========================================================================
  // COVER PAGE
  // ===========================================================================
  content.push(new Paragraph({ spacing: { before: 800, after: 200 } }));

  if (logoBuffer) {
    content.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
        children: [
          new ImageRun({
            type: 'png',
            data: logoBuffer,
            transformation: { width: 220, height: 153 },
            altText: {
              title: 'Logo PT Upaya Riksa Daya',
              description: 'Logo Resmi PT Upaya Riksa Daya',
              name: 'logo-urd.png'
            }
          })
        ]
      })
    );
  }

  content.push(
    createParagraph('PT UPAYA RIKSA DAYA', {
      bold: true,
      size: 32,
      color: BRAND_RED,
      align: AlignmentType.CENTER,
      before: 100,
      after: 100
    }),
    createParagraph('Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)', {
      italic: true,
      size: 22,
      color: BRAND_MUTED,
      align: AlignmentType.CENTER,
      before: 40,
      after: 300
    }),
    createParagraph('PRODUCT REQUIREMENTS DOCUMENT (PRD)', {
      bold: true,
      size: 40,
      color: BRAND_DARK,
      align: AlignmentType.CENTER,
      before: 200,
      after: 100
    }),
    createParagraph('Versi 2.0 (Penyesuaian Alur Bisnis Operasional Terkini)', {
      bold: true,
      size: 26,
      color: BRAND_RED,
      align: AlignmentType.CENTER,
      before: 80,
      after: 200
    }),
    createParagraph(
      'Sistem Terpadu Manajemen Purchase Order, Penjadwalan, Riksa Uji Lapangan, Inversi Penerbitan LHPP & BAP, Pelacakan Distribusi Dokumen, dan Registri Suket K3',
      {
        italic: true,
        size: 20,
        color: BRAND_MUTED,
        align: AlignmentType.CENTER,
        before: 100,
        after: 500
      }
    )
  );

  // Metadata Box Table on Cover
  const metaColWidths = [3000, 6360];
  content.push(
    new Table({
      columnWidths: metaColWidths,
      rows: [
        new TableRow({
          children: [
            createCell('Nomor Dokumen', metaColWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('PRD/URD/2026/V2.0', metaColWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Tanggal Pemutakhiran', metaColWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('30 Oktober 2026', metaColWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Dokumen Dasar Sebelumnya', metaColWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('PRD v0.1 (25 Maret 2026)', metaColWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Status Dokumen', metaColWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Disahkan untuk Implementasi Produksi (Production Aligned)', metaColWidths[1], { isBold: true, fontColor: '047857' })
          ]
        }),
        new TableRow({
          children: [
            createCell('Disusun Oleh', metaColWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Tim Senior Engineering & Software Architect PT Upaya Riksa Daya', metaColWidths[1])
          ]
        })
      ]
    })
  );

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ===========================================================================
  // BAB 1: RINGKASAN EKSEKUTIF & LATAR BELAKANG
  // ===========================================================================
  content.push(
    createHeading1('BAB 1: RINGKASAN EKSEKUTIF & LATAR BELAKANG'),
    createHeading2('1.1 Profil dan Identitas Perusahaan'),
    createParagraph(
      'PT Upaya Riksa Daya adalah Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3) resmi yang bergerak di bidang Pemeriksaan dan Pengujian (Riksa Uji) teknik K3 berdasarkan penunjukan Kementerian Ketenagakerjaan Republik Indonesia. Sesuai dengan pedoman merek tunggal, identitas resmi perusahaan dan sistem aplikasi adalah PT Upaya Riksa Daya dengan motto "Empowering Safety, Ensuring Compliance".'
    ),
    createParagraph(
      'Aplikasi ini dibangun untuk mengotomatisasi seluruh siklus layanan K3, mulai dari penerimaan dokumen Purchase Order (PO) dari perusahaan klien, penugasan Ahli K3/Inspector yang kompeten, pelaksanaan checklist teknis dan pengukuran di lapangan secara mobile, penerbitan dokumen resmi Laporan Hasil Pemeriksaan dan Pengujian (LHPP) serta Berita Acara Pemeriksaan (BAP), pelacakan pengiriman dokumen fisik maupun digital ke Klien dan Disnaker, hingga pengingat otomatis masa berlaku Surat Keterangan (Suket) K3.'
    ),
    createHeading2('1.2 Ruang Lingkup 7 Bidang Pemeriksaan & Pengujian K3'),
    createParagraph(
      'Sistem mendukung 7 bidang spesialisasi pemeriksaan teknis K3 sesuai regulasi perundangan ketenagakerjaan:'
    ),
    createBulletItem('bullet-list', 'Pesawat Angkat dan Pesawat Angkut (Overhead Crane, Mobile Crane, Forklift, Hoist, Excavator, Passenger Hoist). Permenaker No. 8 Tahun 2020.', { boldPrefix: '1. PAA: ' }),
    createBulletItem('bullet-list', 'Pesawat Tenaga dan Produksi (Genset Diesel, Turbin, Kompresor Udara, Mesin Perkakas Produksi). Permenaker No. 38 Tahun 2016.', { boldPrefix: '2. PTP: ' }),
    createBulletItem('bullet-list', 'Pesawat Uap dan Bejana Tekan (Ketel Uap/Boiler, Air Receiver Tank, Tangki Timbun Bahan Kimia/BBM). Permenaker No. 37 Tahun 2016.', { boldPrefix: '3. PUBT: ' }),
    createBulletItem('bullet-list', 'Instalasi Listrik (Panel LVMDP/MVDP, Transformator Daya, Pemeriksaan Termografi Inframerah, Pengukuran Resistansi Isolasi). Permenaker No. 12 Tahun 2015.', { boldPrefix: '4. LIS: ' }),
    createBulletItem('bullet-list', 'Instalasi Penyalur Petir (Sistem Proteksi Petir Konvensional Franklin & Elektrostatis / Early Streamer Emission, Pengukuran Tahanan Pembumian Grounding < 5 Ohm). Permenaker No. 02 Tahun 1989.', { boldPrefix: '5. IPP: ' }),
    createBulletItem('bullet-list', 'Elevator dan Eskalator (Lift Penumpang, Lift Barang, Travelator, Escalator). Permenaker No. 6 Tahun 2017.', { boldPrefix: '6. LE: ' }),
    createBulletItem('bullet-list', 'Instalasi Proteksi Kebakaran (Sistem Springkler Otomatis, Jaringan Pipa Hydrant, Fire Alarm Smoke/Heat Detector, APAR). Permenaker No. 04 Tahun 1980 & Permenaker No. 02 Tahun 1983.', { boldPrefix: '7. IPK: ' })
  );

  // ===========================================================================
  // BAB 2: EVOLUSI DARI PRD V0.1 KE PRD V2.0
  // ===========================================================================
  content.push(
    createHeading1('BAB 2: EVOLUSI DARI PRD V0.1 KE PRD V2.0'),
    createParagraph(
      'PRD v0.1 dirancang pada tahap awal perencanaan (Maret 2026). Setelah pengujian operasional nyata di lapangan dan evaluasi bersama manajemen PT Upaya Riksa Daya, ditemukan beberapa ketidaksesuaian alur kerja yang memerlukan pemutakhiran fundamental. PRD v2.0 ini menggantikan seluruh aturan sebelumnya yang bertentangan.'
    ),
    createHeading2('2.1 Matriks Perbandingan PRD v0.1 vs PRD v2.0')
  );

  const diffWidths = [2400, 3480, 3480];
  content.push(
    new Table({
      columnWidths: diffWidths,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createCell('Aspek Sistem', diffWidths[0], { isHeader: true }),
            createCell('Kondisi Lama (PRD v0.1)', diffWidths[1], { isHeader: true }),
            createCell('Kondisi Terkini (PRD v2.0)', diffWidths[2], { isHeader: true, bg: BG_ACCENT, fontColor: BRAND_RED })
          ]
        }),
        new TableRow({
          children: [
            createCell('Peran Pengguna (Roles)', diffWidths[0], { isBold: true }),
            createCell('Admin Kantor, Ahli K3, Pimpinan, Admin Sistem', diffWidths[1]),
            createCell('Marketing, Inspector, Pimpinan (Monitoring Read-Only), Admin Sistem', diffWidths[2], { isBold: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Peran Pimpinan / Manager', diffWidths[0], { isBold: true }),
            createCell('Memiliki alur approval, verifikasi, dan penolakan (reject) dokumen teknis', diffWidths[1]),
            createCell('STRICTLY READ-ONLY. Hanya memantau dashboard, antrean, dan analitik. Tidak ada tombol approval/reject.', diffWidths[2], { isBold: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Urutan Alur Dokumen', diffWidths[0], { isBold: true }),
            createCell('Inspeksi Lapangan -> Review Pimpinan -> Draf BAP -> Draf LHPP', diffWidths[1]),
            createCell('Inspeksi Lapangan -> LHPP terbit lebih dahulu (SIAP_PREVIEW) -> BAP diterbitkan setelah LHPP', diffWidths[2], { isBold: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Struktur PO & Unit Alat', diffWidths[0], { isBold: true }),
            createCell('Order diasumsikan per unit tunggal atau PO terpisah', diffWidths[1]),
            createCell('1 PO menampung N unit alat lintas bidang K3 dengan status progres mandiri per unit (PO Completion Gate)', diffWidths[2], { isBold: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Kesiapan Lapangan Inspector', diffWidths[0], { isBold: true }),
            createCell('Desktop portal dengan form web statis', diffWidths[1]),
            createCell('Mobile-first field dashboard, checklist dinamis, autosave offline-first, kanvas TTD digital, galeri foto terkompresi', diffWidths[2], { isBold: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Distribusi Dokumen', diffWidths[0], { isBold: true }),
            createCell('Tidak ada pencatatan status pengiriman fisik/digital', diffWidths[1]),
            createCell('Document Distribution Tracker: mencatat pengiriman BAP ke Klien serta LHPP & BAP ke Disnaker dengan bukti resi', diffWidths[2], { isBold: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Integritas Dokumen Publik', diffWidths[0], { isBold: true }),
            createCell('Hanya nomor dokumen manual', diffWidths[1]),
            createCell('Dokumen PDF memuat QR Code dan kode verifikasi publik yang divalidasi dengan hash SHA-256 tanpa login', diffWidths[2], { isBold: true })
          ]
        })
      ]
    })
  );

  content.push(new Paragraph({ spacing: { before: 200, after: 100 } }));

  // ===========================================================================
  // BAB 3: ARSITEKTUR PERAN & MATRIKS HAK AKSES (RBAC)
  // ===========================================================================
  content.push(
    createHeading1('BAB 3: ARSITEKTUR PERAN & MATRIKS HAK AKSES (RBAC)'),
    createHeading2('3.1 Tanggung Jawab Empat Peran Utama'),
    createParagraph(
      'Sistem menetapkan batasan wewenang yang tegas antara urusan komersial marketing, eksekusi teknis inspector, tata kelola sistem oleh admin, dan pengawasan manajerial oleh pimpinan.'
    ),
    createBulletItem('bullet-list', 'Bertanggung jawab atas penerimaan PO klien, pendaftaran klien baru, pendaftaran PIC dan lokasi site, penginputan detail unit alat ke dalam PO, penentuan jadwal pelaksanaan, pengunggahan berkas PO resmi, pemantauan progres unit, koordinasi dokumen BAP/LHPP yang telah selesai, dan pencatatan distribusi dokumen ke klien.', { boldPrefix: 'A. MARKETING: ' }),
    createBulletItem('bullet-list', 'Pelaksana utama riksa uji di lapangan. Melihat jadwal penugasan pada dasbor mobile, membuka lembar kerja berbasis unit PO, memverifikasi kondisi aktual alat, mengisi butir checklist teknis, memasukkan data pengukuran toleransi, mengambil foto dokumentasi (per butir dan per form), mencatat temuan & rekomendasi (Kritis/Mayor/Minor), membubuhkan TTD digital bersama perwakilan klien di layar sentuh, dan mengirimkan hasil uji.', { boldPrefix: 'B. INSPECTOR: ' }),
    createBulletItem('bullet-list', 'Berperan murni sebagai pemantau kinerja operasional (Read-Only). Memantau dashboard ringkasan PO, antrean kerja, jadwal inspeksi, status dokumen terbit, riwayat alat, dan laporan distribusi dokumen. Seluruh tombol intervensi teknis, verifikasi, atau approval ditiadakan.', { boldPrefix: 'C. PIMPINAN / MANAGER: ' }),
    createBulletItem('bullet-list', 'Pengelola sistem tingkat teknis: manajemen pengguna & hak akses, konfigurasi template checklist K3 per kategori alat, konfigurasi pengingat otomatis, pemeliharaan master data, dan audit trail keamanan.', { boldPrefix: 'D. ADMIN SISTEM: ' }),
    createHeading2('3.2 Matriks Hak Akses Modul Sistem (Role-Based Access Control)')
  );

  const rbacWidths = [2760, 1650, 1650, 1650, 1650];
  content.push(
    new Table({
      columnWidths: rbacWidths,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createCell('Modul & Fungsi Bisnis', rbacWidths[0], { isHeader: true }),
            createCell('Marketing', rbacWidths[1], { isHeader: true }),
            createCell('Inspector', rbacWidths[2], { isHeader: true }),
            createCell('Pimpinan', rbacWidths[3], { isHeader: true }),
            createCell('Admin Sistem', rbacWidths[4], { isHeader: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('Pendaftaran Klien & PIC', rbacWidths[0], { isBold: true }),
            createCell('Full (CRUD)', rbacWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Lihat (Read-Only)', rbacWidths[2]),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Full (CRUD)', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Pendaftaran Objek Uji (Unit)', rbacWidths[0], { isBold: true }),
            createCell('Full (CRUD)', rbacWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Lihat (Read-Only)', rbacWidths[2]),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Full (CRUD)', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Input & Pengelolaan PO', rbacWidths[0], { isBold: true }),
            createCell('Full (CRUD)', rbacWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Lihat PO Ditugaskan', rbacWidths[2]),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Full (CRUD)', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Penjadwalan & Penugasan Ahli', rbacWidths[0], { isBold: true }),
            createCell('Kelola Penugasan', rbacWidths[1]),
            createCell('Konfirmasi Terima/Tolak', rbacWidths[2], { isBold: true }),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Full (CRUD)', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Lembar Kerja Digital & Checklist', rbacWidths[0], { isBold: true }),
            createCell('Dilarang (403)', rbacWidths[1], { fontColor: 'DC2626' }),
            createCell('Full Eksekusi Lapangan', rbacWidths[2], { isBold: true, fontColor: '047857' }),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Buka Revisi Khusus', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Dokumentasi Foto & TTD Digital', rbacWidths[0], { isBold: true }),
            createCell('Dilarang (403)', rbacWidths[1], { fontColor: 'DC2626' }),
            createCell('Unggah Foto & Simpan TTD', rbacWidths[2], { isBold: true, fontColor: '047857' }),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Kelola Lampiran', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Penerbitan Dokumen LHPP', rbacWidths[0], { isBold: true }),
            createCell('Lihat & Unduh PDF', rbacWidths[1]),
            createCell('Terbitkan & Finalisasi', rbacWidths[2], { isBold: true, fontColor: '047857' }),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Full Akses', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Penerbitan Dokumen BAP', rbacWidths[0], { isBold: true }),
            createCell('Lihat, Unduh & Batch Cetak', rbacWidths[1]),
            createCell('Terbitkan & Finalisasi', rbacWidths[2], { isBold: true, fontColor: '047857' }),
            createCell('Lihat (Read-Only)', rbacWidths[3]),
            createCell('Full Akses', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Pelacakan Distribusi Dokumen', rbacWidths[0], { isBold: true }),
            createCell('Catat Pengiriman & Resi', rbacWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Lihat Status Distribusi', rbacWidths[2]),
            createCell('Lihat Laporan Distribusi', rbacWidths[3]),
            createCell('Full Akses', rbacWidths[4])
          ]
        }),
        new TableRow({
          children: [
            createCell('Manajemen Akun & Master Data', rbacWidths[0], { isBold: true }),
            createCell('Dilarang (403)', rbacWidths[1], { fontColor: 'DC2626' }),
            createCell('Dilarang (403)', rbacWidths[2], { fontColor: 'DC2626' }),
            createCell('Dilarang (403)', rbacWidths[3], { fontColor: 'DC2626' }),
            createCell('Full (CRUD)', rbacWidths[4], { isBold: true, fontColor: '047857' })
          ]
        })
      ]
    })
  );

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ===========================================================================
  // BAB 4: DIAGRAM ALUR PROSES BISNIS & STATE MACHINE
  // ===========================================================================
  content.push(
    createHeading1('BAB 4: DIAGRAM ALUR PROSES BISNIS & STATE MACHINE'),
    createParagraph(
      'Seluruh interaksi operasional disusun dalam alur kerja sistematis yang menjamin keandalan data, ketertelusuran dokumen, dan tidak adanya tahapan yang dilewati.'
    ),
    createHeading2('4.1 Alur Kerja Utama End-to-End'),
    createParagraph(
      'Diagram alir di bawah ini menggambarkan perjalanan satu Purchase Order dari masuknya kontrak hingga penutupan status PO:'
    )
  );

  // Flowchart visual table
  const flowWidths = [1800, 7560];
  content.push(
    new Table({
      columnWidths: flowWidths,
      rows: [
        new TableRow({
          children: [
            createCell('Langkah 1', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Marketing menerima PO resmi dari klien -> Menginput Nomor PO, Tanggal, Detail Pekerjaan, Klien, Lokasi Pabrik, Kontak PIC, Jadwal Target, dan N unit alat objek uji.', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 2', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Marketing / Admin Kantor menugaskan Inspector yang memiliki SKP penunjukan aktif sesuai kategori alat -> Sistem memvalidasi deteksi bentrok jadwal -> Surat Tugas PDF diterbitkan.', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 3', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Inspector membuka dasbor lapangan -> Mengonfirmasi penugasan -> Membuka lembar kerja unit alat (Status Unit: SEDANG_DIPERIKSA).', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 4', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Inspector melaksanakan pengujian teknis -> Mengisi butir checklist standar K3 (didukung autosave offline) -> Mengambil foto bukti fisik -> Menginput temuan & rekomendasi -> Kesimpulan K3.', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 5', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Penandatanganan Digital di layar sentuh perangkat oleh Inspector dan PIC Klien -> Inspeksi dikirim dan dikunci resmi (Status Form: TERKIRIM).', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 6', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Sistem otomatis menerbitkan Dokumen LHPP (SIAP_PREVIEW -> FINAL) lengkap dengan 5 bab teknis format F4, tabel data teknis, dan galeri foto.', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 7', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Setelah LHPP selesai, sistem menerbitkan Berita Acara Pemeriksaan (BAP FINAL) memuat 28 butir ruang lingkup riksa uji dan tanda tangan kedua belah pihak.', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 8', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('Dokumen BAP didistribusikan ke Klien. Dokumen LHPP & BAP didistribusikan ke Disnaker setempat -> Status distribusi dicatat pada Document Distribution Tracker.', flowWidths[1])
          ]
        }),
        new TableRow({
          children: [
            createCell('Langkah 9', flowWidths[0], { isBold: true, bg: BG_ACCENT }),
            createCell('PO Completion Gate mengevaluasi progres seluruh unit pada PO tersebut. Jika seluruh unit telah menyelesaikan BAP & LHPP, status PO otomatis berubah menjadi SELESAI.', flowWidths[1])
          ]
        })
      ]
    })
  );

  content.push(
    createHeading2('4.2 Inversi Alur Penerbitan Dokumen (LHPP Dahulu, Kemudian BAP)'),
    createParagraph(
      'Sesuai ketentuan revisi proses bisnis terbaru PT Upaya Riksa Daya, urutan dokumen dibalik secara tegas: Laporan Hasil Pemeriksaan dan Pengujian (LHPP) disusun dan diselesaikan terlebih dahulu sebagai dasar teknis yang komprehensif. Setelah kesimpulan teknis dan rekomendasi pada LHPP tuntas difinalisasi, barulah Berita Acara Pemeriksaan (BAP) diterbitkan sebagai dokumen ringkasan legal yang diserahkan kepada perwakilan pemilik alat di lapangan.'
    ),
    createHeading2('4.3 State Machine Status Unit Alat & Status PO'),
    createParagraph(
      'Setiap unit alat di dalam PO memiliki siklus hidup (lifecycle) tersendiri:'
    ),
    createBulletItem('bullet-list', 'Unit baru didaftarkan ke dalam PO, belum memiliki alokasi waktu inspeksi.', { boldPrefix: 'BELUM_DIJADWALKAN / TERJADWAL: ' }),
    createBulletItem('bullet-list', 'Inspector yang memiliki kompetensi sesuai telah ditugaskan ke unit ini.', { boldPrefix: 'DITUGASKAN: ' }),
    createBulletItem('bullet-list', 'Pemeriksaan fisik di lapangan sedang berlangsung oleh inspector.', { boldPrefix: 'SEDANG_DIPERIKSA: ' }),
    createBulletItem('bullet-list', 'Formulir checklist dan TTD digital telah lengkap dan dikunci.', { boldPrefix: 'FORM_TERKIRIM: ' }),
    createBulletItem('bullet-list', 'Dokumen LHPP telah dibuat dan siap ditinjau pratinjau sebelum cetak.', { boldPrefix: 'LHPP_SIAP_PREVIEW / LHPP_FINAL: ' }),
    createBulletItem('bullet-list', 'BAP resmi telah diterbitkan dan ditandatangani kedua pihak.', { boldPrefix: 'BAP_FINAL: ' }),
    createBulletItem('bullet-list', 'Dokumen telah diserahkan dan seluruh kewajiban teknis tuntas.', { boldPrefix: 'SELESAI: ' }),
    createParagraph(
      'Aturan PO Completion Gate: Status PO hanya akan bertransisi ke SELESAI apabila count(unit_status = "BAP_FINAL" ATAU "SELESAI") == total_unit_aktif pada PO bersangkutan.'
    )
  );

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ===========================================================================
  // BAB 5: SPESIFIKASI KEBUTUHAN FUNGSIONAL
  // ===========================================================================
  content.push(
    createHeading1('BAB 5: SPESIFIKASI KEBUTUHAN FUNGSIONAL LENGKAP'),
    createParagraph(
      'Berikut rincian spesifikasi teknis untuk 14 modul operasional yang telah aktif diimplementasikan pada repositori PT Upaya Riksa Daya:'
    ),
    createHeading2('Modul 1: Manajemen Klien, Lokasi Site, dan Kontak PIC'),
    createBulletItem('bullet-list', 'Mencatat entitas perusahaan klien: Nama Resmi, NPWP, Bidang Usaha/Industri, Alamat Kantor, Telepon, dan Email.', { boldPrefix: '1.1 Profil Klien: ' }),
    createBulletItem('bullet-list', 'Mendukung relasi 1-ke-banyak (1:N) untuk cabang pabrik/site operasional klien (Nama Site, Alamat Lengkap, Kota/Kabupaten, Titik Koordinat).', { boldPrefix: '1.2 Multi-Lokasi: ' }),
    createBulletItem('bullet-list', 'Mencatat narahubung operasional K3/HSE (Nama PIC, Jabatan, Nomor WhatsApp aktif, Email) yang menjadi tujuan notifikasi dan reminder.', { boldPrefix: '1.3 Kontak PIC: ' }),
    createHeading2('Modul 2: Registri Unit Alat Objek Uji K3 & QR Code'),
    createBulletItem('bullet-list', 'Peralatan dikelompokkan ke 7 bidang regulasi (PAA, PTP, PUBT, LIS, IPP, LE, IPK).', { boldPrefix: '2.1 Klasifikasi K3: ' }),
    createBulletItem('bullet-list', 'Nama Unit, Merek, Model, Nomor Seri Pabrik, Tahun Pembuatan, Kapasitas Kerja Aman (SWL / Tegangan / Tekanan), dan Lokasi Pemasangan Aktual.', { boldPrefix: '2.2 Spesifikasi Detail: ' }),
    createBulletItem('bullet-list', 'Sistem mencegah duplikasi nomor seri untuk klien yang sama guna menjaga integritas riwayat inspeksi.', { boldPrefix: '2.3 Validasi Unik: ' }),
    createBulletItem('bullet-list', 'Sistem menerbitkan QR Code unik untuk setiap unit alat yang dapat ditempel langsung pada fisik alat untuk inspeksi cepat.', { boldPrefix: '2.4 Identitas QR Code: ' }),
    createHeading2('Modul 3: Manajemen Purchase Order (PO) & Multi-Unit'),
    createBulletItem('bullet-list', 'Pencatatan Nomor PO, Tanggal PO, Jenis Layanan (Pemeriksaan Pertama, Berkala, Perpanjangan, Ulang), Sumber Permohonan, Target Pelaksanaan, dan Catatan Pekerjaan.', { boldPrefix: '3.1 Header PO: ' }),
    createBulletItem('bullet-list', 'Marketing dapat memasukkan banyak unit alat dalam 1 PO secara bersamaan, baik memilih unit terdaftar, input manual unit baru, maupun impor massal berkas CSV.', { boldPrefix: '3.2 Multi-Unit: ' }),
    createBulletItem('bullet-list', 'Penyimpanan scan dokumen PO asli (PDF/JPG hingga 10 MB) sebagai bukti legal penugasan kerja.', { boldPrefix: '3.3 Lampiran PO: ' }),
    createHeading2('Modul 4: Penjadwalan Cerdas & Penugasan Inspector'),
    createBulletItem('bullet-list', 'Penetapan waktu mulai dan selesai pelaksanaan inspeksi.', { boldPrefix: '4.1 Jadwal Terpadu: ' }),
    createBulletItem('bullet-list', 'Sistem otomatis memverifikasi ketersediaan jadwal Inspector. Bila seorang Inspector telah dijadwalkan pada order lain pada jam yang beririsan, sistem menolak penugasan dengan kode SCHEDULE_CONFLICT.', { boldPrefix: '4.2 Deteksi Bentrok: ' }),
    createBulletItem('bullet-list', 'Sistem memeriksa kompetensi bidang penunjukan (SKP) Inspector terhadap kategori unit alat yang ditugaskan (contoh: Ahli Listrik ditolak jika ditugaskan memeriksa Crane PAA).', { boldPrefix: '4.3 Verifikasi SKP: ' }),
    createBulletItem('bullet-list', 'Menerbitkan Surat Tugas resmi ber-KOP PT Upaya Riksa Daya dalam format PDF yang dapat diunduh langsung oleh Inspector.', { boldPrefix: '4.4 Surat Tugas PDF: ' }),
    createHeading2('Modul 5: Lembar Kerja Lapangan & Checklist Digital K3'),
    createBulletItem('bullet-list', 'Menampilkan butir checklist sesuai standar teknis masing-masing kategori alat (input CHOICE: Sesuai / Tidak Sesuai / N/A, NUMBER: Pengukuran riil, TEXT: Keterangan fisik).', { boldPrefix: '5.1 Checklist Dinamis: ' }),
    createBulletItem('bullet-list', 'Pengukuran numerik divalidasi terhadap ambang batas aman (min_value dan max_value). Nilai di luar batas otomatis ditandai sebagai indikasi bahaya teknis.', { boldPrefix: '5.2 Ambang Batas: ' }),
    createBulletItem('bullet-list', 'Setiap perubahan input disimpan otomatis ke memori lokal perangkat (localStorage/IndexedDB) setiap beberapa detik untuk mengantisipasi perangkat mati atau koneksi putus.', { boldPrefix: '5.3 Autosave: ' }),
    createBulletItem('bullet-list', 'Mencatat temuan ketidaksesuaian teknis berkategori Kritis, Mayor, atau Minor beserta batas waktu tindak lanjut dan rekomendasi perbaikan.', { boldPrefix: '5.4 Temuan & Rekomendasi: ' }),
    createHeading2('Modul 6: Galeri Foto Dokumentasi Riksa Uji'),
    createBulletItem('bullet-list', 'Inspector dapat mengambil foto langsung menggunakan kamera smartphone/tablet di lapangan atau memilih dari galeri.', { boldPrefix: '6.1 Kamera Langsung: ' }),
    createBulletItem('bullet-list', 'Dapat mengunggah foto per butir checklist tertentu maupun foto umum dokumentasi riksa uji.', { boldPrefix: '6.2 Asosiasi Foto: ' }),
    createBulletItem('bullet-list', 'Foto dikompresi otomatis di sisi browser sebelum dikirim untuk menghemat kuota dan mempercepat pengiriman di area sinyal minim.', { boldPrefix: '6.3 Kompresi Otomatis: ' }),
    createHeading2('Modul 7: Tanda Tangan Digital Kanvas HTML5'),
    createBulletItem('bullet-list', 'Menyediakan kanvas tanda tangan interaktif yang responsif terhadap sentuhan jari atau stylus pen.', { boldPrefix: '7.1 Kanvas TTD: ' }),
    createBulletItem('bullet-list', 'Menampung tanda tangan Inspector dan tanda tangan Perwakilan/PIC Klien yang mendampingi pemeriksaan di lapangan.', { boldPrefix: '7.2 Dua Pihak: ' }),
    createBulletItem('bullet-list', 'Tanda tangan dikonversi menjadi berkas PNG berlatar transparan dan terenkripsi pada repositori berkas terproteksi.', { boldPrefix: '7.3 Penyimpanan Vektor: ' }),
    createHeading2('Modul 8: Generator Dokumen LHPP (Format Standar F4)'),
    createBulletItem('bullet-list', 'Sistem menyusun LHPP dalam 5 bab teknis: (1) Data Umum & Legalitas, (2) Data Teknis Spesifikasi, (3) Pemeriksaan Visual & Pengukuran, (4) Pengujian Fungsi & Beban, (5) Kesimpulan & Saran Rekomendasi.', { boldPrefix: '8.1 Format 5 Bab: ' }),
    createBulletItem('bullet-list', 'Diformat presisi pada kertas ukuran Folio / F4 (215 x 330 mm) sesuai standar inspeksi ketenagakerjaan di Indonesia.', { boldPrefix: '8.2 Ukuran Kertas: ' }),
    createBulletItem('bullet-list', 'Setiap dokumen LHPP final memuat hash kriptografi SHA-256 dan QR Code verifikasi publik.', { boldPrefix: '8.3 Keabsahan Dokumen: ' }),
    createHeading2('Modul 9: Generator Dokumen Berita Acara Pemeriksaan (BAP)'),
    createBulletItem('bullet-list', 'Diterbitkan setelah LHPP selesai dengan memuat 28 butir ruang lingkup pemeriksaan K3 sesuai format resmi PT Upaya Riksa Daya.', { boldPrefix: '9.1 Penerbitan Otomatis: ' }),
    createBulletItem('bullet-list', 'Mencantumkan kesimpulan Memenuhi Syarat K3 atau Tidak Memenuhi Syarat K3 serta catatan perbaikan.', { boldPrefix: '9.2 Kesimpulan Jelas: ' }),
    createBulletItem('bullet-list', 'Sistem menyediakan tombol untuk mencetak seluruh BAP dari seluruh unit dalam 1 PO menjadi satu berkas PDF gabungan secara instan.', { boldPrefix: '9.3 Cetak Batch 1 PO: ' }),
    createHeading2('Modul 10: Pelacak Distribusi Dokumen (Distribution Tracker)'),
    createBulletItem('bullet-list', 'Mencatat riwayat pengiriman dokumen BAP ke pihak Klien (Status: SIAP_DIKIRIM, DIKIRIM, DITERIMA).', { boldPrefix: '10.1 Distribusi Klien: ' }),
    createBulletItem('bullet-list', 'Mencatat penyerahan berkas berkas LHPP dan BAP ke kantor Disnaker wilayah setempat untuk penerbitan Suket K3.', { boldPrefix: '10.2 Distribusi Disnaker: ' }),
    createBulletItem('bullet-list', 'Mendukung pencatatan media ekspedisi: Email, WhatsApp, Kurir Fisik (JNE/TIKI/Kurir Internal), serta nomor resi pengiriman.', { boldPrefix: '10.3 Bukti & Resi: ' }),
    createHeading2('Modul 11: Riwayat Pengujian Unit Alat Lintas Waktu'),
    createBulletItem('bullet-list', 'Setiap unit alat memiliki rekam jejak kesehatan teknis seumur hidup (lifecycle history).', { boldPrefix: '11.1 Rekam Jejak Seumur Hidup: ' }),
    createBulletItem('bullet-list', 'Dapat menampilkan seluruh riwayat nomor PO sebelumnya, nomor BAP, nomor LHPP, tanggal pemeriksaan terdahulu, nama Ahli K3 yang menguji, serta temuan masa lalu.', { boldPrefix: '11.2 Jejak Digital: ' }),
    createHeading2('Modul 12: Registri Suket K3 & Siklus Repeat Order'),
    createBulletItem('bullet-list', 'Pencatatan nomor Suket resmi dari Disnaker beserta masa berlakunya (1 tahun s/d 5 tahun tergantung jenis alat).', { boldPrefix: '12.1 Registri Suket: ' }),
    createBulletItem('bullet-list', 'Sistem mengirimkan pengingat otomatis pada rentang H-90, H-60, H-30, H-14, dan H0 hari sebelum tanggal kedaluwarsa.', { boldPrefix: '12.2 Notifikasi Berkala: ' }),
    createBulletItem('bullet-list', 'Menyediakan tombol 1-klik untuk langsung membuat draf PO Riksa Uji Perpanjangan dengan data unit yang telah terisi otomatis.', { boldPrefix: '12.3 1-Klik Repeat Order: ' }),
    createHeading2('Modul 13: Antrean Kerja Terpadu (Work Queue) & Pencarian Global'),
    createBulletItem('bullet-list', 'Satu kotak pencarian global pada header navigasi untuk mencari nomor PO, nama klien, nomor seri alat, nomor BAP, atau nomor LHPP secara instan.', { boldPrefix: '13.1 Global Search: ' }),
    createBulletItem('bullet-list', 'Menampilkan antrean tugas operasional yang terorganisir per peran (tugas riksa uji hari ini, draf belum tuntas, dan dokumen menunggu pengiriman).', { boldPrefix: '13.2 Work Queue: ' }),
    createHeading2('Modul 14: Dasbor Monitoring Pimpinan (Read-Only)'),
    createBulletItem('bullet-list', 'Visualisasi KPI performa: Jumlah PO Berjalan, Total Unit Diperiksa, Rasio Penyelesaian Dokumen Tepat Waktu, dan Utilisasi Jam Kerja Ahli K3.', { boldPrefix: '14.1 Metrik Operasional: ' }),
    createBulletItem('bullet-list', 'Memantau pekerjaan yang mendekati atau melewati tenggat waktu (overdue tracking).', { boldPrefix: '14.2 Monitoring Keterlambatan: ' }),
    createBulletItem('bullet-list', 'Tampilan bersih tanpa tombol mutasi untuk menjamin independensi hasil pemeriksaan teknis.', { boldPrefix: '14.3 Bersih Tanpa Mutasi: ' })
  );

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ===========================================================================
  // BAB 6: ARSITEKTUR DATABASE & KAMUS DATA LENGKAP
  // ===========================================================================
  content.push(
    createHeading1('BAB 6: ARSITEKTUR DATABASE & KAMUS DATA LENGKAP'),
    createParagraph(
      'Database dibangun di atas PostgreSQL dengan 24 tabel relasional, menggunakan UUID versi 4 sebagai primary key, skema relasional ternormalisasi tingkat ketiga (3NF), serta trigger audit trail append-only yang tidak dapat dimanipulasi.'
    ),
    createHeading2('6.1 Ringkasan Entitas Utama & Struktur Relasi'),
    createParagraph(
      'Relasi utama sistem berpusat pada: users -> clients -> test_objects -> orders -> order_objects -> schedules -> assignments -> inspections -> lhpp_documents -> bap_documents -> document_distributions.'
    ),
    createHeading2('6.2 Kamus Data Tabel Utama (Data Dictionary)')
  );

  const dictWidths = [2200, 1600, 1400, 4160];

  function createDictTable(tableName, description, columns) {
    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Kolom', dictWidths[0], { isHeader: true }),
          createCell('Tipe Data', dictWidths[1], { isHeader: true }),
          createCell('Sifat', dictWidths[2], { isHeader: true }),
          createCell('Deskripsi & Batasan', dictWidths[3], { isHeader: true })
        ]
      })
    ];
    for (const c of columns) {
      rows.push(
        new TableRow({
          children: [
            createCell(c.name, dictWidths[0], { isBold: true }),
            createCell(c.type, dictWidths[1]),
            createCell(c.nullability, dictWidths[2]),
            createCell(c.desc, dictWidths[3])
          ]
        })
      );
    }
    return [
      createHeading3(`Tabel: ${tableName}`),
      createParagraph(description, { italic: true, size: 20, color: BRAND_MUTED, before: 40, after: 80 }),
      new Table({ columnWidths: dictWidths, rows }),
      new Paragraph({ spacing: { before: 100, after: 100 } })
    ];
  }

  // Tabel users
  content.push(
    ...createDictTable('users', 'Menyimpan identitas personel dan hak otentikasi login sistem.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas unik pengguna (gen_random_uuid())' },
      { name: 'email', type: 'text', nullability: 'UNIQUE, NOT NULL', desc: 'Alamat surel login resmi perusahaan' },
      { name: 'password_hash', type: 'text', nullability: 'NOT NULL', desc: 'Hash kata sandi menggunakan bcrypt (cost 10)' },
      { name: 'full_name', type: 'text', nullability: 'NOT NULL', desc: 'Nama lengkap beserta gelar profesional K3' },
      { name: 'role', type: 'text', nullability: 'NOT NULL', desc: 'Peran akun: ADMIN_SISTEM, MARKETING, INSPECTOR, PIMPINAN' },
      { name: 'phone', type: 'text', nullability: 'NULLABLE', desc: 'Nomor telepon/WhatsApp aktif personel' },
      { name: 'employee_no', type: 'text', nullability: 'NULLABLE', desc: 'Nomor Induk Pegawai PT Upaya Riksa Daya' },
      { name: 'is_active', type: 'boolean', nullability: 'DEFAULT true', desc: 'Status aktifasi akun pengguna' }
    ])
  );

  // Tabel orders
  content.push(
    ...createDictTable('orders', 'Menyimpan header kontrak Purchase Order riksa uji dari klien.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas unik order pemeriksaan' },
      { name: 'order_no', type: 'text', nullability: 'UNIQUE, NOT NULL', desc: 'Nomor urut sistem: ORD/YYYYMM/XXXX' },
      { name: 'po_number', type: 'text', nullability: 'NOT NULL', desc: 'Nomor Purchase Order resmi dari klien' },
      { name: 'po_date', type: 'date', nullability: 'NOT NULL', desc: 'Tanggal penerbitan dokumen PO' },
      { name: 'client_id', type: 'uuid', nullability: 'FK -> clients', desc: 'Perusahaan klien pemesan jasa riksa uji' },
      { name: 'service_type', type: 'text', nullability: 'NOT NULL', desc: 'PEMERIKSAAN_PERTAMA, BERKALA, PERPANJANGAN, ULANG' },
      { name: 'status', type: 'text', nullability: 'NOT NULL', desc: 'TERDAFTAR, DITUGASKAN, SEDANG_DIPERIKSA, MENUNGGU_DOKUMEN, SELESAI' },
      { name: 'requested_date', type: 'date', nullability: 'NULLABLE', desc: 'Target tanggal pelaksanaan riksa uji' },
      { name: 'notes', type: 'text', nullability: 'NULLABLE', desc: 'Catatan ruang lingkup atau petunjuk kerja khusus' }
    ])
  );

  // Tabel order_objects
  content.push(
    ...createDictTable('order_objects', 'Menghubungkan multi-unit alat ke dalam satu PO beserta status masing-masing unit.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas relasi unit dalam order' },
      { name: 'order_id', type: 'uuid', nullability: 'FK -> orders', desc: 'Order PO yang menaungi unit ini' },
      { name: 'object_id', type: 'uuid', nullability: 'FK -> test_objects', desc: 'Peralatan uji yang diperiksa' },
      { name: 'unit_status', type: 'text', nullability: 'NOT NULL', desc: 'TERJADWAL, DITUGASKAN, SEDANG_DIPERIKSA, LHPP_SIAP_PREVIEW, BAP_FINAL, SELESAI' },
      { name: 'inspector_id', type: 'uuid', nullability: 'FK -> users', desc: 'Inspector pelaksana unit bersangkutan' },
      { name: 'scope_items', type: 'jsonb', nullability: 'NULLABLE', desc: 'Daftar item ruang lingkup uji spesifik unit' }
    ])
  );

  // Tabel inspections
  content.push(
    ...createDictTable('inspections', 'Menyimpan formulir lembar kerja riksa uji digital lapangan.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas unik lembar kerja inspeksi' },
      { name: 'order_id', type: 'uuid', nullability: 'FK -> orders', desc: 'Order yang sedang dikerjakan' },
      { name: 'object_id', type: 'uuid', nullability: 'FK -> test_objects', desc: 'Unit alat yang diperiksa' },
      { name: 'template_version_id', type: 'uuid', nullability: 'FK -> template_versions', desc: 'Versi master checklist K3 yang digunakan' },
      { name: 'inspector_id', type: 'uuid', nullability: 'FK -> users', desc: 'Inspector penanggung jawab teknis' },
      { name: 'status', type: 'text', nullability: 'NOT NULL', desc: 'DRAF (Bisa diedit), TERKIRIM (Terkunci resmi)' },
      { name: 'conclusion', type: 'text', nullability: 'NULLABLE', desc: 'MEMENUHI_SYARAT atau TIDAK_MEMENUHI_SYARAT' },
      { name: 'conclusion_notes', type: 'text', nullability: 'NULLABLE', desc: 'Uraian pertimbangan teknis kesimpulan' },
      { name: 'submitted_at', type: 'timestamptz', nullability: 'NULLABLE', desc: 'Waktu final pengiriman dan penguncian form' }
    ])
  );

  // Tabel lhpp_documents
  content.push(
    ...createDictTable('lhpp_documents', 'Dokumen Laporan Hasil Pemeriksaan dan Pengujian (LHPP) resmi format F4.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas dokumen LHPP' },
      { name: 'inspection_id', type: 'uuid', nullability: 'FK, UNIQUE', desc: 'Inspeksi lapangan rujukan' },
      { name: 'lhpp_no', type: 'text', nullability: 'UNIQUE, NULLABLE', desc: 'Nomor resmi: LHPP/URD/<BIDANG>/<BULAN_ROMAWI>/<TAHUN>/<NOMOR>' },
      { name: 'status', type: 'text', nullability: 'NOT NULL', desc: 'SIAP_PREVIEW, FINAL, TERBIT' },
      { name: 'recommendations', type: 'text', nullability: 'NULLABLE', desc: 'Butir saran rekomendasi keselamatan K3' },
      { name: 'recommended_valid_until', type: 'date', nullability: 'NULLABLE', desc: 'Rekomendasi tanggal masa berlaku uji berikutnya' },
      { name: 'document_hash', type: 'text', nullability: 'NULLABLE', desc: 'Hash integritas berkas SHA-256' },
      { name: 'verification_code', type: 'text', nullability: 'NULLABLE', desc: 'Kode acak alfanumerik verifikasi publik' },
      { name: 'prepared_by', type: 'uuid', nullability: 'FK -> users', desc: 'Inspector penyusun laporan' }
    ])
  );

  // Tabel bap_documents
  content.push(
    ...createDictTable('bap_documents', 'Dokumen Berita Acara Pemeriksaan (BAP) legalitas serah terima lapangan.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas dokumen BAP' },
      { name: 'bap_no', type: 'text', nullability: 'UNIQUE, NOT NULL', desc: 'Nomor resmi: BAP/URD/<BULAN_ROMAWI>/<TAHUN>/<NOMOR>' },
      { name: 'inspection_id', type: 'uuid', nullability: 'FK, UNIQUE', desc: 'Inspeksi lapangan rujukan' },
      { name: 'lhpp_id', type: 'uuid', nullability: 'FK -> lhpp_documents', desc: 'LHPP rujukan teknis (diterbitkan setelah LHPP)' },
      { name: 'order_id', type: 'uuid', nullability: 'FK -> orders', desc: 'Order PO bersangkutan' },
      { name: 'object_id', type: 'uuid', nullability: 'FK -> test_objects', desc: 'Unit alat bersangkutan' },
      { name: 'status', type: 'text', nullability: 'NOT NULL', desc: 'DRAF, FINAL, REVISI' },
      { name: 'conclusion', type: 'text', nullability: 'NOT NULL', desc: 'MEMENUHI_SYARAT atau TIDAK_MEMENUHI_SYARAT' },
      { name: 'inspector_signer_name', type: 'text', nullability: 'NOT NULL', desc: 'Nama penanda tangan Inspector' },
      { name: 'inspector_signature_file_id', type: 'uuid', nullability: 'FK -> file_attachments', desc: 'Berkas PNG TTD Inspector' },
      { name: 'client_signer_name', type: 'text', nullability: 'NULLABLE', desc: 'Nama penanda tangan perwakilan klien' },
      { name: 'client_signature_file_id', type: 'uuid', nullability: 'FK -> file_attachments', desc: 'Berkas PNG TTD perwakilan klien' }
    ])
  );

  // Tabel document_distributions
  content.push(
    ...createDictTable('document_distributions', 'Pencatatan pelacakan distribusi berkas resmi BAP & LHPP ke Klien dan Disnaker.', [
      { name: 'id', type: 'uuid', nullability: 'PK, NOT NULL', desc: 'Identitas transaksi pengiriman dokumen' },
      { name: 'document_type', type: 'text', nullability: 'NOT NULL', desc: 'Jenis dokumen: BAP atau LHPP' },
      { name: 'document_id', type: 'uuid', nullability: 'NOT NULL', desc: 'ID dokumen BAP atau LHPP yang dikirim' },
      { name: 'order_id', type: 'uuid', nullability: 'FK -> orders', desc: 'Order bersangkutan' },
      { name: 'object_id', type: 'uuid', nullability: 'FK -> test_objects', desc: 'Unit alat bersangkutan' },
      { name: 'target_destination', type: 'text', nullability: 'NOT NULL', desc: 'Tujuan: KLIEN, DISNAKER, LAINNYA' },
      { name: 'recipient_name', type: 'text', nullability: 'NOT NULL', desc: 'Nama penerima / instansi dinas terkait' },
      { name: 'dispatch_media', type: 'text', nullability: 'NOT NULL', desc: 'EMAIL, WHATSAPP, KURIR_FISIK, LANGSUNG, PORTAL' },
      { name: 'tracking_reference', type: 'text', nullability: 'NULLABLE', desc: 'Nomor resi kurir pengiriman atau ID transmisi' },
      { name: 'status', type: 'text', nullability: 'NOT NULL', desc: 'BELUM_DIKIRIM, SIAP_DIKIRIM, DIKIRIM, DITERIMA' },
      { name: 'dispatched_by', type: 'uuid', nullability: 'FK -> users', desc: 'Personel Marketing/Admin yang mencatat pengiriman' }
    ])
  );

  // Tabel audit_logs
  content.push(
    ...createDictTable('audit_logs', 'Catatan jejak audit aktivitas yang dilindungi trigger immutable PostgreSQL.', [
      { name: 'id', type: 'bigserial', nullability: 'PK, NOT NULL', desc: 'Urutan audit increment otomatis' },
      { name: 'user_id', type: 'uuid', nullability: 'NULLABLE', desc: 'Pengguna pelaksana aksi' },
      { name: 'action', type: 'text', nullability: 'NOT NULL', desc: 'Kode aksi: LOGIN, ORDER_CREATE, INSPECTION_SUBMIT, dll.' },
      { name: 'entity', type: 'text', nullability: 'NOT NULL', desc: 'Tabel yang dikenai perubahan' },
      { name: 'entity_id', type: 'text', nullability: 'NULLABLE', desc: 'Identitas baris yang diubah' },
      { name: 'summary', type: 'jsonb', nullability: 'NOT NULL', desc: 'Ringkasan perubahan data' },
      { name: 'ip', type: 'text', nullability: 'NULLABLE', desc: 'Alamat IP pengguna' },
      { name: 'created_at', type: 'timestamptz', nullability: 'DEFAULT now()', desc: 'Waktu pencatatan (Immutable / Append-Only)' }
    ])
  );

  content.push(new Paragraph({ children: [new PageBreak()] }));

  // ===========================================================================
  // BAB 7: KEBUTUHAN NON-FUNGSIONAL, KEAMANAN & INTEGRITAS
  // ===========================================================================
  content.push(
    createHeading1('BAB 7: KEBUTUHAN NON-FUNGSIONAL, KEAMANAN & INTEGRITAS'),
    createHeading2('7.1 Standar Keamanan & Perlindungan Data'),
    createBulletItem('bullet-list', 'Sesi dilindungi access token JWT berdurasi 15 menit dan refresh token dalam cookie HttpOnly dengan rotasi otomatis.', { boldPrefix: '7.1.1 Autentikasi: ' }),
    createBulletItem('bullet-list', 'Seluruh query SQL pada backend wajib menggunakan parameterized bindings ($1, $2, ...) melalui koneksi pool terisolasi. Konkatenasi mentah string SQL dilarang keras.', { boldPrefix: '7.1.2 Parameterized SQL: ' }),
    createBulletItem('bullet-list', 'Setiap mutasi data penting dicatat pada tabel audit_logs yang dijaga oleh trigger trg_audit_logs_immutable (upaya UPDATE atau DELETE akan dibatalkan otomatis oleh database).', { boldPrefix: '7.1.3 Immutable Audit Trail: ' }),
    createHeading2('7.2 Integritas Dokumen & Validasi Publik Tanpa Login'),
    createParagraph(
      'Setiap dokumen resmi yang diterbitkan (LHPP dan BAP) dilengkapi dengan mekanisme verifikasi digital:'
    ),
    createBulletItem('bullet-list', 'Seluruh isi dokumen dihitung nilai hash SHA-256 saat finalisasi.', { boldPrefix: '1. Hash Kriptografis: ' }),
    createBulletItem('bullet-list', 'Setiap dokumen memiliki kode acak unik (mis: VER-BAP-XXXX) yang dicetak bersama QR Code pada lembar dokumen.', { boldPrefix: '2. Kode Verifikasi: ' }),
    createBulletItem('bullet-list', 'Pihak Disnaker, Klien, atau Auditor Independen dapat memindai QR Code tersebut menggunakan smartphone tanpa perlu login akun, dan langsung melihat keabsahan status dokumen, tanggal inspeksi, nama Ahli K3 pemeriksa, dan kesimpulan resmi.', { boldPrefix: '3. Portal Validasi Publik: ' }),
    createHeading2('7.3 Kesiapan Offline Lapangan & Kompresi Berkas'),
    createBulletItem('bullet-list', 'Inspector di area bawah tanah (basement), remote plant, atau ruang boiler tanpa koneksi internet dapat tetap mengisi checklist dengan autosave memori lokal.', { boldPrefix: 'Offline-First: ' }),
    createBulletItem('bullet-list', 'Foto dokumentasi dikompresi di sisi browser menjadi resolusi proporsional (maks 1600px, kualitas JPEG 80%) sebelum diunggah ke server.', { boldPrefix: 'Optimalisasi Berkas: ' })
  );

  // ===========================================================================
  // BAB 8: STATUS IMPLEMENTASI AKTUAL & KESIMPULAN
  // ===========================================================================
  content.push(
    createHeading1('BAB 8: STATUS IMPLEMENTASI AKTUAL & KESIMPULAN'),
    createParagraph(
      'Seluruh arsitektur yang didefinisikan pada PRD v2.0 ini telah diimplementasikan secara konkret pada basis kode repository PT Upaya Riksa Daya:'
    )
  );

  const statusWidths = [3360, 2400, 3600];
  content.push(
    new Table({
      columnWidths: statusWidths,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            createCell('Modul Fitur Utama', statusWidths[0], { isHeader: true }),
            createCell('Status Implementasi', statusWidths[1], { isHeader: true }),
            createCell('Catatan Verifikasi QA', statusWidths[2], { isHeader: true })
          ]
        }),
        new TableRow({
          children: [
            createCell('4 Peran (Marketing, Inspector, Pimpinan, Admin)', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Diverifikasi via migrasi 011 & suite uji RBAC', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Pimpinan Strictly Read-Only', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Seluruh mutasi diblokir 403 MANAGER_READ_ONLY', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Inversi Dokumen: LHPP Dahulu -> BAP', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('LHPP terbit otomatis pasca submit form, baru kemudian BAP', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Multi-Unit PO & Completion Gate', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('PO hanya SELESAI jika seluruh unit tuntas', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Kanvas Tanda Tangan Digital Dua Pihak', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Inspector + PIC Klien tersimpan sebagai vektor PNG', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Document Distribution Tracker (Klien & Disnaker)', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Tabel document_distributions & antarmuka aktif', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Verifikasi Publik QR Code & SHA-256', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Dapat divalidasi publik melalui portal /verify', statusWidths[2])
          ]
        }),
        new TableRow({
          children: [
            createCell('Pengingat Suket K3 (H-90 s/d H0)', statusWidths[0], { isBold: true }),
            createCell('SELESAI (100%)', statusWidths[1], { isBold: true, fontColor: '047857' }),
            createCell('Simulasi tercatat tanpa duplikasi riwayat', statusWidths[2])
          ]
        })
      ]
    })
  );

  content.push(
    createParagraph('', { before: 200, after: 100 }),
    createParagraph('Disahkan di Jakarta, 30 Oktober 2026', { bold: true, align: AlignmentType.RIGHT }),
    createParagraph('Direksi & Tim Pengembang PT Upaya Riksa Daya', { italic: true, align: AlignmentType.RIGHT })
  );

  // BUILD DOCUMENT
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Arial', size: 22, color: '1E293B' }
        }
      },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          run: { size: 36, bold: true, color: BRAND_RED, font: 'Arial' },
          paragraph: { spacing: { before: 200, after: 120 }, alignment: AlignmentType.CENTER }
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, color: BRAND_RED, font: 'Arial' },
          paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 0 }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, color: BRAND_DARK, font: 'Arial' },
          paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 20, bold: true, color: '334155', font: 'Arial' },
          paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 }
        }
      ]
    },
    numbering: { config: numberingConfig },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: 'PT Upaya Riksa Daya | Product Requirements Document v2.0',
                    size: 16,
                    color: BRAND_MUTED,
                    font: 'Arial'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 120 },
                children: [
                  new TextRun({ text: 'Halaman ', size: 16, color: BRAND_MUTED, font: 'Arial' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: BRAND_MUTED, font: 'Arial' }),
                  new TextRun({ text: ' dari ', size: 16, color: BRAND_MUTED, font: 'Arial' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: BRAND_MUTED, font: 'Arial' })
                ]
              })
            ]
          })
        },
        children: content
      }
    ]
  });

  const outDocxPath = path.resolve(__dirname, '../PRODUCT_REQUIREMENTS_DOCUMENT_PT_UPAYA_RIKSA_DAYA_V2.0.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outDocxPath, buffer);
  console.log(`✓ File Word (.docx) berhasil dibuat: ${outDocxPath} (${buffer.length} byte)`);
}

generatePrdDocx().catch((err) => {
  console.error('Error generating PRD Word document:', err);
  process.exit(1);
});
