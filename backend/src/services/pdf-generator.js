import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { env } from '../config/env.js';
import { resolveAttachmentPath } from '../storage/file-storage.js';
import { getCompanyProfile } from './system-settings-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const officialLogoPath = path.resolve(__dirname, '../../../logo-urd.png');

// Lampiran diambil dari halaman SKP pada contoh LHPP tiap bidang.
// Ganti atau tambah file di folder bidang ini saat tersedia dokumen terbaru.
const LHPP_SKP_APPENDIX_FILES = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../assets/lhpp/skp/manifest.json'), 'utf8')
);

function getLhppSkpAppendixPaths(categoryCode) {
  return (LHPP_SKP_APPENDIX_FILES[categoryCode] || []).map((fileName) =>
    path.resolve(__dirname, '../assets/lhpp/skp', categoryCode, fileName)
  ).filter((filePath) => fs.existsSync(filePath));
}

function drawCompanyHeader(doc, subtitle, profile = null) {
  if (fs.existsSync(officialLogoPath)) {
    doc.image(officialLogoPath, 45, 36, { width: 68 });
  }
  const companyName = profile?.company_name || 'PT UPAYA RIKSA DAYA';
  const tagline = profile?.tagline || 'Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian';
  const email = profile?.email || 'urd@upayariksadaya.com';
  const phone = profile?.phone || '(021) 489 1409';
  const web = profile?.website ? profile.website.replace(/^https?:\/\//, '') : 'upayariksadaya.com';

  doc
    .fillColor('#1D1414')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(companyName, 125, 40)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#324A6D')
    .text(tagline, 125, 58)
    .text(`Email: ${email}  |  Telp: ${phone}  |  ${web}`, 125, 71);

  doc
    .moveTo(45, 94)
    .lineTo(550, 94)
    .lineWidth(1.5)
    .strokeColor('#C81E1E')
    .stroke();

  doc.y = 104;

  if (subtitle) {
    doc
      .fillColor('#1D1414')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(subtitle, 45, 104, { align: 'center', width: 505 });
    doc.moveDown(0.5);
  }
}

function drawCompanyFooter(doc, yPos = 770, profile = null) {
  doc
    .moveTo(45, yPos)
    .lineTo(550, yPos)
    .lineWidth(0.8)
    .strokeColor('#C8D5DC')
    .stroke();
  const companyName = profile?.company_name || 'PT Upaya Riksa Daya';
  const email = profile?.email || 'urd@upayariksadaya.com';
  const phone = profile?.phone || '(021) 489 1409';
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor('#324A6D')
    .text(
      `${companyName} | PJK3 Pemeriksaan & Pengujian K3 | ${email} | ${phone}`,
      45,
      yPos + 5,
      { align: 'center', width: 505 }
    );
}

const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const TEMPLATE_BAP_COLUMNS = [
  [
    'Pemeriksaan Data & Gambar',
    'Uji Beban',
    'Pemeriksaan Area / Lokasi',
    'Pengukuran Pencahayaan',
    'Pemeriksaan Down Conductor',
    'Pengujian Alarm Kebakaran',
    'Pemeriksaan Ruang Mesin',
    'Pemeriksaan Ruang Luncur',
    'Uji Tarik Angkur/Lifeline',
    'Pemeriksaan Panel MCFA'
  ],
  [
    'Pemeriksaan Visual',
    'Pengukuran Dimensi',
    'Pengukuran Kebisingan',
    'Pengukuran Thermal',
    'Pemeriksaan Air Terminal',
    'Pengujian Sprinkler',
    'Pemeriksaan Atas Sangkar',
    'Pengujian Wall Thickness',
    'Pemeriksaan Pillar & Nozzle',
    'Pemeriksaan ARD'
  ],
  [
    'Uji Fungsi',
    'NDT PT/MPI',
    'Pengukuran Getaran',
    'Pengukuran Grounding',
    'Pengujian APAR',
    'Pengujian Hydrant',
    'Pemeriksaan Pit',
    'Pengujian Safety Device'
  ]
];

function renderSingleBapPage(doc, bap, qrBuffer, companyProfile = null) {
  const companyName = companyProfile?.company_name || 'PT. UPAYA RIKSA DAYA';
  // 1. Kop sesuai template resmi Berita Acara Riksa Uji PT. UPAYA RIKSA DAYA
  // Bar merah marun di sisi kiri + Nama PT. UPAYA RIKSA DAYA + Logo resmi di kanan atas
  doc.rect(45, 42, 260, 16).fillColor('#8B262B').fill();

  doc
    .font('Times-Roman')
    .fontSize(12.5)
    .fillColor('#1D1414')
    .text(companyName.toUpperCase(), 315, 43, { width: 145, align: 'left' });

  doc
    .moveTo(315, 58)
    .lineTo(453, 58)
    .lineWidth(0.8)
    .strokeColor('#1D1414')
    .stroke();

  if (fs.existsSync(officialLogoPath)) {
    doc.image(officialLogoPath, 462, 32, { width: 82 });
  }

  // Judul utama & nomor BAP di atas garis titik-titik
  doc
    .font('Times-Bold')
    .fontSize(14)
    .fillColor('#1D1414')
    .text('BERITA ACARA RIKSA UJI', 45, 76, { align: 'center', width: 455 });

  doc
    .font('Times-Roman')
    .fontSize(9.5)
    .fillColor('#1D1414')
    .text(
      `No: ${bap.bap_no || '...................................................'}`,
      45,
      95,
      { align: 'center', width: 455 }
    );

  if (qrBuffer) {
    doc.image(qrBuffer, 505, 77, { width: 40, height: 40 });
    doc.font('Times-Roman').fontSize(6).fillColor('#475569')
      .text('Verifikasi', 500, 119, { align: 'center', width: 50 });
  }

  // 2. Kalimat Pembuka (Hari, Tanggal, Bulan, Tahun)
  const dObj = bap.inspection_date ? new Date(bap.inspection_date) : new Date();
  const validDate = Number.isNaN(dObj.getTime()) ? new Date() : dObj;
  const dayName = INDONESIAN_DAYS[validDate.getDay()];
  const dayNum = String(validDate.getDate()).padStart(2, '0');
  const monthName = INDONESIAN_MONTHS[validDate.getMonth()];
  const yearFull = String(validDate.getFullYear());

  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#1D1414')
    .text(
      `Pada hari ini ${dayName}, Tanggal ${dayNum} Bulan ${monthName} Tahun ${yearFull} telah dilaksanakan pekerjaan pemeriksaan dan pengujian (riksa uji) oleh ${companyName} pada :`,
      45,
      118,
      { width: 505, lineGap: 2 }
    );

  // 3. Identitas Objek & Perusahaan (dengan garis titik-titik sesuai form asli)
  const identityRows = [
    ['Objek Periksa', `${bap.object_name || '-'} (${bap.category_code || '-'})`],
    ['Nama Perusahaan', bap.client_name || '-'],
    ['Alamat Perusahaan', bap.client_address || bap.location_address || '-'],
    [
      'Pabrik Pembuat/Tahun',
      `${bap.manufacturer || bap.brand || '-'} / ${bap.manufacture_year || '-'}`
    ],
    [
      'Nomor Seri/Kapasitas',
      `${bap.serial_number || '-'} / ${bap.capacity || '-'}${bap.capacity_unit ? ` ${bap.capacity_unit}` : ''}`
    ],
    [
      'Lokasi Pemeriksaan',
      `${bap.install_location || bap.location_name || '-'}${bap.po_number ? ` (PO: ${bap.po_number})` : ''}`
    ]
  ];

  let rowY = 154;
  for (const [label, value] of identityRows) {
    doc
      .font('Times-Roman')
      .fontSize(10)
      .fillColor('#1D1414')
      .text(label, 45, rowY, { width: 118 })
      .text(':', 163, rowY);

    // Garis titik-titik latar
    doc
      .font('Times-Roman')
      .fontSize(9)
      .fillColor('#94A3B8')
      .text(
        '................................................................................................................................................',
        172,
        rowY + 1,
        { width: 378, lineBreak: false }
      );

    doc
      .font('Times-Bold')
      .fontSize(9.5)
      .fillColor('#1D1414')
      .text(String(value ?? '-'), 174, rowY - 0.5, { width: 374, lineBreak: false });

    rowY += 16;
  }

  // 4. Lingkup Riksa Uji (3 Kolom Checkbox persis sesuai template)
  const scopeTop = rowY + 2;
  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#1D1414')
    .text('Lingkup Riksa Uji', 45, scopeTop)
    .text(':', 163, scopeTop);

  const rawScopes = Array.isArray(bap.scope_items) ? bap.scope_items : [];
  const normalizedSelected = new Set(rawScopes.map((s) => String(s).trim().toLowerCase()));
  const flatStandard = TEMPLATE_BAP_COLUMNS.flat().map((s) => s.toLowerCase());
  const customScopes = rawScopes.filter(
    (s) => !flatStandard.includes(String(s).trim().toLowerCase())
  );

  const col3WithCustom = [
    ...TEMPLATE_BAP_COLUMNS[2],
    customScopes[0] || '...........................',
    customScopes[1] || '...........................'
  ];
  const columns = [TEMPLATE_BAP_COLUMNS[0], TEMPLATE_BAP_COLUMNS[1], col3WithCustom];
  const colXPositions = [172, 305, 434];
  const colWidths = [130, 126, 118];

  for (let cIdx = 0; cIdx < 3; cIdx += 1) {
    const colItems = columns[cIdx];
    const colX = colXPositions[cIdx];
    const colW = colWidths[cIdx];
    for (let rIdx = 0; rIdx < colItems.length; rIdx += 1) {
      const label = colItems[rIdx];
      const y = scopeTop + rIdx * 13.2;
      const isCustomPlaceholder = label.startsWith('....');
      const isChecked =
        !isCustomPlaceholder &&
        (normalizedSelected.has(label.toLowerCase()) ||
          (label === 'Pemeriksaan Data & Gambar' &&
            normalizedSelected.has('pemeriksaan dokumen')));

      doc
        .rect(colX, y + 1.5, 7.5, 7.5)
        .lineWidth(0.7)
        .strokeColor(isChecked ? '#C81E1E' : '#1D1414')
        .stroke();

      if (isChecked) {
        doc
          .font('Helvetica-Bold')
          .fontSize(7)
          .fillColor('#C81E1E')
          .text('v', colX + 1.6, y + 1);
      }

      doc
        .font(isChecked ? 'Times-Bold' : 'Times-Roman')
        .fontSize(8.2)
        .fillColor('#1D1414')
        .text(label, colX + 10.5, y + 0.5, { width: colW - 11, lineBreak: false });
    }
  }

  // 5. Hasil Riksa Uji
  const resultTop = scopeTop + 138;
  doc
    .font('Times-Roman')
    .fontSize(10.5)
    .fillColor('#1D1414')
    .text('Hasil Riksa Uji', 45, resultTop);

  const resultBoxTop = resultTop + 14;
  doc.rect(45, resultBoxTop, 505, 34).lineWidth(0.9).strokeColor('#1D1414').stroke();

  const isNotCompliant = bap.conclusion === 'TIDAK_MEMENUHI_SYARAT';
  doc
    .font('Times-Roman')
    .fontSize(9.5)
    .fillColor('#1D1414')
    .text(
      'Berdasarkan hasil riksa uji, dapat disimpulkan unit tersebut ',
      53,
      resultBoxTop + 6,
      { continued: true, width: 490 }
    )
    .font(isNotCompliant ? 'Times-Roman' : 'Times-Bold')
    .fillColor(isNotCompliant ? '#94A3B8' : '#065F46')
    .text('MEMENUHI', { continued: true, strike: isNotCompliant })
    .font('Times-Roman')
    .fillColor('#1D1414')
    .text(' / ', { continued: true, strike: false })
    .font(isNotCompliant ? 'Times-Bold' : 'Times-Roman')
    .fillColor(isNotCompliant ? '#991B1B' : '#94A3B8')
    .text('TIDAK MEMENUHI', { continued: true, strike: !isNotCompliant })
    .font('Times-Roman')
    .fillColor('#1D1414')
    .text(' Persyaratan Keselamatan dan Kesehatan Kerja.', { strike: false });

  // 6. Catatan (Kotak dengan baris titik-titik seperti pada template asli)
  const notesTop = resultBoxTop + 42;
  doc
    .font('Times-Roman')
    .fontSize(10.5)
    .fillColor('#1D1414')
    .text('Catatan', 45, notesTop);

  const notesBoxTop = notesTop + 14;
  const notesBoxHeight = 106;
  doc.rect(45, notesBoxTop, 505, notesBoxHeight).lineWidth(0.9).strokeColor('#1D1414').stroke();

  for (let lineIdx = 0; lineIdx < 6; lineIdx += 1) {
    const dotY = notesBoxTop + 14 + lineIdx * 15;
    doc
      .font('Times-Roman')
      .fontSize(8.5)
      .fillColor('#CBD5E1')
      .text(
        '................................................................................................................................................................................',
        53,
        dotY,
        { width: 488, lineBreak: false }
      );
  }

  doc
    .font('Times-Roman')
    .fontSize(9.2)
    .fillColor('#1D1414')
    .text(
      bap.notes ||
        bap.conclusion_notes ||
        'Pemeriksaan dan pengujian telah dilaksanakan sesuai standar K3.',
      55,
      notesBoxTop + 9,
      { width: 485, height: notesBoxHeight - 16, lineGap: 4.5 }
    );

  // 7. Kotak Tanda Tangan Terpadu (Inspector di kiri & Pemilik Alat / Unit di kanan)
  const sigTop = notesBoxTop + notesBoxHeight + 8;
  const sigHeight = 96;
  doc.rect(45, sigTop, 505, sigHeight).lineWidth(0.9).strokeColor('#1D1414').stroke();

  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#1D1414')
    .text('Inspector', 55, sigTop + 6, { align: 'center', width: 220 })
    .text('Pemilik Alat / Unit', 315, sigTop + 6, { align: 'center', width: 220 });

  // Cap / Watermark Logo PT. UPAYA RIKSA DAYA pada area Inspector sesuai template
  if (fs.existsSync(officialLogoPath)) {
    doc.save();
    doc.opacity(0.22);
    doc.image(officialLogoPath, 132, sigTop + 24, { width: 66 });
    doc.restore();
  }

  if (bap.inspector_signature_path && fs.existsSync(bap.inspector_signature_path)) {
    try {
      doc.image(bap.inspector_signature_path, 125, sigTop + 24, { width: 80, height: 42 });
    } catch {
      // Abaikan jika berkas tanda tangan gagal dimuat
    }
  }

  if (bap.client_signature_path && fs.existsSync(bap.client_signature_path)) {
    try {
      doc.image(bap.client_signature_path, 385, sigTop + 24, { width: 80, height: 42 });
    } catch {
      // Abaikan jika berkas tanda tangan gagal dimuat
    }
  }

  const inspDisplayName =
    bap.inspector_signer_name || bap.inspector_name || '........................................';
  const clientDisplayName =
    bap.client_signer_name || '........................................';

  doc
    .font('Times-Roman')
    .fontSize(9.5)
    .fillColor('#1D1414')
    .text(`(   ${inspDisplayName}   )`, 55, sigTop + 75, { align: 'center', width: 220 })
    .text(`(   ${clientDisplayName}   )`, 315, sigTop + 75, { align: 'center', width: 220 });

  // 8. Kalimat Penutup & Alamat Kantor Resmi Sesuai Template
  const closingTop = sigTop + sigHeight + 7;
  doc
    .font('Times-Roman')
    .fontSize(8.8)
    .fillColor('#1D1414')
    .text(
      'Hasil pemeriksaan ini dilakukan sesuai dengan kenyataan yang ada pada saat pemeriksaan dan pengujian unit dilapangan tanpa ada pengaruh dari pihak manapun.',
      45,
      closingTop,
      { width: 505 }
    )
    .text(
      'Demikian berita acara pemeriksaan ini dibuat dan ditandatangani oleh kedua bela pihak untuk dipergunakan sebagaimana mestinya.',
      45,
      closingTop + 22,
      { width: 505 }
    );

  const footerAddrTop = closingTop + 48;
  const addrText = companyProfile?.address || 'Jl. Pondasi No. 50B Kel. Kayu Putih Kec. Pulo Gadung Jakarta Timur 13210';
  const phoneText = companyProfile?.phone ? `ph. ${companyProfile.phone}` : 'ph. 021.4891409, 4715699, 47861912 Fax. 021.47865925';
  const emailText = companyProfile?.email ? `Email. ${companyProfile.email}` : 'Email. urd@upayariksadaya.com, upayariksadaya@gmail.com';
  const webText = companyProfile?.website ? `Website. ${companyProfile.website.replace(/^https?:\/\//, '')}` : 'Website. www.upayariksadaya.com';

  doc
    .font('Times-Roman')
    .fontSize(7.8)
    .fillColor('#1D1414')
    .text(addrText, 45, footerAddrTop, { align: 'center', width: 505 })
    .text(phoneText, 45, footerAddrTop + 10, { align: 'center', width: 505 })
    .text(emailText, 45, footerAddrTop + 20, { align: 'center', width: 505 })
    .text(webText, 45, footerAddrTop + 30, { align: 'center', width: 505 });
}

export async function generateBapPdfBuffer(bapInput) {
  const companyProfile = await getCompanyProfile().catch(() => null);
  const companyName = companyProfile?.company_name || 'PT UPAYA RIKSA DAYA';
  const bapList = Array.isArray(bapInput) ? bapInput : [bapInput];
  const qrBuffers = await Promise.all(
    bapList.map((b) => {
      const qrText = b.verification_code
        ? `https://upayariksadaya.com/verifikasi/${b.verification_code}`
        : `${companyName} | BAP: ${b.bap_no || 'DRAF'} | PO: ${b.po_number || b.order_no || '-'} | SN: ${b.serial_number || '-'}`;
      return QRCode.toBuffer(qrText, { width: 84, margin: 1 });
    })
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    bapList.forEach((bap, idx) => {
      if (idx > 0) doc.addPage();
      renderSingleBapPage(doc, bap, qrBuffers[idx], companyProfile);
    });

    doc.end();
  });
}

const LHPP_CATEGORY_CONFIG = {
  PAA: {
    pageSize: [615.24, 921.36],
    fullName: 'PESAWAT ANGKAT DAN PESAWAT ANGKUT',
    coverTitle: 'PESAWAT ANGKAT DAN PESAWAT ANGKUT',
    specialistTitle: 'Ahli K3 Pesawat Angkat dan Angkut',
    standardRef: 'Permenaker No. 08 Tahun 2020',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. PEMERIKSAAN VISUAL',
      'IV. TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'jenis_pesawat', label: 'Jenis Pesawat' },
      { key: 'pabrik_pembuat_hoist', label: 'Pabrik Pembuat Hoist / Unit' },
      { key: 'swl', label: 'Kapasitas Angkat Aman (SWL)' },
      { key: 'span', label: 'Panjang Bentang (Span)' },
      { key: 'lifting_height', label: 'Tinggi Angkat' },
      { key: 'runway_length', label: 'Panjang Lintasan (Runway)' },
      { key: 'hoist_speed', label: 'Kecepatan Hoisting' },
      { key: 'travel_speed', label: 'Kecepatan Traversing / Travelling' },
      { key: 'drive_type', label: 'Tipe Penggerak' },
      { key: 'brake_type', label: 'Sistem Pengereman' },
      { key: 'hook_type', label: 'Tipe & Kapasitas Kait (Hook)' },
      { key: 'lifting_media', label: 'Media Angkat (Rantai / Wire Rope)' },
      { key: 'standard_ref', label: 'Standar Rujukan K3' },
      { key: 'konstruksi_utama', label: 'Kondisi Konstruksi & Struktur Utama' },
      { key: 'sistem_penggerak', label: 'Sistem Mekanisme Angkat, Wire Rope / Rantai & Kait' },
      { key: 'uji_beban_dinamis', label: 'Hasil Uji Beban Dinamis & Statis (Defleksi)' },
      { key: 'safety_device_paa', label: 'Fungsi Limit Switch, Rem & Overload Limiter' }
    ],
    rules: [
      '1. Unit harus dioperasikan oleh Operator yang telah memiliki Sertifikat K3 dan SIO (Surat Izin Operasi) resmi dari Kemenaker R.I.',
      '2. Dilarang mengoperasikan unit melebihi kapasitas beban maksimum yang diizinkan (Safe Working Load / SWL).',
      '3. Lakukan pemeriksaan dan pengujian berkala paling lambat sesuai batas rekomendasi pemeriksaan berikutnya.'
    ]
  },
  PUBT: {
    pageSize: [615.24, 921.36],
    fullName: 'BEJANA TEKANAN DAN TANGKI TIMBUN',
    coverTitle: 'BEJANA TEKAN & TANGKI TIMBUN',
    specialistTitle: 'Ahli K3 Pesawat Uap dan Bejana Tekan',
    standardRef: 'Permenaker No. 37 Tahun 2016 & ASME Sec. VIII Div. 1',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. PEMERIKSAAN DAN PENGUJIAN',
      'IV. HASIL UKUR, TEMUAN & REKOMENDASI',
      'VII. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'jenis_bejana', label: 'Jenis Bejana Tekan' },
      { key: 'bentuk_bejana', label: 'Bentuk Bejana (Vertikal / Horizontal)' },
      { key: 'pabrik_pembuat', label: 'Pabrik Pembuat Bejana' },
      { key: 'tahun_pembuatan', label: 'Tahun Pembuatan' },
      { key: 'design_pressure', label: 'Tekanan Desain (Design Pressure)' },
      { key: 'test_pressure', label: 'Tekanan Uji Hidrostatis (Hydrotest Pressure)' },
      { key: 'max_allowable_working_pressure', label: 'Tekanan Kerja Maksimum (MAWP)' },
      { key: 'volume_kapasitas', label: 'Volume Kapasitas Bejana' },
      { key: 'fluida_isinya', label: 'Fluida yang Diisikan' },
      { key: 'shell_plate_spec', label: 'Spesifikasi Material Shell Plate' },
      { key: 'head_plate_spec', label: 'Spesifikasi Material Head Plate' },
      { key: 'diameter_dalam', label: 'Diameter Dalam (ID)' },
      { key: 'shell_nominal_thk', label: 'Tebal Nominal Dinding Shell' },
      { key: 'head_nominal_thk', label: 'Tebal Nominal Dinding Head' },
      { key: 'safety_valve_set_pressure', label: 'Setting Tekanan Katup Pengaman (Safety Valve)' },
      { key: 'standard_ref', label: 'Standar Rujukan K3 & Desain' },
      { key: 'ketebalan_dinding', label: 'Hasil Pengukuran Ketebalan Dinding (Ultrasonic Wall Thickness)' },
      { key: 'pengujian_ndt', label: 'Hasil Pemeriksaan NDT Sambungan Las & Shell' },
      { key: 'safety_valve_pubt', label: 'Pengujian Katup Pengaman (Safety Valve), Pressure Gauge & Hydrotest' }
    ],
    rules: [
      '1. Bejana tekan dilarang dioperasikan melebihi Tekanan Kerja Maksimum yang Diizinkan (MAWP).',
      '2. Katup pengaman (safety valve) dan alat penunjuk tekanan (pressure gauge) harus selalu berfungsi baik, terkalibrasi, dan tidak boleh disumbat atau diubah tekanannya.',
      '3. Lakukan pengurasan air kondensat secara berkala melalui drain cock serta lakukan pemeriksaan dan pengujian berkala sesuai Permenaker No. 37 Tahun 2016.'
    ]
  },
  PTP: {
    pageSize: [615.2, 921.4],
    fullName: 'PESAWAT TENAGA DAN PRODUKSI',
    coverTitle: 'PESAWAT TENAGA DAN PRODUKSI',
    specialistTitle: 'Ahli K3 Pesawat Tenaga dan Produksi',
    standardRef: 'Permenaker No. 38 Tahun 2016',
    sectionTitles: [
      'I. DATA UMUM',
      'A. SPESIFIKASI MESIN',
      'III. PEMERIKSAAN, PENGUKURAN & PENGUJIAN',
      'IV. TEMUAN & REKOMENDASI',
      'V. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'jenis_pesawat', label: 'Jenis Pesawat Tenaga & Produksi' },
      { key: 'tipe_mesin', label: 'Tipe / Model Mesin' },
      { key: 'pabrik_pembuat', label: 'Pabrik Pembuat & Negara' },
      { key: 'nomor_seri', label: 'Nomor Seri Mesin / Engine' },
      { key: 'tahun_pembuatan', label: 'Tahun Pembuatan' },
      { key: 'kapasitas_daya', label: 'Kapasitas Daya / Output (kW / kVA / HP)' },
      { key: 'putaran_rpm', label: 'Kecepatan Putaran (RPM)' },
      { key: 'tegangan_voltase', label: 'Tegangan Operasi (Volt)' },
      { key: 'sistem_transmisi', label: 'Sistem Transmisi (Sabuk / Rantai / Roda Gigi)' },
      { key: 'safety_device_interlock', label: 'Alat Pengaman, Guarding & Emergency Stop' },
      { key: 'kebisingan_dba', label: 'Tingkat Kebisingan Lingkungan Kerja (dBA)' },
      { key: 'standard_ref', label: 'Standar Rujukan K3' },
      { key: 'kondisi_mesin', label: 'Kondisi Fisik Mesin, Pondasi & Transmisi Sabuk/Roda Gigi' },
      { key: 'pengukuran_lingkungan', label: 'Hasil Pengukuran Kebisingan, Getaran & Pencahayaan Area' },
      { key: 'sistem_proteksi', label: 'Pelindung Bagian Berputar, Emergency Stop & Safety Device' }
    ],
    rules: [
      '1. Operator pesawat tenaga dan produksi harus memiliki kompetensi K3 serta memahami prosedur pengoperasian aman dan penanganan darurat.',
      '2. Seluruh penutup pengaman bagian berputar (safety guarding) dan tombol darurat (emergency stop) harus selalu terpasang sempurna dan berfungsi aktif saat mesin beroperasi.',
      '3. Lakukan pemeliharaan berkala terhadap sistem pelumasan, transmisi, dan peredaman getaran/kebisingan sesuai ketentuan Permenaker No. 38 Tahun 2016.'
    ]
  },
  IPP: {
    pageSize: [615.24, 921.36],
    fullName: 'INSTALASI PENYALUR PETIR',
    coverTitle: 'INSTALASI PENYALUR PETIR',
    specialistTitle: 'Ahli K3 Instalasi Penyalur Petir dan Listrik',
    standardRef: 'Permenaker No. 02/MEN/1989 & Permenaker No. 31 Tahun 2015',
    sectionTitles: [
      'I. DATA UMUM',
      'II. SPESIFIKASI & ALAT UKUR',
      'III. HASIL INSPEKSI VISUAL & PENGUJIAN',
      'IV. TEMUAN & SYARAT',
      'VII. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'jenis_instalasi', label: 'Jenis Sistem Penyalur Petir (Konvensional / Elektrostatis)' },
      { key: 'tipe_air_terminal', label: 'Tipe Air Terminal / Penangkal Petir' },
      { key: 'merk_air_terminal', label: 'Merk & Pabrik Pembuat Air Terminal' },
      { key: 'radius_proteksi', label: 'Radius Proteksi (m)' },
      { key: 'tinggi_gedung', label: 'Tinggi Bangunan Gedung (m)' },
      { key: 'tinggi_finial', label: 'Tinggi Finial / Tiang Penyangga (m)' },
      { key: 'jumlah_down_conductor', label: 'Jumlah Penghantar Turun (Down Conductor)' },
      { key: 'jenis_hantaran', label: 'Jenis Penghantar (Kabel BC / Tembaga / NYA)' },
      { key: 'penampang_kabel', label: 'Luas Penampang Kabel (mm²)' },
      { key: 'jumlah_bak_kontrol', label: 'Jumlah Bak Kontrol Pemeriksaan' },
      { key: 'jumlah_elektroda', label: 'Jumlah Batang Elektroda Pembumian' },
      { key: 'hasil_tahanan_tanah', label: 'Hasil Pengukuran Tahanan Pembumian Aktual (Ohm)' },
      { key: 'standard_ref', label: 'Standar Rujukan K3' },
      { key: 'air_terminal_detail', label: 'Kondisi Air Terminal & Tiang Penyangga Atap' },
      { key: 'down_conductor_detail', label: 'Kontinuitas Hantaran Turun (Down Conductor) & Sambungan Ukur' },
      { key: 'grounding_petir', label: 'Hasil Pengukuran Tahanan Pembumian Elektrode Penyalur Petir (Ohm)' }
    ],
    rules: [
      '1. Nilai tahanan pembumian (grounding) harus selalu dipelihara di bawah batas maksimum 5 Ohm sesuai Permenaker No. 02/MEN/1989.',
      '2. Bak kontrol dan sambungan ukur (test joint) harus selalu dalam kondisi bersih, mudah diakses, tidak tertutup lantai permanen, dan bebas genangan air.',
      '3. Lakukan pemeriksaan visual jalur konduktor dan pengukuran nilai tahanan tanah berkala sekurang-kurangnya 1 (satu) kali setahun atau setelah mengalami sambaran petir langsung.'
    ]
  },
  LIS: {
    pageSize: [615.12, 921.36],
    fullName: 'INSTALASI LISTRIK',
    coverTitle: 'INSTALASI LISTRIK',
    specialistTitle: 'Ahli K3 Bidang Listrik',
    standardRef: 'Permenaker No. 12 Tahun 2015 & SNI 0225:2011 (PUIL 2011)',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. HASIL PEMERIKSAAN & PENGUKURAN',
      'IV. TEMUAN & REKOMENDASI',
      'V. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'nama_panel', label: 'Nama / Kode Identitas Panel' },
      { key: 'lokasi_panel', label: 'Lokasi Penempatan Ruang Panel' },
      { key: 'kapasitas_daya_kva', label: 'Kapasitas Daya Beban (kVA)' },
      { key: 'tegangan_operasi', label: 'Tegangan Operasi (V)' },
      { key: 'arus_nominal', label: 'Arus Nominal Pemutus Utama (A)' },
      { key: 'tipe_pemutus_utama', label: 'Tipe Pemutus Arus Utama (ACB / MCCB / MCB)' },
      { key: 'merk_komponen_utama', label: 'Merk Komponen Pemutus Utama' },
      { key: 'jumlah_outgoing_feeder', label: 'Jumlah Sirkuit Cabang (Outgoing Feeders)' },
      { key: 'tingkat_proteksi_ip', label: 'Tingkat Proteksi Enclosure (IP Rating)' },
      { key: 'tahanan_isolasi_fasa', label: 'Nilai Tahanan Isolasi Kabel Fasa (MegaOhm)' },
      { key: 'tahanan_pembumian_ohm', label: 'Nilai Tahanan Pembumian Panel (Ohm)' },
      { key: 'suhu_maks_koneksi', label: 'Suhu Maksimum Sambungan Termografi (°C)' },
      { key: 'standard_ref', label: 'Standar Rujukan K3' },
      { key: 'panel_dan_proteksi', label: 'Kondisi Panel LVMDP/SDP, Busbar & Sistem Proteksi Arus Lebih' },
      { key: 'tahanan_isolasi_grounding', label: 'Hasil Pengukuran Tahanan Isolasi & Tahanan Pembumian (Grounding)' },
      { key: 'termografi_listrik', label: 'Hasil Pemeriksaan Suhu Sambungan (Thermal Imaging)' }
    ],
    rules: [
      '1. Pengoperasian dan pemeliharaan instalasi listrik hanya boleh dilakukan oleh Teknisi K3 Listrik / Ahli K3 Listrik yang memiliki lisensi resmi dari Kemenaker R.I.',
      '2. Ruang penempatan panel harus memiliki sirkulasi udara yang baik, penerangan memadai, bebas genangan air, dan area depan panel bebas halangan minimal 0.75 meter.',
      '3. Sediakan APAR jenis Clean Agent / CO2 di dekat panel listrik dan lakukan pemeriksaan termovisi serta uji tahanan isolasi secara berkala sesuai PUIL 2011 dan Permenaker No. 12 Tahun 2015.'
    ]
  },
  LE: {
    pageSize: [615.24, 921.36],
    fullName: 'ELEVATOR DAN ESKALATOR',
    coverTitle: 'ELEVATOR DAN ESKALATOR',
    specialistTitle: 'Ahli K3 Elevator dan Eskalator',
    standardRef: 'Permenaker No. 06 Tahun 2017',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. PEMERIKSAAN VISUAL DAN PENGUJIAN',
      'IV. TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'jenis_pesawat', label: 'Jenis Pesawat (Passenger Lift / Bed Lift / Cargo / Eskalator)' },
      { key: 'merk_pabrik', label: 'Merk & Pabrik Pembuat' },
      { key: 'kapasitas_angkut', label: 'Kapasitas Angkut (Orang / kg)' },
      { key: 'kecepatan_nominal', label: 'Kecepatan Nominal Laju Kereta (m/s)' },
      { key: 'jumlah_lantai_layanan', label: 'Jumlah Lantai Layanan / Pintu' },
      { key: 'panjang_lintasan_travel', label: 'Panjang Lintasan / Travel Height (m)' },
      { key: 'sistem_penggerak', label: 'Sistem Penggerak (Traksi Geared / Gearless / Hidrolik)' },
      { key: 'tipe_mesin_traksi', label: 'Tipe & Spesifikasi Mesin Traksi' },
      { key: 'tali_penggantung', label: 'Spesifikasi Tali Kawat Baja Penggantung (Wire Rope)' },
      { key: 'tipe_pengaman_car', label: 'Tipe Rem Pengaman Sangkar (Safety Gear)' },
      { key: 'tipe_governor', label: 'Tipe Governor Kecepatan Lebih & Setting Kecepatan' },
      { key: 'interlock_pintu', label: 'Sistem Pengunci Daun Pintu (Interlock Switch)' },
      { key: 'catu_daya_darurat_ard', label: 'Automatic Rescue Device (ARD) / Catu Daya Baterai' },
      { key: 'standard_ref', label: 'Standar Rujukan K3' }
    ],
    rules: [
      '1. Pengoperasian, perawatan, dan perbaikan elevator wajib dilaksanakan oleh Teknisi K3 Elevator yang memiliki lisensi K3 dari Kemenaker R.I.',
      '2. Seluruh sistem keselamatan mekanis dan elektrik (governor, safety gear, interlock switch pintu, ARD, dan sistem intercom) harus dipastikan selalu aktif bekerja.',
      '3. Pemilik / pengelola gedung wajib melaksanakan pemeliharaan berkala dan riksa uji berkala selambat-lambatnya 1 (satu) tahun sekali sesuai Permenaker No. 06 Tahun 2017.'
    ]
  },
  IPK: {
    pageSize: [609.6, 935.52],
    fullName: 'INSTALASI PROTEKSI KEBAKARAN',
    coverTitle: 'INSTALASI PROTEKSI KEBAKARAN',
    specialistTitle: 'Ahli K3 Bidang Penanggulangan Kebakaran',
    standardRef: 'Permenaker No. 02/MEN/1983 & Permenaker No. 04/MEN/1980',
    sectionTitles: [
      'III. DATA UMUM',
      'SPESIFIKASI TEKNIK INSTALASI',
      'PEMERIKSAAN DAN PENGUJIAN INSTALASI FIRE ALARM',
      'HASIL PEMERIKSAAN, TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'item_no', label: 'Nomor Unit / Tag Klien (Item No)' },
      { key: 'jenis_instalasi', label: 'Jenis Sistem Proteksi Kebakaran (Alarm / Hydrant / Sprinkler)' },
      { key: 'merk_panel_mcfa', label: 'Merk & Tipe Panel MCFA' },
      { key: 'tipe_sistem', label: 'Tipe Sistem Alarm (Addressable / Semi-Addressable / Konvensional)' },
      { key: 'kapasitas_zona', label: 'Kapasitas Loop / Zona Panel' },
      { key: 'jumlah_smoke_detector', label: 'Jumlah Titik Detektor Asap (Smoke Detector)' },
      { key: 'jumlah_heat_detector', label: 'Jumlah Titik Detektor Panas (Heat Detector)' },
      { key: 'jumlah_mcp', label: 'Jumlah Titik Panggil Manual (Manual Call Point)' },
      { key: 'jumlah_alarm_bell_strobe', label: 'Jumlah Alarm Bell & Lampu Strobo' },
      { key: 'kapasitas_pompa_utama', label: 'Kapasitas Pompa Utama Kebakaran (GPM / kW)' },
      { key: 'tekanan_kerja_bar', label: 'Tekanan Kerja Jaringan Pipa (bar)' },
      { key: 'jumlah_pillar_hydrant', label: 'Jumlah Titik Pillar Hydrant' },
      { key: 'sebaran_apar', label: 'Jumlah & Sebaran Tabung APAR' },
      { key: 'standard_ref', label: 'Standar Rujukan K3' },
      { key: 'sistem_deteksi_mcfa', label: 'Pemeriksaan Panel MCFA, Detektor Asap/Panas & Alarm Kebakaran' },
      { key: 'sistem_hydrant_sprinkler', label: 'Pengujian Tekanan & Aliran Pompa Hydrant, Pillar, Nozzle & Sprinkler' },
      { key: 'apar_dan_evakuasi', label: 'Pemeriksaan Sebaran APAR & Sarana Proteksi Aktif' }
    ],
    rules: [
      '1. Panel kendali alarm kebakaran (MCFA) harus selalu berada dalam kondisi siaga (normal standby) dengan sistem catu daya baterai cadangan terisi penuh.',
      '2. Dilarang menghalangi jangkauan detektor, tombol darurat (manual call point), alarm bell, kotak hidran, dan tabung APAR oleh benda atau penumpukan barang.',
      '3. Lakukan pengujian fungsi detektor, uji simulasi sistem peringatan dini, dan pemeriksaan berkala sesuai ketentuan Permenaker No. 02/MEN/1983.'
    ]
  }
};

function formatIndoDate(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = INDONESIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function hasReportValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

const LEGACY_GENERATED_LHPP_VALUES = new Set([
  'sesuai hasil pemeriksaan dan pengujian lapangan',
  'hasil pemeriksaan teknis sesuai bap.',
  'pertahankan pemeliharaan berkala sesuai standar k3 yang berlaku.'
]);

function hasRecordedReportValue(value) {
  return (
    hasReportValue(value) &&
    !LEGACY_GENERATED_LHPP_VALUES.has(String(value).trim().toLowerCase())
  );
}

function getInspectionResultValue(result) {
  let value = result.choice_value;
  if (!hasRecordedReportValue(value) && hasRecordedReportValue(result.number_value)) {
    value = `${result.number_value}${result.unit ? ` ${result.unit}` : ''}`;
  }
  if (!hasRecordedReportValue(value)) value = result.text_value;
  if (!hasRecordedReportValue(value) && hasRecordedReportValue(result.date_value)) {
    value = formatIndoDate(result.date_value);
  }

  const note = hasRecordedReportValue(result.note) ? ` (Catatan: ${result.note})` : '';
  return `${hasRecordedReportValue(value) ? value : 'Belum diisi'}${note}`;
}

export function buildLhppReportContent(data) {
  const categoryCode = (data.category_code || 'PAA').toUpperCase();
  const category = LHPP_CATEGORY_CONFIG[categoryCode] || LHPP_CATEGORY_CONFIG.PAA;
  const technicalData =
    data.technical_data &&
    typeof data.technical_data === 'object' &&
    !Array.isArray(data.technical_data)
      ? data.technical_data
      : {};
  const readField = (...keys) => {
    for (const key of keys) {
      const value = technicalData[key] ?? data[key];
      if (hasReportValue(value)) return String(value);
    }
    return '-';
  };
  const readDateField = (...keys) => {
    const value = readField(...keys);
    if (value === '-') return value;
    return formatIndoDate(value);
  };
  const templateIdentityRows = {
    PAA: [
      ['Pemilik', readField('client_name')], ['Alamat', readField('client_address')],
      ['Pemakai', readField('pemakai', 'client_name')], ['Pengurus / Penanggung jawab', readField('pengurus', 'contact_name')],
      ['Lokasi Unit', readField('install_location')], ['Jenis Pesawat', readField('jenis_pesawat', 'object_name')],
      ['Item No', readField('item_no')], ['Nomor Seri Unit', readField('serial_number')],
      ['Merk / Model', readField('brand', 'model')], ['Tahun', readField('manufacture_year')],
      ['Kapasitas Angkat', readField('capacity', 'swl')], ['Standar yang dipakai', readField('standard_ref')],
      ['Digunakan untuk', readField('digunakan_untuk')], ['Tanggal diperiksa', readDateField('inspection_date')],
      ['Jenis Pemeriksaan', readField('inspection_type')], ['No. Ijin Pemakaian', readField('previous_permit_no')],
      ['Diperiksa Oleh', readField('inspector_name')]
    ],
    PUBT: [
      ['Pemilik', readField('client_name')], ['Alamat', readField('client_address')],
      ['Pemakai', readField('pemakai', 'client_name')], ['Lokasi Unit', readField('install_location')],
      ['Nama Operator', readField('operator_name')], ['Jenis Bejana', readField('jenis_bejana', 'object_name')],
      ['Pabrik Pembuat', readField('manufacturer')], ['Merk / Type', readField('brand', 'model')],
      ['Tahun Pembuatan', readField('manufacture_year')], ['Item No', readField('item_no')],
      ['No. Serie / No. Unit', readField('serial_number')], ['Tekanan Design', readField('tekanan_desain', 'design_pressure')],
      ['Tekanan Kerja Maks. Yang Diperbolehkan', readField('tekanan_kerja', 'max_allowable_working_pressure')],
      ['Kapasitas', readField('kapasitas_volume', 'volume_kapasitas')], ['Dimensi', readField('dimensi_bejana')],
      ['Media yang digunakan', readField('media_fluida', 'fluida_isinya')], ['Temperatur Kerja', readField('temperatur_kerja')],
      ['Pedoman Pemeriksaan', readField('standard_ref')], ['Digunakan Untuk', readField('digunakan_untuk')],
      ['Jenis Pemeriksaan', readField('inspection_type')], ['No. Ijin Pemakaian', readField('previous_permit_no')],
      ['Tanggal Pemeriksaan dan Pengujian', readDateField('inspection_date')], ['Diperiksa Oleh', readField('inspector_name')]
    ],
    LIS: [
      ['Nama Perusahaan/Instansi', readField('client_name')], ['Alamat', readField('client_address')],
      ['Alamat Pemakai', readField('user_address', 'client_address')], ['Jenis Unit', readField('object_name')],
      ['Jenis Pemeriksaan', readField('inspection_type')], ['Nomor Izin Pemakaian', readField('previous_permit_no')],
      ['Pelaksanaan riksa uji', readDateField('inspection_date')]
    ],
    IPK: [
      ['Nama Gedung / Bangunan', readField('building_name', 'object_name')], ['Alamat Pemakai', readField('client_address')],
      ['Alamat Pemakaian', readField('install_location')], ['Penggunaan Bangunan', readField('building_use')],
      ['Nama Pemilik/Pimpinan/Direktur', readField('owner_name')], ['Instalatur', readField('installer_name')],
      ['Alamat Instalatur', readField('installer_address')], ['Status Riksa Uji', readField('inspection_type')],
      ['Tanggal Riksa Uji', readDateField('inspection_date')], ['No. Surat Keterangan', readField('previous_permit_no')]
    ]
  };
  const isDieselPtp = categoryCode === 'PTP' && /diesel|genset/i.test(`${data.object_name || ''} ${technicalData.jenis_pesawat || ''}`);
  if (categoryCode === 'PTP') {
    templateIdentityRows.PTP = isDieselPtp
      ? [
          ['Perusahaan Pemilik', readField('client_name')], ['Alamat', readField('client_address')],
          ['Lokasi Pemakai', readField('install_location')], ['Alamat Pemakai', readField('user_address', 'client_address')],
          ['Pengurus / Penanggung Jawab', readField('pengurus')], ['Lokasi Unit', readField('install_location')],
          ['Jenis Pesawat / Type', readField('jenis_pesawat', 'object_name')], ['Merk / Type', readField('brand', 'model')],
          ['No. Seri / No. Unit', readField('serial_number')], ['Lokasi / Tahun Pembuatan', readField('manufacture_year')],
          ['Kapasitas', readField('kapasitas_daya', 'capacity')], ['Digunakan Untuk', readField('digunakan_untuk')],
          ['No. SKP PJK3 / Bidang', readField('skp_pjk3')], ['No. SKP / Bidang AK3', readField('skp_ahli_k3')],
          ['Klasifikasi', readField('klasifikasi')], ['No Izin Pemakaian / Penerbit', readField('previous_permit_no')],
          ['Nama Operator', readField('operator_name')], ['Jenis Pemeriksaan', readField('inspection_type')],
          ['Tanggal Riksa Uji', readDateField('inspection_date')], ['Diperiksa Oleh', readField('inspector_name')]
        ]
      : [
          ['Perusahaan Pemilik', readField('client_name')], ['Alamat', readField('client_address')],
          ['Perusahaan Pemakai', readField('user_company', 'client_name')], ['Alamat', readField('user_address', 'client_address')],
          ['Pengurus / Penanggung Jawab', readField('pengurus')], ['Lokasi Unit', readField('install_location')],
          ['Jenis Pesawat / Type', readField('jenis_pesawat', 'object_name')], ['Merk', readField('brand')],
          ['No. Unit', readField('item_no')], ['Perusahaan Pembuat / Pemasang', readField('manufacturer')],
          ['Lokasi / Tahun Pembuatan', readField('manufacture_location', 'manufacture_year')],
          ['Kapasitas', readField('capacity', 'kapasitas_daya')], ['Digunakan Untuk', readField('digunakan_untuk')],
          ['No. SKP PJK3 / Bidang', readField('skp_pjk3')], ['No. SKP / Bidang AK3', readField('skp_ahli_k3')],
          ['Sertifikasi Standar', readField('standard_ref')], ['No Izin Pemakaian / Penerbit', readField('previous_permit_no')],
          ['Nama Operator', readField('operator_name')], ['Jenis Pemeriksaan', readField('inspection_type')],
          ['Tanggal Pemeriksaan', readDateField('inspection_date')], ['Pemeriksa', readField('inspector_name')]
        ];
  }
  const technicalSchema = [...(category.technicalFields || [])];
  if (categoryCode === 'LIS') {
    technicalSchema.splice(0, technicalSchema.length,
      { key: 'sumber_listrik', label: 'Sumber Tenaga Listrik' },
      { key: 'tahun_instalasi', label: 'Tahun Instalasi' },
      { key: 'instalatir', label: 'Instalatir Pemasang' },
      { key: 'tegangan_sistem', label: 'Tenaga Listrik dari PLN' },
      { key: 'jenis_arus', label: 'Jenis Arus / Tegangan Kerja' },
      { key: 'daya_tenaga', label: 'Jumlah Daya Tenaga' },
      { key: 'daya_penerangan', label: 'Jumlah Daya Penerangan' }
    );
  }
  for (const field of categoryCode === 'LIS' ? [] : (Array.isArray(data.lhpp_schema) ? data.lhpp_schema : [])) {
    if (!technicalSchema.some((item) => item.key === field.key)) technicalSchema.push(field);
  }
  const technicalLabelsByKey = new Map(technicalSchema.map((field) => [field.key, field.label]));
  const technicalKeys = new Set();
  const technicalLabels = new Set();
  const technicalRows = technicalSchema.map((field) => {
    technicalKeys.add(field.key);
    technicalLabels.add(field.label);
    const value = technicalData[field.key] ?? technicalData[field.label];
    return {
      label: field.label,
      value: hasRecordedReportValue(value) ? String(value) : 'Belum diisi'
    };
  });

  const resultRows = (Array.isArray(data.results) ? data.results : []).map((result) => ({
    label: [result.section, result.label].filter(hasReportValue).join(' - '),
    value: getInspectionResultValue(result)
  }));
  const checklistRows = (Array.isArray(data.results) ? data.results : []).map((result) => ({
    section: hasReportValue(result.section) ? String(result.section) : 'Pemeriksaan',
    label: hasReportValue(result.label) ? String(result.label) : 'Butir pemeriksaan',
    choice: hasReportValue(result.choice_value) ? String(result.choice_value).toUpperCase() : '',
    inputType: String(result.input_type || 'CHOICE').toUpperCase(),
    value: getInspectionResultValue({ ...result, note: null }),
    note: hasRecordedReportValue(result.note) ? String(result.note) : ''
  }));
  for (const [key, value] of Object.entries(technicalData)) {
    if (!hasRecordedReportValue(value) || technicalKeys.has(key) || technicalLabels.has(key)) continue;
    resultRows.push({
      label: technicalLabelsByKey.get(key) || key.replaceAll('_', ' '),
      value: String(value)
    });
  }

  const findings = Array.isArray(data.findings) ? data.findings : [];
  const conclusionLabels = {
    MEMENUHI_SYARAT: 'MEMENUHI SYARAT',
    MEMENUHI_SYARAT_DENGAN_CATATAN: 'MEMENUHI SYARAT DENGAN CATATAN',
    TIDAK_MEMENUHI_SYARAT: 'TIDAK MEMENUHI SYARAT'
  };

  return {
    categoryCode,
    technicalData,
    isDiesel: isDieselPtp,
    specialistTitle: category.specialistTitle,
    pageSize: category.pageSize || [615.24, 921.36],
    categoryName: data.category_name || category.fullName,
    title: `LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN (LHPP) - BIDANG ${categoryCode}`,
    sectionTitles: category.sectionTitles || [
      `1. Data Umum & Identitas Objek (${data.category_name || category.fullName})`,
      `2. Data Teknis Spesifik Bidang ${categoryCode}`,
      '3. Pemeriksaan, Pengukuran & Pengujian',
      '4. Temuan Lapangan & Rekomendasi',
      '5. Kesimpulan dan Syarat Operasi'
    ],
    metadata: [
      `Nomor LHPP: ${data.lhpp_no || 'DRAF (Belum Terbit)'}`,
      `Referensi BAP: ${data.bap_no || '-'} | Nomor PO/Order: ${data.po_number || data.order_no || '-'}`,
      `Versi: ${hasReportValue(data.version) ? `v${data.version}` : '-'} | Status: ${data.status || '-'} | Kode Verifikasi: ${data.verification_code || '-'}`
    ],
    coverInfoRows: [
      ['Perusahaan', readField('client_name')],
      ['Item No', readField('item_no')],
      ['Jenis', `${categoryCode} / ${data.object_name || category.fullName}`],
      ['SN', readField('serial_number')],
      ['Lokasi', readField('install_location', 'client_address')],
      ['Inspected', readDateField('inspection_date')],
      ['Re-Inspection', hasReportValue(data.recommended_valid_until) ? formatIndoDate(data.recommended_valid_until) : '-']
    ],
    identityRows: templateIdentityRows[categoryCode] || [
      ['Pemilik', readField('client_name')], ['Alamat', readField('client_address')],
      ['Lokasi Unit', readField('install_location')], ['Jenis Pesawat', readField('object_name')],
      ['Nomor Seri', readField('serial_number')], ['Tahun Pembuatan', readField('manufacture_year')],
      ['Kapasitas', readField('capacity')], ['Tanggal Pemeriksaan', readField('inspection_date')],
      ['Diperiksa Oleh', readField('inspector_name')]
    ],
    methodSummary: hasReportValue(data.method_summary) ? data.method_summary : 'Belum diisi.',
    technicalNotes: hasRecordedReportValue(data.technical_notes)
      ? data.technical_notes
      : 'Belum diisi.',
    technicalRows,
    resultRows,
    checklistRows,
    findings: findings.map((finding) => ({
      severity: finding.severity,
      description: finding.description,
      recommendation: finding.recommendation
    })),
    conclusion: conclusionLabels[data.conclusion] || 'Belum ditetapkan',
    conclusionNotes: hasReportValue(data.conclusion_notes) ? data.conclusion_notes : '-',
    recommendations: hasRecordedReportValue(data.recommendations)
      ? data.recommendations
      : 'Belum diisi.',
    noFindings: findings.length === 0,
    coverTitle: category.coverTitle || data.category_name || category.fullName,
    standardRef: category.standardRef || 'Standar Rujukan K3 Kemnaker R.I.',
    rules: category.rules || [],
    signature: {
      inspector: data.inspector_name || '-',
      reviewer: data.reviewer_name || '-',
      approver: data.approver_name || '-',
      publishedAt: data.published_at ? formatIndoDate(data.published_at) : '-'
    },
    photos: Array.isArray(data.photos)
      ? data.photos.map((p) => ({
          id: p.id,
          caption: p.caption || p.originalName || 'Foto Dokumentasi Riksa Uji',
          originalName: p.originalName || p.original_name,
          storageKey: p.storageKey || p.storage_key,
          mimeType: p.mimeType || p.mime_type,
          createdAt: p.createdAt || p.created_at
        }))
      : []
  };
}

// ============================================================================
// LHPP RENDERER
// Layout mengikuti dokumen rujukan PT Upaya Riksa Daya (hasil ukur koordinat
// langsung dari 7 PDF contoh: ukuran halaman, margin, tinggi baris, font).
//
// Konvensi koordinat: semua nilai "top" pada helper teks adalah koordinat atas
// glyph sebagaimana diukur pada PDF rujukan (pdfplumber `top`). Helper
// mengonversinya ke koordinat PDFKit (REF_TOP_OFFSET).
// ============================================================================

const LHPP_INK = '#000000';
const LHPP_BORDER = 0.5;
const REF_TOP_OFFSET = 0.1; // y PDFKit = top rujukan + 0.1 * ukuran font (Times)

const COLOR_RED = '#FF0000';
const COLOR_RED_SHADOW = '#843C0C';
const COLOR_BAR = '#878787';
const COLOR_BAR_SHADOW = '#525252';

function pickTimes({ bold = false, italic = false } = {}) {
  if (bold) return italic ? 'Times-BoldItalic' : 'Times-Bold';
  return italic ? 'Times-Italic' : 'Times-Roman';
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

const FOOTER_FONT_CANDIDATES = [
  process.env.LHPP_FOOTER_FONT_PATH,
  path.resolve(__dirname, '../assets/fonts/calibri-light.ttf'),
  path.resolve(__dirname, '../assets/fonts/Carlito-Regular.ttf')
].filter(Boolean);

function registerFooterFont(doc) {
  for (const candidate of FOOTER_FONT_CANDIDATES) {
    try {
      if (fs.existsSync(candidate)) {
        doc.registerFont('LhppFooter', candidate);
        return 'LhppFooter';
      }
    } catch {
      // lanjut ke kandidat berikutnya
    }
  }
  return 'Helvetica';
}

// ----------------------------------------------------------------------------
// KANVAS: primitif gambar + kontrol aliran halaman
// ----------------------------------------------------------------------------
class LhppCanvas {
  constructor(doc, profile) {
    this.doc = doc;
    this.profile = profile;
    this.y = profile.pageTop;
    this.footerFont = registerFooterFont(doc);
    this.bodyPages = new Set();
  }

  get left() { return this.profile.left; }
  get right() { return this.profile.right; }
  get width() { return this.profile.right - this.profile.left; }
  get bottom() { return this.profile.bodyBottom; }

  textWidth(str, size = 12, o = {}) {
    return this.doc.font(pickTimes(o)).fontSize(size).widthOfString(String(str ?? ''));
  }

  /** Pecah teks menjadi baris sesuai lebar (menghormati \n). */
  wrap(text, width, size = 12, o = {}) {
    const doc = this.doc;
    doc.font(pickTimes(o)).fontSize(size);
    const out = [];
    for (const paragraph of String(text ?? '').split('\n')) {
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (words.length === 0) { out.push(''); continue; }
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (doc.widthOfString(candidate) <= width) { line = candidate; continue; }
        if (line) out.push(line);
        if (doc.widthOfString(word) <= width) { line = word; continue; }
        let chunk = '';
        for (const ch of word) {
          if (doc.widthOfString(chunk + ch) > width && chunk) { out.push(chunk); chunk = ch; }
          else chunk += ch;
        }
        line = chunk;
      }
      out.push(line);
    }
    return out;
  }

  /** Satu baris teks pada koordinat top rujukan. */
  txt(str, x, top, o = {}) {
    const size = o.size ?? 12;
    const text = String(str ?? '');
    const doc = this.doc;
    doc.font(pickTimes(o)).fontSize(size).fillColor(o.color ?? LHPP_INK);
    let px = x;
    if (o.width && o.align === 'center') px = x + (o.width - doc.widthOfString(text)) / 2;
    else if (o.width && o.align === 'right') px = x + o.width - doc.widthOfString(text);
    doc.text(text, px, top + REF_TOP_OFFSET * size, { lineBreak: false });
  }

  /** Beberapa baris dengan jarak (pitch) tetap. Mengembalikan jumlah baris. */
  block(lines, x, top, pitch, o = {}) {
    lines.forEach((line, i) => this.txt(line, x, top + i * pitch, o));
    return lines.length;
  }

  rect(x, y, w, h, o = {}) {
    const doc = this.doc;
    if (o.fill) doc.rect(x, y, w, h).fillColor(o.fill).fill();
    if (o.stroke !== false) {
      doc.rect(x, y, w, h).lineWidth(o.lw ?? LHPP_BORDER).strokeColor(o.color ?? LHPP_INK).stroke();
    }
  }

  hline(x1, x2, y, lw = LHPP_BORDER) {
    this.doc.moveTo(x1, y).lineTo(x2, y).lineWidth(lw).strokeColor(LHPP_INK).stroke();
  }

  vline(x, y1, y2, lw = LHPP_BORDER) {
    this.doc.moveTo(x, y1).lineTo(x, y2).lineWidth(lw).strokeColor(LHPP_INK).stroke();
  }

  /** Sel bertepi dengan teks. Rata atas (seperti tabel Word rujukan) kecuali vAlign:'middle'. */
  cell(x, y, w, h, text, o = {}) {
    if (o.border !== false) this.rect(x, y, w, h, { fill: o.fill });
    else if (o.fill) this.rect(x, y, w, h, { fill: o.fill, stroke: false });
    if (text === undefined || text === null || text === '') return 0;
    const size = o.size ?? 12;
    const pitch = o.pitch ?? size * 1.15;
    const padX = o.padX ?? 5.4;
    const lines = this.wrap(text, w - padX * 2, size, o);
    const blockH = lines.length * pitch;
    const top = o.vAlign === 'middle'
      ? y + Math.max(0, (h - blockH) / 2) + (o.midAdjust ?? 0.4)
      : y + (o.padTop ?? 2.0);
    lines.forEach((line, i) => {
      this.txt(line, x + padX, top + i * pitch, {
        ...o,
        size,
        width: w - padX * 2,
        align: o.align ?? 'left'
      });
    });
    return lines.length;
  }

  /** Tanda centang vektor setara glyph "√" 12pt pada kolom berpusat cx. */
  tick(cx, rowTop, size = 12) {
    const k = size / 12;
    const y = rowTop + 2.0;
    const doc = this.doc;
    doc.save();
    doc.moveTo(cx - 4.6 * k, y + 8.4 * k)
      .lineTo(cx - 2.0 * k, y + 12.6 * k)
      .lineTo(cx + 4.8 * k, y + 2.4 * k)
      .lineWidth(0.9 * k).lineJoin('miter').strokeColor(LHPP_INK).stroke();
    doc.restore();
  }

  dash(cx, rowTop, size = 12) {
    this.txt('-', cx - this.textWidth('-', size) / 2, rowTop + 2.0, { size });
  }

  // ------------------------------------------------------------------
  // Halaman
  // ------------------------------------------------------------------
  newPage() {
    this.doc.addPage();
    this.y = this.profile.pageTop;
    this.bodyPages.add(this.doc.bufferedPageRange().count - 1);
  }

  markBodyPage() {
    this.bodyPages.add(this.doc.bufferedPageRange().count - 1);
  }

  /** Pastikan ruang; jika tidak cukup pindah halaman dan panggil hook (mis. header tabel). */
  ensure(h, onNewPage) {
    if (this.y + h <= this.bottom) return false;
    this.newPage();
    if (onNewPage) onNewPage();
    return true;
  }

  drawFooters() {
    const f = this.profile.footer;
    const doc = this.doc;
    for (const index of this.bodyPages) {
      doc.switchToPage(index);
      doc.font(this.footerFont).fontSize(f.nameSize).fillColor('#FF0000')
        .text('PT. UPAYA RIKSA DAYA', f.x, f.nameTop + 0.08 * f.nameSize, { lineBreak: false });
      doc.font(this.footerFont).fontSize(f.addrSize).fillColor(LHPP_INK)
        .text(f.address, f.x, f.addrTop + 0.08 * f.addrSize, { lineBreak: false });
    }
  }
}

// ----------------------------------------------------------------------------
// COVER
// ----------------------------------------------------------------------------
function drawCoverPage(c, report, _data) {
  const { doc, profile } = c;
  const cv = profile.cover;
  const W = doc.page.width;
  const H = doc.page.height;

  // Pita merah atas/bawah + bayangan, dan dua tiang abu-abu (ukuran dari rujukan).
  doc.rect(cv.topBand.x0 + 1, -5.5, cv.topBand.x1 - cv.topBand.x0, cv.topBand.bottom + 7.5).fillColor(COLOR_RED_SHADOW).fill();
  doc.rect(cv.topBand.x0, -7.5, cv.topBand.x1 - cv.topBand.x0, cv.topBand.bottom + 7.5).fillColor(COLOR_RED).fill();
  doc.rect(cv.bottomBand.x0 + 1, cv.bottomBand.top + 2, cv.bottomBand.x1 - cv.bottomBand.x0, cv.bottomBand.bottom - cv.bottomBand.top).fillColor(COLOR_RED_SHADOW).fill();
  doc.rect(cv.bottomBand.x0, cv.bottomBand.top, cv.bottomBand.x1 - cv.bottomBand.x0, cv.bottomBand.bottom - cv.bottomBand.top).fillColor(COLOR_RED).fill();
  for (const barX of cv.bars) {
    doc.rect(barX + 1, 2, 7.1, H + 40).fillColor(COLOR_BAR_SHADOW).fill();
    doc.rect(barX, 0, 7.1, H + 40).fillColor(COLOR_BAR).fill();
  }

  // Tahun + garis bawah selebar teks
  c.txt(report.coverYear, cv.yearX, cv.yearTop, { size: 28, bold: true });
  const yearW = c.textWidth(report.coverYear, 28, { bold: true });
  doc.rect(cv.yearX, cv.underlineY, yearW, 2.7).fillColor(LHPP_INK).fill();

  // Judul 3 baris (tengah halaman)
  const titleLines = [
    'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN',
    'SERTIFIKASI',
    String(report.coverTitle || report.categoryName).toUpperCase()
  ];
  titleLines.forEach((line, i) => {
    c.txt(line, 0, cv.titleTop + i * cv.titlePitch, { size: 18, bold: true, width: W, align: 'center' });
  });

  // Identitas: label | titik dua | nilai (kolom sejajar)
  const valueX = cv.colonX + c.textWidth(': ', 14, { bold: true });
  const valueW = W - valueX - 60;
  let top = cv.infoTop;
  report.coverRows.forEach(([label, value], index) => {
    c.txt(label, cv.labelX, top, { size: 14, bold: true });
    c.txt(':', cv.colonX, top, { size: 14, bold: true });
    const lines = c.wrap(hasReportValue(value) ? String(value) : '-', valueW, 14, { bold: true });
    lines.forEach((line, li) => c.txt(line, valueX, top + li * cv.infoLinePitch, { size: 14, bold: true }));
    const pitch = typeof cv.infoPitch === 'function' ? cv.infoPitch(index) : cv.infoPitch;
    top += pitch + (lines.length - 1) * cv.infoLinePitch;
  });

  // Foto objek
  const photo = cv.photo;
  const cover = report.coverPhoto;
  let drawn = false;
  if (cover?.storageKey) {
    try {
      const p = resolveAttachmentPath(cover.storageKey);
      if (p && fs.existsSync(p)) {
        doc.image(p, photo.x, photo.y, { fit: [photo.w, photo.h], align: 'center', valign: 'center' });
        drawn = true;
      }
    } catch {
      drawn = false;
    }
  }
  if (!drawn) {
    c.txt('Foto objek belum tersedia', photo.x, photo.y + photo.h / 2 - 6, {
      size: 10, italic: true, color: '#666666', width: photo.w, align: 'center'
    });
  }

  // Blok alamat (merah + hitam, tebal, tengah)
  cv.address.forEach((line, i) => {
    c.txt(line, 0, cv.addressTop + i * cv.addressPitch, {
      size: 11, bold: true, width: W, align: 'center', color: i === 0 ? COLOR_RED : LHPP_INK
    });
  });
}

// ----------------------------------------------------------------------------
// BLOK UMUM
// ----------------------------------------------------------------------------

/** Kotak judul halaman-2 (nama laporan + nomor). */
function drawTitleBlock(c, lines, spec) {
  const { doc } = c;
  const x0 = spec.x0 ?? c.left;
  const x1 = spec.x1 ?? c.right;
  if (spec.box) {
    c.rect(x0, spec.y0, x1 - x0, spec.y1 - spec.y0, { fill: spec.fill });
  }
  lines.forEach((line, i) => {
    c.txt(line, x0, spec.firstTop + i * spec.pitch, {
      size: spec.size ?? 14, bold: true, width: x1 - x0, align: 'center'
    });
  });
  c.y = spec.endY ?? (spec.box ? spec.y1 : spec.firstTop + lines.length * spec.pitch);
  void doc;
}

/** Judul bab dalam sel bertepi, ukuran 14 bold. */
function drawSectionRow(c, title, o = {}) {
  const h = o.h ?? 20.4;
  c.ensure(h + (o.reserve ?? 40));
  const x0 = o.x0 ?? c.left;
  const x1 = o.x1 ?? c.right;
  c.cell(x0, c.y, x1 - x0, h, title, {
    size: o.size ?? 14, bold: true, padX: o.padX ?? 6.2, padTop: o.padTop ?? 2.3,
    border: o.border !== false, align: o.align ?? 'left', fill: o.fill
  });
  c.y += h;
}

/**
 * Tabel label | nilai.
 * spec: { x0,x1, labelW, numberW, size, minH, padTop, pitch, colonInValue, colonCol, bold }
 */
function drawKeyValueTable(c, rows, spec = {}) {
  const x0 = spec.x0 ?? c.left;
  const x1 = spec.x1 ?? c.right;
  const numberW = spec.numberW ?? 0;
  const labelW = spec.labelW ?? 170;
  const size = spec.size ?? 12;
  const minH = spec.minH ?? 20.4;
  const pitch = spec.pitch ?? size * 1.15;
  const padX = spec.padX ?? 5.4;
  const colonW = spec.colonW ?? 0;
  const labelX0 = x0 + numberW;
  const valueX0 = labelX0 + labelW;
  rows.forEach((row, index) => {
    const [label, rawValue, ro = {}] = row;
    const value = hasReportValue(rawValue) ? String(rawValue) : '-';
    const valueText = spec.colonInValue ? `: ${value}` : value;
    const valueLines = c.wrap(valueText, x1 - valueX0 - padX * 2 - colonW, size, { bold: ro.bold });
    const labelLines = c.wrap(label, labelW - padX * 2, size, { bold: ro.labelBold });
    const lines = Math.max(valueLines.length, labelLines.length);
    const h = spec.rowHeight
      ? spec.rowHeight(lines)
      : Math.max(minH, lines * pitch + (spec.padTop ?? 2.0) * 2 + (spec.padBottom ?? 0.6));
    c.ensure(h, spec.onNewPage);
    const y = c.y;
    if (numberW) {
      c.cell(x0, y, numberW, h, String(index + 1), { size, align: 'center', padTop: spec.padTop });
    }
    c.cell(labelX0, y, labelW, h, '', { size });
    c.cell(valueX0, y, x1 - valueX0, h, '', { size });
    const first = spec.firstTop ? spec.firstTop(lines) : (spec.padTop ?? 2.0);
    labelLines.forEach((line, i) => c.txt(line, labelX0 + padX, y + (spec.labelMid ? (h - labelLines.length * pitch) / 2 : first) + i * pitch, { size, bold: ro.labelBold }));
    if (colonW) c.txt(':', valueX0 + padX, y + first, { size });
    valueLines.forEach((line, i) => c.txt(line, valueX0 + padX + colonW, y + first + i * pitch, { size, bold: ro.bold }));
    c.y += h;
  });
}

// ----------------------------------------------------------------------------
// CHECKLIST (grid presisi)
// ----------------------------------------------------------------------------
/**
 * items: [{ no, group, label, status: 'OK'|'BAD'|'NA'|'' , note, heading }]
 * spec:
 *   cols  : batas kolom [x0,x1,...] (jumlah = roles.length + 1)
 *   roles : ['no','group','label','ok','bad','note'] atau ['no','label','ok','bad','note']
 *   size, rowMin, groupPitch, labelPitch, labelStep (tambahan tinggi tiap baris bungkus)
 *   header(c, first) -> menggambar header & mengembalikan tinggi
 */
function drawChecklist(c, items, spec) {
  const { cols, roles } = spec;
  const size = spec.size ?? 12;
  const rowMin = spec.rowMin ?? 20.4;
  const labelPitch = spec.labelPitch ?? size * 1.15;
  const labelStep = spec.labelStep ?? labelPitch;
  const groupPitch = spec.groupPitch ?? size * 1.15;
  const idx = (role) => roles.indexOf(role);
  const colX = (role) => cols[idx(role)];
  const colW = (role) => cols[idx(role) + 1] - cols[idx(role)];
  const hasGroup = idx('group') >= 0;
  const padX = spec.padX ?? 5.0;
  const tickSize = spec.tickSize ?? size;

  const rowHeight = (item) => {
    if (item.heading) {
      const hl = c.wrap(item.label, colW('label') - padX * 2, size, { bold: true });
      return Math.max(rowMin, rowMin + (hl.length - 1) * labelStep);
    }
    const ll = c.wrap(item.label, colW('label') - padX * 2, size, { italic: item.italic });
    return Math.max(rowMin, rowMin + (ll.length - 1) * labelStep);
  };

  // Kelompokkan: blok "no" (kolom No bergabung), blok "group" (kolom Nama Bagian bergabung)
  const heights = items.map(rowHeight);
  let first = true;
  let startHeader = () => {
    const hh = spec.header(c, first);
    c.y += hh;
    first = false;
  };
  startHeader();
  const repeatHeader = () => startHeader();

  let i = 0;
  while (i < items.length) {
    // blok baris dengan no yang sama (kolom No digabung) - dipecah bila halaman habis
    let j = i;
    const key = hasGroup ? `${items[i].no}` : null;
    while (j < items.length && (!hasGroup || `${items[j].no}` === key)) {
      j += 1;
    }
    // Hitung baris yang muat pada halaman ini
    let end = i;
    let used = 0;
    while (end < j && c.y + used + heights[end] <= c.bottom) {
      used += heights[end];
      end += 1;
    }
    if (end === i) {
      c.newPage();
      repeatHeader();
      continue;
    }
    drawChecklistChunk(c, items.slice(i, end), heights.slice(i, end), {
      spec, size, labelPitch, labelStep, groupPitch, padX, tickSize, colX, colW, idx, hasGroup, rowMin
    });
    i = end;
    if (end < j) {
      c.newPage();
      repeatHeader();
    }
  }
}

function drawChecklistChunk(c, items, heights, k) {
  const { spec, size, labelPitch, groupPitch, padX, tickSize, colX, colW, hasGroup } = k;
  const y0 = c.y;
  const total = heights.reduce((a, b) => a + b, 0);
  const x0 = spec.cols[0];
  const xEnd = spec.cols[spec.cols.length - 1];

  // Kolom yang digabung (No, Nama Bagian) untuk seluruh blok
  if (hasGroup) {
    const noW = colW('no');
    c.rect(colX('no'), y0, noW, total);
    c.txt(items[0].no ?? '', colX('no'), y0 + 2.0, { size, width: noW, align: 'center' });
    // Sub-kelompok Nama Bagian
    let gy = y0;
    let gi = 0;
    while (gi < items.length) {
      let gj = gi;
      let gh = 0;
      while (gj < items.length && items[gj].group === items[gi].group) { gh += heights[gj]; gj += 1; }
      c.rect(colX('group'), gy, colW('group'), gh);
      const gl = c.wrap(items[gi].group ?? '', colW('group') - padX * 2, size);
      gl.forEach((line, li) => c.txt(line, colX('group') + padX, gy + 2.0 + li * groupPitch, { size }));
      gy += gh;
      gi = gj;
    }
  }

  // Deteksi grup N/A penuh -> kolom Keterangan digabung
  const allNA = items.length > 0 && items.every((it) => it.status === 'NA') && spec.mergeNA !== false && hasGroup;
  let y = y0;
  items.forEach((item, n) => {
    const h = heights[n];
    // sel dasar
    const baseRoles = hasGroup ? ['label', 'ok', 'bad', 'note'] : spec.roles;
    baseRoles.forEach((role) => {
      if (role === 'note' && allNA) return;
      c.rect(colX(role), y, colW(role), h);
    });
    if (!hasGroup) {
      // kolom No dan label mandiri
      if (item.heading) {
        c.txt(item.no ?? '', colX('no'), y + 2.0, { size, width: colW('no'), align: 'center' });
      } else if (item.no) {
        c.txt(item.no, colX('no'), y + 2.0, { size, width: colW('no'), align: 'center' });
      }
    }
    const lines = c.wrap(item.label, colW('label') - padX * 2, size, { bold: !!item.heading, italic: item.italic });
    lines.forEach((line, li) => c.txt(line, colX('label') + padX, y + 2.0 + li * (spec.labelStep ?? labelPitch), {
      size, bold: !!item.heading, italic: item.italic
    }));
    if (!item.heading) {
      const okC = colX('ok') + colW('ok') / 2;
      const badC = colX('bad') + colW('bad') / 2;
      if (item.status === 'OK') { c.tick(okC, y, tickSize); c.dash(badC, y, size); }
      else if (item.status === 'BAD') { c.dash(okC, y, size); c.tick(badC, y, tickSize); }
      else if (item.status === 'NA') { c.dash(okC, y, size); c.dash(badC, y, size); }
      else {
        c.txt('Belum diisi', colX('ok'), y + 3.0, {
          size: 7, italic: true, color: '#777777', width: colW('ok') + colW('bad'), align: 'center'
        });
      }
      if (!allNA && item.note) {
        c.wrap(item.note, colW('note') - padX * 2, size).forEach((line, li) =>
          c.txt(line, colX('note') + padX, y + 2.0 + li * labelPitch, { size }));
      }
    }
    y += h;
  });
  if (allNA) {
    const nx = colX('note');
    c.rect(nx, y0, colW('note'), total);
    c.txt(items[0].note || 'N/A', nx, y0 + total / 2 - 7, { size, width: colW('note'), align: 'center' });
  }
  void x0; void xEnd;
  c.y = y0 + total;
}

// ----------------------------------------------------------------------------
// PARAGRAF / KESIMPULAN / SYARAT / TANDA TANGAN
// ----------------------------------------------------------------------------

/** Paragraf dengan komponen tebal; parts: [{t, b}] atau string. */
function drawRichParagraph(c, parts, o = {}) {
  const size = o.size ?? 12;
  const x = o.x ?? c.left;
  const width = o.width ?? c.width;
  const pitch = o.pitch ?? 20.7;
  const indent = o.indent ?? 0;
  const tokens = [];
  for (const part of Array.isArray(parts) ? parts : [{ t: String(parts) }]) {
    const words = String(part.t).split(/(\s+)/).filter((w) => w !== '');
    for (const w of words) tokens.push({ w, b: !!part.b });
  }
  const lines = [];
  let line = [];
  let lineW = indent;
  for (const tk of tokens) {
    const w = c.textWidth(tk.w, size, { bold: tk.b });
    if (/^\s+$/.test(tk.w) && line.length === 0) continue;
    if (lineW + w > width && line.length > 0 && !/^\s+$/.test(tk.w)) {
      lines.push(line);
      line = [];
      lineW = o.hangIndent ?? 0;
    }
    line.push(tk);
    lineW += w;
  }
  if (line.length) lines.push(line);
  c.ensure(lines.length * pitch);
  let top = c.y;
  lines.forEach((ln, li) => {
    let px = x + (li === 0 ? indent : o.hangIndent ?? 0);
    // rata kiri-kanan (justify) kecuali baris terakhir
    const natural = ln.reduce((a, tk) => a + c.textWidth(tk.w, size, { bold: tk.b }), 0);
    const gaps = ln.filter((tk) => /^\s+$/.test(tk.w)).length;
    const avail = width - (li === 0 ? indent : o.hangIndent ?? 0);
    const extra = o.justify !== false && li < lines.length - 1 && gaps > 0 ? (avail - natural) / gaps : 0;
    for (const tk of ln) {
      c.txt(tk.w, px, top, { size, bold: tk.b });
      px += c.textWidth(tk.w, size, { bold: tk.b }) + (/^\s+$/.test(tk.w) ? extra : 0);
    }
    top += pitch;
  });
  c.y = top;
}

/** Daftar bernomor dengan indent gantung. */
function drawNumberedList(c, items, o = {}) {
  const size = o.size ?? 12;
  const pitch = o.pitch ?? 20.7;
  const numX = o.numX ?? c.left + 31.6;
  const textX = o.textX ?? c.left + 49.6;
  const width = (o.right ?? c.right) - textX;
  items.forEach((item) => {
    const m = String(item).match(/^(\d+\.|[a-z]\.)\s*(.*)$/s);
    const label = m ? m[1] : '';
    const body = m ? m[2] : String(item);
    const lines = c.wrap(body, width, size);
    c.ensure(lines.length * pitch);
    if (label) c.txt(label, numX, c.y, { size });
    lines.forEach((line, i) => c.txt(line, textX, c.y + i * pitch, { size }));
    c.y += lines.length * pitch;
  });
}

/** Blok tanda tangan satu kolom di kanan (rujukan PAA/PUBT/PTP/LIS/IPK). */
function drawSignatureBlock(c, report, data, o = {}) {
  const centerX = o.centerX ?? 432;
  const size = 12;
  const lines = [
    `Jakarta, ${report.signature.publishedAt !== '-' ? report.signature.publishedAt : formatIndoDate(new Date())}`,
    ...(o.titleLines || ['Yang Memeriksa/Menguji', report.specialistTitle])
  ];
  const sigH = o.sigH ?? 120;
  c.ensure(lines.length * 15.8 + sigH + 40);
  let top = c.y;
  const colW = o.colW ?? 240;
  lines.forEach((line, i) => {
    c.txt(line, centerX - colW / 2, top + i * 15.9, { size, bold: true, width: colW, align: 'center' });
  });
  top += lines.length * 15.9;
  // Tanda tangan/QR
  const sigY = top + 4;
  const sigPath = data.inspector_signature_path;
  if (sigPath && fs.existsSync(sigPath)) {
    try {
      c.doc.image(sigPath, centerX - 62, sigY, { fit: [124, 80], align: 'center', valign: 'center' });
    } catch {
      // abaikan jika gagal dimuat
    }
  } else if (o.qrBuffer) {
    c.doc.image(o.qrBuffer, centerX - 30, sigY + 6, { width: 60 });
  }
  const nameTop = sigY + (o.nameOffset ?? 96);
  c.txt(report.signature.inspector, centerX - colW / 2, nameTop, { size, bold: true, width: colW, align: 'center' });
  const nw = c.textWidth(report.signature.inspector, size, { bold: true });
  c.hline(centerX - nw / 2, centerX + nw / 2, nameTop + 13.6, 0.7);
  if (data.inspector_skp_no || o.skpNo) {
    c.txt(data.inspector_skp_no || o.skpNo, centerX - colW / 2, nameTop + 15.8, { size, bold: true, width: colW, align: 'center' });
  }
  c.y = nameTop + 34;
}

// ----------------------------------------------------------------------------
// GRID FOTO DOKUMENTASI (2 kolom x 3 baris, caption di sel atas foto)
// ----------------------------------------------------------------------------
function drawPhotoGrid(c, photos, spec) {
  const g = spec.grid;
  const rowsPerPage = g.rowsPerPage ?? 3;
  const captionBelow = spec.captionPosition === 'bottom';
  const list = photos.length > 0 ? photos : [];
  if (list.length === 0) {
    c.cell(c.left, c.y, c.width, 24, 'Belum ada foto dokumentasi.', { size: 11, italic: true });
    c.y += 24;
    return;
  }
  let i = 0;
  let rowOnPage = 0;
  const gridTop = () => c.y;
  let pageTop = gridTop();
  while (i < list.length) {
    if (rowOnPage >= rowsPerPage) {
      c.newPage();
      rowOnPage = 0;
      pageTop = gridTop();
    }
    const rowTop = pageTop + rowOnPage * g.rowPitch;
    for (let col = 0; col < 2; col += 1) {
      const photo = list[i + col];
      const cx0 = g.x[col];
      const cx1 = g.x[col + 1];
      const capH = g.captionH;
      // sel foto
      c.rect(cx0, rowTop, cx1 - cx0, g.rowPitch);
      const caption = photo ? (photo.caption || photo.originalName || '') : '';
      const capY = captionBelow ? rowTop + g.rowPitch - capH : rowTop;
      const imgY = captionBelow ? rowTop + g.imgDY - capH + 2 : rowTop + g.imgDY;
      if (photo) {
        c.txt(caption, cx0, capY + (g.captionTop ?? 2.1), {
          size: g.captionSize ?? 12, bold: true, width: cx1 - cx0, align: 'center'
        });
        if (captionBelow) c.hline(cx0, cx1, capY);
        const p = photo.storageKey ? resolveAttachmentPath(photo.storageKey) : null;
        if (p && fs.existsSync(p) && String(photo.mimeType || '').startsWith('image/')) {
          try {
            c.doc.image(p, cx0 + g.imgDX, imgY, { fit: [g.imgW, g.imgH], align: 'center', valign: 'center' });
          } catch {
            c.txt('[Gambar tidak dapat dirender]', cx0, imgY + g.imgH / 2 - 5, { size: 9, italic: true, color: '#666666', width: cx1 - cx0, align: 'center' });
          }
        } else {
          c.txt('[Foto terlampir]', cx0, imgY + g.imgH / 2 - 5, { size: 9, italic: true, color: '#666666', width: cx1 - cx0, align: 'center' });
        }
      }
    }
    i += 2;
    rowOnPage += 1;
    c.y = rowTop + g.rowPitch;
  }
}

// ============================================================================
// PROFIL GEOMETRI PER BIDANG (diukur dari PDF rujukan)
// ============================================================================
const ADDRESS_FOOTER = 'Jl. Pondasi No. 50B Kampung Ambon, Jakarta Timur. 13210';
const COVER_ADDRESS_A = [
  'PT. UPAYA RIKSA DAYA',
  ADDRESS_FOOTER,
  'Phone. 021 4891409, 021 4715699, 021 47861912',
  'Email: urd@upayariksadaya.com  Web. upayariksa.com'
];
const COVER_ADDRESS_B = [
  'PT. UPAYA RIKSA DAYA',
  ADDRESS_FOOTER,
  'Phone: 021 4891409 | 021 4715699,021 47861912',
  'Email : urd@upayariksadaya.com Web. upayariksa.com'
];

function makeCover(o) {
  return {
    topBand: { x0: -23.2, x1: 619.4, bottom: o.topBottom ?? 51.8 },
    bottomBand: { x0: -4.3, x1: 624.9, top: o.bottomTop, bottom: o.bottomEnd },
    bars: o.bars,
    yearX: o.yearX, yearTop: o.yearTop ?? 61.0, underlineY: o.underlineY ?? 85.9,
    titleTop: o.titleTop, titlePitch: o.titlePitch ?? 20.7,
    labelX: o.labelX ?? 85.2, colonX: o.colonX, infoTop: o.infoTop,
    infoPitch: o.infoPitch, infoLinePitch: o.infoLinePitch ?? 16.1,
    photo: o.photo,
    address: o.address ?? COVER_ADDRESS_B, addressTop: o.addressTop, addressPitch: o.addressPitch ?? 12.7
  };
}

const LHPP_PROFILES = {
  PAA: {
    pageTop: 56.8, left: 63.9, right: 546.0, bodyBottom: 806,
    footer: { x: 63.9, nameTop: 850.7, nameSize: 12, addrTop: 874.2, addrSize: 11, address: ADDRESS_FOOTER },
    cover: makeCover({
      bottomTop: 864.7, bottomEnd: 918.1, bars: [46.8, 560.1], yearX: 63.9, titleTop: 126.3,
      colonX: 171.9, infoTop: 263.7, infoPitch: 16.1,
      photo: { x: 153.3, y: 422.6, w: 302.3, h: 226.8 },
      address: COVER_ADDRESS_A, addressTop: 741.3
    }),
    checklist: { x: [64.1, 89.7, 198.9, 340.6, 397.0, 453.8, 553.3] },
    grid: { x: [64.1, 305.1, 546.1], rowPitch: 212.1, captionH: 25.7, imgDX: 7.1, imgDY: 27.9, imgW: 226.8, imgH: 170.1, rowsPerPage: 3 }
  },
  PUBT: {
    pageTop: 58.0, left: 64.3, right: 554.0, bodyBottom: 806,
    footer: { x: 63.9, nameTop: 860.0, nameSize: 12, addrTop: 874.4, addrSize: 11, address: 'Jl. Pondasi No. 50 B, Kampung Ambon, Jakarta Timur. 13210' },
    cover: makeCover({
      bottomTop: 869.2, bottomEnd: 918.0, topBottom: 52.5, bars: [43.5, 564.0], yearX: 85.2, titleTop: 123.9,
      colonX: 207.9, infoTop: 257.8, infoPitch: (i) => (i < 5 ? 18.5 : 16.1),
      photo: { x: 149.3, y: 428.3, w: 311.8, h: 233.8 }, addressTop: 737.0, addressPitch: 12.7
    }),
    grid: { x: [64.1, 315.3, 581.2], rowPitch: 225.7, captionH: 26, imgDX: 12.1, imgDY: 34.7, imgW: 226.8, imgH: 170.1, captionTop: 2.1, rowsPerPage: 3 }
  },
  PTP: {
    pageTop: 57.0, left: 63.8, right: 553.0, bodyBottom: 806,
    footer: { x: 63.8, nameTop: 878.8, nameSize: 12, addrTop: 895.3, addrSize: 11, address: ADDRESS_FOOTER },
    cover: makeCover({
      bottomTop: 885.8, bottomEnd: 952.6, topBottom: 48.8, bars: [46.7, 565.9], yearX: 78.0, underlineY: 86.0, titleTop: 134.3,
      colonX: 171.8, infoTop: 270.3, infoPitch: 18.1,
      photo: { x: 134.7, y: 411.0, w: 340.1, h: 255.1 }, addressTop: 741.1, addressPitch: 14.5,
      address: ['PT. UPAYA RIKSA DAYA', ADDRESS_FOOTER, 'Ph. 021 4891409, 021 4715699, 021 47861912', 'Email: urd@upayariksadaya.com Web. upayariksa.com']
    }),
    grid: { x: [78.0, 328.9, 579.8], rowPitch: 208.7, captionH: 26.4, imgDX: 12.0, imgDY: 26.4, imgW: 226.7, imgH: 170.0, captionSize: 11, captionTop: 1.8, rowsPerPage: 3 }
  },
  PTP_DIESEL: {
    pageTop: 56.9, left: 54.8, right: 558.7, bodyBottom: 806,
    footer: { x: 63.9, nameTop: 848.7, nameSize: 11, addrTop: 874.2, addrSize: 11, address: 'Jl. Pondasi No. 50 B, Kampung Ambon, Jakarta Timur. 13210' },
    cover: makeCover({
      bottomTop: 870.9, bottomEnd: 956.5, topBottom: 48.8, bars: [42.4, 559.5], yearX: 85.2, titleTop: 137.6,
      colonX: 207.9, infoTop: 282.0, infoPitch: 16.1, address: COVER_ADDRESS_B,
      photo: { x: 134.5, y: 428.7, w: 340.2, h: 255.1 }, addressTop: 742.3
    }),
    grid: { x: [64.1, 305.1, 546.1], rowPitch: 212.1, captionH: 25.7, imgDX: 7.1, imgDY: 27.9, imgW: 226.8, imgH: 170.1, rowsPerPage: 3 }
  },
  IPP: {
    pageTop: 57.0, left: 63.9, right: 553.0, bodyBottom: 806,
    footer: { x: 49.7, nameTop: 845.4, nameSize: 12, addrTop: 860.0, addrSize: 12, address: ADDRESS_FOOTER },
    cover: makeCover({
      bottomTop: 879.7, bottomEnd: 929.1, topBottom: 52.5, bars: [43.5, 563.5], yearX: 85.2, titleTop: 137.7,
      colonX: 207.9, infoTop: 250.9, infoPitch: 16.1, address: COVER_ADDRESS_B,
      photo: { x: 148.8, y: 419.2, w: 311.8, h: 233.8 }, addressTop: 729.0, addressPitch: 14.5
    }),
    grid: { x: [63.9, 304.9, 545.9], rowPitch: 212.1, captionH: 25.7, imgDX: 7.1, imgDY: 27.9, imgW: 226.8, imgH: 170.1, rowsPerPage: 3 }
  },
  LIS: {
    pageTop: 56.9, left: 56.7, right: 586.1, bodyBottom: 810,
    footer: { x: 49.7, nameTop: 864.4, nameSize: 11, addrTop: 879.0, addrSize: 11, address: ADDRESS_FOOTER },
    cover: makeCover({
      bottomTop: 871.5, bottomEnd: 927.8, topBottom: 48.0, bars: [47.8, 556.3], yearX: 85.2, yearTop: 60.8, titleTop: 134.5,
      colonX: 207.9, infoTop: 263.7, infoPitch: 18.5, address: COVER_ADDRESS_B,
      photo: { x: 148.8, y: 432.2, w: 311.8, h: 233.8 }, addressTop: 737.0
    }),
    grid: { x: [56.7, 315.2, 586.1], rowPitch: 249.0, captionH: 41.5, imgDX: 15.8, imgDY: 66.0, imgW: 226.7, imgH: 170.0, rowsPerPage: 3 }
  },
  IPK: {
    pageTop: 54.0, left: 78.0, right: 552.9, bodyBottom: 820,
    footer: { x: 21.2, nameTop: 878.9, nameSize: 12, addrTop: 895.4, addrSize: 11, address: ADDRESS_FOOTER },
    cover: makeCover({
      bottomTop: 884.8, bottomEnd: 940.4, topBottom: 48.8, bars: [45.0, 560.2], yearX: 78.0, yearTop: 71.9, underlineY: 96.9,
      titleTop: 148.5, colonX: 171.9, infoTop: 292.9, infoPitch: 16.1, address: COVER_ADDRESS_B,
      photo: { x: 148.8, y: 447.1, w: 311.8, h: 234.1 }, addressTop: 763.2
    }),
    grid: { x: [64.6, 304.9, 545.9], rowPitch: 212.9, captionH: 27.9, imgDX: 6.7, imgDY: 27.9, imgW: 226.7, imgH: 170.2, rowsPerPage: 3 }
  }
};
LHPP_PROFILES.LE = { ...LHPP_PROFILES.PAA };

function pickProfile(report) {
  if (report.categoryCode === 'PTP' && report.isDiesel) return LHPP_PROFILES.PTP_DIESEL;
  return LHPP_PROFILES[report.categoryCode] || LHPP_PROFILES.PAA;
}

// ============================================================================
// UTILITAS ISI
// ============================================================================
function fieldOf(data, ...keys) {
  const td = asObject(data.technical_data);
  for (const key of keys) {
    const v = td[key] ?? data[key];
    if (hasRecordedReportValue(v)) return String(v);
  }
  return '-';
}

function joinParts(parts, sep = ' / ') {
  return parts.filter((p) => hasReportValue(p) && p !== '-').join(sep) || '-';
}

function buildCoverRows(report, data) {
  const f = (...k) => fieldOf(data, ...k);
  const company = f('client_name');
  const itemNo = f('item_no');
  const inspected = formatIndoDate(data.inspection_date);
  const reinsp = hasReportValue(data.recommended_valid_until) ? formatIndoDate(data.recommended_valid_until) : '-';
  const objectName = data.object_name || report.categoryName;
  const loc = f('install_location', 'client_address');
  const cap = f('capacity', 'swl', 'kapasitas_daya', 'kapasitas_volume');
  const year = f('manufacture_year', 'tahun_pembuatan');
  switch (report.categoryCode) {
    case 'PUBT':
      return [['Perusahaan', company], ['Item No', itemNo], ['Jenis', `PUBT / ${objectName}`], ['SN', f('serial_number')],
        ['Lokasi', loc], ['Inspected', inspected], ['Re – Inspection', reinsp]];
    case 'IPP':
      return [['Perusahaan', company], ['Item No', itemNo], ['Jenis', `IPP / ${f('jenis_instalasi', 'object_name')}`],
        ['SN', f('serial_number')], ['Lokasi', loc], ['Inspected', inspected], ['Re – Inspection', reinsp]];
    case 'LIS':
      return [['Perusahaan', company], ['Jenis', objectName], ['SN', joinParts([f('serial_number'), cap], ' / ')],
        ['Lokasi', loc], ['Inspected', inspected], ['Re – Inspection', reinsp]];
    case 'IPK':
      return [['Perusahaan', company], ['Jenis', `IPK / ${String(objectName).toUpperCase()}`], ['SN', f('serial_number')],
        ['Lokasi', loc], ['Inspected', inspected], ['Re-Inspection', reinsp]];
    case 'PTP':
      if (report.isDiesel) {
        return [['Perusahaan', company], ['Jenis', `PTP / ${objectName}`], ['SN', joinParts([f('serial_number'), cap, year], ' / ')],
          ['Lokasi', loc], ['Inspected', inspected], ['Re- Inspection', reinsp]];
      }
      return [['Perusahaan', company], ['Item No', itemNo], ['Jenis', `PTP / ${objectName}`], ['Lokasi', loc],
        ['Inspected', inspected], ['Re- Inspection', reinsp]];
    default:
      return [['Perusahaan', company], ['Item No', itemNo], ['Jenis', `${report.categoryCode} / ${objectName}`],
        ['SN', joinParts([f('serial_number'), cap, year], ' / ')], ['Lokasi', loc], ['Inspected', inspected],
        ['Re-Inspection', reinsp]];
  }
}

function pickCoverPhoto(photos) {
  const images = photos.filter((p) => ['image/jpeg', 'image/png'].includes(p.mimeType));
  return images.find((p) => /keseluruhan|overall|tampak depan|cover/i.test(p.caption || '')) || images[0] || null;
}

/** Item checklist siap gambar dari report.checklistRows. */
function toChecklistItems(report, mode) {
  const statusOf = (r) => (r.choice === 'SESUAI' ? 'OK' : r.choice === 'TIDAK_SESUAI' ? 'BAD'
    : r.choice === 'TIDAK_BERLAKU' ? 'NA' : '');
  const noteOf = (r) => (r.choice === 'TIDAK_BERLAKU'
    ? (r.note || 'N/A')
    : r.inputType === 'CHOICE'
      ? r.note
      : [r.value !== 'Belum diisi' ? r.value : '', r.note].filter(hasReportValue).join(' / '));
  const measureRx = /(kebisingan|pencahayaan|penerangan|grounding|pembumian|tahanan|putaran|rpm|getaran|ketebalan|thickness)/i;
  const groups = [];
  for (const r of report.checklistRows.filter((x) => x.inputType === 'CHOICE' || !measureRx.test(`${x.section} ${x.label}`))) {
    const last = groups[groups.length - 1];
    if (!last || last.section !== r.section) groups.push({ section: r.section, rows: [r] });
    else last.rows.push(r);
  }
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const items = [];
  groups.forEach((g, gi) => {
    if (mode === 'merged') {
      g.rows.forEach((r) => items.push({ no: String(gi + 1), group: g.section, label: r.label, status: statusOf(r), note: noteOf(r) }));
    } else if (mode === 'flat-heading') {
      items.push({ no: String(gi + 1), label: g.section, heading: true });
      g.rows.forEach((r, ri) => {
        const hasLetter = /^(\(?[a-z]\)?[.)])\s/.test(r.label);
        items.push({ label: hasLetter ? r.label : `${letters[ri] || '-'}. ${r.label}`, status: statusOf(r), note: noteOf(r) });
      });
    } else if (mode === 'section-numbered') {
      items.push({ label: `${String.fromCharCode(65 + gi)}. ${g.section.toUpperCase()}`, heading: true, section: true });
      g.rows.forEach((r, ri) => items.push({ no: String(ri + 1), label: r.label, status: statusOf(r), note: noteOf(r) }));
    } else {
      g.rows.forEach((r, ri) => items.push({ no: ri === 0 ? String(gi + 1) : '', label: ri === 0 ? `${g.section}: ${r.label}` : r.label, status: statusOf(r), note: noteOf(r) }));
    }
  });
  return items;
}

/** Baris pengukuran numerik (kebisingan, pencahayaan, grounding, dll). */
function collectMeasurements(report) {
  const explicit = asArray(report.technicalData.measurements);
  if (explicit.length > 0) {
    return explicit.map((m) => ({ label: m.label, value: [m.value, m.unit].filter(hasReportValue).join(' '), standard: m.standard || m.note || '' }));
  }
  const rx = /(kebisingan|pencahayaan|penerangan|grounding|pembumian|tahanan|putaran|rpm|getaran|ketebalan|thickness)/i;
  return report.checklistRows
    .filter((r) => r.inputType !== 'CHOICE' && r.value !== 'Belum diisi' && rx.test(`${r.section} ${r.label}`))
    .map((r) => ({ label: r.label, value: r.value, standard: r.note || '' }));
}

/** Tabel sederhana: header + baris, kolom ditentukan x-nya. */
function drawSimpleTable(c, header, rows, xs, o = {}) {
  const size = o.size ?? 12;
  const rowMin = o.rowMin ?? 20.4;
  const headerH = o.headerH ?? rowMin + 0.8;
  const aligns = o.aligns ?? xs.slice(0, -1).map(() => 'center');
  const drawHeader = () => {
    header.forEach((h, i) => c.cell(xs[i], c.y, xs[i + 1] - xs[i], headerH, h, { size, bold: true, align: 'center', vAlign: 'middle', pitch: size * 1.15 }));
    c.y += headerH;
  };
  c.ensure(headerH + rowMin);
  if (header.length) drawHeader();
  rows.forEach((row) => {
    const lines = row.map((v, i) => c.wrap(v, xs[i + 1] - xs[i] - 10.8, size).length);
    const h = Math.max(rowMin, Math.max(...lines) * size * 1.15 + 5);
    c.ensure(h, header.length ? drawHeader : null);
    row.forEach((v, i) => c.cell(xs[i], c.y, xs[i + 1] - xs[i], h, v, { size, align: aligns[i], pitch: size * 1.15 }));
    c.y += h;
  });
}

/** Judul bagian (14pt tebal) tanpa kotak, dengan jarak seperti rujukan. */
function drawBigHeading(c, title, o = {}) {
  c.ensure(o.reserve ?? 90);
  c.txt(title, o.x ?? c.left, c.y + (o.dy ?? 2.3), { size: o.size ?? 14, bold: true });
  c.y += o.h ?? 26;
}

function drawConclusionSection(c, report, data, o = {}) {
  const sectionNo = o.no ?? 'VI';
  const heading = o.heading ?? `${sectionNo}. KESIMPULAN`;
  c.newPage();
  c.txt(heading, c.left, c.y + 2.0, { size: 14, bold: true });
  c.y += o.afterHeading ?? 25;
  const verdict = report.conclusion;
  const parts = [
    { t: o.lead ?? 'Atas dasar hasil pemeriksaan dan pengujian tersebut di atas, maka dapat disimpulkan bahwa ' },
    { t: `${data.object_name || report.categoryName}`, b: true },
    { t: `, dengan Nomor Seri: ` },
    { t: fieldOf(data, 'serial_number'), b: true },
    { t: `, kapasitas: ` },
    { t: fieldOf(data, 'capacity', 'swl', 'kapasitas_daya', 'kapasitas_volume'), b: true },
    { t: ', dinyatakan ' },
    { t: verdict.toUpperCase().includes('TIDAK') ? 'TIDAK MEMENUHI PERSYARATAN K3' : 'MEMENUHI PERSYARATAN K3', b: true },
    { t: '. Unit dapat digunakan di ' },
    { t: `${fieldOf(data, 'install_location')} ${data.client_name || ''}`.trim(), b: true },
    { t: ' dengan mengikuti rekomendasi yang telah kami berikan, antara lain:' }
  ];
  drawRichParagraph(c, o.parts || parts, { indent: 28.3, pitch: 20.7 });
  if (hasReportValue(report.conclusionNotes) && report.conclusionNotes !== '-') {
    c.y += 4;
    drawRichParagraph(c, [{ t: report.conclusionNotes }], { pitch: 20.7 });
  }
  c.y += 8;
  const rulesHeading = o.rulesHeading ?? `${o.rulesNo ?? 'VII'}. SYARAT - SYARAT`;
  c.txt(rulesHeading, c.left, c.y + 2.0, { size: 14, bold: true });
  c.y += 25;
  const rules = [...report.rules];
  if (hasRecordedReportValue(report.recommendations)) rules.push(`${rules.length + 1}. ${report.recommendations}`);
  drawNumberedList(c, rules, { pitch: 20.7 });
  c.y += 28;
  drawSignatureBlock(c, report, data, { qrBuffer: o.qrBuffer, centerX: o.centerX ?? 432 });
}

// ============================================================================
// PAA
// ============================================================================
function renderPaa(c, report, data, ctx) {
  const td = report.technicalData;
  const f = (...k) => fieldOf(data, ...k);
  const isGantry = /gantry/i.test(data.object_name || '');

  // ---- Halaman: I. DATA UMUM ---------------------------------------------
  c.newPage();
  drawTitleBlock(c, [
    'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN',
    'PESAWAT ANGKAT DAN PESAWAT ANGKUT',
    `(${String(data.object_name || report.categoryName).toUpperCase()})`,
    `NO. ${data.lhpp_no || data.po_number || '-'}`
  ], { box: true, x0: 63.9, x1: 545.9, y0: 56.8, y1: 131.3, firstTop: 59.3, pitch: 18.5 });
  drawSectionRow(c, 'I. DATA UMUM', { h: 25.5, reserve: 60 });
  c.y += 0.5;
  drawKeyValueTable(c, report.identityRows, {
    labelW: 170, colonInValue: true, minH: 25.6, pitch: 20.7, size: 12, labelMid: true,
    rowHeight: (lines) => (lines === 1 ? 25.6 : 20.7 * lines + 0.4),
    firstTop: (lines) => (lines === 1 ? 4.2 : 1.7)
  });

  // ---- Halaman: II. DATA TEKNIS ------------------------------------------
  c.newPage();
  drawSectionRow(c, 'II. DATA TEKNIS', { h: 20.4 });
  c.cell(c.left, c.y, c.width, 20.3, 'DATA PESAWAT ANGKAT DAN ANGKUT', { size: 12, bold: true, align: 'center' });
  c.y += 20.3;
  const summary = [
    ['Pemilik', data.client_name], ['Alamat', data.client_address], ['Jenis Peralatan', data.object_name],
    ['Pabrik Pembuat Hoist', f('pabrik_pembuat_hoist', 'manufacturer', 'brand')], ['Kapasitas Angkat', f('swl', 'capacity')],
    ['Nomor Seri Unit', data.serial_number || f('serial_number')], ['Tahun Pembuatan', f('manufacture_year')]
  ];
  drawKeyValueTable(c, summary, { labelW: 171.4, minH: 20.4, pitch: 13.8, size: 12 });
  c.y += 15.4;
  drawPaaTechnicalGroups(c, f, isGantry);

  // ---- Halaman: III. PEMERIKSAAN VISUAL ----------------------------------
  c.newPage();
  const cx = LHPP_PROFILES.PAA.checklist.x;
  const heading = (first) => {
    if (first) { c.cell(cx[0], c.y, cx[6] - cx[0], 20.4, 'III. PEMERIKSAAN VISUAL', { size: 14, bold: true, padX: 6.2, padTop: 2.3 }); c.y += 20.4; }
  };
  const header = (cc, first) => {
    if (first) heading(true);
    const y = cc.y;
    const total = first ? 71.3 : 63.7;
    const kondisiH = first ? 20.4 : 21.4;
    cc.cell(cx[0], y, cx[1] - cx[0], total, 'No', { size: 12, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cx[1], y, cx[2] - cx[1], total, 'Nama Bagian /\nKomponen', { size: 12, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cx[2], y, cx[3] - cx[2], total, 'Pemeriksaan terhadap', { size: 12, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cx[3], y, cx[5] - cx[3], kondisiH, 'Kondisi', { size: 12, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cx[3], y + kondisiH, cx[4] - cx[3], total - kondisiH, 'Memenuhi\nSyarat K3', { size: 10, bold: true, align: 'center', vAlign: 'middle', padX: 1.5 });
    cc.cell(cx[4], y + kondisiH, cx[5] - cx[4], total - kondisiH, 'Tidak\nMemenuhi\nSyarat K3', { size: 10, bold: true, align: 'center', vAlign: 'middle', padX: 1.5 });
    cc.cell(cx[5], y, cx[6] - cx[5], total, 'Keterangan', { size: 12, bold: true, align: 'center', vAlign: 'middle' });
    return total;
  };
  if (report.checklistRows.length === 0) {
    heading(true);
    c.cell(cx[0], c.y, cx[6] - cx[0], 24, 'Belum ada butir checklist pada versi template ini.', { size: 11, italic: true });
    c.y += 24;
  } else {
    drawChecklist(c, toChecklistItems(report, 'merged'), {
      cols: cx, roles: ['no', 'group', 'label', 'ok', 'bad', 'note'], size: 12, rowMin: 20.35, labelStep: 20.8,
      groupPitch: 14.9, labelPitch: 14.9, header
    });
  }

  // ---- IV. PEMERIKSAAN TIDAK MERUSAK -------------------------------------
  const chain = asObject(td.chain_inspection);
  const hook = asObject(td.hook_inspection);
  const ndtRows = asArray(td.ndt_tables);
  if (Object.keys(chain).length || Object.keys(hook).length || ndtRows.length) {
    c.y += 24;
    drawBigHeading(c, 'IV. PEMERIKSAAN TIDAK MERUSAK', { x: 63.3, reserve: 150 });
    if (Object.keys(chain).length) drawPaaMeasureTable(c, 'IV. 1.   CHAIN / RANTAI', chain);
    if (Object.keys(hook).length) { c.newPage(); drawPaaMeasureTable(c, 'IV. 2.   HOOK / KAIT', hook, true); }
    ndtRows.forEach((t) => { c.ensure(160); drawPaaMeasureTable(c, t.title, t); });
  }
  const mpi = asObject(td.mpi_report);
  if (Object.keys(mpi).length) { c.newPage(); drawMpiReport(c, mpi, data); }

  // ---- V. PENGUJIAN -------------------------------------------------------
  drawPaaTests(c, report, data, td);

  // ---- VI/VII. KESIMPULAN & SYARAT ---------------------------------------
  drawConclusionSection(c, report, data, { no: 'VI', rulesNo: 'VII', qrBuffer: ctx.qrBuffer });

  // ---- VIII. DOKUMENTASI --------------------------------------------------
  c.newPage();
  c.txt('VIII. DOKUMENTASI', c.left, c.y + 2.0, { size: 14, bold: true });
  c.y += 25.5;
  drawPhotoGrid(c, report.photos, { grid: LHPP_PROFILES.PAA.grid, captionPosition: ctx.captionPosition });
}

function drawPaaTechnicalGroups(c, f, isGantry) {
  const x = [63.9, 91.8, 199.3, 277.3, 366.7, 456.2, 545.6];
  const H = 20.4;
  const size = 12;
  const group = (no, name, rows) => {
    const total = rows.reduce((a, r) => a + (r.h ?? H), 0);
    c.ensure(total);
    const y0 = c.y;
    c.cell(x[0], y0, x[1] - x[0], total, String(no), { size, align: 'center', vAlign: 'middle' });
    c.cell(x[1], y0, x[2] - x[1], total, name, { size, align: 'center', vAlign: 'middle' });
    let y = y0;
    rows.forEach((r) => {
      const h = r.h ?? H;
      r.cells.forEach(([a, b, text, o = {}]) => c.cell(x[a], y, x[b] - x[a], h, text, { size, ...o }));
      y += h;
    });
    c.y = y0 + total;
  };
  const span = (label, value) => ({ cells: [[2, 4, label], [4, 6, value]] });
  group(1, 'Spesifikasi', [
    span('Tinggi Angkat', f('lifting_height')), span('Panjang Span', f('span')), span('Panjang Runway Rail', f('runway_length')),
    { h: 20.5, cells: [[2, 3, 'Kecepatan', { vAlign: 'middle' }], [3, 4, '- Hoisting'], [4, 6, f('hoist_speed')]] },
    { h: 20.9, cells: [[2, 3, ''], [3, 4, '- Traversing'], [4, 6, f('traverse_speed', 'travel_speed')]] },
    { h: 20.9, cells: [[2, 3, ''], [3, 4, '- Travelling'], [4, 6, f('travelling_speed', 'travel_speed')]] }
  ]);
  const motor = (label, key) => ({
    cells: [[2, 3, label], [3, 4, f(`${key}_hoisting`, key)], [4, 5, f(`${key}_traversing`)], [5, 6, f(`${key}_travelling`)]]
  });
  group(2, 'Motor Penggerak', [
    { cells: [[2, 3, ''], [3, 4, 'Hoisting', { align: 'center' }], [4, 5, 'Traversing', { align: 'center' }], [5, 6, 'Travelling', { align: 'center' }]] },
    motor('Type', 'motor_type'), motor('Daya', 'motor_power'), motor('Putaran', 'motor_rpm'),
    motor('Voltage', 'motor_voltage'), motor('Amphere', 'motor_ampere'), motor('Frekuensi', 'motor_frequency')
  ]);
  group(3, 'Rem', [
    { h: 28.1, cells: [[2, 3, 'Jenis'], [3, 4, f('brake_type')], [4, 5, '-'], [5, 6, '-']] },
    { cells: [[2, 3, 'Type'], [3, 4, f('brake_model')], [4, 5, '-'], [5, 6, '-']] }
  ]);
  const triple = (a, b, c3) => [
    { cells: [[2, 3, a[0]], [3, 6, a[1]]] }, { cells: [[2, 3, b[0]], [3, 6, b[1]]] }, { cells: [[2, 3, c3[0]], [3, 6, c3[1]]] }
  ];
  group(4, 'Kait Utama', triple(['Type', f('hook_type')], ['Kapasitas', f('hook_capacity')], ['Material', f('hook_material')]));
  group(5, 'Kait Tambahan', triple(['Type', f('aux_hook_type')], ['Kapasitas', f('aux_hook_capacity')], ['Material', f('aux_hook_material')]));
  group(6, 'Chain', triple(['Dimensi', f('chain_dimension')], ['Panjang', f('chain_length')], ['Diameter', f('chain_diameter')]));
  void isGantry;
}

/** Tabel ukur chain/hook: spec vs hasil + kesimpulan. */
function drawPaaMeasureTable(c, title, t, small = false) {
  const size = small ? 11 : 12;
  c.ensure(40);
  c.txt(title, c.left + 18, c.y + 2.0, { size: 12, bold: true });
  c.y += 24;
  const xs = small ? [63.9, 99.5, 248.2, 418.4, 546, 553] : [63.9, 92.2, 191.4, 276.5, 375.8, 545.6];
  const hasSketch = !small && !!t.sketch;
  const cols = small ? [63.9, 99.5, 248.2, 297.8, 418.4, 553.0] : xs;
  const rows = asArray(t.rows);
  const header = small ? ['No.', 'Bagian', 'Spec', 'Hasil', 'Keterangan'] : ['No', 'Uraian', 'Spec', 'Hasil', 'Sketsa'];
  const rowH = small ? 22.9 : 28.8;
  const headH = small ? 22.9 : 21.2;
  const y0 = c.y;
  header.forEach((h, i) => c.cell(cols[i], c.y, cols[i + 1] - cols[i], headH, h, { size, bold: true, align: 'center', vAlign: 'middle' }));
  c.y += headH;
  const bodyTop = c.y;
  rows.forEach((r) => {
    const cells = [r.no, r.label, r.spec, r.result, r.note || ''];
    cells.forEach((v, i) => {
      if (!small && i === 4) return;
      c.cell(cols[i], c.y, cols[i + 1] - cols[i], rowH, v, { size, align: 'center', vAlign: 'middle' });
    });
    c.y += rowH;
  });
  if (!small) c.rect(cols[4], bodyTop, cols[5] - cols[4], Math.max(rowH * rows.length, 1));
  if (hasSketch && t.sketch && fs.existsSync(t.sketch)) {
    try { c.doc.image(t.sketch, cols[4] + 4, bodyTop + 4, { fit: [cols[5] - cols[4] - 8, Math.max(rowH * rows.length, 1) - 8], align: 'center', valign: 'center' }); } catch { /* abaikan */ }
  }
  if (t.conclusion) {
    c.cell(cols[0], c.y, cols[cols.length - 1] - cols[0], 30, `Kesimpulan : ${t.conclusion}`, { size: 12, pitch: 14.9 });
    c.y += 30;
  }
  c.y += 14;
  void y0;
}

function drawMpiReport(c, m, data) {
  const L = 63.9; const R = 553.0; const W = R - L;
  const top = c.y;
  const logo = officialLogoPath;
  c.rect(L, top, 150, 62);
  if (fs.existsSync(logo)) c.doc.image(logo, L + 30, top + 6, { width: 80 });
  c.txt('PT. UPAYA RIKSA DAYA', L, top + 48, { size: 9, bold: true, width: 150, align: 'center' });
  c.rect(L + 150, top, W - 150, 62);
  c.txt('NDT', L + 150, top + 16, { size: 11, bold: true, width: W - 150, align: 'center' });
  c.txt('MAGNETIC PARTICEL INSPECTION TEST REPORT', L + 150, top + 30, { size: 11, bold: true, width: W - 150, align: 'center' });
  c.y = top + 62;
  const row = (cells, h = 17.5, size = 10) => {
    let x = L;
    cells.forEach(([w, text, o = {}]) => { c.cell(x, c.y, w, h, text, { size, padTop: 2.5, padX: 4, ...o }); x += w; });
    c.y += h;
  };
  row([[350, `Client : ${m.client || data.client_name || '-'}`], [W - 350, `Date : ${m.date || formatIndoDate(data.inspection_date)}`]]);
  row([[W, `Location : ${m.location || '-'}`]]);
  row([[200, `Subject : ${m.subject || '-'}`], [100, `Material : ${m.material || 'C/S'}`], [100, 'Procedure'], [W - 400, m.procedure || 'ASME BPVC.V article 7']], 36);
  row([[200, `Serial No : ${m.serial_no || '-'}`], [100, `Temp. : ${m.temp || 'Ambient'}`], [100, 'Acc. Criteria'], [W - 400, m.acc_criteria || 'ASME BPVC.VIII Mandatory Appendix 6']], 50);
  const box = (on) => (on ? '[x]' : '[ ]');
  const sel = (arr, v) => arr.map((k) => `${box(String(v || '').toLowerCase() === k.toLowerCase())} ${k}`).join('    ');
  row([[170, 'Surface Preparation'], [W - 170, sel(['As-Welded', 'As-Rolled', 'As-Forged', 'Grinding', 'Machining', 'Blasting', 'Wire Brush'], m.surface)]], 30);
  row([[170, 'Surface Preparation'], [W - 170, sel(['Before/After Pwht', 'Before/After Load Test', 'Other'], m.stage || 'Before/After Load Test')]]);
  row([[170, 'Magnetization Techniques'], [W - 170, sel(['Prod', 'Yoke'], m.technique || 'Yoke')]]);
  row([[170, 'Magnetization Currents'], [W - 170, sel(['AC', 'DC', 'Permanent'], m.current || 'Permanent')]]);
  row([[170, 'Calibration Block'], [W - 170, `Weight : ${m.calibration_block || '40Lb'}`]]);
  row([[170, 'Examination Medium'], [W - 170, sel(['Dry Visible', 'Wet Visible', 'Wet Fluorescent'], m.medium || 'Wet Visible')]]);
  [['Cleaner', m.cleaner || 'Magnaflux SKC-S'], ['Contrast', m.contrast || 'Magnaflux WCP-2'], ['Magnetic Particle', m.particle || 'Magnaflux 7HF']].forEach(([l, v]) => {
    c.cell(L, c.y, 170, 34, l, { size: 10, vAlign: 'middle', padX: 4 });
    c.cell(L + 170, c.y, W - 170, 17, `Merk : ${v}`, { size: 10, padTop: 2.5, padX: 4 });
    c.cell(L + 170, c.y + 17, W - 170, 17, 'Application : Spraying', { size: 10, padTop: 2.5, padX: 4 });
    c.y += 34;
  });
  const cols = [L, L + 28, L + 170, L + 330, L + 395, R];
  ['No', 'Description', 'Indication', 'Result', 'Remark'].forEach((h, i) => c.cell(cols[i], c.y, cols[i + 1] - cols[i], 17, h, { size: 10, align: 'center', padTop: 2.5 }));
  c.y += 17;
  asArray(m.results).forEach((r, i) => {
    [String(r.no ?? i + 1), r.description, r.indication, r.result, r.remark].forEach((v, k) =>
      c.cell(cols[k], c.y, cols[k + 1] - cols[k], 30, v, { size: 10, padTop: 2.5, padX: 4 }));
    c.y += 30;
  });
}

function drawPaaTests(c, report, data, td) {
  const fnTests = asArray(td.function_tests);
  const load = asObject(td.load_test);
  const defl = asObject(td.deflection);
  if (!fnTests.length && !Object.keys(load).length && !Object.keys(defl).length) return;
  c.newPage();
  c.txt('V. PENGUJIAN', c.left + 18, c.y + 2.0, { size: 14, bold: true });
  c.y += 26;
  if (fnTests.length) {
    c.txt('V.1.   UJI FUNGSI', c.left + 42.6, c.y + 2.0, { size: 12, bold: true });
    c.y += 24;
    drawSimpleTable(c, ['Pengujian', 'Hasil', 'Keterangan'], fnTests.map((t) => [t.name, t.result || '-', t.note || '']),
      [63.9, 212.7, 354.5, 553.0], { rowMin: 31.7, headH: 28.9, aligns: ['left', 'center', 'center'] });
    c.y += 20;
  }
  if (Object.keys(load).length) {
    c.txt('V.2.   UJI BEBAN', c.left + 42.6, c.y + 2.0, { size: 12, bold: true });
    c.y += 24;
    const xs = [63.9, 139.2, 205.6, 276.5, 347.5, 439.9, 553.0];
    const y0 = c.y;
    c.cell(xs[0], y0, xs[1] - xs[0], 68.6, 'Beban Uji', { bold: true, align: 'center', vAlign: 'middle' });
    c.cell(xs[1], y0, xs[4] - xs[1], 34.4, 'Kondisi', { bold: true, align: 'center', vAlign: 'middle' });
    c.cell(xs[4], y0, xs[5] - xs[4], 68.6, 'Brake\nSystem', { bold: true, align: 'center', vAlign: 'middle' });
    c.cell(xs[5], y0, xs[6] - xs[5], 68.6, 'Keterangan', { bold: true, align: 'center', vAlign: 'middle' });
    ['Hoisting', 'Traversing', 'Travelling'].forEach((h, i) => c.cell(xs[1 + i], y0 + 34.4, xs[2 + i] - xs[1 + i], 34.2, h, { bold: true, align: 'center', vAlign: 'middle' }));
    c.y = y0 + 68.6;
    [load.load, load.hoisting, load.traversing, load.travelling, load.brake, load.note].forEach((v, i) =>
      c.cell(xs[i], c.y, xs[i + 1] - xs[i], 29.6, v ?? '-', { align: 'center', vAlign: 'middle' }));
    c.y += 29.6;
    if (load.conclusion) {
      c.cell(xs[0], c.y, xs[6] - xs[0], 41.9, `Kesimpulan : ${load.conclusion}`, { pitch: 20.7 });
      c.y += 41.9;
    }
    c.y += 20;
  }
  if (Object.keys(defl).length) {
    c.txt('HASIL PENGUKURAN DEFLEKSI :', c.left, c.y + 2.0, { size: 12, bold: true });
    c.y += 24;
    [`Standar/Tolak Ukur : 1/${defl.ratio || 888} x L (span) = ${defl.limit || '-'}`,
      `Berdasarkan design : 1/${defl.ratio || 888} x ${defl.span || '-'} = ${defl.limit || '-'}`,
      `Berdasarkan pengukuran : ${defl.measure_text || '-'}`,
      `Maka : ${defl.result_text || '-'}`].forEach((line) => { c.txt(line, c.left, c.y, { size: 12 }); c.y += 24; });
    c.txt('Standar/referensi :', c.left, c.y, { size: 12, bold: true }); c.y += 21;
    ['1. Peraturan Menteri Tenaga Kerja dan Transmigrasi R.I No : Per./08/Men/2020', '2. ASME B.30.11'].forEach((line) => {
      c.txt(line, c.left, c.y, { size: 12 }); c.y += 20.7;
    });
  }
}

// ============================================================================
// RENDERER GENERIK (dipakai PUBT, PTP, IPP, LIS, IPK, LE) + blok khusus
// ============================================================================
function drawFindings(c, report) {
  if (report.noFindings) return;
  c.ensure(60);
  c.txt('TEMUAN LAPANGAN & REKOMENDASI', c.left, c.y + 2.0, { size: 14, bold: true });
  c.y += 26;
  const w = c.width;
  drawSimpleTable(c, ['Tingkat', 'Uraian Temuan', 'Rekomendasi'],
    report.findings.map((f) => [(f.severity || 'TEMUAN').toUpperCase(), f.description || '-', f.recommendation || '-']),
    [c.left, c.left + 0.14 * w, c.left + 0.57 * w, c.right], { size: 11, aligns: ['center', 'left', 'left'] });
  c.y += 16;
}

function renderGeneric(c, report, data, ctx, o) {
  const td = report.technicalData;
  // Halaman 2: judul + data umum
  c.newPage();
  drawTitleBlock(c, o.titleLines, o.titleSpec);
  if (o.dataUmumHeading) o.dataUmumHeading(c);
  drawKeyValueTable(c, report.identityRows, o.identitySpec);

  // Data teknis
  if (o.technical) {
    if (o.technicalNewPage !== false) c.newPage();
    o.technical(c, report, data, td);
  }

  // Checklist
  if (o.checklist) {
    const k = o.checklist;
    if (k.newPage !== false) c.newPage();
    if (k.heading) k.heading(c);
    if (report.checklistRows.length === 0) {
      c.cell(k.cols[0], c.y, k.cols[k.cols.length - 1] - k.cols[0], 24, 'Belum ada butir checklist pada versi template ini.', { size: 11, italic: true });
      c.y += 24;
    } else {
      drawChecklist(c, toChecklistItems(report, k.mode), {
        cols: k.cols, roles: k.roles, size: k.size ?? 12, rowMin: k.rowMin ?? 20.4,
        labelStep: k.labelStep, header: k.header, mergeNA: false, padX: k.padX
      });
    }
  }
  if (o.afterChecklist) o.afterChecklist(c, report, data, td);
  drawFindings(c, report);

  // Kesimpulan, syarat, tanda tangan
  drawConclusionSection(c, report, data, { ...o.conclusion, qrBuffer: ctx.qrBuffer });

  // Dokumentasi
  c.newPage();
  c.txt(o.photoHeading ?? 'DOKUMENTASI', c.left, c.y + 2.0, { size: 14, bold: true });
  c.y += 25.5;
  drawPhotoGrid(c, report.photos, { grid: c.profile.grid, captionPosition: ctx.captionPosition });
}

/** Header tabel 2 tingkat: No | Bagian | Kondisi(ok,bad) | Keterangan */
function makeCondHeader(cols, labels, o = {}) {
  const [noL, labelL, okL, badL, noteL, kondisiL] = labels;
  return (cc, first) => {
    const total = first ? (o.first ?? 60.3) : (o.cont ?? 52);
    const kh = o.kondisiH ?? 18.4;
    const y = cc.y;
    const sz = o.size ?? 12;
    cc.cell(cols[0], y, cols[1] - cols[0], total, noL, { size: sz, bold: true, align: 'center', vAlign: 'middle', padX: 1 });
    cc.cell(cols[1], y, cols[2] - cols[1], total, labelL, { size: sz, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cols[2], y, cols[4] - cols[2], kh, kondisiL, { size: sz, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cols[2], y + kh, cols[3] - cols[2], total - kh, okL, { size: o.subSize ?? sz, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cols[3], y + kh, cols[4] - cols[3], total - kh, badL, { size: o.subSize ?? sz, bold: true, align: 'center', vAlign: 'middle' });
    cc.cell(cols[4], y, cols[5] - cols[4], total, noteL, { size: sz, bold: true, align: 'center', vAlign: 'middle' });
    return total;
  };
}

// ----------------------------------------------------------------------------
// PUBT
// ----------------------------------------------------------------------------
function drawPubtTechnical(c, report, data, _td) {
  const f = (...k) => fieldOf(data, ...k);
  const x = [64.3, 149.4, 216.9, 320.6, 554.0];
  c.txt('II. DATA TEKNIS', 67.3, c.y + 2.0, { size: 14, bold: true });
  c.y += 28;
  const H = 17.5;
  const group = (name, rows) => {
    const total = rows.length * H;
    c.ensure(total);
    const y0 = c.y;
    c.cell(x[0], y0, x[1] - x[0], total, name, { size: 12, bold: true, align: 'center', vAlign: 'middle' });
    let y = y0;
    // sub-kolom digabung per runtun sub yang sama
    let i = 0;
    while (i < rows.length) {
      const sub = rows[i].sub;
      let j = i;
      while (j < rows.length && rows[j].sub === sub) j += 1;
      if (sub) c.cell(x[1], y, x[2] - x[1], (j - i) * H, sub, { size: 12, vAlign: 'middle' });
      for (let k = i; k < j; k += 1) {
        const r = rows[k];
        const lx = sub ? x[2] : x[1];
        c.cell(lx, y, x[3] - lx, H, r.label, { size: 12, padTop: 1.7 });
        c.cell(x[3], y, x[4] - x[3], H, r.value, { size: 12, padTop: 1.7 });
        y += H;
      }
      i = j;
    }
    c.y = y0 + total;
  };
  const r = (label, value, sub) => ({ label, value, sub });
  group('Shell / Badan', [
    r('Jumlah RoundShell', f('jumlah_roundshell')), r('Cara Penyambungan', f('cara_penyambungan')),
    r('Material / Bahan', f('material_shell', 'shell_plate_spec')), r('Diameter Dalam (ID)', f('diameter_dalam')),
    r('Ketebalan (t)', f('shell_nominal_thk')), r('Panjang Badan', f('panjang_badan')),
    r('Jenis', f('jenis_penguat'), 'Penguat'), r('Jumlah', f('jumlah_penguat'), 'Penguat'),
    r('Ukuran/Dimensi', f('ukuran_penguat'), 'Penguat')
  ]);
  const head = (side) => ['Jenis/Bentuk|bentuk_head', 'Lengkungan (R)|head_radius', 'Lekukan (r)|head_knuckle_radius',
    'Kemiringan|head_angle', 'Diameter|diameter_head', 'Ketebalan|head_nominal_thk', 'Material / Bahan|material_head']
    .map((s) => { const [l, k] = s.split('|'); return r(l, f(`${k}_${side}`, k), side === 'kiri' ? 'Samping Kiri' : 'Samping Kanan'); });
  group('Tutup / Head', [...head('kiri'), ...head('kanan')]);
  group('Pipa-pipa / Channel', [
    r('Jenis/bentuk', f('pipe_type')), r('Diameter', f('pipe_diameter'), 'Dimensi'), r('Ketebalan', f('pipe_thickness'), 'Dimensi'),
    r('Panjang', f('pipe_length'), 'Dimensi'), r('Jumlah', f('pipe_count'), 'Dimensi'), r('Material', f('pipe_material')),
    r('Cara Pemasangan', f('pipe_installation')), r('Diameter', f('inst_pipe_diameter'), 'Instalasi Pipa'),
    r('Ketebalan', f('inst_pipe_thickness'), 'Instalasi Pipa'), r('Jenis Katup', f('valve_type'), 'Instalasi Pipa'),
    r('Jumlah', f('valve_count'), 'Instalasi Pipa')
  ]);
}

function pubtThicknessData(report, data) {
  const t = asArray(report.technicalData.thickness_measurements);
  return t.map((row) => {
    const readings = asArray(row.readings).map(Number).filter((n) => !Number.isNaN(n));
    const min = readings.length ? Math.min(...readings) : NaN;
    return { item: row.item, readings: asArray(row.readings), design: row.design ?? fieldOf(data, 'shell_nominal_thk'), min };
  });
}

function pubtAfterChecklist(c, report, data, td) {
  const f = (...k) => fieldOf(data, ...k);
  const dims = asArray(td.dimension_rows);
  if (dims.length) {
    c.newPage();
    c.txt('b) Dimensi', c.left + 35, c.y + 2.0, { size: 12, bold: true });
    c.y += 26;
    drawSimpleTable(c, ['No.', 'Komponen', 'Ukuran / Dimensi', 'Keterangan'], dims.map((d, i) => [String(d.no ?? i + 1), d.component, d.value || '', d.note || '']),
      [68.4, 270.9, 410.5, 559.0], { size: 12, rowMin: 18.4, aligns: ['center', 'left', 'left', 'left'] });
  }
  // IV. LAPORAN PENGUJIAN
  c.newPage();
  c.txt('IV.   LAPORAN PENGUJIAN', c.left + 17.6, c.y + 2.0, { size: 14, bold: true });
  c.y += 32;
  c.txt('a.  PEMERIKSAAN TIDAK MERUSAK ( NDT )', c.left + 17.6, c.y, { size: 12, bold: true });
  c.y += 24;
  asArray(td.ndt_tables).forEach((t) => {
    c.ensure(150);
    c.txt(t.title, c.left + 17.6, c.y, { size: 12, bold: true });
    c.txt(`Jenis NDT : ${t.method || ''}`, 324.9, c.y + 16.6, { size: 12, bold: true });
    c.y += 74;
    drawSimpleTable(c, ['No', 'Bagian yang di NDT', 'Lokasi', 'Cacat', 'Keterangan'],
      asArray(t.rows).map((r, i) => [String(i + 1), r.part, r.location, r.defect || 'Tidak ada', r.note || '']),
      [63.4, 109.7, 220.3, 284.1, 399.4, 509.1], { rowMin: 24, size: 12 });
    c.y += 16;
  });
  // b. Tekanan
  c.ensure(220);
  const pt = asObject(td.pressure_test);
  c.txt('b.  METODE PENGUJIAN TEKANAN', c.left + 17.6, c.y, { size: 12, bold: true });
  c.y += 24;
  drawSimpleTable(c, ['No', 'Data Pengujian', 'Simbol', 'Keterangan'], [
    ['1.', 'Tekanan Desain', 'DP', pt.design || f('tekanan_desain', 'design_pressure')],
    ['2.', 'Tekanan Kerja', 'WP', pt.working || f('tekanan_kerja', 'max_allowable_working_pressure')],
    ['3.', 'Tekanan Uji', 'TP', pt.test || f('test_pressure')],
    ['4.', 'Temperature', '', pt.temperature || 'Ambient'],
    ['5.', 'Waktu Penahanan Tekanan Desain/Kerja', 'T0', pt.hold_design || '-'],
    ['', 'Tekanan Uji', 'T1', pt.hold_test || '-'],
    ['6.', 'Kenaikan Temperatur', '', pt.temp_rise || '-']
  ], [c.left, c.left + 26, c.left + 250, c.left + 330, c.right], { rowMin: 20.4, aligns: ['center', 'left', 'center', 'left'] });
  c.y += 14;
  const sv = asObject(td.safety_valve_test);
  c.txt('c.  METODE PENGUJIAN SAFETY VALVE', c.left + 17.6, c.y, { size: 12, bold: true });
  c.y += 24;
  drawSimpleTable(c, ['No', 'Perlengkapan', 'Setting', 'Membuka', 'Menutup', 'Keterangan'],
    [['1', 'Tingkap Pengaman I', sv.set || f('safety_valve_set_pressure'), sv.open || '-', sv.close || '-', sv.note || '']],
    [c.left, c.left + 26, c.left + 190, c.left + 260, c.left + 330, c.left + 400, c.right],
    { rowMin: 22 });

  // V. Ketebalan
  const th = pubtThicknessData(report, data);
  if (th.length) {
    c.newPage();
    c.txt('V.   HASIL PENGUKURAN KETEBALAN DAN PERHITUNGAN', c.left + 11, c.y + 2.0, { size: 14, bold: true });
    c.y += 40;
    c.txt('LAPORAN HASIL PENGUKURAN KETEBALAN', 0, c.y, { size: 14, bold: true, width: c.doc.page.width, align: 'center' });
    c.y += 24;
    drawThicknessSketch(c, th);
    const L0 = c.left;
    const rows = th.map((t, i) => [String(i + 1), t.item, ...[0, 1, 2, 3, 4].map((k) => String(asArray(t.readings)[k] ?? '-').replace('.', ',')), String(t.design), Number.isNaN(t.min) ? '-' : `${String(t.min).replace('.', ',')} mm`]);
    const widths = [40, 85, 45, 45, 45, 45, 45, 70, 69];
    const xsT = widths.reduce((acc, w) => { acc.push(acc[acc.length - 1] + w); return acc; }, [L0]);
    drawSimpleTable(c, ['No', 'Item', 'T1', 'T2', 'T3', 'T4', 'T5', 'Design Thickness', 'Min. Thickness'], rows, xsT,
      { size: 12, rowMin: 20.4, headerH: 42 });
    c.y += 16;
    drawPubtCalc(c, th, data);
  }
}

function drawThicknessSketch(c, th) {
  const cx = c.doc.page.width / 2;
  const top = c.y + 16;
  const w = 170; const bodyH = 190; const hd = 46;
  c.doc.save();
  c.doc.rect(cx - w / 2, top + hd, w, bodyH).fillColor('#FFFF00').fill();
  c.doc.rect(cx - w / 2, top + hd, w, bodyH).lineWidth(1.4).strokeColor(LHPP_INK).stroke();
  [[top + hd, -1], [top + hd + bodyH, 1]].forEach(([y, dir]) => {
    c.doc.path(`M ${cx - w / 2} ${y} C ${cx - w / 2} ${y + dir * hd * 1.3} ${cx + w / 2} ${y + dir * hd * 1.3} ${cx + w / 2} ${y} Z`).fillColor('#FFFF00').fill();
    c.doc.path(`M ${cx - w / 2} ${y} C ${cx - w / 2} ${y + dir * hd * 1.3} ${cx + w / 2} ${y + dir * hd * 1.3} ${cx + w / 2} ${y}`).lineWidth(1.4).strokeColor(LHPP_INK).stroke();
  });
  c.doc.restore();
  const pos = [[[-0.2, -0.3], [-0.1, -0.1]], [], []];
  void pos;
  th.forEach((t, gi) => {
    const baseY = [top + hd * 0.4, top + hd + bodyH * 0.5, top + hd + bodyH + hd * 0.55][gi] ?? top;
    asArray(t.readings).slice(0, 5).forEach((val, k) => {
      const px = cx - w / 2 + 28 + (k % 2) * 70 + (k > 2 ? 12 : 0);
      const py = baseY + (k - 2) * (gi === 1 ? 26 : 9);
      c.doc.circle(px, py + 6, 2.6).fillColor('#1F3864').fill();
      c.txt(`${String(val).replace('.', ',')} mm`, px + 6, py, { size: 9, bold: true, color: LHPP_INK });
    });
  });
  c.y = top + hd * 2 + bodyH + 20;
}

function psiFromKg(v) { return v * 14.2233; }
function drawPubtCalc(c, th, data) {
  const f = (...k) => fieldOf(data, ...k);
  const num = (s) => parseFloat(String(s).replace(',', '.').replace(/[^0-9.-]/g, ''));
  const dp = num(f('design_pressure', 'tekanan_desain'));
  const wp = num(f('max_allowable_working_pressure', 'tekanan_kerja'));
  const idMm = num(f('diameter_dalam'));
  if ([dp, wp, idMm].some(Number.isNaN)) return;
  c.newPage();
  c.txt('VI.   HASIL PERHITUNGAN', c.left + 11, c.y + 2.0, { size: 14, bold: true });
  c.y += 30;
  const P = psiFromKg(dp); const S = num(asObject(data.technical_data).allowable_stress) || 17500; const E = 1; const C = 1.0;
  const rIn = idMm / 2 / 25.4;
  const tShellIn = (P * (rIn + C / 25.4)) / (S * E - 0.6 * P) + C / 25.4;
  const tHeadIn = (P * (idMm / 25.4 + 2 * C / 25.4)) / (2 * S * E - 0.2 * P) + C / 25.4;
  const shellMin = th[1]?.min; const headMin = Math.min(th[0]?.min ?? Infinity, th[2]?.min ?? Infinity);
  const lines = [
    `Diketahui : DP = ${dp} kg/cm² = ${P.toFixed(2)} psi ; WP = ${wp} kg/cm² ; D = ${idMm} mm = ${(idMm / 25.4).toFixed(3)} inch`,
    `r = ${(idMm / 2).toFixed(0)} mm ; E = 1 ; S = ${S} ; C = ${C.toFixed(1)} mm`,
    '',
    'Shell / badan :  t = P (r + C) / (S·E − 0.6·P) + C',
    `t = ${tShellIn.toFixed(3)} inch = ${(tShellIn * 25.4).toFixed(2)} mm`,
    `t pengukuran > t kalkulasi = ${shellMin ?? '-'} mm > ${(tShellIn * 25.4).toFixed(2)} mm ${shellMin > tShellIn * 25.4 ? '( Aman digunakan )' : '( TIDAK AMAN )'}`,
    '',
    'Head / tutup :  t = P (D + 2C) / (2·S·E − 0.2·P) + C',
    `t = ${tHeadIn.toFixed(3)} inch = ${(tHeadIn * 25.4).toFixed(2)} mm`,
    `t pengukuran > t kalkulasi = ${Number.isFinite(headMin) ? headMin : '-'} mm > ${(tHeadIn * 25.4).toFixed(2)} mm ${headMin > tHeadIn * 25.4 ? '( Aman digunakan )' : '( TIDAK AMAN )'}`,
    '',
    `BILA ALAT TETAP DIOPERASIKAN PADA TEKANAN (P) = ${wp} kg/cm², SHELL / BADAN DAN HEAD / TUTUP ${shellMin > tShellIn * 25.4 && headMin > tHeadIn * 25.4 ? 'MASIH AMAN' : 'PERLU EVALUASI'} UNTUK DIGUNAKAN.`
  ];
  lines.forEach((ln) => {
    const wrapped = c.wrap(ln, c.width, 12, { bold: /^BILA|^Shell|^Head/.test(ln) });
    wrapped.forEach((w) => { c.txt(w, c.left, c.y, { size: 12, bold: /^BILA|^Shell|^Head/.test(ln) }); c.y += 20.7; });
    if (!ln) c.y += 4;
  });
}

// ----------------------------------------------------------------------------
// PTP: matriks pengukuran kebisingan/pencahayaan/grounding
// ----------------------------------------------------------------------------
function drawPtpMeasurements(c, report, data, td) {
  c.newPage();
  c.txt('IV.  PENGUJIAN', c.left + 5.4, c.y + 4.0, { size: 12, bold: true });
  c.y += 26;
  const tests = collectMeasurements(report);
  if (report.isDiesel) {
    drawSimpleTable(c, ['NO.', 'KOMPONEN YANG DIUJI', 'HASIL', 'KETERANGAN'],
      tests.map((t, i) => [String(i + 1), t.label, t.value, t.standard]),
      [c.left, c.left + 31.9, c.left + 248.6, c.left + 311, c.right], { rowMin: 18.3, aligns: ['center', 'left', 'center', 'left'] });
    return;
  }
  const areas = asArray(td.measurement_areas);
  const xs = [c.left, c.left + 31.8, c.left + 191.3, c.left + 257, c.left + 323.3, c.right];
  void xs;
  drawSimpleTable(c, ['Pengujian', 'Hasil', 'Keterangan'], tests.map((t) => [t.label, t.value, t.standard]),
    [c.left, c.left + 230, c.left + 330, c.right], { rowMin: 20.4, aligns: ['left', 'center', 'left'] });
  if (areas.length) {
    c.y += 12;
    const n = areas.length;
    const w0 = 150; const wA = (c.width - w0) / n;
    const ax = (i) => c.left + w0 + wA * i;
    c.cell(c.left, c.y, w0, 44, 'Pengujian', { bold: true, align: 'center', vAlign: 'middle' });
    c.cell(ax(0), c.y, c.right - ax(0), 22, 'Bagian yang diuji', { bold: true, align: 'center', vAlign: 'middle' });
    areas.forEach((a, i) => c.cell(ax(i), c.y + 22, wA, 22, a.name, { align: 'center', vAlign: 'middle', size: 11 }));
    c.y += 44;
    [['Kebisingan (dB)\n(Mesin standby)', 'noise'], ['Pencahayaan (lux)', 'lux'], ['Grounding', 'grounding']].forEach(([label, key]) => {
      c.cell(c.left, c.y, w0, 32, label, { size: 11, vAlign: 'middle', align: 'center' });
      areas.forEach((a, i) => c.cell(ax(i), c.y, wA, 32, a[key] ?? '-', { align: 'center', vAlign: 'middle' }));
      c.y += 32;
    });
  }
}

// ----------------------------------------------------------------------------
// IPP: tahanan pembumian
// ----------------------------------------------------------------------------
function drawIppTests(c, _report, data, _td) {
  c.newPage();
  c.cell(c.left, c.y, c.width, 28.2, 'V.    PEMERIKSAAN UMUM', { size: 14, bold: true, padX: 14, vAlign: 'middle' });
  c.y += 28.2;
  const r = fieldOf(data, 'hasil_tahanan_tanah', 'grounding_petir');
  drawSimpleTable(c, ['NO', 'KONDISI MATERIAL', 'HASIL', 'KET.'], [['1', 'SISTEM JARINGAN INSTALASI', 'BAIK', r === '-' ? '-' : `${r} Ω`]],
    [c.left, c.left + 34, c.left + 234, c.left + 334, c.right], { size: 11, rowMin: 16.7 });
  c.y += 30;
  c.txt('DIAGRAM RANGKAIAN', 0, c.y, { size: 14, bold: true, width: c.doc.page.width, align: 'center' });
  c.y += 28;
  const cx = c.doc.page.width / 2;
  const y = c.y + 40;
  [['E', cx - 140], ['P', cx + 20], ['C', cx + 160]].forEach(([n, px]) => { c.vline(px, y - 20, y + 30, 2); c.txt(n, px + 4, y - 22, { size: 10, bold: true }); });
  c.doc.moveTo(cx - 140, y - 20).lineTo(cx + 160, y - 20).lineWidth(0.7).strokeColor(LHPP_INK).stroke();
  c.txt('10 m', cx - 70, y + 4, { size: 10 });
  c.txt('20 m', cx - 20, y + 36, { size: 10 });
  c.y = y + 70;
  drawSimpleTable(c, ['NO', 'E - C', 'E – P', 'NILAI R ( Ω )', 'KET.'], [['1', '2', '3', r === '-' ? '-' : `${r} Ω`, '5']],
    [c.left, c.left + 60, c.left + 170, c.left + 280, c.left + 380, c.right], { size: 12, rowMin: 20.4, headerH: 40 });
  c.y += 24;
  c.cell(c.left, c.y, c.width, 28, 'VI.    HASIL PENGUJIAN', { size: 14, bold: true, padX: 14, vAlign: 'middle' });
  c.y += 28;
  drawSimpleTable(c, ['NO', 'KONDISI MATERIAL', 'BAIK', 'HASIL PENGUKURAN', 'KET.'], [['1', 'PENGUJIAN TAHANAN PEMBUMIAN', '√', r === '-' ? '-' : `R = ${r} Ω`, 'Standar < 5 Ω']],
    [c.left, c.left + 34, c.left + 200, c.left + 280, c.left + 380, c.right], { size: 11, rowMin: 28, headerH: 28 });
}

// ----------------------------------------------------------------------------
// LIS: thermal panel
// ----------------------------------------------------------------------------
const THERMAL_STANDARD = [
  ['A', '≤ MAX. TEMP.', 'Normal untuk Data', 'Monitor < 3 Bulan'],
  ['B', '≥ 1℃ - 10℃', 'Medium Heating / Pemanasan Sedang', 'Perbaiki < 14 Hari'],
  ['C', '≥ 11℃ - 20℃', 'Serious Heating / Pemanasan Serius', 'Perbaiki < 7 Hari'],
  ['D', '≥ 21℃ - 40℃', 'Acute Heating / Pemanasan Akut', 'Segera Perbaiki'],
  ['E', '≥ 41℃', 'Critical Heating / Pemanasan Kritis', 'Segera Perbaiki']
];
const THERMAL_LIMITS = [
  ['1', 'Coil Contactor, Coil Relay', '90,0 ℃', 'Standart ANSI/IEEE C 37.63 – 1984'],
  ['2', 'Bushbar/Terminal Koneksi Bushbar/Konduktor', '70,0 ℃', 'Standart ANSI/IEEE'],
  ['3', 'Terminal Koneksi', '60,0 ℃', 'Standart ANSI/IEEE C 37 – 1991'],
  ['4', 'Isolasi/Lapisan Raychem', '60,0 ℃', 'Standart ANSI/IEEE'],
  ['5', 'Fuse Tegangan Rendah dan Tinggi Max. 200 Amper', '70,0 ℃', 'Standart ANSI/IEEE C 37.40 – 1981'],
  ['6', 'Bushing Trafo', '85,0 ℃', 'Standart ANSI/IEEE C 37 – 1991'],
  ['7', 'Bushing Circuit Breaker', '70,0 ℃', 'Standart ANSI/IEEE C 37 – 1991'],
  ['8', 'Case ACB/MCCB/MCB/PCB', '60,0 ℃', 'Standart ANSI/IEEE'],
  ['9', 'Isolator/IS/DS/Support', '60,0 ℃', 'Standart ANSI/IEEE']
];

function drawLisThermal(c, report, data, td) {
  c.newPage();
  c.txt('IV. PENGUKURAN THERMAL PANEL', c.left + 7, c.y + 2.0, { size: 14, bold: true });
  c.y += 30;
  c.txt('STANDART THERMAL PANEL', 0, c.y, { size: 14, bold: true, width: c.doc.page.width, align: 'center' });
  c.y += 24;
  drawSimpleTable(c, ['', 'PERBEDAAN TEMPERATUR DARI TEMPERATUR MAXIMAL YANG DIIJINKAN', '', 'PRIORITAS PERBAIKAN'],
    THERMAL_STANDARD.map((r) => [r[0], r[1], r[2], r[3]]),
    [c.left + 14, c.left + 54, c.left + 194, c.left + 400, c.right - 14], { size: 11, rowMin: 21.1, headerH: 42, aligns: ['center', 'center', 'left', 'left'] });
  c.y += 14;
  c.txt('TEMPERATUR MAKSIMUM YANG DIIJINKAN', 0, c.y, { size: 12, bold: true, width: c.doc.page.width, align: 'center' });
  c.y += 20;
  drawSimpleTable(c, [], THERMAL_LIMITS, [c.left + 14, c.left + 40, c.left + 300, c.left + 380, c.right - 14], { size: 11, rowMin: 21.1, aligns: ['center', 'left', 'center', 'left'] });
  // Grid thermal: 3 panel per halaman (thermal | foto)
  let panels = asArray(td.thermal_panels);
  if (!panels.length) {
    const th = report.photos.filter((p) => /thermal/i.test(p.caption || ''));
    for (let i = 0; i < th.length; i += 2) panels.push({ name: th[i].caption.replace(/thermal\s*(panel)?\s*[-:]?\s*/i, ''), thermal_key: th[i].storageKey, visual_key: th[i + 1]?.storageKey });
  }
  if (!panels.length) return;
  const xs = [c.left, 315.2, c.right];
  panels.forEach((p, i) => {
    if (i % 3 === 0) c.newPage();
    const top = c.y;
    const h = 258.4;
    c.rect(xs[0], top, xs[2] - xs[0], h);
    c.vline(xs[1], top + 42.3, top + h);
    c.hline(xs[0], xs[2], top + 42.3);
    c.txt('Hasil Thermal Panel', xs[0], top + 2.3, { size: 12, bold: true, width: xs[2] - xs[0], align: 'center' });
    c.txt(p.name || '', xs[0], top + 18, { size: 12, bold: true, width: xs[2] - xs[0], align: 'center' });
    [[p.thermal_key, xs[0]], [p.visual_key, xs[1]]].forEach(([key, x]) => {
      const file = key ? resolveAttachmentPath(key) : null;
      if (file && fs.existsSync(file)) {
        try { c.doc.image(file, x + 15.8, top + 66, { fit: [226.7, 170], align: 'center', valign: 'center' }); } catch { /* abaikan */ }
      }
    });
    c.y = top + h;
  });
}

// ----------------------------------------------------------------------------
// IPK: matriks data pemasangan & pengujian alarm
// ----------------------------------------------------------------------------
function drawIpkMatrix(c, title, zones) {
  // 11 kolom: Lantai | Lokasi | Zona | ROR | Fixed | Smoke | TPM | Fl.Sw | Bell | Lamp | Status
  const xs = [78.0, 129.0, 205.6, 248.2, 283.6, 319.0, 361.6, 397.0, 432.4, 460.9, 496.3, 552.9];
  c.ensure(120);
  c.txt(title, 0, c.y + 2.0, { size: 14, bold: true, width: c.doc.page.width, align: 'center' });
  c.y += 24;
  const y0 = c.y;
  const h1 = 21.2;
  const cell = (a, b, y, h, t, o = {}) => c.cell(xs[a], y, xs[b] - xs[a], h, t, { size: 12, align: 'center', vAlign: 'middle', bold: true, ...o });
  cell(0, 1, y0, h1 * 2, 'Lantai'); cell(1, 2, y0, h1 * 2, 'Lokasi'); cell(2, 3, y0, h1 * 2, 'Zona');
  cell(3, 8, y0, h1, 'DETEKTOR'); cell(8, 10, y0, h1, 'ALARM'); cell(10, 11, y0, h1 * 2, 'STATUS');
  ['ROR', 'Fixed', 'Smoke', 'TPM', 'Fl.Sw', 'Bell', 'Lamp'].forEach((t, i) => cell(3 + i, 4 + i, y0 + h1, h1, t, { size: 11 }));
  c.y = y0 + h1 * 2;
  const keys = ['ror', 'fixed', 'smoke', 'tpm', 'flsw', 'bell', 'lamp'];
  const tot = Object.fromEntries(keys.map((k) => [k, 0]));
  zones.forEach((z) => {
    const h = z.height ?? 21.2;
    c.ensure(h);
    const vals = [z.floor, z.location, z.zone, ...keys.map((k) => z[k] || '-'), z.status || 'Baik'];
    vals.forEach((v, i) => c.cell(xs[i], c.y, xs[i + 1] - xs[i], h, v ?? '-', { size: 11, align: 'center', vAlign: 'middle' }));
    keys.forEach((k) => { tot[k] += Number(z[k]) || 0; });
    c.y += h;
  });
  c.cell(xs[0], c.y, xs[3] - xs[0], h1, 'Total', { size: 12, bold: true, align: 'center', vAlign: 'middle' });
  keys.forEach((k, i) => c.cell(xs[3 + i], c.y, xs[4 + i] - xs[3 + i], h1, tot[k] || '-', { size: 12, bold: true, align: 'center', vAlign: 'middle' }));
  c.cell(xs[10], c.y, xs[11] - xs[10], h1, '', {});
  c.y += h1;
}

function drawIpkSpecific(c, report, data, td) {
  const f = (...k) => fieldOf(data, ...k);
  const zones = asArray(td.ipk_zones);
  const tested = asArray(td.ipk_tested_zones);
  c.newPage();
  c.txt('IV. DATA BANGUNAN', c.left - 14, c.y + 4.2, { size: 14, bold: true });
  c.y += 28;
  const b = [['Luas Lahan', f('luas_lahan')], ['Luas Bangunan Total', f('luas_bangunan')], ['Konstruksi Bangunan', f('konstruksi_bangunan')],
    ['Tinggi Bangunan', f('tinggi_bangunan')], ['Jumlah Lantai', f('jumlah_lantai')], ['Dibangun Tahun', f('tahun_bangunan')],
    ['Klasifikasi Risiko Kebakaran', f('klasifikasi_risiko')]];
  b.forEach(([l, v], i) => {
    c.txt(String(i + 1), c.left + 4, c.y, { size: 12 }); c.txt(l, c.left + 22, c.y, { size: 12 });
    c.txt(`: ${v}`, c.left + 190, c.y, { size: 12 }); c.y += 22;
  });
  c.y += 10;
  c.txt('V. JENIS PEMERIKSAAN DAN PENGUJIAN', c.left - 14, c.y, { size: 14, bold: true });
  c.y += 28;
  ['( √ ) Pemeriksaan Dokumen.', '( √ ) Pemeriksaan Visual.', '( √ ) Pengujian Peralatan / Instalasi.'].forEach((t, i) => {
    c.txt(`${i + 1}. ${t}`, c.left + 4, c.y, { size: 12 }); c.y += 22;
  });
  if (zones.length) { c.newPage(); drawIpkMatrix(c, 'DATA PEMASANGAN INSTALASI ALARM', zones); }
  if (tested.length) { c.newPage(); drawIpkMatrix(c, 'PEMERIKSAAN DAN PENGUJIAN INSTALASI FIRE ALARM', tested); }
}

// ----------------------------------------------------------------------------
// KONFIGURASI PER BIDANG
// ----------------------------------------------------------------------------
function categoryOptions(report, data) {
  const lhppNo = data.lhpp_no || data.po_number || '-';
  const base = {
    technicalNewPage: true,
    conclusion: {}
  };
  switch (report.categoryCode) {
    case 'PUBT': {
      const cols = [66.6, 95.2, 255.6, 340.4, 411.2, 554.5];
      return {
        ...base,
        titleLines: ['LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', 'BEJANA TEKAN (AIR PRESSURE TANK)', String(data.client_name || '').toUpperCase(), `No. ${lhppNo}`],
        titleSpec: { box: true, x0: 65, x1: 543.5, y0: 58, y1: 124, fill: '#E0E0E0', firstTop: 61.4, pitch: 16.1 },
        dataUmumHeading: (c) => { c.cell(65, c.y + 0, 478.5, 0.1, '', { border: false }); c.txt('I. DATA UMUM', 70, 126.7, { size: 14, bold: true }); c.y = 150; },
        identitySpec: { x0: 64.3, x1: 554, labelW: 203, colonInValue: true, minH: 21.5, pitch: 13.8, padTop: 3.3, numberW: 0 },
        technical: drawPubtTechnical,
        checklist: {
          cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'flat-heading', rowMin: 19.4,
          heading: (c) => { c.txt('III. LAPORAN PEMERIKSAAN', 75, c.y + 2, { size: 14, bold: true }); c.y += 30; c.txt('a). Visual', 99.9, c.y, { size: 12, bold: true }); c.y += 18; },
          header: makeCondHeader(cols, ['No.', 'Bagian - Bagian', 'Memenuhi\nSyarat', 'Tidak\nMemenuhi\nSyarat', 'Keterangan', 'Kondisi'], { first: 60.3, cont: 60.3 })
        },
        afterChecklist: pubtAfterChecklist,
        conclusion: { no: 'VII', rulesNo: 'VIII', lead: 'Berdasarkan pemeriksaan dan pengujian dengan kondisi diatas, dinyatakan bahwa ' },
        photoHeading: 'IX. DOKUMENTASI'
      };
    }
    case 'PTP': {
      if (report.isDiesel) {
        const cols = [54.8, 88.2, 281.1, 347.1, 413.2, 558.7];
        return {
          ...base,
          titleLines: ['LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', 'PESAWAT TENAGA DAN PRODUKSI', '(MOTOR DIESEL)', `No.${lhppNo}`],
          titleSpec: { box: false, x0: 64, x1: 560, firstTop: 83.7, pitch: 16.1, endY: 148 },
          dataUmumHeading: (c) => { c.txt('I. DATA UMUM', 73.1, 152.7, { size: 14, bold: true }); c.y = 168; },
          identitySpec: { x0: 64.1, x1: 560.4, numberW: 26.8, labelW: 171.7, minH: 20.9, pitch: 13.8, padTop: 3.4 },
          technical: (c, rep, _d, _td) => {
            c.txt('II. PEMERIKSAAN DOKUMEN TEKNIS', c.left + 9, c.y + 4, { size: 14, bold: true });
            c.y += 28;
            drawKeyValueTable(c, rep.technicalRows.map((r) => [r.label, r.value]), { x0: 54.8, x1: 558.7, numberW: 33.4, labelW: 192.9, minH: 18.3, pitch: 13.8, padTop: 2.2 });
          },
          checklist: {
            cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'section-numbered', rowMin: 18.3, newPage: false,
            heading: (c) => { c.y += 14; c.txt('III. PEMERIKSAAN DAN PENGUKURAN', c.left + 9, c.y, { size: 14, bold: true }); c.y += 26; },
            header: makeCondHeader(cols, ['NO.', 'KOMPONEN', 'Memenuhi\nSyarat', 'Tidak Memenuhi\nSyarat', 'KETERANGAN', 'KONDISI'], { first: 54, cont: 54, size: 12, subSize: 10, kondisiH: 18 })
          },
          afterChecklist: drawPtpMeasurements,
          conclusion: { no: 'VI', rulesNo: 'VII', heading: 'VI. KESIMPULAN', rulesHeading: 'VII. SARAN' },
          photoHeading: 'VIII. DOKUMENTASI'
        };
      }
      const cols = [63.8, 95.6, 277.7, 320.3, 374.3, 553.0];
      return {
        ...base,
        titleLines: ['LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', 'PESAWAT TENAGA DAN PRODUKSI', `No. ${lhppNo}`],
        titleSpec: { box: true, x0: 63.6, x1: 553.8, y0: 58.2, y1: 133.3, firstTop: 60.4, pitch: 24.7 },
        dataUmumHeading: (c) => { c.cell(63.6, c.y, 490.2, 30.9, 'I. DATA UMUM', { size: 12, bold: true, padTop: 7.5, padX: 9 }); c.y += 30.9; },
        identitySpec: { x0: 63.8, x1: 553.8, numberW: 26.6, labelW: 184.5, minH: 25.2, pitch: 13.8, padTop: 4.0 },
        technical: (c, rep) => {
          c.cell(c.left, c.y, c.width, 21.2, 'II. DATA TEKNIK', { size: 12, bold: true, padX: 5.4 }); c.y += 21.2;
          c.cell(c.left, c.y, c.width, 21.2, 'SPESIFIKASI MESIN', { size: 12, bold: true, padX: 26 }); c.y += 21.2;
          drawKeyValueTable(c, rep.technicalRows.map((r) => [r.label, r.value]), { x0: 63.8, x1: 555, numberW: 27, labelW: 182.3, minH: 21.2, pitch: 13.8, padTop: 3.0 });
        },
        checklist: {
          cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'flat-heading', rowMin: 21.2, newPage: false,
          heading: (c) => { c.y += 6; c.cell(c.left, c.y, c.width, 21.2, 'III. PEMERIKSAAN & PENGUKURAN', { size: 12, bold: true }); c.y += 21.2; },
          header: makeCondHeader(cols, ['NO.', 'KOMPONEN', 'BAIK', 'BURUK', 'KETERANGAN', 'KONDISI'], { first: 42.4, cont: 42.4, kondisiH: 21.2 })
        },
        afterChecklist: drawPtpMeasurements,
        conclusion: { no: 'V', rulesNo: 'VI', heading: 'V. KESIMPULAN', rulesHeading: 'VI. SARAN' },
        photoHeading: 'VI. DOKUMENTASI'
      };
    }
    case 'IPP': {
      const cols = [63.9, 97.8, 283.6, 340.4, 397.0, 553.0];
      return {
        ...base,
        titleLines: ['LAPORAN HASIL PEMERIKSAAN PERTAMA', 'JENIS PERALATAN : INSTALASI PENYALUR PETIR', `No. Reg : ${data.lhpp_no || '-'}`],
        titleSpec: { box: false, x0: 63.9, x1: 553, firstTop: 58.8, pitch: 17.4, endY: 120 },
        identitySpec: { x0: 63.9, x1: 553, numberW: 31.4, labelW: 217.1, minH: 27.2, pitch: 13.8, padTop: 6.5 },
        technical: null,
        checklist: {
          cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'flat-heading', rowMin: 20.4,
          heading: (c) => { c.txt('III. HASIL INSPEKSI VISUAL', c.left + 7, c.y + 2, { size: 14, bold: true }); c.y += 26; },
          header: makeCondHeader(cols, ['NO', 'KONDISI MATERIAL', 'BAIK', 'BURUK', 'KET.', 'HASIL'], { first: 40, cont: 40, size: 11 })
        },
        afterChecklist: (c, rep, d, td) => {
          drawKeyValueTable(c, rep.technicalRows.map((r) => [r.label, r.value]), { x0: 63.9, x1: 553, numberW: 31.4, labelW: 217.1, minH: 20.4, pitch: 13.8, padTop: 3 });
          drawIppTests(c, rep, d, td);
        },
        conclusion: { no: 'VII', heading: 'VII. KESIMPULAN DAN SYARAT :', rulesHeading: 'SYARAT' },
        photoHeading: 'VIII. DOKUMENTASI'
      };
    }
    case 'LIS': {
      const cols = [69.6, 99.4, 333.2, 397.1, 461.0, 560.1];
      return {
        ...base,
        titleLines: ['LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', 'INSTALASI LISTRIK', `No. ${lhppNo}`],
        titleSpec: { box: false, x0: 56.7, x1: 586.1, firstTop: 86.8, pitch: 18.5, endY: 150 },
        dataUmumHeading: (c) => { c.txt('I. DATA UMUM', c.left + 14, c.y + 2, { size: 14, bold: true }); c.y += 26; },
        identitySpec: { x0: 71.1, x1: 673 - 87, numberW: 37, labelW: 189, minH: 28.1, pitch: 13.8, padTop: 6.5 },
        technical: (c, rep) => {
          c.txt('II. DATA TEKNIS', c.left + 14, c.y + 2, { size: 14, bold: true }); c.y += 26;
          drawKeyValueTable(c, rep.technicalRows.map((r) => [r.label, r.value]), { x0: 71.1, x1: 586.1, numberW: 37, labelW: 189, minH: 24.5, pitch: 13.8, padTop: 5 });
        },
        checklist: {
          cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'flat-heading', rowMin: 23.5, size: 12,
          heading: (c) => { c.txt('III. INSPECTION CHEKLIST', c.left + 19, c.y + 2, { size: 14, bold: true }); c.y += 26; },
          header: makeCondHeader(cols, ['NO', 'Item Pemeriksaan', 'Ada', 'Tidak Ada', 'Ket', 'Hasil Pemeriksaan'], { first: 48, cont: 48, kondisiH: 24 })
        },
        afterChecklist: drawLisThermal,
        conclusion: { no: 'V', rulesNo: 'VI', heading: 'V. KESIMPULAN', rulesHeading: 'VI. SARAN' },
        photoHeading: 'VII. DOKUMENTASI'
      };
    }
    case 'IPK': {
      const cols = [78.0, 129.0, 283.6, 340.4, 397.0, 552.9];
      return {
        ...base,
        titleLines: ['LAPORAN HASIL PEMERIKSAAN & PENGUJIAN BERKALA', 'INSTALASI PROTEKSI KEBAKARAN', `Nomor : ${lhppNo}`],
        titleSpec: { box: false, x0: 78, x1: 552.9, firstTop: 53.7, pitch: 16.1, endY: 112 },
        dataUmumHeading: (c) => { c.txt('III. DATA UMUM', c.left, c.y + 2, { size: 14, bold: true }); c.y += 26; },
        identitySpec: { x0: 78, x1: 552.9, numberW: 28, labelW: 150, colonW: 10, minH: 21.2, pitch: 13.8, padTop: 3 },
        technical: drawIpkSpecific,
        checklist: {
          cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'flat-heading', rowMin: 21.2,
          heading: (c) => { c.txt('PEMERIKSAAN DAN PENGUJIAN INSTALASI ALARM', c.left, c.y + 2, { size: 14, bold: true }); c.y += 26; },
          header: makeCondHeader(cols, ['NO', 'PEMERIKSAAN / PENGUJIAN', 'Memenuhi', 'Tidak Memenuhi', 'SYARAT - SYARAT', 'HASIL'], { first: 42, cont: 42, kondisiH: 21 })
        },
        conclusion: { no: 'VI', rulesNo: 'VII', heading: 'VI. KESIMPULAN', rulesHeading: 'VII. SARAN' },
        photoHeading: 'VIII. DOKUMENTASI'
      };
    }
    default: {
      const cols = [64.1, 89.7, 340.6, 397.0, 453.8, 553.3];
      return {
        ...base,
        titleLines: ['LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', String(report.coverTitle).toUpperCase(), `NO. ${lhppNo}`],
        titleSpec: { box: true, x0: 63.9, x1: 545.9, y0: 56.8, y1: 131.3, firstTop: 59.3, pitch: 18.5 },
        dataUmumHeading: (c) => { drawSectionRow(c, 'I. DATA UMUM', { h: 25.5 }); },
        identitySpec: { labelW: 170, colonInValue: true, minH: 25.6, pitch: 20.7 },
        technical: (c, rep) => {
          drawSectionRow(c, 'II. DATA TEKNIS');
          drawKeyValueTable(c, rep.technicalRows.map((r) => [r.label, r.value]), { labelW: 171.4, minH: 20.4, pitch: 13.8 });
        },
        checklist: {
          cols, roles: ['no', 'label', 'ok', 'bad', 'note'], mode: 'flat-heading', rowMin: 20.4,
          heading: (c) => { drawSectionRow(c, 'III. PEMERIKSAAN VISUAL DAN PENGUJIAN', { x1: 553.3 }); },
          header: makeCondHeader(cols, ['No', 'Pemeriksaan terhadap', 'Memenuhi\nSyarat K3', 'Tidak Memenuhi\nSyarat K3', 'Keterangan', 'Kondisi'], { first: 60, cont: 60, subSize: 10 })
        },
        conclusion: { no: 'VI', rulesNo: 'VII' },
        photoHeading: 'VIII. DOKUMENTASI'
      };
    }
  }
}

// ============================================================================
// GENERATE LHPP
// ============================================================================
export async function generateLhppPdfBuffer(data, options = {}) {
  const report = buildLhppReportContent(data);
  const qrText = data.verification_code
    ? `https://upayariksadaya.com/verifikasi/${data.verification_code}`
    : `PT UPAYA RIKSA DAYA | LHPP: ${data.lhpp_no || 'DRAF'} | BAP: ${data.bap_no || '-'}`;
  const qrBuffer = await QRCode.toBuffer(qrText, { width: 96, margin: 1 });

  const inspectionDate = new Date(data.inspection_date || data.published_at || Date.now());
  report.coverYear = String(Number.isNaN(inspectionDate.getTime()) ? new Date().getFullYear() : inspectionDate.getFullYear());
  report.coverRows = buildCoverRows(report, data);
  report.coverPhoto = pickCoverPhoto(report.photos);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: report.pageSize,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      bufferPages: true,
      compress: true
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      const profile = pickProfile(report);
      const c = new LhppCanvas(doc, profile);
      const ctx = { qrBuffer, captionPosition: options.captionPosition || 'top' };

      drawCoverPage(c, report, data);

      if (report.categoryCode === 'PAA' || report.categoryCode === 'LE') {
        renderPaa(c, report, data, ctx);
      } else {
        const opts = categoryOptions(report, data);
        renderGeneric(c, report, data, ctx, opts);
      }
      c.drawFooters();

      // Lampiran SKP / izin dari contoh bidang (halaman penuh, tanpa footer)
      for (const attachmentPath of getLhppSkpAppendixPaths(report.categoryCode)) {
        doc.addPage({ size: report.pageSize, margins: { top: 0, right: 0, bottom: 0, left: 0 } });
        doc.image(attachmentPath, 0, 0, { fit: [doc.page.width, doc.page.height], align: 'center', valign: 'center' });
      }
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function generateAssignmentLetterPdfBuffer(data) {
  const companyProfile = await getCompanyProfile().catch(() => null);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCompanyHeader(doc, 'SURAT TUGAS PEMERIKSAAN DAN PENGUJIAN K3', companyProfile);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#1D1414')
      .text(`Nomor Order : ${data.order_no}`, 45, 138)
      .text(`Nomor PO : ${data.po_number || '-'}`)
      .text(`Jenis Layanan : ${data.service_type}`)
      .moveDown(0.6)
      .text(
        'Manajemen PT Upaya Riksa Daya dengan ini menugaskan Ahli K3 berikut untuk melaksanakan pemeriksaan dan pengujian K3 pada lokasi klien:'
      )
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Klien : ', { continued: true })
      .font('Helvetica')
      .text(data.client_name)
      .font('Helvetica-Bold')
      .text('Lokasi : ', { continued: true })
      .font('Helvetica')
      .text(
        data.location_name
          ? `${data.location_name} (${data.location_address || ''})`
          : data.client_address || '-'
      )
      .font('Helvetica-Bold')
      .text('Kontak PIC : ', { continued: true })
      .font('Helvetica')
      .text(data.contact_name ? `${data.contact_name} (${data.contact_phone || '-'})` : '-')
      .font('Helvetica-Bold')
      .text('Jadwal Pelaksanaan : ', { continued: true })
      .font('Helvetica')
      .text(
        data.start_at
          ? `${new Date(data.start_at).toLocaleString('id-ID')} s/d ${new Date(
              data.end_at
            ).toLocaleString('id-ID')}`
          : 'Belum dijadwalkan'
      );

    doc.moveDown(0.7).font('Helvetica-Bold').text('Tim Ahli K3 yang Ditugaskan:');
    doc.font('Helvetica');
    for (const a of data.assignments || []) {
      doc.text(`• ${a.full_name} (${a.email}) | Status Konfirmasi: ${a.status}`);
    }

    doc.moveDown(0.7).font('Helvetica-Bold').text('Daftar Unit / Objek Uji K3 dalam PO:');
    doc.font('Helvetica');
    for (const o of data.objects || []) {
      doc.text(
        `• [${o.category_code}] ${o.name} | S/N: ${o.serial_number} (${o.brand || '-'}) | Status Unit: ${o.unit_status || 'TERJADWAL'}`
      );
    }

    doc
      .moveDown(1.5)
      .text(
        'Demikian surat tugas ini diterbitkan untuk dilaksanakan dengan penuh tanggung jawab sesuai standar K3 yang berlaku.'
      );

    drawCompanyFooter(doc, 768);
    doc.end();
  });
}

export async function generateBastPdfBuffer(data) {
  const companyProfile = await getCompanyProfile().catch(() => null);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCompanyHeader(doc, 'BERITA ACARA SERAH TERIMA DOKUMEN RIKSA UJI K3', companyProfile);

    const now = new Date(data.handover_date || data.dispatch_date || new Date());
    const dayName = INDONESIAN_DAYS[now.getDay()];
    const dateFormatted = `${now.getDate()} ${INDONESIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    const bastNo = data.bast_no || data.tracking_reference || `BAST/URD/${new Date().getFullYear()}/${String(data.id || Date.now()).slice(-4)}`;

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#1D1414')
      .text('BERITA ACARA SERAH TERIMA DOKUMEN (BAST)', { align: 'center' })
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#50667A')
      .text(`Nomor: ${bastNo}`, { align: 'center' })
      .moveDown(1);

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#1D1414')
      .text(
        `Pada hari ini, ${dayName}, tanggal ${dateFormatted}, bertempat di kantor / lokasi operasional PT Upaya Riksa Daya, yang bertanda tangan di bawah ini:`,
        45,
        doc.y,
        { width: 505, lineGap: 2 }
      )
      .moveDown(0.8);

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text('1. PIHAK PERTAMA (Yang Menyerahkan):')
      .font('Helvetica')
      .text(`   Nama        : ${data.dispatched_by_name || 'Admin Operasional PT Upaya Riksa Daya'}`)
      .text('   Instansi    : PT Upaya Riksa Daya (PJK3 Bidang Riksa Uji K3)')
      .text('   Alamat      : Jl. Pondasi No. 50 B, Kampung Ambon, Jakarta Timur')
      .moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text('2. PIHAK KEDUA (Yang Menerima):')
      .font('Helvetica')
      .text(`   Nama        : ${data.recipient_name || data.contact_name || 'Perwakilan Klien'}`)
      .text(`   Perusahaan  : ${data.client_name || '-'}`)
      .text(`   Alamat      : ${data.client_address || data.location_address || '-'}`)
      .text(`   Nomor PO    : ${data.po_number || data.order_no || '-'}`)
      .moveDown(0.8);

    doc
      .font('Helvetica')
      .text(
        'PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima dari PIHAK PERTAMA dalam keadaan lengkap dan baik, bundel dokumen resmi hasil Pemeriksaan dan Pengujian (Riksa Uji) K3 untuk unit peralatan sebagai berikut:',
        { width: 505, lineGap: 2 }
      )
      .moveDown(0.8);

    const items = data.items || data.objects || [];
    const tableTop = doc.y;
    doc.rect(45, tableTop, 505, 20).fill('#F3F5F8');
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#1D1414')
      .text('NO', 50, tableTop + 5, { width: 25 })
      .text('OBJEK ALAT & NO. SERI', 80, tableTop + 5, { width: 145 })
      .text('BIDANG K3', 230, tableTop + 5, { width: 65 })
      .text('NO. LHPP & BAP', 300, tableTop + 5, { width: 110 })
      .text('NO. SUKET / KELENGKAPAN', 415, tableTop + 5, { width: 130 });

    let currentY = tableTop + 22;
    doc.font('Helvetica').fontSize(7.5);

    if (items.length === 0) {
      doc
        .fillColor('#50667A')
        .text(`Bundel dokumen resmi untuk Order ${data.order_no || data.po_number || '-'}`, 80, currentY);
      currentY += 18;
    } else {
      items.forEach((item, idx) => {
        if (currentY > 670) {
          doc.addPage({ size: 'A4', margin: 45 });
          currentY = 45;
        }
        const objDesc = `${item.object_name || item.name} (SN: ${item.serial_number || '-'})`;
        const docsDesc = `LHPP: ${item.lhpp_no || 'Terlampir'}\nBAP: ${item.bap_no || 'Terlampir'}`;
        const suketDesc = `${item.suket_no ? `Suket: ${item.suket_no}` : 'Suket K3 Asli'}\n(Buku LHPP + Lembar Suket)`;

        doc
          .fillColor('#1D1414')
          .text(String(idx + 1), 50, currentY, { width: 25 })
          .text(objDesc, 80, currentY, { width: 145 })
          .text(item.category_code || item.category_name || 'K3', 230, currentY, { width: 65 })
          .text(docsDesc, 300, currentY, { width: 110 })
          .text(suketDesc, 415, currentY, { width: 130 });

        currentY += 26;
        doc.moveTo(45, currentY - 2).lineTo(550, currentY - 2).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      });
    }

    doc.y = currentY + 10;
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#334155')
      .text(
        'Catatan: Seluruh berkas asli yang diserahterimakan wajib disimpan dengan baik oleh Pihak Kedua sebagai dokumen pemenuhan regulasi Ketenagakerjaan. Jadwal riksa uji berkala selanjutnya wajib dilaksanakan sebelum masa berlaku habis.',
        45,
        doc.y,
        { width: 505, lineGap: 1.5 }
      )
      .moveDown(1.5);

    const sigY = Math.max(doc.y, 630);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#1D1414')
      .text('Yang Menyerahkan,', 45, sigY, { width: 230, align: 'center' })
      .text('Yang Menerima,', 320, sigY, { width: 230, align: 'center' })
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#64748B')
      .text('PT UPAYA RIKSA DAYA', 45, sigY + 14, { width: 230, align: 'center' })
      .text(data.client_name || 'PERWAKILAN KLIEN', 320, sigY + 14, { width: 230, align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#1D1414')
      .text(
        data.dispatched_by_name || 'Admin Operasional URD',
        45,
        sigY + 70,
        { width: 230, align: 'center' }
      )
      .text(
        data.recipient_name || data.contact_name || '( ........................................ )',
        320,
        sigY + 70,
        { width: 230, align: 'center' }
      );

    drawCompanyFooter(doc, 770);
    doc.end();
  });
}

export async function generateObjectQrStickerPdfBuffer(data) {
  const verifyUrl = `${env.appBaseUrl || 'http://localhost:5173'}/verifikasi/${data.verification_code || data.id}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 72, margin: 1 });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [283.46, 212.6],
        margin: 10
      });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.rect(4, 4, 275.46, 204.6).lineWidth(2).strokeColor('#C81E1E').stroke();
      doc.rect(7, 7, 269.46, 198.6).lineWidth(0.6).strokeColor('#C81E1E').stroke();

      if (fs.existsSync(officialLogoPath)) {
        doc.image(officialLogoPath, 12, 11, { width: 28 });
      }
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#C81E1E')
        .text('PT UPAYA RIKSA DAYA', 44, 12)
        .font('Helvetica')
        .fontSize(5.5)
        .fillColor('#334155')
        .text('PJK3 SKP KEMNAKER R.I. NO. 560/URD/PJK3-RIKSALAP/2024', 44, 23)
        .text('Telp. (021) 489 1409  |  upayariksadaya.com', 44, 30);

      doc.rect(8, 38, 267.46, 15).fill('#C81E1E');
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor('#FFFFFF')
        .text('TANDA SELESAI PEMERIKSAAN & PENGUJIAN K3', 8, 42, {
          width: 267.46,
          align: 'center'
        });

      doc.image(qrBuffer, 12, 58, { width: 68 });
      doc
        .font('Helvetica')
        .fontSize(5)
        .fillColor('#64748B')
        .text('Scan untuk verifikasi', 12, 130, { width: 68, align: 'center' })
        .text('keaslian Suket K3', 12, 137, { width: 68, align: 'center' });

      const leftCol = 88;
      const topInfo = 58;

      const printRow = (label, val, y) => {
        doc
          .font('Helvetica')
          .fontSize(6)
          .fillColor('#64748B')
          .text(label, leftCol, y, { width: 65 })
          .font('Helvetica-Bold')
          .fontSize(6.5)
          .fillColor('#0F172A')
          .text(`: ${val}`, leftCol + 60, y, { width: 125, lineBreak: false });
      };

      printRow('Nomor Seri / Tag', data.serial_number || '-', topInfo);
      printRow('Nama Objek Alat', (data.name || data.object_name || '-').slice(0, 24), topInfo + 10);
      printRow('Kapasitas SWL', data.capacity || '-', topInfo + 20);
      printRow('Perusahaan Klien', (data.client_name || '-').slice(0, 24), topInfo + 30);
      printRow('Bidang Riksa Uji', data.category_name || data.category_code || 'K3', topInfo + 40);
      printRow('No. Suket K3', data.suket_no || 'TERCATAT DI DISNAKER', topInfo + 50);

      const expDate = data.valid_until || data.next_inspection_date;
      const expDateFormatted = expDate
        ? new Date(expDate).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        : 'MENUNGGU PENETAPAN';

      doc.rect(leftCol, topInfo + 63, 180, 20).fill('#FEF2F2');
      doc.rect(leftCol, topInfo + 63, 180, 20).lineWidth(0.8).strokeColor('#F87171').stroke();
      doc
        .font('Helvetica-Bold')
        .fontSize(6)
        .fillColor('#991B1B')
        .text('MASA BERLAKU HINGGA:', leftCol + 5, topInfo + 66)
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#DC2626')
        .text(expDateFormatted, leftCol + 5, topInfo + 73);

      doc
        .font('Helvetica')
        .fontSize(5)
        .fillColor('#94A3B8')
        .text(
          'Dilarang merusak / melepas stiker ini  ·  Wajib diuji ulang berkala sesuai Permenaker',
          8,
          195,
          { width: 267.46, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateRecommendationLetterPdfBuffer(data) {
  const companyProfile = await getCompanyProfile().catch(() => null);
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCompanyHeader(doc, 'LEMBAR TEMUAN DAN REKOMENDASI K3 (CORRECTIVE ACTION NOTICE)', companyProfile);

    const now = new Date(data.inspection_date || new Date());
    const dateFormatted = `${now.getDate()} ${INDONESIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    const letterNo = data.recommendation_no || `REK-K3/URD/${new Date().getFullYear()}/${String(data.inspection_id || data.id || Date.now()).slice(-4)}`;

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#C81E1E')
      .text('LEMBAR REKOMENDASI & TEMUAN HASIL RIKSA UJI', { align: 'center' })
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#50667A')
      .text(`Nomor: ${letterNo}`, { align: 'center' })
      .moveDown(0.8);

    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor('#1D1414')
      .text(
        `Berdasarkan hasil pemeriksaan dan pengujian (Riksa Uji) K3 di lokasi kerja pada tanggal ${dateFormatted}, dengan ini disampaikan bahwa unit peralatan kerja di bawah ini:`,
        45,
        doc.y,
        { width: 505, lineGap: 1.5 }
      )
      .moveDown(0.6);

    const boxY = doc.y;
    doc.rect(45, boxY, 505, 70).fill('#F8FAFC');
    doc.rect(45, boxY, 505, 70).lineWidth(0.8).strokeColor('#CBD5E1').stroke();

    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0F172A');
    doc.text(`Perusahaan Klien : ${data.client_name || '-'}`, 55, boxY + 8);
    doc.text(`Lokasi Unit      : ${data.install_location || data.location_address || '-'}`, 55, boxY + 22);
    doc.text(`Nama Objek Alat  : ${data.object_name || data.name || '-'}`, 55, boxY + 36);
    doc.text(`Nomor Seri       : ${data.serial_number || '-'}`, 55, boxY + 50);

    doc.text(`Bidang K3   : ${data.category_name || data.category_code || '-'}`, 320, boxY + 8);
    doc.text(`Kapasitas   : ${data.capacity || '-'}`, 320, boxY + 22);
    doc.text(`Pemeriksa   : ${data.inspector_name || 'Ahli K3 PT Upaya Riksa Daya'}`, 320, boxY + 36);
    doc.text(`Tanggal Uji : ${dateFormatted}`, 320, boxY + 50);

    doc.y = boxY + 80;

    doc.rect(45, doc.y, 505, 24).fill('#FEF2F2');
    doc.rect(45, doc.y, 505, 24).lineWidth(1).strokeColor('#DC2626').stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#DC2626')
      .text('STATUS: BELUM MEMENUHI SYARAT K3 (PERLU TINDAKAN PERBAIKAN KLIEN)', 45, doc.y + 7, {
        width: 505,
        align: 'center'
      });

    doc.y += 34;

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor('#0F172A')
      .text('Daftar Temuan Teknis & Rekomendasi Perbaikan Wajib:');
    doc.moveDown(0.4);

    const findings = data.findings || [];
    const tableTop = doc.y;
    doc.rect(45, tableTop, 505, 18).fill('#F1F5F9');
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#334155')
      .text('NO', 50, tableTop + 5, { width: 25 })
      .text('KOMPONEN / BAGIAN', 80, tableTop + 5, { width: 130 })
      .text('URAIAN TEMUAN KERUSAKAN / KETIDAKSESUAIAN', 215, tableTop + 5, { width: 170 })
      .text('REKOMENDASI PERBAIKAN', 390, tableTop + 5, { width: 155 });

    let rowY = tableTop + 20;
    doc.font('Helvetica').fontSize(7.5);

    if (findings.length === 0) {
      doc
        .fillColor('#64748B')
        .text('1', 50, rowY)
        .text('Komponen Utama', 80, rowY)
        .text(data.conclusion_notes || 'Ditemukan indikasi ketidaksesuaian fungsi/struktur.', 215, rowY, { width: 170 })
        .text(data.recommendations || 'Lakukan perbaikan dan kalibrasi ulang.', 390, rowY, { width: 155 });
      rowY += 28;
    } else {
      findings.forEach((f, idx) => {
        if (rowY > 660) {
          doc.addPage({ size: 'A4', margin: 45 });
          rowY = 45;
        }
        doc
          .fillColor('#0F172A')
          .text(String(idx + 1), 50, rowY, { width: 25 })
          .text(f.component || f.label || 'Komponen Operasi', 80, rowY, { width: 130 })
          .text(f.finding || f.description || '-', 215, rowY, { width: 170 })
          .text(f.recommendation || data.recommendations || '-', 390, rowY, { width: 155 });
        rowY += 28;
        doc.moveTo(45, rowY - 2).lineTo(550, rowY - 2).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
      });
    }

    doc.y = rowY + 12;
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#334155')
      .text(
        'KETENTUAN K3 KEMENAKER R.I.:\n1. Unit peralatan tersebut di atas tidak dibenarkan dioperasikan dengan beban penuh atau membahayakan keselamatan tenaga kerja sebelum perbaikan diselesaikan.\n2. Pihak Manajemen Klien wajib mengirimkan bukti dokumentasi hasil perbaikan kepada PT Upaya Riksa Daya untuk verifikasi teknis lanjutan sebagai syarat pengajuan penerbitan Surat Keterangan (Suket) Kelayakan K3 ke Disnaker Provinsi.',
        45,
        doc.y,
        { width: 505, lineGap: 2 }
      )
      .moveDown(1.5);

    const sigY = Math.max(doc.y, 650);
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#1D1414')
      .text('Ahli K3 Pemeriksa,', 45, sigY, { width: 230, align: 'center' })
      .text('Mengetahui / Menerima,', 320, sigY, { width: 230, align: 'center' })
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748B')
      .text('PT UPAYA RIKSA DAYA', 45, sigY + 14, { width: 230, align: 'center' })
      .text(data.client_name || 'PERWAKILAN KLIEN', 320, sigY + 14, { width: 230, align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#1D1414')
      .text(
        data.inspector_name || 'Ahli K3 PT Upaya Riksa Daya',
        45,
        sigY + 65,
        { width: 230, align: 'center' }
      )
      .text(
        data.client_signer_name || data.contact_name || '( ........................................ )',
        320,
        sigY + 65,
        { width: 230, align: 'center' }
      );

    drawCompanyFooter(doc, 770);
    doc.end();
  });
}
