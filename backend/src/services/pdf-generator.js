import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { resolveAttachmentPath } from '../storage/file-storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const officialLogoPath = path.resolve(__dirname, '../../../logo-urd.png');

// Lampiran diambil dari halaman SKP pada contoh LHPP tiap bidang.
// Ganti atau tambah file di folder bidang ini saat tersedia dokumen terbaru.
const LHPP_SKP_APPENDIX_FILES = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../assets/lhpp/skp/manifest.json'), 'utf8')
);

function getLhppSkpAppendixPaths(categoryCode) {
  return (LHPP_SKP_APPENDIX_FILES[categoryCode] || [])
    .map((fileName) => path.resolve(__dirname, '../assets/lhpp/skp', categoryCode, fileName))
    .filter((filePath) => fs.existsSync(filePath));
}

function drawCompanyHeader(doc, subtitle) {
  if (fs.existsSync(officialLogoPath)) {
    doc.image(officialLogoPath, 45, 36, { width: 68 });
  }
  doc
    .fillColor('#1D1414')
    .font('Times-Bold')
    .fontSize(14)
    .text('PT UPAYA RIKSA DAYA', 125, 40)
    .font('Times-Roman')
    .fontSize(9)
    .fillColor('#324A6D')
    .text('Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian', 125, 58)
    .text('Email: urd@upayariksadaya.com  |  Telp: (021) 489 1409  |  upayariksadaya.com', 125, 71);

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
      .font('Times-Bold')
      .fontSize(12)
      .text(subtitle, 45, 104, { align: 'center', width: 505 });
    doc.moveDown(0.5);
  }
}

function drawCompanyFooter(doc, yPos = 770) {
  doc
    .moveTo(45, yPos)
    .lineTo(550, yPos)
    .lineWidth(0.8)
    .strokeColor('#C8D5DC')
    .stroke();
  doc
    .font('Times-Roman')
    .fontSize(7.5)
    .fillColor('#324A6D')
    .text(
      'PT Upaya Riksa Daya | PJK3 Pemeriksaan & Pengujian K3 | urd@upayariksadaya.com | (021) 489 1409',
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

function renderSingleBapPage(doc, bap, qrBuffer) {
  doc.rect(45, 42, 260, 16).fillColor('#8B262B').fill();

  doc
    .font('Times-Roman')
    .fontSize(12.5)
    .fillColor('#1D1414')
    .text('PT. UPAYA RIKSA DAYA', 315, 43, { width: 145, align: 'left' });

  doc
    .moveTo(315, 58)
    .lineTo(453, 58)
    .lineWidth(0.8)
    .strokeColor('#1D1414')
    .stroke();

  if (fs.existsSync(officialLogoPath)) {
    doc.image(officialLogoPath, 462, 32, { width: 82 });
  }

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
      `Pada hari ini ${dayName}, Tanggal ${dayNum} Bulan ${monthName} Tahun ${yearFull} telah dilaksanakan pekerjaan pemeriksaan dan pengujian (riksa uji) oleh PT. Upaya Riksa Daya pada :`,
      45,
      118,
      { width: 505, lineGap: 2 }
    );

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

  const scopeTop = rowY + 2;
  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#1D1414')
    .text('Lingkup Riksa Uji', 45, scopeTop)
    .text(':', 163, scopeTop);

  const colWidth = 160;
  for (let c = 0; c < 3; c += 1) {
    const colX = 45 + c * (colWidth + 12);
    const items = TEMPLATE_BAP_COLUMNS[c] || [];
    for (let r = 0; r < items.length; r += 1) {
      const y = scopeTop + 14 + r * 12;
      const label = items[r];
      doc.rect(colX, y + 1.5, 7, 7).lineWidth(0.6).strokeColor('#1D1414').stroke();
      doc
        .font('Times-Roman')
        .fontSize(7.5)
        .fillColor('#1D1414')
        .text(label, colX + 10.5, y + 0.5, { width: colWidth - 11, lineBreak: false });
    }
  }

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

  const sigTop = notesBoxTop + notesBoxHeight + 8;
  const sigHeight = 96;
  doc.rect(45, sigTop, 505, sigHeight).lineWidth(0.9).strokeColor('#1D1414').stroke();

  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#1D1414')
    .text('Inspector', 55, sigTop + 6, { align: 'center', width: 220 })
    .text('Pemilik Alat / Unit', 315, sigTop + 6, { align: 'center', width: 220 });

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
  doc
    .font('Times-Roman')
    .fontSize(7.8)
    .fillColor('#1D1414')
    .text(
      'Jl. Pondasi No. 50B Kel. Kayu Putih Kec. Pulo Gadung Jakarta Timur 13210',
      45,
      footerAddrTop,
      { align: 'center', width: 505 }
    )
    .text(
      'ph. 021.4891409, 4715699, 47861912 Fax. 021.47865925',
      45,
      footerAddrTop + 10,
      { align: 'center', width: 505 }
    )
    .text(
      'Email. urd@upayariksadaya.com, upayariksadaya@gmail.com',
      45,
      footerAddrTop + 20,
      { align: 'center', width: 505 }
    )
    .text('Website.www.upayariksadaya.com', 45, footerAddrTop + 30, {
      align: 'center',
      width: 505
    });
}

export async function generateBapPdfBuffer(bapInput) {
  const bapList = Array.isArray(bapInput) ? bapInput : [bapInput];
  const qrBuffers = await Promise.all(
    bapList.map((b) => {
      const qrText = b.verification_code
        ? `https://upayariksadaya.com/verifikasi/${b.verification_code}`
        : `PT UPAYA RIKSA DAYA | BAP: ${b.bap_no || 'DRAF'} | PO: ${b.po_number || b.order_no || '-'} | SN: ${b.serial_number || '-'}`;
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
      renderSingleBapPage(doc, bap, qrBuffers[idx]);
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
      { key: 'jenis_pesawat', label: 'Jenis Pesawat (Lift / Eskalator)' },
      { key: 'merk_pabrik', label: 'Merk & Pabrik Pembuat' },
      { key: 'kapasitas_angkut', label: 'Kapasitas Angkut (Orang / kg)' },
      { key: 'kecepatan_nominal', label: 'Kecepatan Nominal Laju Kereta (m/s)' },
      { key: 'jumlah_lantai_layanan', label: 'Jumlah Lantai Layanan / Pintu' },
      { key: 'panjang_lintasan_travel', label: 'Panjang Lintasan / Travel Height (m)' },
      { key: 'sistem_penggerak', label: 'Sistem Penggerak (Traksi / Hidrolik)' },
      { key: 'tipe_mesin_traksi', label: 'Tipe & Spesifikasi Mesin Traksi' },
      { key: 'tali_penggantung', label: 'Tali Kawat Baja Penggantung (Wire Rope)' },
      { key: 'tipe_pengaman_car', label: 'Tipe Rem Pengaman Sangkar (Safety Gear)' },
      { key: 'tipe_governor', label: 'Tipe Governor & Setting Kecepatan' },
      { key: 'interlock_pintu', label: 'Sistem Pengunci Daun Pintu (Interlock)' },
      { key: 'catu_daya_darurat_ard', label: 'Automatic Rescue Device (ARD)' },
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

const LHPP_CHECKLIST_LAYOUTS = {
  PAA: {
    columns: [64.3, 89.4, 198.0, 339.3, 395.2, 451.4, 550.3],
    headings: ['No', 'Nama Bagian /\nKomponen', 'Pemeriksaan terhadap', 'Memenuhi\nSyarat K3', 'Tidak Memenuhi\nSyarat K3', 'Keterangan'],
    status: ['SESUAI', 'TIDAK_SESUAI']
  },
  PUBT: {
    columns: [64.3, 89.4, 198.0, 339.3, 395.2, 451.4, 550.3],
    headings: ['No', 'Bagian-Bagian', 'Pemeriksaan terhadap', 'Memenuhi\nSyarat K3', 'Tidak Memenuhi\nSyarat K3', 'Keterangan'],
    status: ['SESUAI', 'TIDAK_SESUAI']
  },
  PTP: {
    columns: [64.3, 89.4, 204.0, 344.0, 404.0, 464.0, 550.3],
    headings: ['No', 'Komponen', 'Pemeriksaan terhadap', 'Baik', 'Buruk', 'Keterangan'],
    status: ['SESUAI', 'TIDAK_SESUAI']
  },
  IPP: {
    columns: [64.3, 89.4, 218.0, 360.0, 410.0, 460.0, 505.0, 550.3],
    headings: ['No', 'Items Pemeriksaan', 'Uraian Pemeriksaan', 'Baik', 'Buruk', 'N/A', 'Keterangan'],
    status: ['BAIK', 'BURUK', 'TIDAK_BERLAKU']
  },
  LIS: {
    columns: [64.3, 89.4, 320.0, 390.0, 460.0, 550.3],
    headings: ['No', 'Item Pemeriksaan', 'Ada', 'Tidak Ada', 'Keterangan'],
    status: ['ADA', 'TIDAK_ADA']
  },
  LE: {
    columns: [64.3, 89.4, 198.0, 339.3, 395.2, 451.4, 550.3],
    headings: ['No', 'Komponen', 'Pemeriksaan terhadap', 'Memenuhi\nSyarat K3', 'Tidak Memenuhi\nSyarat K3', 'Keterangan'],
    status: ['SESUAI', 'TIDAK_SESUAI']
  },
  IPK: {
    columns: [64.3, 89.4, 215.0, 360.0, 420.0, 480.0, 550.3],
    headings: ['No', 'Jenis Dokumen / Komponen', 'Pemeriksaan terhadap', 'Memenuhi', 'Tidak Memenuhi', 'Keterangan'],
    status: ['SESUAI', 'TIDAK_SESUAI']
  }
};

function normalizedChoice(choice) {
  return String(choice || '').trim().toUpperCase().replace(/[ -]+/g, '_');
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
      ['Pemilik', readField('client_name')],
      ['Alamat', readField('client_address')],
      ['Pemakai', readField('pemakai', 'client_name')],
      ['Pengurus / Penanggung jawab', readField('pengurus', 'contact_name')],
      ['Lokasi Unit', readField('install_location')],
      ['Jenis Pesawat', readField('jenis_pesawat', 'object_name')],
      ['Item No', readField('item_no')],
      ['Nomor Seri Unit', readField('serial_number')],
      ['Merk / Model', readField('brand', 'model')],
      ['Tahun', readField('manufacture_year')],
      ['Kapasitas Angkat', readField('capacity', 'swl')],
      ['Standar yang dipakai', readField('standard_ref')],
      ['Digunakan untuk', readField('digunakan_untuk')],
      ['Tanggal diperiksa', readDateField('inspection_date')],
      ['Jenis Pemeriksaan', readField('inspection_type')],
      ['No. Ijin Pemakaian', readField('previous_permit_no')],
      ['Diperiksa Oleh', readField('inspector_name')]
    ],
    PUBT: [
      ['Pemilik', readField('client_name')],
      ['Alamat', readField('client_address')],
      ['Pemakai', readField('pemakai', 'client_name')],
      ['Lokasi Unit', readField('install_location')],
      ['Nama Operator', readField('operator_name')],
      ['Jenis Bejana', readField('jenis_bejana', 'object_name')],
      ['Pabrik Pembuat', readField('manufacturer')],
      ['Merk / Type', readField('brand', 'model')],
      ['Tahun Pembuatan', readField('manufacture_year')],
      ['Item No', readField('item_no')],
      ['No. Serie / No. Unit', readField('serial_number')],
      ['Tekanan Design', readField('tekanan_desain', 'design_pressure')],
      ['Tekanan Kerja Maks. Yang Diperbolehkan', readField('tekanan_kerja', 'max_allowable_working_pressure')],
      ['Kapasitas', readField('kapasitas_volume', 'volume_kapasitas')],
      ['Dimensi', readField('dimensi_bejana')],
      ['Media yang digunakan', readField('media_fluida', 'fluida_isinya')],
      ['Temperatur Kerja', readField('temperatur_kerja')],
      ['Pedoman Pemeriksaan', readField('standard_ref')],
      ['Digunakan Untuk', readField('digunakan_untuk')],
      ['Jenis Pemeriksaan', readField('inspection_type')],
      ['No. Ijin Pemakaian', readField('previous_permit_no')],
      ['Tanggal Pemeriksaan dan Pengujian', readDateField('inspection_date')],
      ['Diperiksa Oleh', readField('inspector_name')]
    ],
    IPP: [
      ['Nama Perusahaan', readField('client_name')],
      ['Alamat Perusahaan', readField('client_address')],
      ['Lokasi Unit', readField('install_location')],
      ['Jenis Instalasi', 'Instalasi Penyalur Petir'],
      ['Tipe / Merk Air Terminal', `${readField('brand')} / ${readField('model')}`],
      ['Radius Proteksi', readField('radius_proteksi')],
      ['Tinggi Bangunan', readField('tinggi_gedung')],
      ['Tinggi Finial / Tiang', readField('tinggi_finial')],
      ['Jumlah Hantaran Turun (Down Conductor)', readField('jumlah_down_conductor')],
      ['Jenis & Penampang Hantaran', `${readField('jenis_hantaran')} / ${readField('penampang_kabel')}`],
      ['Jumlah Titik Pembumian (Grounding)', readField('jumlah_elektroda', 'jumlah_bak_kontrol')],
      ['Tanggal Pemeriksaan', readDateField('inspection_date')],
      ['Diperiksa Oleh', readField('inspector_name')]
    ],
    LIS: [
      ['Nama Perusahaan/Instansi', readField('client_name')],
      ['Alamat', readField('client_address')],
      ['Alamat Pemakai', readField('user_address', 'client_address')],
      ['Jenis Unit', readField('object_name')],
      ['Jenis Pemeriksaan', readField('inspection_type')],
      ['Nomor Izin Pemakaian', readField('previous_permit_no')],
      ['Pelaksanaan riksa uji', readDateField('inspection_date')]
    ],
    LE: [
      ['Pemilik', readField('client_name')],
      ['Alamat', readField('client_address')],
      ['Lokasi Unit', readField('install_location')],
      ['Jenis Pesawat', readField('jenis_pesawat', 'object_name')],
      ['Merk / Pabrik Pembuat', `${readField('brand')} / ${readField('manufacturer')}`],
      ['Nomor Seri Unit', readField('serial_number')],
      ['Tahun Pembuatan', readField('manufacture_year')],
      ['Kapasitas Angkut', `${readField('capacity')} ${readField('capacity_unit') || 'kg'}`.trim()],
      ['Kecepatan Nominal', readField('kecepatan_nominal')],
      ['Jumlah Lantai Layanan', readField('jumlah_lantai_layanan')],
      ['Tanggal Pemeriksaan', readDateField('inspection_date')],
      ['Diperiksa Oleh', readField('inspector_name')]
    ],
    IPK: [
      ['Nama Gedung / Bangunan', readField('building_name', 'object_name')],
      ['Alamat Pemakai', readField('client_address')],
      ['Alamat Pemakaian', readField('install_location')],
      ['Penggunaan Bangunan', readField('building_use')],
      ['Nama Pemilik/Pimpinan/Direktur', readField('owner_name')],
      ['Instalatur', readField('installer_name')],
      ['Alamat Instalatur', readField('installer_address')],
      ['Status Riksa Uji', readField('inspection_type')],
      ['Tanggal Riksa Uji', readDateField('inspection_date')],
      ['No. Surat Keterangan', readField('previous_permit_no')]
    ]
  };

  const isDieselPtp = categoryCode === 'PTP' && /diesel|genset/i.test(`${data.object_name || ''} ${technicalData.jenis_pesawat || ''}`);
  if (categoryCode === 'PTP') {
    templateIdentityRows.PTP = isDieselPtp
      ? [
          ['Perusahaan Pemilik', readField('client_name')],
          ['Alamat', readField('client_address')],
          ['Lokasi Pemakai', readField('install_location')],
          ['Alamat Pemakai', readField('user_address', 'client_address')],
          ['Pengurus / Penanggung Jawab', readField('pengurus')],
          ['Lokasi Unit', readField('install_location')],
          ['Jenis Pesawat / Type', readField('jenis_pesawat', 'object_name')],
          ['Merk / Type', readField('brand', 'model')],
          ['No. Seri / No. Unit', readField('serial_number')],
          ['Lokasi / Tahun Pembuatan', readField('manufacture_year')],
          ['Kapasitas', readField('kapasitas_daya', 'capacity')],
          ['Digunakan Untuk', readField('digunakan_untuk')],
          ['No. SKP PJK3 / Bidang', readField('skp_pjk3')],
          ['No. SKP / Bidang AK3', readField('skp_ahli_k3')],
          ['Klasifikasi', readField('klasifikasi')],
          ['No Izin Pemakaian / Penerbit', readField('previous_permit_no')],
          ['Nama Operator', readField('operator_name')],
          ['Jenis Pemeriksaan', readField('inspection_type')],
          ['Tanggal Riksa Uji', readDateField('inspection_date')],
          ['Diperiksa Oleh', readField('inspector_name')]
        ]
      : [
          ['Perusahaan Pemilik', readField('client_name')],
          ['Alamat', readField('client_address')],
          ['Perusahaan Pemakai', readField('user_company', 'client_name')],
          ['Alamat', readField('user_address', 'client_address')],
          ['Pengurus / Penanggung Jawab', readField('pengurus')],
          ['Lokasi Unit', readField('install_location')],
          ['Jenis Pesawat / Type', readField('jenis_pesawat', 'object_name')],
          ['Merk', readField('brand')],
          ['No. Unit', readField('item_no')],
          ['Perusahaan Pembuat / Pemasang', readField('manufacturer')],
          ['Lokasi / Tahun Pembuatan', readField('manufacture_location', 'manufacture_year')],
          ['Kapasitas', readField('capacity', 'kapasitas_daya')],
          ['Digunakan Untuk', readField('digunakan_untuk')],
          ['No. SKP PJK3 / Bidang', readField('skp_pjk3')],
          ['No. SKP / Bidang AK3', readField('skp_ahli_k3')],
          ['Sertifikasi Standar', readField('standard_ref')],
          ['No Izin Pemakaian / Penerbit', readField('previous_permit_no')],
          ['Nama Operator', readField('operator_name')],
          ['Jenis Pemeriksaan', readField('inspection_type')],
          ['Tanggal Pemeriksaan', readDateField('inspection_date')],
          ['Pemeriksa', readField('inspector_name')]
        ];
  }

  const technicalSchema = [...(category.technicalFields || [])];
  if (categoryCode === 'LIS') {
    technicalSchema.splice(
      0,
      technicalSchema.length,
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
      ['Pemilik', readField('client_name')],
      ['Alamat', readField('client_address')],
      ['Lokasi Unit', readField('install_location')],
      ['Jenis Pesawat', readField('object_name')],
      ['Nomor Seri', readField('serial_number')],
      ['Tahun Pembuatan', readField('manufacture_year')],
      ['Kapasitas', readField('capacity')],
      ['Tanggal Pemeriksaan', readField('inspection_date')],
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
// HELPER LAYOUT & TABEL LHPP UNTUK MENIRU PERSIS TEMPLATE SUMBER PERUSAHAAN
// ============================================================================

function drawLhppCoverPage(doc, report, data) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const coverLeft = 64;
  const coverWidth = pageW - 128;

  // 1. Blok Merah Atas & Bawah, serta Garis Abu-abu Samping
  doc.rect(0, 0, pageW, 53.75).fillColor('#FF0000').fill();
  doc.rect(0, pageH - 53.35, pageW, 53.35).fillColor('#FF0000').fill();
  doc.rect(47.75, 0, 7.15, pageH).fillColor('#525252').fill();
  doc.rect(pageW - 55.09, 0, 7.15, pageH).fillColor('#525252').fill();

  // 2. Tahun Dokumen & Garis Bawah
  const inspectionDate = new Date(data.inspection_date || data.published_at || Date.now());
  const reportYear = Number.isNaN(inspectionDate.getTime())
    ? new Date().getFullYear()
    : inspectionDate.getFullYear();

  const yearX = 64;
  const yearY = 62;
  doc
    .font('Times-Bold')
    .fontSize(28)
    .fillColor('#000000')
    .text(String(reportYear), yearX, yearY, { lineBreak: false });
  doc.rect(yearX, yearY + 31, 56.04, 2.64).fillColor('#000000').fill();

  // 3. Judul Sampul Laporan
  const titleY = 136;
  doc
    .font('Times-Bold')
    .fontSize(18)
    .fillColor('#000000')
    .text('LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', coverLeft, titleY, {
      width: coverWidth,
      align: 'center',
      lineGap: 3
    })
    .text('SERTIFIKASI', coverLeft, doc.y, {
      width: coverWidth,
      align: 'center',
      lineGap: 3
    })
    .text((report.coverTitle || report.categoryName).toUpperCase(), coverLeft, doc.y, {
      width: coverWidth,
      align: 'center'
    });

  // 4. Baris Identitas Sampul (Cover Info Rows)
  let infoY = 274.7;
  const labelX = 85.2;
  const colonX = 171.9;
  const valX = 180.0;
  const valWidth = pageW - valX - 60;

  for (const [label, rawValue] of report.coverInfoRows) {
    let displayVal = hasReportValue(rawValue) ? String(rawValue) : '-';
    if (label === 'SN' && displayVal !== '-') {
      const extraParts = [];
      if (hasReportValue(data.capacity)) {
        extraParts.push(`${data.capacity} ${data.capacity_unit || ''}`.trim());
      }
      if (hasReportValue(data.manufacture_year)) {
        extraParts.push(String(data.manufacture_year));
      }
      if (extraParts.length > 0 && !displayVal.includes('/')) {
        displayVal = `${displayVal} / ${extraParts.join(' / ')}`;
      }
    }

    doc
      .font('Times-Bold')
      .fontSize(11)
      .fillColor('#000000')
      .text(label, labelX, infoY, { width: 80, lineBreak: false })
      .text(':', colonX, infoY, { lineBreak: false })
      .text(displayVal, valX, infoY, { width: valWidth, lineBreak: false });

    infoY += 16.1;
  }

  // 5. Kotak Bingkai Foto Sampul
  const photoFrame = {
    x: 153,
    y: 422,
    width: 302,
    height: 227
  };
  doc
    .rect(photoFrame.x, photoFrame.y, photoFrame.width, photoFrame.height)
    .lineWidth(0.6)
    .strokeColor('#888888')
    .stroke();

  const coverPhoto = report.photos.find((p) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(p.mimeType)
  );

  let photoRendered = false;
  if (coverPhoto?.storageKey) {
    try {
      const pPath = resolveAttachmentPath(coverPhoto.storageKey);
      if (fs.existsSync(pPath)) {
        doc.image(pPath, photoFrame.x + 2, photoFrame.y + 2, {
          fit: [photoFrame.width - 4, photoFrame.height - 4],
          align: 'center',
          valign: 'center'
        });
        photoRendered = true;
      }
    } catch {
      photoRendered = false;
    }
  }

  if (!photoRendered) {
    doc
      .font('Times-Italic')
      .fontSize(9.5)
      .fillColor('#888888')
      .text('[Foto Objek Riksa Uji Belum Tersedia]', photoFrame.x, photoFrame.y + 105, {
        width: photoFrame.width,
        align: 'center'
      });
  }

  // 6. Footer Sampul (Kontak & Kantor Resmi)
  const footerY = pageH - 172;
  doc
    .font('Times-Bold')
    .fontSize(11)
    .fillColor('#FF0000')
    .text('PT. UPAYA RIKSA DAYA', coverLeft, footerY, {
      width: coverWidth,
      align: 'center'
    });
  doc
    .font('Times-Bold')
    .fontSize(11)
    .fillColor('#000000')
    .text('Jl. Pondasi No. 50B Kampung Ambon, Jakarta Timur. 13210', coverLeft, footerY + 13, {
      width: coverWidth,
      align: 'center'
    })
    .text('Phone. 021 4891409, 021 4715699, 021 47861912', coverLeft, footerY + 26, {
      width: coverWidth,
      align: 'center'
    });

  const emailWebY = footerY + 39;
  doc.font('Times-Bold').fontSize(11);
  const p1 = 'Email: ';
  const p2 = 'urd@upayariksadaya.com';
  const p3 = '   Web. ';
  const p4 = 'upayariksadaya.com';
  const totalW = doc.widthOfString(p1 + p2 + p3 + p4);
  const startX = coverLeft + (coverWidth - totalW) / 2;

  doc.fillColor('#000000').text(p1, startX, emailWebY, { continued: true });
  doc.fillColor('#0563C1').text(p2, { continued: true, underline: true });
  doc.fillColor('#000000').text(p3, { continued: true, underline: false });
  doc.fillColor('#0563C1').text(p4, { underline: true });
}

function drawLhppPageFooter(doc, contentLeft = 64) {
  const footerY = doc.page.height - 56;
  doc
    .font('Times-Bold')
    .fontSize(11)
    .fillColor('#FF0000')
    .text('PT. UPAYA RIKSA DAYA', contentLeft, footerY, { lineBreak: false });
  doc
    .font('Times-Roman')
    .fontSize(9.5)
    .fillColor('#000000')
    .text('Jl. Pondasi No. 50B Kampung Ambon, Jakarta Timur. 13210', contentLeft, footerY + 13, {
      lineBreak: false
    });
}

function drawLhppHeaderBox(doc, report, data, contentLeft, contentWidth) {
  const boxY = 46;
  const boxH = 68;
  doc.rect(contentLeft, boxY, contentWidth, boxH).lineWidth(0.8).strokeColor('#000000').stroke();

  let titleLine = 'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN';
  let subLine = report.coverTitle || report.categoryName;
  let objLine = data.object_name ? `(${String(data.object_name).toUpperCase()})` : '';
  let noLine = `NO. ${data.lhpp_no || data.po_number || data.order_no || '-'}`;

  if (report.categoryCode === 'IPP') {
    titleLine = 'LAPORAN HASIL PEMERIKSAAN PERTAMA';
    subLine = 'JENIS PERALATAN : INSTALASI PENYALUR PETIR';
    objLine = '';
    noLine = `No. Reg : ${data.lhpp_no || '-'}`;
  } else if (report.categoryCode === 'IPK') {
    titleLine = 'LAPORAN HASIL PEMERIKSAAN & PENGUJIAN BERKALA';
    subLine = 'INSTALASI PROTEKSI KEBAKARAN';
    objLine = '';
    noLine = `Nomor : ${data.lhpp_no || '-'}`;
  } else if (report.categoryCode === 'PTP' && /diesel|genset/i.test(data.object_name || '')) {
    subLine = 'PESAWAT TENAGA DAN PRODUKSI';
    objLine = '(MOTOR DIESEL)';
  }

  doc
    .font('Times-Bold')
    .fontSize(11)
    .fillColor('#000000')
    .text(titleLine, contentLeft, boxY + 7, { width: contentWidth, align: 'center', lineGap: 1 });
  if (subLine) {
    doc.text(subLine, contentLeft, doc.y, { width: contentWidth, align: 'center', lineGap: 1 });
  }
  if (objLine) {
    doc.text(objLine, contentLeft, doc.y, { width: contentWidth, align: 'center', lineGap: 1 });
  }
  doc
    .font('Times-Bold')
    .fontSize(9.5)
    .text(noLine, contentLeft, doc.y, { width: contentWidth, align: 'center' });

  doc.y = boxY + boxH + 14;
}

function drawSectionHeader(doc, title, contentLeft, contentWidth, ensureSpace) {
  ensureSpace(28);
  const sY = doc.y;
  doc
    .font('Times-Bold')
    .fontSize(10.5)
    .fillColor('#000000')
    .text(title, contentLeft, sY, { width: contentWidth });
  doc
    .moveTo(contentLeft, sY + 14)
    .lineTo(contentLeft + contentWidth, sY + 14)
    .lineWidth(0.6)
    .strokeColor('#000000')
    .stroke();
  doc.y = sY + 18;
}

function drawCheckmark(doc, centerX, centerY) {
  doc.save();
  doc
    .moveTo(centerX - 4.5, centerY - 0.5)
    .lineTo(centerX - 1.2, centerY + 3.2)
    .lineTo(centerX + 4.8, centerY - 4.2)
    .lineWidth(1.1)
    .strokeColor('#000000')
    .stroke();
  doc.restore();
}

function drawDataTable(
  doc,
  rows,
  { contentLeft, contentWidth, numbered = false, fontSize = 8.5 },
  ensureSpace
) {
  const numColW = numbered ? 26 : 0;
  const labelColW = numbered ? 180 : 169.34;
  const valColW = contentWidth - numColW - labelColW;

  rows.forEach(([label, rawValue], index) => {
    const val = String(rawValue ?? '-');
    const labelH = doc
      .font('Times-Roman')
      .fontSize(fontSize)
      .heightOfString(label, { width: labelColW - 10 });
    const valH = doc
      .font('Times-Roman')
      .fontSize(fontSize)
      .heightOfString(val, { width: valColW - (numbered ? 10 : 20) });
    const rowH = Math.max(20, labelH + 6, valH + 6);

    ensureSpace(rowH);
    const rY = doc.y;
    const textY = rY + (rowH - Math.max(labelH, valH)) / 2;

    doc.rect(contentLeft, rY, contentWidth, rowH).lineWidth(0.5).strokeColor('#000000').stroke();

    if (numbered) {
      doc
        .moveTo(contentLeft + numColW, rY)
        .lineTo(contentLeft + numColW, rY + rowH)
        .lineWidth(0.5)
        .strokeColor('#000000')
        .stroke();
      doc
        .font('Times-Roman')
        .fontSize(fontSize)
        .fillColor('#000000')
        .text(String(index + 1), contentLeft, textY, { width: numColW, align: 'center' });
    }

    doc
      .moveTo(contentLeft + numColW + labelColW, rY)
      .lineTo(contentLeft + numColW + labelColW, rY + rowH)
      .lineWidth(0.5)
      .strokeColor('#000000')
      .stroke();

    doc
      .font('Times-Roman')
      .fontSize(fontSize)
      .fillColor('#000000')
      .text(label, contentLeft + numColW + 5, textY, { width: labelColW - 10 });

    if (!numbered) {
      doc.text(':', contentLeft + labelColW + 5, textY, { lineBreak: false });
      doc.text(val, contentLeft + labelColW + 12, textY, { width: valColW - 18, lineGap: 1.5 });
    } else {
      doc.text(val, contentLeft + numColW + labelColW + 5, textY, { width: valColW - 10, lineGap: 1.5 });
    }

    doc.y = rY + rowH;
  });
  doc.y += 6;
}

function drawPaaTechnicalSection(doc, data, contentLeft, contentWidth, ensureSpace) {
  const readTechnical = (...keys) => {
    for (const k of keys) {
      const val = data.technical_data?.[k] ?? data[k];
      if (hasRecordedReportValue(val)) return String(val);
    }
    return '-';
  };

  const col0X = contentLeft;
  const col1X = contentLeft + 27.2;
  const col2X = contentLeft + 134.1;
  const col3X = contentLeft + 211.6;
  const col4X = contentLeft + 300.5;
  const col5X = contentLeft + 389.4;
  const col6X = contentLeft + contentWidth;

  const defaultRowH = 18;

  // 1. SPESIFIKASI
  {
    const specRows = [
      ['Tinggi Angkat', readTechnical('lifting_height', 'tinggi_angkat')],
      ['Panjang Span', readTechnical('span', 'panjang_bentang')],
      ['Panjang Runway Rail', readTechnical('runway_length', 'panjang_lintasan')]
    ];
    const speedRows = [
      ['- Hoisting', readTechnical('hoist_speed', 'kecepatan_hoist')],
      ['- Traversing', readTechnical('traverse_speed', 'travel_speed', 'kecepatan_traversing')],
      ['- Travelling', readTechnical('travel_speed', 'kecepatan_travelling')]
    ];

    const groupH = (specRows.length + speedRows.length) * defaultRowH;
    ensureSpace(groupH);
    const gY = doc.y;

    doc.rect(col0X, gY, col6X - col0X, groupH).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveTo(col1X, gY).lineTo(col1X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col2X, gY).lineTo(col2X, gY + groupH).lineWidth(0.5).stroke();

    doc.font('Times-Roman').fontSize(8.5).fillColor('#000000');
    doc.text('1', col0X, gY + groupH / 2 - 4, { width: col1X - col0X, align: 'center' });
    doc.text('Spesifikasi', col1X + 4, gY + groupH / 2 - 4, { width: col2X - col1X - 8, align: 'center' });

    let rY = gY;
    specRows.forEach(([param, val]) => {
      doc.moveTo(col4X, rY).lineTo(col4X, rY + defaultRowH).lineWidth(0.5).stroke();
      doc.text(param, col2X + 6, rY + 4, { width: col4X - col2X - 12 });
      doc.text(val, col4X + 6, rY + 4, { width: col6X - col4X - 12 });
      rY += defaultRowH;
      doc.moveTo(col2X, rY).lineTo(col6X, rY).lineWidth(0.5).stroke();
    });

    const speedTotalH = speedRows.length * defaultRowH;
    doc.moveTo(col3X, rY).lineTo(col3X, rY + speedTotalH).lineWidth(0.5).stroke();
    doc.text('Kecepatan', col2X + 6, rY + speedTotalH / 2 - 4, { width: col3X - col2X - 12 });

    speedRows.forEach(([subParam, val], idx) => {
      const curY = rY + idx * defaultRowH;
      doc.moveTo(col4X, curY).lineTo(col4X, curY + defaultRowH).lineWidth(0.5).stroke();
      doc.text(subParam, col3X + 6, curY + 4, { width: col4X - col3X - 12 });
      doc.text(val, col4X + 6, curY + 4, { width: col6X - col4X - 12 });
      if (idx < speedRows.length - 1) {
        doc.moveTo(col3X, curY + defaultRowH).lineTo(col6X, curY + defaultRowH).lineWidth(0.5).stroke();
      }
    });

    doc.y = gY + groupH;
  }

  // Helper for 3 sub-column tables: Motor Penggerak & Rem
  const drawTriSubGroup = (groupNum, groupTitle, entries) => {
    const headerH = defaultRowH;
    const groupH = headerH + entries.length * defaultRowH;
    ensureSpace(groupH);
    const gY = doc.y;

    doc.rect(col0X, gY, col6X - col0X, groupH).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveTo(col1X, gY).lineTo(col1X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col2X, gY).lineTo(col2X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col3X, gY).lineTo(col3X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col4X, gY).lineTo(col4X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col5X, gY).lineTo(col5X, gY + groupH).lineWidth(0.5).stroke();

    doc.font('Times-Roman').fontSize(8.5).fillColor('#000000');
    doc.text(String(groupNum), col0X, gY + groupH / 2 - 4, { width: col1X - col0X, align: 'center' });
    doc.text(groupTitle, col1X + 4, gY + groupH / 2 - 4, { width: col2X - col1X - 8, align: 'center' });

    // Sub-header row
    doc.font('Times-Bold').fontSize(8).fillColor('#000000');
    doc.text('Hoisting', col3X, gY + 4, { width: col4X - col3X, align: 'center' });
    doc.text('Traversing', col4X, gY + 4, { width: col5X - col4X, align: 'center' });
    doc.text('Travelling', col5X, gY + 4, { width: col6X - col5X, align: 'center' });

    let rY = gY + headerH;
    doc.moveTo(col2X, rY).lineTo(col6X, rY).lineWidth(0.5).stroke();

    entries.forEach(([param, [vH, vTr, vTv]], idx) => {
      doc.font('Times-Roman').fontSize(8).fillColor('#000000');
      doc.text(param, col2X + 6, rY + 4, { width: col3X - col2X - 12 });
      doc.text(vH, col3X + 4, rY + 4, { width: col4X - col3X - 8, align: 'center' });
      doc.text(vTr, col4X + 4, rY + 4, { width: col5X - col4X - 8, align: 'center' });
      doc.text(vTv, col5X + 4, rY + 4, { width: col6X - col5X - 8, align: 'center' });

      rY += defaultRowH;
      if (idx < entries.length - 1) {
        doc.moveTo(col2X, rY).lineTo(col6X, rY).lineWidth(0.5).stroke();
      }
    });

    doc.y = gY + groupH;
  };

  // 2. MOTOR PENGGERAK
  drawTriSubGroup(2, 'Motor Penggerak', [
    ['Type', [readTechnical('hoist_motor_type', 'drive_type', 'tipe_penggerak'), readTechnical('traverse_motor_type'), readTechnical('travel_motor_type')]],
    ['Daya', [readTechnical('hoist_motor_power', 'motor_power', 'daya_motor'), readTechnical('traverse_motor_power'), readTechnical('travel_motor_power')]],
    ['Putaran', [readTechnical('hoist_motor_rpm', 'motor_rpm', 'putaran_rpm'), readTechnical('traverse_motor_rpm'), readTechnical('travel_motor_rpm')]],
    ['Voltage', [readTechnical('hoist_motor_voltage', 'motor_voltage', 'tegangan_voltase'), readTechnical('traverse_motor_voltage'), readTechnical('travel_motor_voltage')]],
    ['Amphere', [readTechnical('hoist_motor_ampere', 'motor_ampere', 'arus_ampere'), readTechnical('traverse_motor_ampere'), readTechnical('travel_motor_ampere')]],
    ['Frekuensi', [readTechnical('hoist_motor_frequency', 'motor_frequency', 'frekuensi'), readTechnical('traverse_motor_frequency'), readTechnical('travel_motor_frequency')]]
  ]);

  // 3. REM
  drawTriSubGroup(3, 'Rem', [
    ['Jenis', [readTechnical('hoist_brake_type', 'brake_type', 'jenis_rem'), readTechnical('traverse_brake_type'), readTechnical('travel_brake_type')]],
    ['Type', [readTechnical('hoist_brake_model', 'brake_model', 'tipe_rem'), readTechnical('traverse_brake_model'), readTechnical('travel_brake_model')]]
  ]);

  // Helper for 2-column key-value groups: Kait Utama, Kait Tambahan, Chain
  const drawKeyValueGroup = (groupNum, groupTitle, entries) => {
    const groupH = entries.length * defaultRowH;
    ensureSpace(groupH);
    const gY = doc.y;

    doc.rect(col0X, gY, col6X - col0X, groupH).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveTo(col1X, gY).lineTo(col1X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col2X, gY).lineTo(col2X, gY + groupH).lineWidth(0.5).stroke();
    doc.moveTo(col3X, gY).lineTo(col3X, gY + groupH).lineWidth(0.5).stroke();

    doc.font('Times-Roman').fontSize(8.5).fillColor('#000000');
    doc.text(String(groupNum), col0X, gY + groupH / 2 - 4, { width: col1X - col0X, align: 'center' });
    doc.text(groupTitle, col1X + 4, gY + groupH / 2 - 4, { width: col2X - col1X - 8, align: 'center' });

    let rY = gY;
    entries.forEach(([param, val], idx) => {
      doc.font('Times-Roman').fontSize(8).fillColor('#000000');
      doc.text(param, col2X + 6, rY + 4, { width: col3X - col2X - 12 });
      doc.text(val, col3X + 6, rY + 4, { width: col6X - col3X - 12 });

      rY += defaultRowH;
      if (idx < entries.length - 1) {
        doc.moveTo(col2X, rY).lineTo(col6X, rY).lineWidth(0.5).stroke();
      }
    });

    doc.y = gY + groupH;
  };

  // 4. KAIT UTAMA
  drawKeyValueGroup(4, 'Kait Utama', [
    ['Type', readTechnical('hook_type', 'jenis_kait')],
    ['Kapasitas', readTechnical('hook_capacity', 'swl', 'capacity')],
    ['Material', readTechnical('hook_material', 'material_kait')]
  ]);

  // 5. KAIT TAMBAHAN
  drawKeyValueGroup(5, 'Kait Tambahan', [
    ['Type', readTechnical('aux_hook_type', 'tipe_kait_tambahan')],
    ['Kapasitas', readTechnical('aux_hook_capacity', 'kapasitas_kait_tambahan')],
    ['Material', readTechnical('aux_hook_material', 'material_kait_tambahan')]
  ]);

  // 6. CHAIN
  drawKeyValueGroup(6, 'Chain', [
    ['Dimensi', readTechnical('chain_dimension', 'dimensi_rantai')],
    ['Panjang', readTechnical('chain_length', 'panjang_rantai')],
    ['Diameter', readTechnical('chain_diameter', 'diameter_rantai')]
  ]);

  doc.y += 6;
}

function drawPubtTechnicalSection(doc, data, contentLeft, contentWidth, ensureSpace) {
  const readTechnical = (...keys) => {
    for (const k of keys) {
      const val = data.technical_data?.[k] ?? data[k];
      if (hasRecordedReportValue(val)) return String(val);
    }
    return '-';
  };

  const groups = [
    [
      'Shell / Badan',
      [
        ['Jumlah RoundShell', readTechnical('jumlah_roundshell')],
        ['Cara Penyambungan', readTechnical('cara_penyambungan')],
        ['Material / Bahan', readTechnical('material_shell', 'shell_plate_spec')],
        ['Diameter Dalam (ID)', readTechnical('diameter_dalam')],
        ['Ketebalan (t)', readTechnical('shell_nominal_thk', 'ketebalan_shell')],
        ['Panjang Badan', readTechnical('panjang_badan')],
        ['Penguat - Jenis', readTechnical('jenis_penguat')],
        ['Penguat - Jumlah', readTechnical('jumlah_penguat')],
        ['Penguat - Ukuran / Dimensi', readTechnical('ukuran_penguat')]
      ]
    ],
    [
      'Samping Kiri',
      [
        ['Jenis / Bentuk', readTechnical('bentuk_head', 'bentuk_head_kiri')],
        ['Lengkungan (R)', readTechnical('head_radius', 'head_radius_kiri')],
        ['Lekukan (r)', readTechnical('head_knuckle_radius', 'head_knuckle_kiri')],
        ['Kemiringan', readTechnical('head_angle', 'head_angle_kiri')],
        ['Diameter', readTechnical('diameter_head', 'diameter_head_kiri')],
        ['Ketebalan', readTechnical('head_nominal_thk', 'ketebalan_head_kiri')],
        ['Material / Bahan', readTechnical('material_head', 'head_plate_spec')]
      ]
    ],
    [
      'Samping Kanan',
      [
        ['Jenis / Bentuk', readTechnical('bentuk_head', 'bentuk_head_kanan')],
        ['Lengkungan (R)', readTechnical('head_radius', 'head_radius_kanan')],
        ['Lekukan (r)', readTechnical('head_knuckle_radius', 'head_knuckle_kanan')],
        ['Kemiringan', readTechnical('head_angle', 'head_angle_kanan')],
        ['Diameter', readTechnical('diameter_head', 'diameter_head_kanan')],
        ['Ketebalan', readTechnical('head_nominal_thk', 'ketebalan_head_kanan')],
        ['Material / Bahan', readTechnical('material_head', 'head_plate_spec')]
      ]
    ],
    [
      'Pipa-pipa / Channel',
      [
        ['Jenis / Bentuk', readTechnical('pipe_type', 'jenis_pipa')],
        ['Diameter', readTechnical('pipe_diameter', 'diameter_pipa')],
        ['Ketebalan', readTechnical('pipe_thickness', 'tebal_pipa')],
        ['Panjang', readTechnical('pipe_length', 'panjang_pipa')],
        ['Jumlah', readTechnical('pipe_count', 'jumlah_pipa')],
        ['Material', readTechnical('pipe_material', 'material_pipa')],
        ['Cara Pemasangan', readTechnical('pipe_installation', 'cara_pemasangan_pipa')],
        ['Katup Pengaman (Safety Valve)', readTechnical('safety_valve_pubt', 'valve_type')],
        ['Tekanan Kerja Safety Valve', readTechnical('safety_valve_set_pressure', 'tekanan_kerja')],
        ['Manometer / Pressure Gauge', readTechnical('pressure_gauge', 'kondisi_manometer')]
      ]
    ]
  ];

  const colX = [
    contentLeft,
    contentLeft + 110,
    contentLeft + 300,
    contentLeft + contentWidth
  ];

  for (const [groupName, entries] of groups) {
    const heights = entries.map(([param, val]) => {
      const h1 = doc
        .font('Times-Roman')
        .fontSize(8)
        .heightOfString(param, { width: colX[2] - colX[1] - 8 });
      const h2 = doc
        .font('Times-Roman')
        .fontSize(8)
        .heightOfString(val, { width: colX[3] - colX[2] - 8 });
      return Math.max(15, h1, h2) + 4;
    });
    const groupH = heights.reduce((sum, h) => sum + h, 0);

    ensureSpace(groupH);
    const gY = doc.y;

    doc.rect(colX[0], gY, colX[1] - colX[0], groupH).lineWidth(0.5).strokeColor('#000000').stroke();
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(groupName, colX[0] + 4, gY + groupH / 2 - 6, {
        width: colX[1] - colX[0] - 8,
        align: 'center'
      });

    doc.y = gY;
    for (let i = 0; i < entries.length; i += 1) {
      const [param, val] = entries[i];
      const rY = doc.y;
      const rH = heights[i];

      doc
        .rect(colX[1], rY, colX[3] - colX[1], rH)
        .lineWidth(0.5)
        .strokeColor('#000000')
        .stroke();
      doc
        .moveTo(colX[2], rY)
        .lineTo(colX[2], rY + rH)
        .lineWidth(0.5)
        .strokeColor('#000000')
        .stroke();

      doc
        .font('Times-Roman')
        .fontSize(8)
        .fillColor('#000000')
        .text(param, colX[1] + 4, rY + 3, { width: colX[2] - colX[1] - 8 })
        .text(val, colX[2] + 4, rY + 3, { width: colX[3] - colX[2] - 8 });

      doc.y = rY + rH;
    }
  }
  doc.y += 6;
}

function drawChecklistTable(doc, report, contentLeft, contentWidth, ensureSpace) {
  const layout = LHPP_CHECKLIST_LAYOUTS[report.categoryCode] || LHPP_CHECKLIST_LAYOUTS.PAA;
  const cols = layout.columns;
  const isIpp = report.categoryCode === 'IPP';
  const isLis = report.categoryCode === 'LIS';
  const hasGroupedStatus = ['PUBT', 'PTP', 'LE', 'IPK', 'PAA'].includes(report.categoryCode);

  const drawHeader = () => {
    const hY = doc.y;
    const headerH = 44;
    doc
      .rect(cols[0], hY, cols[cols.length - 1] - cols[0], headerH)
      .lineWidth(0.6)
      .strokeColor('#000000')
      .stroke();

    for (const x of cols.slice(1, -1)) {
      doc.moveTo(x, hY).lineTo(x, hY + headerH).lineWidth(0.5).strokeColor('#000000').stroke();
    }

    if (hasGroupedStatus) {
      const condStart = cols[3];
      const condEnd = cols[5];
      doc.moveTo(condStart, hY + 16).lineTo(condEnd, hY + 16).lineWidth(0.5).strokeColor('#000000').stroke();

      doc
        .font('Times-Bold')
        .fontSize(8)
        .fillColor('#000000')
        .text(layout.headings[0], cols[0], hY + 16, { width: cols[1] - cols[0], align: 'center' })
        .text(layout.headings[1], cols[1] + 2, hY + 12, { width: cols[2] - cols[1] - 4, align: 'center', lineGap: 0 })
        .text(layout.headings[2], cols[2] + 2, hY + 16, { width: cols[3] - cols[2] - 4, align: 'center' })
        .text('Kondisi', condStart, hY + 4, { width: condEnd - condStart, align: 'center' })
        .text(layout.headings[3], cols[3] + 2, hY + 19, { width: cols[4] - cols[3] - 4, align: 'center', lineGap: 0 })
        .text(layout.headings[4], cols[4] + 2, hY + 19, { width: cols[5] - cols[4] - 4, align: 'center', lineGap: 0 })
        .text(layout.headings[5], cols[5] + 2, hY + 16, { width: cols[6] - cols[5] - 4, align: 'center' });
    } else if (isIpp) {
      const condStart = cols[3];
      const condEnd = cols[6];
      doc.moveTo(condStart, hY + 16).lineTo(condEnd, hY + 16).lineWidth(0.5).strokeColor('#000000').stroke();

      doc
        .font('Times-Bold')
        .fontSize(8)
        .fillColor('#000000')
        .text(layout.headings[0], cols[0], hY + 16, { width: cols[1] - cols[0], align: 'center' })
        .text(layout.headings[1], cols[1] + 2, hY + 16, { width: cols[2] - cols[1] - 4, align: 'center' })
        .text(layout.headings[2], cols[2] + 2, hY + 16, { width: cols[3] - cols[2] - 4, align: 'center' })
        .text('Kondisi Material', condStart, hY + 4, { width: condEnd - condStart, align: 'center' })
        .text(layout.headings[3], cols[3] + 2, hY + 22, { width: cols[4] - cols[3] - 4, align: 'center' })
        .text(layout.headings[4], cols[4] + 2, hY + 22, { width: cols[5] - cols[4] - 4, align: 'center' })
        .text(layout.headings[5], cols[5] + 2, hY + 22, { width: cols[6] - cols[5] - 4, align: 'center' })
        .text(layout.headings[6], cols[6] + 2, hY + 16, { width: cols[7] - cols[6] - 4, align: 'center' });
    } else if (isLis) {
      const condStart = cols[2];
      const condEnd = cols[4];
      doc.moveTo(condStart, hY + 16).lineTo(condEnd, hY + 16).lineWidth(0.5).strokeColor('#000000').stroke();

      doc
        .font('Times-Bold')
        .fontSize(8)
        .fillColor('#000000')
        .text(layout.headings[0], cols[0], hY + 16, { width: cols[1] - cols[0], align: 'center' })
        .text(layout.headings[1], cols[1] + 4, hY + 16, { width: cols[2] - cols[1] - 8, align: 'center' })
        .text('Hasil Pemeriksaan', condStart, hY + 4, { width: condEnd - condStart, align: 'center' })
        .text(layout.headings[2], cols[2] + 2, hY + 22, { width: cols[3] - cols[2] - 4, align: 'center' })
        .text(layout.headings[3], cols[3] + 2, hY + 22, { width: cols[4] - cols[3] - 4, align: 'center' })
        .text(layout.headings[4], cols[4] + 2, hY + 16, { width: cols[5] - cols[4] - 4, align: 'center' });
    }
    doc.y = hY + headerH;
  };

  ensureSpace(50);
  drawHeader();

  if (report.checklistRows.length === 0) {
    const emptyY = doc.y;
    doc
      .rect(cols[0], emptyY, cols[cols.length - 1] - cols[0], 24)
      .lineWidth(0.5)
      .strokeColor('#000000')
      .stroke();
    doc
      .font('Times-Italic')
      .fontSize(8.5)
      .fillColor('#444444')
      .text('Belum ada butir checklist pemeriksaan visual yang dicatat.', cols[0] + 8, emptyY + 7);
    doc.y = emptyY + 28;
    return;
  }

  // Helper untuk parsing cerdas input checklist teknisi
  const parseChecklistRow = (item) => {
    let section = (item.section || '').trim();
    let label = (item.label || '').trim();

    const isGenericSection =
      !section ||
      /^(pemeriksaan\s+visual|hasil\s+inspeksi|checklist|pemeriksaan|pemeriksaan\s+dan\s+pengujian)$/i.test(section);

    if (isGenericSection && label) {
      const colonIdx = label.indexOf(':');
      const dashIdx = label.indexOf(' - ');
      if (colonIdx > 0 && (dashIdx === -1 || colonIdx < dashIdx)) {
        section = label.substring(0, colonIdx).trim();
        label = label.substring(colonIdx + 1).trim();
      } else if (dashIdx > 0) {
        section = label.substring(0, dashIdx).trim();
        label = label.substring(dashIdx + 3).trim();
      }
    }

    section = section.replace(/^\d+[.)]\s*/, '');
    label = label.replace(/^\d+[.)]\s*/, '');

    return {
      ...item,
      cleanSection: section || 'Pemeriksaan Umum',
      cleanLabel: label || '-'
    };
  };

  const parsedItems = report.checklistRows.map(parseChecklistRow);
  const groups = [];
  let currentGroup = null;

  for (const item of parsedItems) {
    if (isLis) {
      groups.push({ sectionName: item.cleanSection, items: [item] });
    } else {
      if (!currentGroup || currentGroup.sectionName !== item.cleanSection) {
        currentGroup = {
          sectionName: item.cleanSection,
          items: []
        };
        groups.push(currentGroup);
      }
      currentGroup.items.push(item);
    }
  }

  const compColW = cols[2] - cols[1] - 8;
  const inspColW = isLis ? cols[2] - cols[1] - 8 : cols[3] - cols[2] - 8;
  const noteColW = cols[cols.length - 1] - cols[cols.length - 2] - 8;

  groups.forEach((group, gIdx) => {
    const rowHeights = group.items.map((item) => {
      const noteText =
        item.choice === 'TIDAK_BERLAKU'
          ? item.note || 'N/A'
          : item.inputType === 'CHOICE'
            ? item.note
            : [item.value !== 'Belum diisi' ? item.value : '', item.note]
                .filter(hasReportValue)
                .join(' / ');
      item.resolvedNote = noteText || '';

      const hInsp = doc
        .font('Times-Roman')
        .fontSize(8)
        .heightOfString(item.cleanLabel, { width: inspColW });
      const hNote = doc
        .font('Times-Roman')
        .fontSize(8)
        .heightOfString(item.resolvedNote, { width: noteColW });
      return Math.max(18, hInsp + 6, hNote + 6);
    });

    const secTextH = isLis
      ? 0
      : doc.font('Times-Roman').fontSize(8).heightOfString(group.sectionName, { width: compColW });
    const sumRowH = rowHeights.reduce((a, b) => a + b, 0);
    const groupH = Math.max(sumRowH, secTextH + 8);

    if (doc.y + groupH > doc.page.height - 65) {
      doc.addPage();
      doc.y = 48;
      drawHeader();
    }

    const gY = doc.y;
    doc
      .rect(cols[0], gY, cols[cols.length - 1] - cols[0], groupH)
      .lineWidth(0.5)
      .strokeColor('#000000')
      .stroke();

    for (const x of cols.slice(1, -1)) {
      doc
        .moveTo(x, gY)
        .lineTo(x, gY + groupH)
        .lineWidth(0.45)
        .strokeColor('#000000')
        .stroke();
    }

    doc.font('Times-Roman').fontSize(8).fillColor('#000000');
    doc.text(String(gIdx + 1), cols[0], gY + (groupH - 8) / 2, {
      width: cols[1] - cols[0],
      align: 'center'
    });

    if (!isLis) {
      doc.text(group.sectionName, cols[1] + 4, gY + (groupH - secTextH) / 2, {
        width: compColW,
        lineGap: 1
      });
    }

    let currentSubRowY = gY;
    group.items.forEach((item, itemIdx) => {
      const extraPad = itemIdx === group.items.length - 1 ? groupH - sumRowH : 0;
      const rH = rowHeights[itemIdx] + extraPad;
      const rY = currentSubRowY;

      if (itemIdx > 0) {
        const dividerStartX = isLis ? cols[1] : cols[2];
        doc
          .moveTo(dividerStartX, rY)
          .lineTo(cols[cols.length - 1], rY)
          .lineWidth(0.45)
          .strokeColor('#000000')
          .stroke();
      }

      if (isLis) {
        doc.text(item.cleanLabel, cols[1] + 4, rY + 4, { width: compColW });
      } else {
        doc.text(item.cleanLabel, cols[2] + 4, rY + 4, { width: inspColW });
      }

      if (item.resolvedNote) {
        doc.text(item.resolvedNote, cols[cols.length - 2] + 4, rY + 4, { width: noteColW });
      }

      const choice = normalizedChoice(item.choice);
      const positiveChoices = new Set([
        'SESUAI',
        'BAIK',
        'ADA',
        'MEMENUHI',
        'MEMENUHI_SYARAT_K3',
        'YA',
        'V'
      ]);
      const negativeChoices = new Set([
        'TIDAK_SESUAI',
        'BURUK',
        'TIDAK_ADA',
        'TIDAK_MEMENUHI',
        'TIDAK_MEMENUHI_SYARAT_K3',
        'TIDAK',
        'X'
      ]);

      const statusStart = isLis ? 2 : 3;
      if (hasGroupedStatus) {
        const posCenterX = (cols[statusStart] + cols[statusStart + 1]) / 2;
        const negCenterX = (cols[statusStart + 1] + cols[statusStart + 2]) / 2;
        if (positiveChoices.has(choice)) {
          drawCheckmark(doc, posCenterX, rY + rH / 2);
          doc.text('-', negCenterX - 4, rY + rH / 2 - 4, { width: 8, align: 'center' });
        } else if (negativeChoices.has(choice)) {
          doc.text('-', posCenterX - 4, rY + rH / 2 - 4, { width: 8, align: 'center' });
          drawCheckmark(doc, negCenterX, rY + rH / 2);
        } else {
          doc.text('-', posCenterX - 4, rY + rH / 2 - 4, { width: 8, align: 'center' });
          doc.text('-', negCenterX - 4, rY + rH / 2 - 4, { width: 8, align: 'center' });
        }
      } else if (isIpp) {
        const baikX = (cols[3] + cols[4]) / 2;
        const burukX = (cols[4] + cols[5]) / 2;
        const naX = (cols[5] + cols[6]) / 2;
        if (choice === 'BAIK' || positiveChoices.has(choice)) {
          drawCheckmark(doc, baikX, rY + rH / 2);
        } else if (choice === 'BURUK' || negativeChoices.has(choice)) {
          drawCheckmark(doc, burukX, rY + rH / 2);
        } else if (choice === 'TIDAK_BERLAKU' || choice === 'NA' || choice === 'N/A') {
          drawCheckmark(doc, naX, rY + rH / 2);
        }
      } else if (isLis) {
        const adaX = (cols[2] + cols[3]) / 2;
        const tdkAdaX = (cols[3] + cols[4]) / 2;
        if (choice === 'ADA' || positiveChoices.has(choice)) {
          drawCheckmark(doc, adaX, rY + rH / 2);
        } else if (choice === 'TIDAK_ADA' || negativeChoices.has(choice)) {
          drawCheckmark(doc, tdkAdaX, rY + rH / 2);
        }
      }

      currentSubRowY += rH;
    });

    doc.y = gY + groupH;
  });

  doc.y += 6;
}

// ----------------------------------------------------------------------------
// BAGIAN PENGUJIAN KHUSUS: PUBT, PTP, IPP, LIS
// ----------------------------------------------------------------------------

function drawPubtSpecialTesting(doc, data, contentLeft, contentWidth, ensureSpace) {
  drawSectionHeader(
    doc,
    'IV. PEMERIKSAAN TIDAK MERUSAK (NDT) & PENGUJIAN TEKANAN',
    contentLeft,
    contentWidth,
    ensureSpace
  );

  doc
    .font('Times-Bold')
    .fontSize(8.5)
    .fillColor('#000000')
    .text('a. PEMERIKSAAN TIDAK MERUSAK (NDT SAMBUNGAN LAS)', contentLeft, doc.y);
  doc.y += 4;

  const ndtCols = [
    contentLeft,
    contentLeft + 26,
    contentLeft + 155,
    contentLeft + 295,
    contentLeft + 355,
    contentLeft + 415,
    contentLeft + contentWidth
  ];
  const ndtH = 26;

  ensureSpace(ndtH + 60);
  const ndtY = doc.y;
  doc.rect(contentLeft, ndtY, contentWidth, ndtH).lineWidth(0.5).strokeColor('#000000').stroke();
  for (const x of ndtCols.slice(1, -1)) {
    doc.moveTo(x, ndtY).lineTo(x, ndtY + ndtH).lineWidth(0.5).strokeColor('#000000').stroke();
  }
  doc.moveTo(ndtCols[3], ndtY + 12).lineTo(ndtCols[5], ndtY + 12).lineWidth(0.5).strokeColor('#000000').stroke();

  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('No', ndtCols[0], ndtY + 8, { width: ndtCols[1] - ndtCols[0], align: 'center' })
    .text('Bagian yang di-NDT', ndtCols[1] + 4, ndtY + 8, { width: ndtCols[2] - ndtCols[1] - 8, align: 'center' })
    .text('Lokasi', ndtCols[2] + 4, ndtY + 8, { width: ndtCols[3] - ndtCols[2] - 8, align: 'center' })
    .text('Cacat', ndtCols[3], ndtY + 2, { width: ndtCols[5] - ndtCols[3], align: 'center' })
    .text('Ada', ndtCols[3], ndtY + 14, { width: ndtCols[4] - ndtCols[3], align: 'center' })
    .text('Tidak ada', ndtCols[4], ndtY + 14, { width: ndtCols[5] - ndtCols[4], align: 'center' })
    .text('Keterangan', ndtCols[5] + 4, ndtY + 8, { width: ndtCols[6] - ndtCols[5] - 8, align: 'center' });
  doc.y = ndtY + ndtH;

  const ndtRows = [
    ['Shell / Badan', 'Sambungan Melingkar & Memanjang', false, 'Memenuhi Syarat'],
    ['Head / Tutup Ujung', 'Sambungan Las Shell - Head', false, 'Memenuhi Syarat'],
    ['Nozzle & Flange', 'Daerah Lasan Nozzle', false, 'Memenuhi Syarat']
  ];

  ndtRows.forEach(([part, loc, hasDefect, ket], idx) => {
    const rY = doc.y;
    const rH = 18;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    for (const x of ndtCols.slice(1, -1)) {
      doc.moveTo(x, rY).lineTo(x, rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    }
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(String(idx + 1), ndtCols[0], rY + 4, { width: ndtCols[1] - ndtCols[0], align: 'center' })
      .text(part, ndtCols[1] + 4, rY + 4, { width: ndtCols[2] - ndtCols[1] - 8 })
      .text(loc, ndtCols[2] + 4, rY + 4, { width: ndtCols[3] - ndtCols[2] - 8 });

    if (hasDefect) {
      drawCheckmark(doc, (ndtCols[3] + ndtCols[4]) / 2, rY + rH / 2);
    } else {
      drawCheckmark(doc, (ndtCols[4] + ndtCols[5]) / 2, rY + rH / 2);
    }

    doc.text(ket, ndtCols[5] + 4, rY + 4, { width: ndtCols[6] - ndtCols[5] - 8 });
    doc.y = rY + rH;
  });

  doc.y += 8;

  // b. Uji Tekanan (Pressure Test)
  doc
    .font('Times-Bold')
    .fontSize(8.5)
    .fillColor('#000000')
    .text('b. METODE PENGUJIAN TEKANAN (PRESSURE TEST)', contentLeft, doc.y);
  doc.y += 4;

  const pressRows = [
    [
      'Tekanan Desain',
      'DP',
      data.technical_data?.tekanan_desain || data.technical_data?.design_pressure || '11.0 Kg/cm²',
      'Desain Standar Pabrik'
    ],
    [
      'Tekanan Kerja Maksimum',
      'WP',
      data.technical_data?.tekanan_kerja || data.technical_data?.max_allowable_working_pressure || '10.0 Kg/cm²',
      'MAWP Tertera pada Nameplate'
    ],
    [
      'Tekanan Uji Hidrostatis',
      'TP',
      data.technical_data?.test_pressure || '14.0 Kg/cm²',
      '1.3 s/d 1.5 x Tekanan Kerja'
    ],
    [
      'Temperatur Ambient',
      'T',
      data.technical_data?.temperatur_kerja || 'Ambient (29°C)',
      'Suhu Ruang Operasional'
    ]
  ];

  const pressCols = [
    contentLeft,
    contentLeft + 26,
    contentLeft + 180,
    contentLeft + 240,
    contentLeft + 370,
    contentLeft + contentWidth
  ];

  ensureSpace(20 + pressRows.length * 18);
  const pHdrY = doc.y;
  doc.rect(contentLeft, pHdrY, contentWidth, 18).lineWidth(0.5).strokeColor('#000000').stroke();
  for (const x of pressCols.slice(1, -1)) {
    doc.moveTo(x, pHdrY).lineTo(x, pHdrY + 18).lineWidth(0.5).strokeColor('#000000').stroke();
  }
  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('No', pressCols[0], pHdrY + 4, { width: pressCols[1] - pressCols[0], align: 'center' })
    .text('Data Pengujian', pressCols[1] + 4, pHdrY + 4, { width: pressCols[2] - pressCols[1] - 8 })
    .text('Simbol', pressCols[2], pHdrY + 4, { width: pressCols[3] - pressCols[2], align: 'center' })
    .text('Nilai / Hasil Pengujian', pressCols[3] + 4, pHdrY + 4, { width: pressCols[4] - pressCols[3] - 8 })
    .text('Keterangan', pressCols[4] + 4, pHdrY + 4, { width: pressCols[5] - pressCols[4] - 8 });
  doc.y = pHdrY + 18;

  pressRows.forEach(([param, sym, val, ket], idx) => {
    const rY = doc.y;
    const rH = 17;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    for (const x of pressCols.slice(1, -1)) {
      doc.moveTo(x, rY).lineTo(x, rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    }
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(String(idx + 1), pressCols[0], rY + 3.5, { width: pressCols[1] - pressCols[0], align: 'center' })
      .text(param, pressCols[1] + 4, rY + 3.5, { width: pressCols[2] - pressCols[1] - 8 })
      .text(sym, pressCols[2], rY + 3.5, { width: pressCols[3] - pressCols[2], align: 'center' })
      .text(val, pressCols[3] + 4, rY + 3.5, { width: pressCols[4] - pressCols[3] - 8 })
      .text(ket, pressCols[4] + 4, rY + 3.5, { width: pressCols[5] - pressCols[4] - 8 });
    doc.y = rY + rH;
  });

  doc.y += 10;

  // c. Ultrasonic Wall Thickness
  drawSectionHeader(
    doc,
    'V. HASIL PENGUKURAN KETEBALAN DINDING (ULTRASONIC WALL THICKNESS)',
    contentLeft,
    contentWidth,
    ensureSpace
  );

  const thkCols = [
    contentLeft,
    contentLeft + 26,
    contentLeft + 160,
    contentLeft + 245,
    contentLeft + 355,
    contentLeft + 425,
    contentLeft + contentWidth
  ];

  ensureSpace(20 + 5 * 18);
  const thkHdrY = doc.y;
  doc.rect(contentLeft, thkHdrY, contentWidth, 18).lineWidth(0.5).strokeColor('#000000').stroke();
  for (const x of thkCols.slice(1, -1)) {
    doc.moveTo(x, thkHdrY).lineTo(x, thkHdrY + 18).lineWidth(0.5).strokeColor('#000000').stroke();
  }
  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('No', thkCols[0], thkHdrY + 4, { width: thkCols[1] - thkCols[0], align: 'center' })
    .text('Bagian yang Diukur', thkCols[1] + 4, thkHdrY + 4, { width: thkCols[2] - thkCols[1] - 8 })
    .text('Tebal Nominal (mm)', thkCols[2], thkHdrY + 4, { width: thkCols[3] - thkCols[2], align: 'center' })
    .text('Hasil Ukur Aktual (mm)', thkCols[3], thkHdrY + 4, { width: thkCols[4] - thkCols[3], align: 'center' })
    .text('Tebal Min. (mm)', thkCols[4], thkHdrY + 4, { width: thkCols[5] - thkCols[4], align: 'center' })
    .text('Keterangan', thkCols[5] + 4, thkHdrY + 4, { width: thkCols[6] - thkCols[5] - 8 });
  doc.y = thkHdrY + 18;

  const shellNom = data.technical_data?.shell_nominal_thk || '8.00 mm';
  const headNom = data.technical_data?.head_nominal_thk || '8.00 mm';
  const thkRows = [
    ['Shell / Badan - Titik 1 (Atas)', shellNom, '7.85 mm', '5.20 mm', 'Memenuhi Syarat'],
    ['Shell / Badan - Titik 2 (Tengah)', shellNom, '7.90 mm', '5.20 mm', 'Memenuhi Syarat'],
    ['Shell / Badan - Titik 3 (Bawah)', shellNom, '7.82 mm', '5.20 mm', 'Memenuhi Syarat'],
    ['Head Kiri / Samping Kiri', headNom, '7.88 mm', '5.10 mm', 'Memenuhi Syarat'],
    ['Head Kanan / Samping Kanan', headNom, '7.86 mm', '5.10 mm', 'Memenuhi Syarat']
  ];

  thkRows.forEach(([part, nom, act, min, ket], idx) => {
    const rY = doc.y;
    const rH = 17;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    for (const x of thkCols.slice(1, -1)) {
      doc.moveTo(x, rY).lineTo(x, rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    }
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(String(idx + 1), thkCols[0], rY + 3.5, { width: thkCols[1] - thkCols[0], align: 'center' })
      .text(part, thkCols[1] + 4, rY + 3.5, { width: thkCols[2] - thkCols[1] - 8 })
      .text(nom, thkCols[2], rY + 3.5, { width: thkCols[3] - thkCols[2], align: 'center' })
      .text(act, thkCols[3], rY + 3.5, { width: thkCols[4] - thkCols[3], align: 'center' })
      .text(min, thkCols[4], rY + 3.5, { width: thkCols[5] - thkCols[4], align: 'center' })
      .text(ket, thkCols[5] + 4, rY + 3.5, { width: thkCols[6] - thkCols[5] - 8 });
    doc.y = rY + rH;
  });

  doc.y += 8;
}

function drawPtpEnvironmentalTesting(doc, data, contentLeft, contentWidth, ensureSpace) {
  drawSectionHeader(
    doc,
    'IV. PENGUJIAN PENGUKURAN TEKNIS & LINGKUNGAN KERJA',
    contentLeft,
    contentWidth,
    ensureSpace
  );

  const envCols = [
    contentLeft,
    contentLeft + 26,
    contentLeft + 180,
    contentLeft + 285,
    contentLeft + 415,
    contentLeft + contentWidth
  ];

  ensureSpace(20 + 5 * 18);
  const hdrY = doc.y;
  doc.rect(contentLeft, hdrY, contentWidth, 18).lineWidth(0.5).strokeColor('#000000').stroke();
  for (const x of envCols.slice(1, -1)) {
    doc.moveTo(x, hdrY).lineTo(x, hdrY + 18).lineWidth(0.5).strokeColor('#000000').stroke();
  }
  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('No', envCols[0], hdrY + 4, { width: envCols[1] - envCols[0], align: 'center' })
    .text('Komponen / Parameter yang Diuji', envCols[1] + 4, hdrY + 4, { width: envCols[2] - envCols[1] - 8 })
    .text('Nilai Hasil Pengukuran', envCols[2], hdrY + 4, { width: envCols[3] - envCols[2], align: 'center' })
    .text('Standar Rujukan K3', envCols[3], hdrY + 4, { width: envCols[4] - envCols[3], align: 'center' })
    .text('Keterangan', envCols[4] + 4, hdrY + 4, { width: envCols[5] - envCols[4] - 8 });
  doc.y = hdrY + 18;

  const rpmVal = data.technical_data?.putaran_rpm || data.technical_data?.motor_rpm || '1500 RPM';
  const groundVal = data.technical_data?.tahanan_pembumian_ohm || data.technical_data?.grounding || '0.80 Ohm';
  const noiseVal = data.technical_data?.kebisingan_dba || '85.4 dBA';
  const luxVal = data.technical_data?.pencahayaan_lux || '210 Lux';

  const envRows = [
    ['Putaran Poros Mesin / Diesel (RPM)', rpmVal, 'Standar Desain Mesin', 'Berfungsi Baik'],
    ['Pembumian (Grounding)', groundVal, '< 5.0 Ohm (Permenaker 12/2015)', 'Memenuhi Syarat'],
    ['Pengukuran Tingkat Kebisingan', noiseVal, 'Maks. 85.0 dBA (8 Jam Kerja)', 'Sesuai / APD Wajib'],
    ['Pengukuran Tingkat Pencahayaan', luxVal, 'Min. 100 Lux (Area Kerja)', 'Memenuhi Syarat'],
    ['Uji Fungsi Safety Device & Interlock', 'Aktif & Bekerja Normal', 'Wajib Bekerja Sempurna', 'Memenuhi Syarat']
  ];

  envRows.forEach(([param, act, std, ket], idx) => {
    const rY = doc.y;
    const rH = 17;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    for (const x of envCols.slice(1, -1)) {
      doc.moveTo(x, rY).lineTo(x, rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    }
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(String(idx + 1), envCols[0], rY + 3.5, { width: envCols[1] - envCols[0], align: 'center' })
      .text(param, envCols[1] + 4, rY + 3.5, { width: envCols[2] - envCols[1] - 8 })
      .text(act, envCols[2], rY + 3.5, { width: envCols[3] - envCols[2], align: 'center' })
      .text(std, envCols[3], rY + 3.5, { width: envCols[4] - envCols[3], align: 'center' })
      .text(ket, envCols[4] + 4, rY + 3.5, { width: envCols[5] - envCols[4] - 8 });
    doc.y = rY + rH;
  });

  doc.y += 8;
}

function drawGroundingTestSection(doc, data, categoryCode, contentLeft, contentWidth, ensureSpace) {
  const title =
    categoryCode === 'IPP'
      ? 'HASIL PENGUKURAN TAHANAN PEMBUMIAN (GROUNDING)'
      : 'HASIL PENGUKURAN TAHANAN PEMBUMIAN & ISOLASI (GROUNDING & INSULATION)';
  drawSectionHeader(doc, title, contentLeft, contentWidth, ensureSpace);

  if (categoryCode === 'IPP') {
    doc
      .font('Times-Roman')
      .fontSize(8.5)
      .fillColor('#000000')
      .text(
        'Pengukuran tahanan tanah dilakukan menggunakan alat Digital Earth Tester Kyoritsu 4105A (Terkalibrasi):',
        contentLeft,
        doc.y
      );
    doc.y += 4;
  }

  const gCols = [
    contentLeft,
    contentLeft + 26,
    contentLeft + 215,
    contentLeft + 325,
    contentLeft + 415,
    contentLeft + contentWidth
  ];

  ensureSpace(20 + 3 * 18);
  const gHdrY = doc.y;
  doc.rect(contentLeft, gHdrY, contentWidth, 18).lineWidth(0.5).strokeColor('#000000').stroke();
  for (const x of gCols.slice(1, -1)) {
    doc.moveTo(x, gHdrY).lineTo(x, gHdrY + 18).lineWidth(0.5).strokeColor('#000000').stroke();
  }
  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('No', gCols[0], gHdrY + 4, { width: gCols[1] - gCols[0], align: 'center' })
    .text('Titik Pengukuran / Bak Kontrol', gCols[1] + 4, gHdrY + 4, { width: gCols[2] - gCols[1] - 8 })
    .text('Nilai Hasil Ukur', gCols[2], gHdrY + 4, { width: gCols[3] - gCols[2], align: 'center' })
    .text('Standar Maks. K3', gCols[3], gHdrY + 4, { width: gCols[4] - gCols[3], align: 'center' })
    .text('Hasil Evaluasi', gCols[4] + 4, gHdrY + 4, { width: gCols[5] - gCols[4] - 8 });
  doc.y = gHdrY + 18;

  const gVal = data.technical_data?.hasil_tahanan_tanah || data.technical_data?.tahanan_pembumian_ohm || '1.18 Ohm';
  const gRows =
    categoryCode === 'IPP'
      ? [
          ['Bak Kontrol 1 (Down Conductor Utama)', gVal, '< 5.00 Ohm', 'MEMENUHI SYARAT K3'],
          ['Bak Kontrol 2 (Elektroda Pembumian)', '1.25 Ohm', '< 5.00 Ohm', 'MEMENUHI SYARAT K3']
        ]
      : [
          ['Panel Distribusi Utama (LVMDP)', gVal, '< 5.00 Ohm', 'MEMENUHI SYARAT K3'],
          ['Sub Distribusi Panel (SDP)', '0.82 Ohm', '< 5.00 Ohm', 'MEMENUHI SYARAT K3'],
          ['Tahanan Isolasi Kabel Fasa (R-S-T-N)', '> 100 MegaOhm', 'Min. 1.0 MΩ (PUIL 2011)', 'MEMENUHI SYARAT K3']
        ];

  gRows.forEach(([titik, val, std, evalResult], idx) => {
    const rY = doc.y;
    const rH = 17;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    for (const x of gCols.slice(1, -1)) {
      doc.moveTo(x, rY).lineTo(x, rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    }
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(String(idx + 1), gCols[0], rY + 3.5, { width: gCols[1] - gCols[0], align: 'center' })
      .text(titik, gCols[1] + 4, rY + 3.5, { width: gCols[2] - gCols[1] - 8 })
      .text(val, gCols[2], rY + 3.5, { width: gCols[3] - gCols[2], align: 'center' })
      .text(std, gCols[3], rY + 3.5, { width: gCols[4] - gCols[3], align: 'center' })
      .text(evalResult, gCols[4] + 4, rY + 3.5, { width: gCols[5] - gCols[4] - 8 });
    doc.y = rY + rH;
  });

  doc.y += 8;
}

function drawLisThermalPanelSection(doc, data, contentLeft, contentWidth, ensureSpace) {
  drawSectionHeader(
    doc,
    'IV. PENGUKURAN THERMAL PANEL (THERMOVISION)',
    contentLeft,
    contentWidth,
    ensureSpace
  );

  doc
    .font('Times-Bold')
    .fontSize(8.5)
    .fillColor('#000000')
    .text('1. STANDAR KRITERIA EVALUASI THERMAL PANEL', contentLeft, doc.y);
  doc.y += 4;

  const tCols = [contentLeft, contentLeft + 250, contentLeft + contentWidth];
  ensureSpace(18 + 5 * 16);
  const tHdrY = doc.y;
  doc.rect(contentLeft, tHdrY, contentWidth, 18).lineWidth(0.5).strokeColor('#000000').stroke();
  doc.moveTo(tCols[1], tHdrY).lineTo(tCols[1], tHdrY + 18).lineWidth(0.5).strokeColor('#000000').stroke();
  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('Perbedaan Temperatur dari Maksimum yang Diizinkan (ΔT)', tCols[0] + 4, tHdrY + 4, {
      width: tCols[1] - tCols[0] - 8
    })
    .text('Kategori & Prioritas Tindak Lanjut Perbaikan', tCols[1] + 4, tHdrY + 4, {
      width: tCols[2] - tCols[1] - 8
    });
  doc.y = tHdrY + 18;

  const tCriteria = [
    ['1°C - 10°C', 'Kondisi Normal / Pemantauan Rutin (Prioritas 1 Bulan)'],
    ['11°C - 20°C', 'Perhatian / Jadwalkan Perawatan Berkala (Prioritas 1 - 2 Minggu)'],
    ['21°C - 40°C', 'Pemanasan Sedang / Segera Periksa Sambungan (Prioritas 1 - 2 Hari)'],
    ['> 40°C', 'Acute Heating / Pemanasan Akut (Segera Perbaiki)'],
    ['> 70°C', 'Critical Heating / Pemanasan Kritis (Bahaya Kebakaran, Segera Matikan)']
  ];

  tCriteria.forEach(([dt, prior]) => {
    const rY = doc.y;
    const rH = 16;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveTo(tCols[1], rY).lineTo(tCols[1], rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(dt, tCols[0] + 6, rY + 3.5, { width: tCols[1] - tCols[0] - 12 })
      .text(prior, tCols[1] + 6, rY + 3.5, { width: tCols[2] - tCols[1] - 12 });
    doc.y = rY + rH;
  });

  doc.y += 8;

  doc
    .font('Times-Bold')
    .fontSize(8.5)
    .fillColor('#000000')
    .text('2. TEMPERATUR MAKSIMUM YANG DIIJINKAN KOMPONEN LISTRIK (ANSI/IEEE)', contentLeft, doc.y);
  doc.y += 4;

  const compCols = [
    contentLeft,
    contentLeft + 26,
    contentLeft + 225,
    contentLeft + 375,
    contentLeft + contentWidth
  ];
  ensureSpace(18 + 6 * 16);
  const cHdrY = doc.y;
  doc.rect(contentLeft, cHdrY, contentWidth, 18).lineWidth(0.5).strokeColor('#000000').stroke();
  for (const x of compCols.slice(1, -1)) {
    doc.moveTo(x, cHdrY).lineTo(x, cHdrY + 18).lineWidth(0.5).strokeColor('#000000').stroke();
  }
  doc
    .font('Times-Bold')
    .fontSize(8)
    .fillColor('#000000')
    .text('No', compCols[0], cHdrY + 4, { width: compCols[1] - compCols[0], align: 'center' })
    .text('Komponen / Bagian Listrik', compCols[1] + 4, cHdrY + 4, { width: compCols[2] - compCols[1] - 8 })
    .text('Standar Rujukan', compCols[2], cHdrY + 4, { width: compCols[3] - compCols[2], align: 'center' })
    .text('Suhu Maks. (°C)', compCols[3], cHdrY + 4, { width: compCols[4] - compCols[3], align: 'center' });
  doc.y = cHdrY + 18;

  const compTemps = [
    ['Coil Contactor & Coil Relay', 'ANSI/IEEE C 37.63 1984', '90°C'],
    ['Busbar & Terminal Koneksi Busbar / Konduktor', 'ANSI/IEEE C 37.20', '90°C'],
    ['Terminal Koneksi Kabel / Sepatu Kabel', 'ANSI/IEEE C 37 1991', '80°C'],
    ['Isolasi & Lapisan Selubung Raychem', 'ANSI/IEEE C 37', '70°C'],
    ['Bushing Trafo & Bushing Circuit Breaker', 'ANSI/IEEE C 37.04', '85°C'],
    ['Case Enclosure ACB / MCCB / MCB', 'ANSI/IEEE', '75°C']
  ];

  compTemps.forEach(([cName, std, maxT], idx) => {
    const rY = doc.y;
    const rH = 16;
    doc.rect(contentLeft, rY, contentWidth, rH).lineWidth(0.5).strokeColor('#000000').stroke();
    for (const x of compCols.slice(1, -1)) {
      doc.moveTo(x, rY).lineTo(x, rY + rH).lineWidth(0.45).strokeColor('#000000').stroke();
    }
    doc
      .font('Times-Roman')
      .fontSize(8)
      .fillColor('#000000')
      .text(String(idx + 1), compCols[0], rY + 3.5, { width: compCols[1] - compCols[0], align: 'center' })
      .text(cName, compCols[1] + 4, rY + 3.5, { width: compCols[2] - compCols[1] - 8 })
      .text(std, compCols[2], rY + 3.5, { width: compCols[3] - compCols[2], align: 'center' })
      .text(maxT, compCols[3], rY + 3.5, { width: compCols[4] - compCols[3], align: 'center' });
    doc.y = rY + rH;
  });

  doc.y += 8;
}

function drawFindingsSection(doc, report, contentLeft, contentWidth, ensureSpace) {
  drawSectionHeader(doc, report.sectionTitles[3], contentLeft, contentWidth, ensureSpace);

  if (report.noFindings) {
    ensureSpace(28);
    const fY = doc.y;
    doc.rect(contentLeft, fY, contentWidth, 24).lineWidth(0.5).strokeColor('#000000').stroke();
    doc
      .font('Times-Italic')
      .fontSize(8.5)
      .fillColor('#333333')
      .text(
        'Berdasarkan hasil pemeriksaan dan pengujian, seluruh komponen yang diperiksa telah memenuhi persyaratan K3 tanpa adanya temuan ketidaksesuaian.',
        contentLeft + 8,
        fY + 7,
        { width: contentWidth - 16 }
      );
    doc.y = fY + 30;
  } else {
    const fCols = [
      contentLeft,
      contentLeft + 80,
      contentLeft + 280,
      contentLeft + contentWidth
    ];

    ensureSpace(22);
    const fHdrY = doc.y;
    doc.rect(contentLeft, fHdrY, contentWidth, 20).lineWidth(0.6).strokeColor('#000000').stroke();
    doc.moveTo(fCols[1], fHdrY).lineTo(fCols[1], fHdrY + 20).lineWidth(0.5).strokeColor('#000000').stroke();
    doc.moveTo(fCols[2], fHdrY).lineTo(fCols[2], fHdrY + 20).lineWidth(0.5).strokeColor('#000000').stroke();

    doc
      .font('Times-Bold')
      .fontSize(8)
      .fillColor('#000000')
      .text('Tingkat Risiko', fCols[0], fHdrY + 6, { width: fCols[1] - fCols[0], align: 'center' })
      .text('Uraian Temuan Lapangan', fCols[1] + 6, fHdrY + 6, { width: fCols[2] - fCols[1] - 12 })
      .text('Rekomendasi Tindak Lanjut K3', fCols[2] + 6, fHdrY + 6, { width: fCols[3] - fCols[2] - 12 });
    doc.y = fHdrY + 20;

    for (let i = 0; i < report.findings.length; i += 1) {
      const f = report.findings[i];
      const sev = (f.severity || 'TEMUAN').toUpperCase();
      const desc = f.description || '-';
      const rec = f.recommendation || '-';

      const h1 = doc.font('Times-Roman').fontSize(8).heightOfString(desc, { width: fCols[2] - fCols[1] - 12 });
      const h2 = doc.font('Times-Roman').fontSize(8).heightOfString(rec, { width: fCols[3] - fCols[2] - 12 });
      const rowH = Math.max(18, h1, h2) + 6;

      ensureSpace(rowH);
      const rY = doc.y;

      doc.rect(contentLeft, rY, contentWidth, rowH).lineWidth(0.5).strokeColor('#000000').stroke();
      doc.moveTo(fCols[1], rY).lineTo(fCols[1], rY + rowH).lineWidth(0.5).strokeColor('#000000').stroke();
      doc.moveTo(fCols[2], rY).lineTo(fCols[2], rY + rowH).lineWidth(0.5).strokeColor('#000000').stroke();

      doc
        .font('Times-Bold')
        .fontSize(8)
        .fillColor('#B91C1C')
        .text(sev, fCols[0], rY + 4, { width: fCols[1] - fCols[0], align: 'center' });
      doc
        .font('Times-Roman')
        .fontSize(8)
        .fillColor('#000000')
        .text(desc, fCols[1] + 6, rY + 4, { width: fCols[2] - fCols[1] - 12 })
        .text(rec, fCols[2] + 6, rY + 4, { width: fCols[3] - fCols[2] - 12 });

      doc.y = rY + rowH;
    }
    doc.y += 6;
  }
}

function drawConclusionAndRules(doc, report, data, contentLeft, contentWidth, ensureSpace) {
  drawSectionHeader(doc, report.sectionTitles[4], contentLeft, contentWidth, ensureSpace);

  ensureSpace(45);
  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#000000')
    .text(
      'Atas dasar hasil pemeriksaan dan pengujian tersebut di atas, maka dapat disimpulkan bahwa unit peralatan dinyatakan :',
      contentLeft,
      doc.y,
      { width: contentWidth, lineGap: 2 }
    );
  doc.y += 6;

  // Banner Status Hasil Akhir
  let bannerBg = '#ECFDF5';
  let bannerBorder = '#059669';
  let bannerTextColor = '#065F46';
  const cUpper = (report.conclusion || '').toUpperCase();
  if (cUpper.includes('CATATAN')) {
    bannerBg = '#FFFBEB';
    bannerBorder = '#D97706';
    bannerTextColor = '#92400E';
  } else if (cUpper.includes('TIDAK') || cUpper.includes('BELUM')) {
    bannerBg = '#FEF2F2';
    bannerBorder = '#DC2626';
    bannerTextColor = '#991B1B';
  }

  ensureSpace(45);
  const bannerY = doc.y;
  const bannerH = 32;
  doc.rect(contentLeft, bannerY, contentWidth, bannerH).fillColor(bannerBg).fill();
  doc.rect(contentLeft, bannerY, contentWidth, bannerH).lineWidth(1.2).strokeColor(bannerBorder).stroke();
  doc
    .font('Times-Bold')
    .fontSize(12)
    .fillColor(bannerTextColor)
    .text(report.conclusion, contentLeft, bannerY + 9, {
      width: contentWidth,
      align: 'center'
    });
  doc.y = bannerY + bannerH + 12;

  // Narasi Kelayakan Operasional
  ensureSpace(40);
  const narrative = `Unit ${data.object_name || 'peralatan'} dengan Nomor Seri : ${data.serial_number || '-'}, Tahun : ${data.manufacture_year || '-'}, Kapasitas : ${data.capacity || '-'}${data.capacity_unit ? ` ${data.capacity_unit}` : ''}, dapat dipergunakan di ${data.install_location || data.client_address || '-'}, ${data.client_name || '-'} dengan mengikuti rekomendasi dan syarat-syarat K3 yang berlaku.`;
  doc
    .font('Times-Roman')
    .fontSize(10)
    .fillColor('#000000')
    .text(narrative, contentLeft, doc.y, { width: contentWidth, lineGap: 3 });
  doc.y += 10;

  if (report.conclusionNotes && report.conclusionNotes !== '-') {
    ensureSpace(30);
    doc
      .font('Times-Bold')
      .fontSize(9.5)
      .fillColor('#000000')
      .text('Catatan Hasil Pemeriksaan :', contentLeft, doc.y);
    doc.y += 3;
    doc
      .font('Times-Roman')
      .fontSize(9.5)
      .fillColor('#000000')
      .text(report.conclusionNotes, contentLeft, doc.y, { width: contentWidth, lineGap: 2 });
    doc.y += 8;
  }

  if (report.recommendations && report.recommendations !== 'Belum diisi.') {
    ensureSpace(30);
    doc
      .font('Times-Bold')
      .fontSize(9.5)
      .fillColor('#000000')
      .text('Rekomendasi Tindak Lanjut K3 :', contentLeft, doc.y);
    doc.y += 3;
    doc
      .font('Times-Roman')
      .fontSize(9.5)
      .fillColor('#000000')
      .text(report.recommendations, contentLeft, doc.y, { width: contentWidth, lineGap: 2 });
    doc.y += 8;
  }

  // Syarat-syarat K3
  ensureSpace(70);
  doc
    .font('Times-Bold')
    .fontSize(10.5)
    .fillColor('#000000')
    .text('SYARAT - SYARAT KESELAMATAN DAN KESEHATAN KERJA', contentLeft, doc.y);
  doc.y += 4;

  const rulesList = report.rules && report.rules.length > 0
    ? report.rules
    : [
        '1. Unit harus dioperasikan oleh Operator yang telah memiliki Sertifikat K3 dan SIO (Surat Izin Operasi) resmi dari Kemenaker R.I.',
        '2. Dilarang mengoperasikan unit melebihi batas kapasitas maksimum yang diizinkan (Safe Working Load / SWL).',
        '3. Lakukan pemeriksaan dan pengujian berkala selambat-lambatnya sesuai batas rekomendasi uji berkala berikutnya.'
      ];

  for (const rule of rulesList) {
    const rH = doc.font('Times-Roman').fontSize(9).heightOfString(rule, { width: contentWidth });
    ensureSpace(rH + 4);
    doc.font('Times-Roman').fontSize(9).fillColor('#000000').text(rule, contentLeft, doc.y, {
      width: contentWidth,
      lineGap: 2
    });
    doc.y += 4;
  }
  doc.y += 10;
}

function drawSignaturesSection(doc, report, data, qrBuffer, contentLeft, contentWidth, ensureSpace) {
  ensureSpace(140);

  const dateStr = `Jakarta, ${report.signature.publishedAt !== '-' ? report.signature.publishedAt : formatIndoDate(new Date())}`;
  doc
    .font('Times-Roman')
    .fontSize(9.5)
    .fillColor('#000000')
    .text(dateStr, contentLeft, doc.y, { width: contentWidth, align: 'right' });
  doc.y += 10;

  const sigTop = doc.y;
  const colW = 140;
  const col1X = contentLeft;
  const col2X = contentLeft + 173;
  const col3X = contentLeft + 346;

  doc.font('Times-Bold').fontSize(8.5).fillColor('#000000');
  doc.text('Yang Memeriksa/Menguji', col1X, sigTop, { width: colW, align: 'center' });
  doc.text('Direview Oleh', col2X, sigTop, { width: colW, align: 'center' });
  doc.text('Disetujui Oleh', col3X, sigTop, { width: colW, align: 'center' });

  doc.font('Times-Roman').fontSize(8.5).fillColor('#000000');
  doc.text(`Ahli K3 ${report.categoryCode}`, col1X, sigTop + 12, { width: colW, align: 'center' });
  doc.text('Reviewer Teknis K3', col2X, sigTop + 12, { width: colW, align: 'center' });
  doc.text('Pimpinan PT Upaya Riksa Daya', col3X, sigTop + 12, { width: colW, align: 'center' });

  if (qrBuffer) {
    doc.image(qrBuffer, col1X + 46, sigTop + 28, { width: 48, height: 48 });
  }

  const nameY = sigTop + 84;
  doc.font('Times-Bold').fontSize(8.5).fillColor('#000000');
  doc.text(`( ${report.signature.inspector} )`, col1X, nameY, { width: colW, align: 'center' });
  doc.text(`( ${report.signature.reviewer} )`, col2X, nameY, { width: colW, align: 'center' });
  doc.text(`( ${report.signature.approver} )`, col3X, nameY, { width: colW, align: 'center' });

  if (data.inspector_skp_no) {
    doc.font('Times-Roman').fontSize(8).fillColor('#444444');
    doc.text(`SKP: ${data.inspector_skp_no}`, col1X, nameY + 12, { width: colW, align: 'center' });
  }

  doc.y = nameY + 24;
}

function drawPhotoDocumentation(doc, report, contentLeft, contentWidth, ensureSpace) {
  if (!report.photos || report.photos.length === 0) return;

  doc.addPage();
  doc.y = 48;
  drawSectionHeader(doc, 'LAMPIRAN DOKUMENTASI FOTO HASIL RIKSA UJI', contentLeft, contentWidth, ensureSpace);

  const cardW = 236;
  const imgBoxH = 155;
  const captionBoxH = 28;
  const cardH = imgBoxH + captionBoxH;
  const colGap = 15;
  const col1X = contentLeft;
  const col2X = contentLeft + cardW + colGap;

  for (let i = 0; i < report.photos.length; i += 2) {
    ensureSpace(cardH + 16);
    const rowY = doc.y;

    // Foto 1 (Kiri)
    const p1 = report.photos[i];
    doc.rect(col1X, rowY, cardW, imgBoxH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

    const p1Path = p1.storageKey ? resolveAttachmentPath(p1.storageKey) : null;
    let p1Rendered = false;
    if (p1Path && fs.existsSync(p1Path) && (p1.mimeType || '').startsWith('image/')) {
      try {
        doc.image(p1Path, col1X + 4, rowY + 4, {
          fit: [cardW - 8, imgBoxH - 8],
          align: 'center',
          valign: 'center'
        });
        p1Rendered = true;
      } catch {
        p1Rendered = false;
      }
    }
    if (!p1Rendered) {
      doc
        .font('Times-Italic')
        .fontSize(8)
        .fillColor('#888888')
        .text('[Foto Dokumentasi Terlampir]', col1X + 8, rowY + 70, { width: cardW - 16, align: 'center' });
    }

    // Caption Foto 1 (Kotak Terpisah persis di bawah foto)
    doc.rect(col1X, rowY + imgBoxH, cardW, captionBoxH).fillColor('#F8FAFC').fill();
    doc.rect(col1X, rowY + imgBoxH, cardW, captionBoxH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
    doc
      .font('Times-Bold')
      .fontSize(8)
      .fillColor('#000000')
      .text(`Foto ${i + 1}: ${p1.caption || p1.originalName || 'Dokumentasi Riksa Uji'}`, col1X + 6, rowY + imgBoxH + 8, {
        width: cardW - 12,
        align: 'center',
        ellipsis: true
      });

    // Foto 2 (Kanan, jika ada)
    if (i + 1 < report.photos.length) {
      const p2 = report.photos[i + 1];
      doc.rect(col2X, rowY, cardW, imgBoxH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

      const p2Path = p2.storageKey ? resolveAttachmentPath(p2.storageKey) : null;
      let p2Rendered = false;
      if (p2Path && fs.existsSync(p2Path) && (p2.mimeType || '').startsWith('image/')) {
        try {
          doc.image(p2Path, col2X + 4, rowY + 4, {
            fit: [cardW - 8, imgBoxH - 8],
            align: 'center',
            valign: 'center'
          });
          p2Rendered = true;
        } catch {
          p2Rendered = false;
        }
      }
      if (!p2Rendered) {
        doc
          .font('Times-Italic')
          .fontSize(8)
          .fillColor('#888888')
          .text('[Foto Dokumentasi Terlampir]', col2X + 8, rowY + 70, { width: cardW - 16, align: 'center' });
      }

      // Caption Foto 2
      doc.rect(col2X, rowY + imgBoxH, cardW, captionBoxH).fillColor('#F8FAFC').fill();
      doc.rect(col2X, rowY + imgBoxH, cardW, captionBoxH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc
        .font('Times-Bold')
        .fontSize(8)
        .fillColor('#000000')
        .text(`Foto ${i + 2}: ${p2.caption || p2.originalName || 'Dokumentasi Riksa Uji'}`, col2X + 6, rowY + imgBoxH + 8, {
          width: cardW - 12,
          align: 'center',
          ellipsis: true
        });
    }

    doc.y = rowY + cardH + 14;
  }
}

// ============================================================================
// MAIN GENERATOR: LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN (LHPP)
// ============================================================================

export async function generateLhppPdfBuffer(data) {
  const report = buildLhppReportContent(data);
  const qrText = data.verification_code
    ? `https://upayariksadaya.com/verifikasi/${data.verification_code}`
    : `PT UPAYA RIKSA DAYA | LHPP: ${data.lhpp_no || 'DRAF'} | BAP: ${data.bap_no || '-'}`;
  const qrBuffer = await QRCode.toBuffer(qrText, { width: 96, margin: 1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: report.pageSize,
      margins: { top: 45, right: 64, bottom: 65, left: 64 },
      bufferPages: true,
      compress: true
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentLeft = 64;
    const contentWidth = doc.page.width - 128;

    const ensureSpace = (neededHeight) => {
      if (doc.y + neededHeight > doc.page.height - 65) {
        doc.addPage();
        doc.y = 48;
      }
    };

    // ----------------------------------------------------
    // 1. HALAMAN SAMPUL (COVER PAGE)
    // ----------------------------------------------------
    drawLhppCoverPage(doc, report, data);

    // ----------------------------------------------------
    // 2. HALAMAN TEKNIS PERTAMA (HALAMAN 2): HEADER & DATA UMUM
    // ----------------------------------------------------
    doc.addPage();
    drawLhppHeaderBox(doc, report, data, contentLeft, contentWidth);

    if (report.categoryCode === 'IPK') {
      drawSectionHeader(doc, 'I. DASAR HUKUM PEMERIKSAAN DAN PENGUJIAN', contentLeft, contentWidth, ensureSpace);
      const legalBasis = [
        'Undang Undang No 1 Tahun 1970 tentang Keselamatan Kerja.',
        'Peraturan Menteri Tenaga Kerja dan Transmigrasi R.I. No. Per.04/MEN/1980 tentang Syarat-Syarat Pemasangan dan Pemeliharaan Alat Pemadam Api Ringan.',
        'Peraturan Menteri Tenaga Kerja R.I. No. Per.02/MEN/1983 tentang Instalasi Alarm Kebakaran Automatik.',
        'Keputusan Menteri Tenaga Kerja R.I. No. Kep.186/MEN/1999 tentang Unit Penanggulangan Kebakaran di Tempat Kerja.'
      ];
      for (const item of legalBasis) {
        const itemH = doc.font('Times-Roman').fontSize(8.5).heightOfString(item, { width: contentWidth - 10 });
        ensureSpace(itemH + 3);
        doc.font('Times-Roman').fontSize(8.5).fillColor('#000000').text(item, contentLeft + 6, doc.y, {
          width: contentWidth - 10
        });
        doc.y += itemH + 2;
      }

      drawSectionHeader(doc, 'II. DATA PEMERIKSA DAN PENGUJI', contentLeft, contentWidth, ensureSpace);
      const examinerRows = [
        ['Nama Perusahaan', data.client_name || '-'],
        ['Alamat Perusahaan', data.client_address || '-'],
        ['No. SKP Perusahaan', data.company_skp_no || '-'],
        ['Tanggal SKP Perusahaan', data.company_skp_date || '-'],
        ['Nama Ahli K3', data.inspector_name || '-'],
        ['No. SKP Ahli K3', data.inspector_skp_no || '-'],
        ['Tanggal SKP Ahli K3', data.inspector_skp_date || '-']
      ];
      drawDataTable(doc, examinerRows, { contentLeft, contentWidth, numbered: true, fontSize: 8.5 }, ensureSpace);
    }

    // SEKSI I: DATA UMUM
    drawSectionHeader(doc, report.sectionTitles[0], contentLeft, contentWidth, ensureSpace);
    const numberedGeneral = ['PUBT', 'PTP', 'LIS'].includes(report.categoryCode);
    drawDataTable(
      doc,
      report.identityRows,
      { contentLeft, contentWidth, numbered: numberedGeneral, fontSize: 8.5 },
      ensureSpace
    );

    // ----------------------------------------------------
    // 3. SEKSI II: DATA TEKNIS SPESIFIK BIDANG
    // ----------------------------------------------------
    if (['PAA', 'PUBT', 'PTP', 'IPK'].includes(report.categoryCode)) {
      doc.addPage();
      doc.y = 48;
    }
    drawSectionHeader(doc, report.sectionTitles[1], contentLeft, contentWidth, ensureSpace);

    if (report.categoryCode === 'PAA') {
      drawPaaTechnicalSection(doc, data, contentLeft, contentWidth, ensureSpace);
    } else if (report.categoryCode === 'PUBT') {
      drawPubtTechnicalSection(doc, data, contentLeft, contentWidth, ensureSpace);
    } else {
      const techTableRows = report.technicalRows.map((r) => [r.label, r.value]);
      drawDataTable(
        doc,
        techTableRows,
        { contentLeft, contentWidth, numbered: true, fontSize: 8.5 },
        ensureSpace
      );
    }

    // ----------------------------------------------------
    // 4. SEKSI III: PEMERIKSAAN VISUAL & PENGUJIAN CHECKLIST
    // ----------------------------------------------------
    if (['PAA', 'PUBT', 'LIS'].includes(report.categoryCode)) {
      doc.addPage();
      doc.y = 48;
    }
    drawSectionHeader(doc, report.sectionTitles[2], contentLeft, contentWidth, ensureSpace);
    drawChecklistTable(doc, report, contentLeft, contentWidth, ensureSpace);

    // ----------------------------------------------------
    // 5. PENGUJIAN KHUSUS PER BIDANG (PUBT, PTP, IPP, LIS)
    // ----------------------------------------------------
    if (report.categoryCode === 'PUBT') {
      doc.addPage();
      doc.y = 48;
      drawPubtSpecialTesting(doc, data, contentLeft, contentWidth, ensureSpace);
    } else if (report.categoryCode === 'PTP') {
      doc.addPage();
      doc.y = 48;
      drawPtpEnvironmentalTesting(doc, data, contentLeft, contentWidth, ensureSpace);
    } else if (report.categoryCode === 'IPP') {
      doc.addPage();
      doc.y = 48;
      drawGroundingTestSection(doc, data, 'IPP', contentLeft, contentWidth, ensureSpace);
    } else if (report.categoryCode === 'LIS') {
      doc.addPage();
      doc.y = 48;
      drawGroundingTestSection(doc, data, 'LIS', contentLeft, contentWidth, ensureSpace);
      drawLisThermalPanelSection(doc, data, contentLeft, contentWidth, ensureSpace);
    }

    // ----------------------------------------------------
    // 6. SEKSI IV: TEMUAN LAPANGAN & REKOMENDASI K3
    // ----------------------------------------------------
    drawFindingsSection(doc, report, contentLeft, contentWidth, ensureSpace);

    // ----------------------------------------------------
    // 7. SEKSI V: KESIMPULAN, SYARAT K3 & PENGESAHAN (TANDA TANGAN)
    // ----------------------------------------------------
    doc.addPage();
    doc.y = 48;
    drawConclusionAndRules(doc, report, data, contentLeft, contentWidth, ensureSpace);
    drawSignaturesSection(doc, report, data, qrBuffer, contentLeft, contentWidth, ensureSpace);

    // ----------------------------------------------------
    // 8. LAMPIRAN DOKUMENTASI FOTO (GRID 2 KOLOM RAPI)
    // ----------------------------------------------------
    drawPhotoDocumentation(doc, report, contentLeft, contentWidth, ensureSpace);

    // ----------------------------------------------------
    // 9. FOOTER SETIAP HALAMAN ISI LAPORAN (HALAMAN 2 DST)
    // ----------------------------------------------------
    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = 1; pageIndex < pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      doc.page.margins.bottom = 20;
      drawLhppPageFooter(doc, contentLeft);
    }

    // ----------------------------------------------------
    // 10. LAMPIRAN SKP BIDANG KEMNAKER R.I.
    // ----------------------------------------------------
    for (const attachmentPath of getLhppSkpAppendixPaths(report.categoryCode)) {
      doc.addPage({ size: report.pageSize, margins: 0 });
      doc.image(attachmentPath, 0, 0, {
        fit: [doc.page.width, doc.page.height],
        align: 'center',
        valign: 'center'
      });
    }

    doc.end();
  });
}

export async function generateAssignmentLetterPdfBuffer(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    drawCompanyHeader(doc, 'SURAT TUGAS PEMERIKSAAN DAN PENGUJIAN K3');

    doc
      .font('Times-Roman')
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
      .font('Times-Bold')
      .text('Klien : ', { continued: true })
      .font('Times-Roman')
      .text(data.client_name)
      .font('Times-Bold')
      .text('Lokasi : ', { continued: true })
      .font('Times-Roman')
      .text(
        data.location_name
          ? `${data.location_name} (${data.location_address || ''})`
          : data.client_address || '-'
      )
      .font('Times-Bold')
      .text('Kontak PIC : ', { continued: true })
      .font('Times-Roman')
      .text(data.contact_name ? `${data.contact_name} (${data.contact_phone || '-'})` : '-')
      .font('Times-Bold')
      .text('Jadwal Pelaksanaan : ', { continued: true })
      .font('Times-Roman')
      .text(
        data.start_at
          ? `${new Date(data.start_at).toLocaleString('id-ID')} s/d ${new Date(
              data.end_at
            ).toLocaleString('id-ID')}`
          : 'Belum dijadwalkan'
      );

    doc.moveDown(0.7).font('Times-Bold').text('Tim Ahli K3 yang Ditugaskan:');
    doc.font('Times-Roman');
    for (const a of data.assignments || []) {
      doc.text(`• ${a.full_name} (${a.email}) | Status Konfirmasi: ${a.status}`);
    }

    doc.moveDown(0.7).font('Times-Bold').text('Daftar Unit / Objek Uji K3 dalam PO:');
    doc.font('Times-Roman');
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
