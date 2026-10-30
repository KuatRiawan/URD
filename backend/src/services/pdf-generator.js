import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { resolveAttachmentPath } from '../storage/file-storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const officialLogoPath = path.resolve(__dirname, '../../../logo-urd.png');

function drawCompanyHeader(doc, subtitle) {
  if (fs.existsSync(officialLogoPath)) {
    doc.image(officialLogoPath, 45, 36, { width: 68 });
  }
  doc
    .fillColor('#1D1414')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('PT UPAYA RIKSA DAYA', 125, 40)
    .font('Helvetica')
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
      .font('Helvetica-Bold')
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
    .font('Helvetica')
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
  // 1. Kop sesuai template resmi Berita Acara Riksa Uji PT. UPAYA RIKSA DAYA
  // Bar merah marun di sisi kiri + Nama PT. UPAYA RIKSA DAYA + Logo resmi di kanan atas
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

  // Judul utama & nomor BAP di atas garis titik-titik
  doc
    .font('Times-Bold')
    .fontSize(14)
    .fillColor('#1D1414')
    .text('BERITA ACARA RIKSA UJI', 45, 76, { align: 'center', width: 505 });

  doc
    .font('Times-Roman')
    .fontSize(9.5)
    .fillColor('#1D1414')
    .text(
      `No: ${bap.bap_no || '...................................................'}`,
      45,
      95,
      { align: 'center', width: 505 }
    );

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
      `Pada hari ini ${dayName}, Tanggal ${dayNum} Bulan ${monthName} Tahun ${yearFull} telah dilaksanakan pekerjaan pemeriksaan dan pengujian (riksa uji) oleh PT. Upaya Riksa Daya pada :`,
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

  if (qrBuffer) {
    doc.image(qrBuffer, 279, sigTop + 26, { width: 36 });
  }

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
    fullName: 'PESAWAT ANGKAT DAN PESAWAT ANGKUT',
    specialistTitle: 'Ahli K3 Pesawat Angkat dan Angkut',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. PEMERIKSAAN VISUAL DAN PENGUJIAN',
      'IV. TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'konstruksi_utama', label: 'Kondisi Konstruksi & Struktur Utama' },
      { key: 'sistem_penggerak', label: 'Sistem Mekanisme Angkat, Wire Rope / Rantai & Kait' },
      { key: 'uji_beban_dinamis', label: 'Hasil Uji Beban Dinamis & Statis (Defleksi)' },
      { key: 'safety_device_paa', label: 'Fungsi Limit Switch, Rem & Overload Limiter' }
    ]
  },
  PUBT: {
    fullName: 'BEJANA TEKANAN DAN TANGKI TIMBUN',
    specialistTitle: 'Ahli K3 Pesawat Uap dan Bejana Tekan',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. PEMERIKSAAN DAN PENGUJIAN',
      'IV. HASIL UKUR, TEMUAN & REKOMENDASI',
      'VII. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'ketebalan_dinding', label: 'Hasil Pengukuran Ketebalan Dinding (Ultrasonic Wall Thickness)' },
      { key: 'pengujian_ndt', label: 'Hasil Pemeriksaan NDT Sambungan Las & Shell' },
      { key: 'safety_valve_pubt', label: 'Pengujian Katup Pengaman (Safety Valve), Pressure Gauge & Hydrotest' }
    ]
  },
  PTP: {
    fullName: 'PESAWAT TENAGA DAN PRODUKSI',
    specialistTitle: 'Ahli K3 Pesawat Tenaga dan Produksi',
    sectionTitles: [
      'I. DATA UMUM',
      'A. SPESIFIKASI MESIN',
      'III. PEMERIKSAAN, PENGUKURAN & PENGUJIAN',
      'IV. TEMUAN & REKOMENDASI',
      'V. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'kondisi_mesin', label: 'Kondisi Fisik Mesin, Pondasi & Transmisi Sabuk/Roda Gigi' },
      { key: 'pengukuran_lingkungan', label: 'Hasil Pengukuran Kebisingan, Getaran & Pencahayaan Area' },
      { key: 'sistem_proteksi', label: 'Pelindung Bagian Berputar, Emergency Stop & Safety Device' }
    ]
  },
  IPP: {
    fullName: 'INSTALASI PENYALUR PETIR',
    specialistTitle: 'Ahli K3 Instalasi Penyalur Petir dan Listrik',
    sectionTitles: [
      'I. DATA UMUM',
      'II. SPESIFIKASI & ALAT UKUR',
      'III. HASIL INSPEKSI VISUAL & PENGUJIAN',
      'IV. TEMUAN & SYARAT',
      'VII. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'air_terminal_detail', label: 'Kondisi Air Terminal & Tiang Penyangga Atap' },
      { key: 'down_conductor_detail', label: 'Kontinuitas Hantaran Turun (Down Conductor) & Sambungan Ukur' },
      { key: 'grounding_petir', label: 'Hasil Pengukuran Tahanan Pembumian Elektrode Penyalur Petir (Ohm)' }
    ]
  },
  LIS: {
    fullName: 'INSTALASI LISTRIK',
    specialistTitle: 'Ahli K3 Bidang Listrik',
    sectionTitles: [
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. HASIL PEMERIKSAAN & PENGUKURAN',
      'IV. TEMUAN & REKOMENDASI',
      'V. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'panel_dan_proteksi', label: 'Kondisi Panel LVMDP/SDP, Busbar & Sistem Proteksi Arus Lebih' },
      { key: 'tahanan_isolasi_grounding', label: 'Hasil Pengukuran Tahanan Isolasi & Tahanan Pembumian (Grounding)' },
      { key: 'termografi_listrik', label: 'Hasil Pemeriksaan Suhu Sambungan (Thermal Imaging)' }
    ]
  },
  LE: {
    fullName: 'ELEVATOR DAN ESKALATOR',
    specialistTitle: 'Ahli K3 Elevator dan Eskalator'
  },
  IPK: {
    fullName: 'INSTALASI PROTEKSI KEBAKARAN',
    specialistTitle: 'Ahli K3 Bidang Penanggulangan Kebakaran',
    sectionTitles: [
      'II. DATA PEMERIKSA DAN DATA UMUM',
      'SPESIFIKASI TEKNIK INSTALASI',
      'PEMERIKSAAN DAN PENGUJIAN INSTALASI FIRE ALARM',
      'HASIL PEMERIKSAAN, TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ],
    technicalFields: [
      { key: 'sistem_deteksi_mcfa', label: 'Pemeriksaan Panel MCFA, Detektor Asap/Panas & Alarm Kebakaran' },
      { key: 'sistem_hydrant_sprinkler', label: 'Pengujian Tekanan & Aliran Pompa Hydrant, Pillar, Nozzle & Sprinkler' },
      { key: 'apar_dan_evakuasi', label: 'Pemeriksaan Sebaran APAR & Sarana Proteksi Aktif' }
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
  const technicalSchema =
    Array.isArray(data.lhpp_schema) && data.lhpp_schema.length
      ? data.lhpp_schema
      : category.technicalFields || [];
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
    identityRows: [
      ['Nama Perusahaan', data.client_name],
      ['Alamat Perusahaan', data.client_address],
      ['Kategori Objek K3', `${categoryCode} - ${data.category_name || category.fullName}`],
      ['Nama Objek / Unit', data.object_name],
      ['Merek / Tipe / Pabrik Pembuat', [data.brand, data.model, data.manufacturer].filter(hasReportValue).join(' / ') || '-'],
      ['Nomor Seri', data.serial_number],
      [
        'Tahun Pembuatan / Kapasitas',
        [data.manufacture_year, [data.capacity, data.capacity_unit].filter(hasReportValue).join(' ')].filter(hasReportValue).join(' / ')
      ],
      ['Lokasi Pemeriksaan', data.install_location || data.client_address],
      ['Suket Sebelumnya', data.previous_permit_no],
      [
        'Ahli K3 Pemeriksa',
        data.inspector_name ? `${data.inspector_name} (${category.specialistTitle})` : '-'
      ],
      [
        'Rekomendasi Pemeriksaan Berikutnya',
        hasReportValue(data.recommended_valid_until)
          ? formatIndoDate(data.recommended_valid_until)
          : 'Sesuai ketetapan Suket K3 Disnaker'
      ]
    ].map(([label, value]) => [label, hasReportValue(value) ? String(value) : '-']),
    methodSummary: hasReportValue(data.method_summary) ? data.method_summary : 'Belum diisi.',
    technicalNotes: hasRecordedReportValue(data.technical_notes)
      ? data.technical_notes
      : 'Belum diisi.',
    technicalRows,
    resultRows,
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

export async function generateLhppPdfBuffer(data) {
  const report = buildLhppReportContent(data);
  const qrText = data.verification_code
    ? `https://upayariksadaya.com/verifikasi/${data.verification_code}`
    : `PT UPAYA RIKSA DAYA | LHPP: ${data.lhpp_no || 'DRAF'} | BAP: ${data.bap_no || '-'}`;
  const qrBuffer = await QRCode.toBuffer(qrText, { width: 96, margin: 1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [595.28, 935.43],
      margins: { top: 95, right: 45, bottom: 65, left: 45 },
      bufferPages: true,
      compress: false
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let isCoverPage = true;

    const drawContinuationHeader = () => {
      if (isCoverPage) return;
      drawCompanyHeader(doc);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1D1414')
        .text(`${report.title} (LANJUTAN)`, 45, 102, { width: 505, align: 'center' })
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748B')
        .text(`Nomor LHPP: ${data.lhpp_no || 'DRAF (Belum Terbit)'} | Objek: ${data.object_name || '-'}`, 45, 115, { width: 505, align: 'center' });
      doc.y = 132;
    };

    doc.on('pageAdded', drawContinuationHeader);

    // ==========================================
    // 1. COVER PAGE RESMI (Sesuai Contoh Dokumen)
    // ==========================================
    // Logo Perusahaan di Posisi Atas
    if (fs.existsSync(officialLogoPath)) {
      doc.image(officialLogoPath, 247, 50, { width: 100 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#1D1414')
      .text('PT UPAYA RIKSA DAYA', 45, 145, { align: 'center', width: 505 })
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor('#8B262B')
      .text('PERUSAHAAN JASA KESELAMATAN & KESEHATAN KERJA (PJK3)', 45, 164, { align: 'center', width: 505 })
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#475569')
      .text('Keputusan Penunjukan Kemenaker R.I. Bidang Pemeriksaan dan Pengujian K3', 45, 178, { align: 'center', width: 505 });

    // Garis Aksen Kop Cover
    doc
      .moveTo(145, 195)
      .lineTo(450, 195)
      .lineWidth(1.2)
      .strokeColor('#8B262B')
      .stroke();

    // Judul Utama Laporan di Cover
    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#0F172A')
      .text('LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN', 45, 225, { align: 'center', width: 505 })
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#8B262B')
      .text('SERTIFIKASI KESELAMATAN DAN KESEHATAN KERJA', 45, 246, { align: 'center', width: 505 })
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1E293B')
      .text(`${report.categoryName.toUpperCase()}`, 45, 264, { align: 'center', width: 505 });

    // Kotak Ringkasan Identitas Dokumen / Unit di Cover
    const coverCardTop = 305;
    const coverCardWidth = 475;
    const coverCardHeight = 295;
    const coverCardLeft = 60;

    doc
      .rect(coverCardLeft, coverCardTop, coverCardWidth, coverCardHeight)
      .fillColor('#F8FAFC')
      .fill();
    doc
      .rect(coverCardLeft, coverCardTop, coverCardWidth, coverCardHeight)
      .lineWidth(0.8)
      .strokeColor('#CBD5E1')
      .stroke();

    // Header kecil di dalam kartu
    doc
      .rect(coverCardLeft, coverCardTop, coverCardWidth, 24)
      .fillColor('#E2E8F0')
      .fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor('#1E293B')
      .text('INFORMASI RESMI INSPEKSI PERALATAN K3', coverCardLeft, coverCardTop + 7, {
        align: 'center',
        width: coverCardWidth
      });

    const coverInfoRows = [
      ['Perusahaan / Pemilik', data.client_name || '-'],
      ['Nomor Item / Tag Unit', data.po_number || data.order_no || '-'],
      ['Jenis Peralatan K3', `${report.categoryCode} / ${data.object_name || '-'}`],
      ['Nomor Seri / Tag', data.serial_number || '-'],
      ['Merk / Model / Pembuat', [data.brand, data.model, data.manufacturer].filter(hasReportValue).join(' / ') || '-'],
      ['Kapasitas Kerja / Desain', [data.capacity, data.capacity_unit].filter(hasReportValue).join(' ') || '-'],
      ['Lokasi Penempatan / Plant', data.install_location || data.client_address || '-'],
      ['Tanggal Pemeriksaan', formatIndoDate(data.inspection_date || data.published_at)],
      ['Rekomendasi Riksa Uji Ulang', hasReportValue(data.recommended_valid_until) ? formatIndoDate(data.recommended_valid_until) : 'Sesuai ketetapan Suket K3 Disnaker'],
      ['Nomor Registrasi LHPP', data.lhpp_no || 'DRAF (Belum Terbit)']
    ];

    let cRowY = coverCardTop + 32;
    for (const [cLabel, cVal] of coverInfoRows) {
      doc
        .font('Helvetica-Bold')
        .fontSize(8.2)
        .fillColor('#334155')
        .text(cLabel, coverCardLeft + 16, cRowY, { width: 140 })
        .font('Helvetica')
        .text(':', coverCardLeft + 158, cRowY)
        .font('Helvetica-Bold')
        .fillColor('#0F172A')
        .text(String(cVal), coverCardLeft + 168, cRowY, { width: 285 });
      cRowY += 25;
    }

    // QR Code Verifikasi di Bawah Kotak
    doc.image(qrBuffer, 260, 625, { width: 75 });
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#64748B')
      .text('Pindai QR code untuk memverifikasi keabsahan laporan riksa uji resmi PT Upaya Riksa Daya', 45, 706, {
        align: 'center',
        width: 505
      });

    // Footer Resmi di Halaman Cover
    doc
      .moveTo(60, 775)
      .lineTo(535, 775)
      .lineWidth(0.6)
      .strokeColor('#CBD5E1')
      .stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#1D1414')
      .text('PT UPAYA RIKSA DAYA', 45, 785, { align: 'center', width: 505 })
      .font('Helvetica')
      .fontSize(7.8)
      .fillColor('#475569')
      .text('Jl. Pondasi No. 50B Kel. Kayu Putih Kec. Pulo Gadung, Jakarta Timur 13210', 45, 798, { align: 'center', width: 505 })
      .text('Telp: (021) 489 1409, 471 5699 | Fax: (021) 4786 5925', 45, 810, { align: 'center', width: 505 })
      .text('Email: urd@upayariksadaya.com | Website: www.upayariksadaya.com', 45, 822, { align: 'center', width: 505 });

    // ==========================================
    // 2. HALAMAN LAPORAN TEKNIS (HALAMAN 2 DST)
    // ==========================================
    isCoverPage = false;
    doc.addPage();

    // Judul Header Halaman Isi
    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor('#1D1414')
      .text(report.title, 45, 104, { align: 'center', width: 505 });

    // Metadata Baris Bergaris
    doc
      .rect(45, 120, 505, 20)
      .fillColor('#F1F5F9')
      .fill();
    doc
      .rect(45, 120, 505, 20)
      .lineWidth(0.5)
      .strokeColor('#CBD5E1')
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(7.2)
      .fillColor('#334155')
      .text(report.metadata.join('  |  '), 48, 126, { width: 499, align: 'center' });

    doc.y = 148;

    // Helper: Periksa Ruang Halaman
    const ensureSpace = (neededHeight) => {
      if (doc.y + neededHeight > 870) {
        doc.addPage();
        doc.y = 135;
      }
    };

    // Helper: Gambar Judul Bab / Section
    const drawSectionHeader = (title) => {
      ensureSpace(26);
      const sY = doc.y;
      doc.rect(45, sY, 505, 20).fillColor('#F1F5F9').fill();
      doc.rect(45, sY, 505, 20).lineWidth(0.7).strokeColor('#CBD5E1').stroke();
      doc.rect(45, sY, 4, 20).fillColor('#8B262B').fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#1E293B')
        .text(title, 55, sY + 5, { width: 490 });
      doc.y = sY + 24;
    };

    // ----------------------------------------------------
    // SEKSI I: DATA UMUM (Tabel 2 Kolom Bergaris Rapi)
    // ----------------------------------------------------
    drawSectionHeader(report.sectionTitles[0]);

    const labelColW = 160;
    const valueColW = 505 - labelColW;

    for (let i = 0; i < report.identityRows.length; i++) {
      const [label, val] = report.identityRows[i];
      const valStr = String(val ?? '-');
      const lH = doc.font('Helvetica-Bold').fontSize(7.5).heightOfString(label, { width: labelColW - 14, lineGap: 1 });
      const vH = doc.font('Helvetica').fontSize(7.5).heightOfString(valStr, { width: valueColW - 14, lineGap: 1 });
      const rowH = Math.max(lH, vH) + 6;

      ensureSpace(rowH);
      const rY = doc.y;
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      doc.rect(45, rY, 505, rowH).fillColor(bg).fill();
      doc.rect(45, rY, 505, rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.moveTo(45 + labelColW, rY).lineTo(45 + labelColW, rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text(label, 52, rY + 3.5, { width: labelColW - 14, lineGap: 1 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#0F172A').text(valStr, 45 + labelColW + 7, rY + 3.5, { width: valueColW - 14, lineGap: 1 });

      doc.y = rY + rowH;
    }
    doc.y += 6;

    // ----------------------------------------------------
    // SEKSI II: DATA TEKNIS & EVALUASI SPESIFIK BIDANG
    // ----------------------------------------------------
    drawSectionHeader(report.sectionTitles[1]);

    // Box Metode Riksa Uji & Catatan Teknis
    const methodText = `Metode Riksa Uji: ${report.methodSummary}`;
    const mH = doc.font('Helvetica').fontSize(7.5).heightOfString(methodText, { width: 490, lineGap: 1 });
    ensureSpace(mH + 8);
    let bY = doc.y;
    doc.rect(45, bY, 505, mH + 8).fillColor('#F8FAFC').fill();
    doc.rect(45, bY, 505, mH + 8).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text('Metode Riksa Uji: ', 52, bY + 4, { continued: true })
      .font('Helvetica').fillColor('#0F172A').text(report.methodSummary, { width: 490, lineGap: 1 });
    doc.y = bY + mH + 11;

    const notesText = `Catatan Analisis Teknis: ${report.technicalNotes}`;
    const nH = doc.font('Helvetica').fontSize(7.5).heightOfString(notesText, { width: 490, lineGap: 1 });
    ensureSpace(nH + 8);
    bY = doc.y;
    doc.rect(45, bY, 505, nH + 8).fillColor('#F8FAFC').fill();
    doc.rect(45, bY, 505, nH + 8).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text('Catatan Analisis Teknis: ', 52, bY + 4, { continued: true })
      .font('Helvetica').fillColor('#0F172A').text(report.technicalNotes, { width: 490, lineGap: 1 });
    doc.y = bY + nH + 11;

    // Tabel Parameter Teknis Lapangan
    for (let i = 0; i < report.technicalRows.length; i++) {
      const row = report.technicalRows[i];
      const lH = doc.font('Helvetica-Bold').fontSize(7.5).heightOfString(row.label, { width: labelColW - 14, lineGap: 1 });
      const vH = doc.font('Helvetica').fontSize(7.5).heightOfString(row.value, { width: valueColW - 14, lineGap: 1 });
      const rowH = Math.max(lH, vH) + 6;

      ensureSpace(rowH);
      const rY = doc.y;
      const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

      doc.rect(45, rY, 505, rowH).fillColor(bg).fill();
      doc.rect(45, rY, 505, rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.moveTo(45 + labelColW, rY).lineTo(45 + labelColW, rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text(row.label, 52, rY + 3.5, { width: labelColW - 14, lineGap: 1 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#0F172A').text(row.value, 45 + labelColW + 7, rY + 3.5, { width: valueColW - 14, lineGap: 1 });

      doc.y = rY + rowH;
    }
    doc.y += 6;

    // ----------------------------------------------------
    // SEKSI III: PEMERIKSAAN VISUAL DAN PENGUJIAN (TABEL FORMAL)
    // ----------------------------------------------------
    drawSectionHeader(report.sectionTitles[2]);

    if (report.resultRows.length === 0) {
      ensureSpace(28);
      const emptyY = doc.y;
      doc.rect(45, emptyY, 505, 24).fillColor('#F8FAFC').fill();
      doc.rect(45, emptyY, 505, 24).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#64748B').text('Belum ada butir hasil yang dicatat.', 55, emptyY + 8);
      doc.y = emptyY + 30;
    } else {
      const resColW = [30, 200, 195, 80];
      const resColX = [45, 75, 275, 470];

      // Header Tabel Hasil Pemeriksaan
      ensureSpace(22);
      let rHeaderY = doc.y;
      doc.rect(45, rHeaderY, 505, 20).fillColor('#E2E8F0').fill();
      doc.rect(45, rHeaderY, 505, 20).lineWidth(0.6).strokeColor('#94A3B8').stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B');
      doc.text('No.', resColX[0], rHeaderY + 5.5, { width: resColW[0], align: 'center' });
      doc.text('Komponen / Parameter Diperiksa', resColX[1] + 6, rHeaderY + 5.5, { width: resColW[1] - 12 });
      doc.text('Hasil Pemeriksaan & Pengukuran', resColX[2] + 6, rHeaderY + 5.5, { width: resColW[2] - 12 });
      doc.text('Status K3', resColX[3], rHeaderY + 5.5, { width: resColW[3], align: 'center' });
      doc.y = rHeaderY + 20;

      for (let i = 0; i < report.resultRows.length; i++) {
        const item = report.resultRows[i];
        const labelText = item.label || `Pemeriksaan ${i + 1}`;
        const valText = item.value || '-';

        let statusText = 'SESUAI';
        let statusColor = '#059669';
        const combined = `${labelText} ${valText}`.toLowerCase();
        if (combined.includes('tidak sesuai') || combined.includes('rusak') || combined.includes('bocor') || combined.includes('retak') || combined.includes('aus')) {
          statusText = 'TEMUAN';
          statusColor = '#DC2626';
        } else if (combined.includes('catatan') || combined.includes('perlu')) {
          statusText = 'CATATAN';
          statusColor = '#D97706';
        } else if (combined.includes('n/a') || combined.includes('tidak ada')) {
          statusText = 'N/A';
          statusColor = '#64748B';
        }

        const h1 = doc.font('Helvetica-Bold').fontSize(7.5).heightOfString(labelText, { width: resColW[1] - 12, lineGap: 1 });
        const h2 = doc.font('Helvetica').fontSize(7.5).heightOfString(valText, { width: resColW[2] - 12, lineGap: 1 });
        const rowH = Math.max(h1, h2) + 6;

        if (doc.y + rowH > 870) {
          doc.addPage();
          doc.y = 135;
          // Gambar ulang header tabel di halaman baru
          rHeaderY = doc.y;
          doc.rect(45, rHeaderY, 505, 20).fillColor('#E2E8F0').fill();
          doc.rect(45, rHeaderY, 505, 20).lineWidth(0.6).strokeColor('#94A3B8').stroke();
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B');
          doc.text('No.', resColX[0], rHeaderY + 5.5, { width: resColW[0], align: 'center' });
          doc.text('Komponen / Parameter Diperiksa', resColX[1] + 6, rHeaderY + 5.5, { width: resColW[1] - 12 });
          doc.text('Hasil Pemeriksaan & Pengukuran', resColX[2] + 6, rHeaderY + 5.5, { width: resColW[2] - 12 });
          doc.text('Status K3', resColX[3], rHeaderY + 5.5, { width: resColW[3], align: 'center' });
          doc.y = rHeaderY + 20;
        }

        const rY = doc.y;
        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

        doc.rect(45, rY, 505, rowH).fillColor(bg).fill();
        doc.rect(45, rY, 505, rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
        doc.moveTo(resColX[1], rY).lineTo(resColX[1], rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
        doc.moveTo(resColX[2], rY).lineTo(resColX[2], rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
        doc.moveTo(resColX[3], rY).lineTo(resColX[3], rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

        doc.font('Helvetica').fontSize(7.5).fillColor('#64748B').text(String(i + 1), resColX[0], rY + 3.5, { width: resColW[0], align: 'center' });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B').text(labelText, resColX[1] + 6, rY + 3.5, { width: resColW[1] - 12, lineGap: 1 });
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(valText, resColX[2] + 6, rY + 3.5, { width: resColW[2] - 12, lineGap: 1 });
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(statusColor).text(statusText, resColX[3], rY + 3.5, { width: resColW[3], align: 'center' });

        doc.y = rY + rowH;
      }
      doc.y += 6;
    }

    // ----------------------------------------------------
    // SEKSI IV: TEMUAN LAPANGAN & REKOMENDASI PERBAIKAN
    // ----------------------------------------------------
    drawSectionHeader(report.sectionTitles[3]);

    if (report.noFindings) {
      ensureSpace(28);
      const fY = doc.y;
      doc.rect(45, fY, 505, 24).fillColor('#F8FAFC').fill();
      doc.rect(45, fY, 505, 24).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
      doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B').text('Belum ada temuan lapangan yang dicatat.', 55, fY + 8);
      doc.y = fY + 30;
    } else {
      const fColW = [70, 235, 200];
      const fColX = [45, 115, 350];

      ensureSpace(22);
      let fHeaderY = doc.y;
      doc.rect(45, fHeaderY, 505, 20).fillColor('#E2E8F0').fill();
      doc.rect(45, fHeaderY, 505, 20).lineWidth(0.6).strokeColor('#94A3B8').stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B');
      doc.text('Tingkat Risiko', fColX[0], fHeaderY + 5.5, { width: fColW[0], align: 'center' });
      doc.text('Uraian Temuan Lapangan', fColX[1] + 6, fHeaderY + 5.5, { width: fColW[1] - 12 });
      doc.text('Rekomendasi Tindak Lanjut K3', fColX[2] + 6, fHeaderY + 5.5, { width: fColW[2] - 12 });
      doc.y = fHeaderY + 20;

      for (let i = 0; i < report.findings.length; i++) {
        const finding = report.findings[i];
        const sevText = (finding.severity || 'TEMUAN').toUpperCase();
        const descText = finding.description || 'Temuan tanpa uraian';
        const recText = finding.recommendation || '-';

        const h1 = doc.font('Helvetica').fontSize(7.5).heightOfString(descText, { width: fColW[1] - 12, lineGap: 1 });
        const h2 = doc.font('Helvetica').fontSize(7.5).heightOfString(recText, { width: fColW[2] - 12, lineGap: 1 });
        const rowH = Math.max(h1, h2) + 6;

        if (doc.y + rowH > 870) {
          doc.addPage();
          doc.y = 135;
          fHeaderY = doc.y;
          doc.rect(45, fHeaderY, 505, 20).fillColor('#E2E8F0').fill();
          doc.rect(45, fHeaderY, 505, 20).lineWidth(0.6).strokeColor('#94A3B8').stroke();
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B');
          doc.text('Tingkat Risiko', fColX[0], fHeaderY + 5.5, { width: fColW[0], align: 'center' });
          doc.text('Uraian Temuan Lapangan', fColX[1] + 6, fHeaderY + 5.5, { width: fColW[1] - 12 });
          doc.text('Rekomendasi Tindak Lanjut K3', fColX[2] + 6, fHeaderY + 5.5, { width: fColW[2] - 12 });
          doc.y = fHeaderY + 20;
        }

        const rY = doc.y;
        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

        doc.rect(45, rY, 505, rowH).fillColor(bg).fill();
        doc.rect(45, rY, 505, rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
        doc.moveTo(fColX[1], rY).lineTo(fColX[1], rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
        doc.moveTo(fColX[2], rY).lineTo(fColX[2], rY + rowH).lineWidth(0.5).strokeColor('#CBD5E1').stroke();

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#DC2626').text(sevText, fColX[0], rY + 3.5, { width: fColW[0], align: 'center' });
        doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B').text(descText, fColX[1] + 6, rY + 3.5, { width: fColW[1] - 12, lineGap: 1 });
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(recText, fColX[2] + 6, rY + 3.5, { width: fColW[2] - 12, lineGap: 1 });

        doc.y = rY + rowH;
      }
      doc.y += 6;
    }

    // ----------------------------------------------------
    // SEKSI V: KESIMPULAN & SYARAT-SYARAT K3 (OPERASIONAL)
    // ----------------------------------------------------
    drawSectionHeader(report.sectionTitles[4]);

    const introSummary = 'Atas dasar hasil pemeriksaan dan pengujian tersebut di atas, maka dapat disimpulkan bahwa unit peralatan dinyatakan:';
    ensureSpace(60);
    doc.font('Helvetica').fontSize(8).fillColor('#1E293B').text(introSummary, 45, doc.y, { width: 505, lineGap: 1 });
    doc.y += 12;

    // Banner Status Kesimpulan
    let bannerBg = '#ECFDF5';
    let bannerBorder = '#059669';
    let bannerText = '#065F46';
    const cUpper = (report.conclusion || '').toUpperCase();
    if (cUpper.includes('CATATAN')) {
      bannerBg = '#FFFBEB';
      bannerBorder = '#D97706';
      bannerText = '#92400E';
    } else if (cUpper.includes('TIDAK') || cUpper.includes('BELUM')) {
      bannerBg = '#FEF2F2';
      bannerBorder = '#DC2626';
      bannerText = '#991B1B';
    }

    ensureSpace(40);
    const bnrY = doc.y;
    doc.rect(45, bnrY, 505, 30).fillColor(bannerBg).fill();
    doc.rect(45, bnrY, 505, 30).lineWidth(1.2).strokeColor(bannerBorder).stroke();
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor(bannerText).text(report.conclusion, 45, bnrY + 9, {
      width: 505,
      align: 'center'
    });
    doc.y = bnrY + 36;

    if (report.conclusionNotes && report.conclusionNotes !== '-') {
      ensureSpace(20);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text('Catatan Kesimpulan: ', 45, doc.y, { continued: true })
        .font('Helvetica').fillColor('#0F172A').text(report.conclusionNotes, { width: 505, lineGap: 1 });
      doc.moveDown(0.2);
    }

    if (report.recommendations) {
      ensureSpace(20);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155').text('Rekomendasi Tindak Lanjut: ', 45, doc.y, { continued: true })
        .font('Helvetica').fillColor('#0F172A').text(report.recommendations, { width: 505, lineGap: 1 });
      doc.moveDown(0.3);
    }

    // Syarat-syarat Operasi K3 Sesuai Dokumen Resmi URD
    ensureSpace(50);
    const sBoxY = doc.y;
    doc.rect(45, sBoxY, 505, 16).fillColor('#F1F5F9').fill();
    doc.rect(45, sBoxY, 505, 16).lineWidth(0.5).strokeColor('#CBD5E1').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E293B').text('SYARAT - SYARAT KESELAMATAN KERJA & OPERASIONAL', 52, sBoxY + 4);
    doc.y = sBoxY + 20;

    const opRules = [
      '1. Unit harus dioperasikan oleh Operator yang telah memiliki Sertifikat K3 dan SIO (Surat Izin Operasi) resmi dari Kemenaker R.I.',
      '2. Dilarang mengoperasikan unit melebihi kapasitas beban maksimum yang diizinkan (Safe Working Load / SWL).',
      '3. Lakukan pemeriksaan dan pengujian berkala paling lambat sesuai batas rekomendasi pemeriksaan berikutnya.'
    ];
    for (const rule of opRules) {
      ensureSpace(14);
      doc.font('Helvetica').fontSize(7.2).fillColor('#334155').text(rule, 50, doc.y, { width: 495, lineGap: 1 });
      doc.moveDown(0.15);
    }
    doc.y += 8;

    // ----------------------------------------------------
    // PENGESAHAN & TANDA TANGAN (3 KOLOM RESMI)
    // ----------------------------------------------------
    ensureSpace(120);
    const dateLine = `Jakarta, ${report.signature.publishedAt !== '-' ? report.signature.publishedAt : formatIndoDate(new Date())}`;
    doc.font('Helvetica').fontSize(8).fillColor('#1E293B').text(dateLine, 45, doc.y, { width: 505, align: 'right' });
    doc.y += 14;

    const sigTop = doc.y;
    const sigColW = 160;
    const col1X = 45;
    const col2X = 217;
    const col3X = 390;

    doc.font('Helvetica-Bold').fontSize(7.8).fillColor('#1E293B');
    doc.text('Yang Memeriksa / Menguji:', col1X, sigTop, { width: sigColW, align: 'center' });
    doc.text('Direview Oleh:', col2X, sigTop, { width: sigColW, align: 'center' });
    doc.text('Disetujui Oleh:', col3X, sigTop, { width: sigColW, align: 'center' });

    doc.font('Helvetica').fontSize(7.2).fillColor('#475569');
    doc.text(`Ahli K3 ${report.categoryCode}`, col1X, sigTop + 10, { width: sigColW, align: 'center' });
    doc.text('Reviewer Teknis K3', col2X, sigTop + 10, { width: sigColW, align: 'center' });
    doc.text('Pimpinan PT Upaya Riksa Daya', col3X, sigTop + 10, { width: sigColW, align: 'center' });

    // QR Code verifikasi pada kolom Ahli K3
    if (qrBuffer) {
      doc.image(qrBuffer, col1X + 56, sigTop + 24, { width: 48 });
    }

    const nameY = sigTop + 76;
    doc.font('Helvetica-Bold').fontSize(7.8).fillColor('#0F172A');
    doc.text(`( ${report.signature.inspector} )`, col1X, nameY, { width: sigColW, align: 'center' });
    doc.text(`( ${report.signature.reviewer} )`, col2X, nameY, { width: sigColW, align: 'center' });
    doc.text(`( ${report.signature.approver} )`, col3X, nameY, { width: sigColW, align: 'center' });

    doc.font('Helvetica').fontSize(7).fillColor('#64748B');
    doc.text(`Disusun oleh Ahli K3: ${report.signature.inspector}`, 45, nameY + 16, { width: 505, align: 'center' });

    doc.y = nameY + 28;

    // ==========================================
    // VI. LAMPIRAN DOKUMENTASI FOTO HASIL RIKSA UJI
    // ==========================================
    if (report.photos && report.photos.length > 0) {
      doc.addPage();
      doc.y = 135;

      const photoSecTitle = 'VI. LAMPIRAN DOKUMENTASI FOTO HASIL RIKSA UJI';
      doc
        .rect(45, doc.y, 505, 20)
        .fillColor('#8B262B')
        .fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#FFFFFF')
        .text(photoSecTitle, 52, doc.y + 5, { width: 495 });
      doc.y += 28;

      const cardW = 245;
      const cardH = 175;
      const imgW = 233;
      const imgH = 135;

      for (let i = 0; i < report.photos.length; i += 2) {
        ensureSpace(cardH + 20);
        const rowY = doc.y;

        // Foto 1 (Kolom Kiri)
        const p1 = report.photos[i];
        const p1X = 45;
        doc.rect(p1X, rowY, cardW, cardH).fillColor('#F8FAFC').fill();
        doc.rect(p1X, rowY, cardW, cardH).lineWidth(0.6).strokeColor('#CBD5E1').stroke();

        const p1Path = p1.storageKey ? resolveAttachmentPath(p1.storageKey) : null;
        if (p1Path && fs.existsSync(p1Path) && (p1.mimeType || '').startsWith('image/')) {
          try {
            doc.image(p1Path, p1X + 6, rowY + 6, {
              fit: [imgW, imgH],
              align: 'center',
              valign: 'center'
            });
          } catch {
            doc
              .font('Helvetica')
              .fontSize(7.5)
              .fillColor('#64748B')
              .text('[Gambar tidak dapat dirender]', p1X + 10, rowY + 60, { width: imgW, align: 'center' });
          }
        } else {
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor('#64748B')
            .text('[Foto Terlampir]', p1X + 10, rowY + 60, { width: imgW, align: 'center' });
        }

        // Caption Foto 1
        doc.rect(p1X, rowY + 145, cardW, 30).fillColor('#F1F5F9').fill();
        doc.rect(p1X, rowY + 145, cardW, 30).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
        doc
          .font('Helvetica-Bold')
          .fontSize(7.2)
          .fillColor('#1E293B')
          .text(`Foto ${i + 1}: ${p1.caption || p1.originalName || 'Dokumentasi Riksa Uji'}`, p1X + 6, rowY + 150, {
            width: cardW - 12,
            height: 22,
            ellipsis: true
          });

        // Foto 2 (Kolom Kanan, jika ada)
        if (i + 1 < report.photos.length) {
          const p2 = report.photos[i + 1];
          const p2X = 305;
          doc.rect(p2X, rowY, cardW, cardH).fillColor('#F8FAFC').fill();
          doc.rect(p2X, rowY, cardW, cardH).lineWidth(0.6).strokeColor('#CBD5E1').stroke();

          const p2Path = p2.storageKey ? resolveAttachmentPath(p2.storageKey) : null;
          if (p2Path && fs.existsSync(p2Path) && (p2.mimeType || '').startsWith('image/')) {
            try {
              doc.image(p2Path, p2X + 6, rowY + 6, {
                fit: [imgW, imgH],
                align: 'center',
                valign: 'center'
              });
            } catch {
              doc
                .font('Helvetica')
                .fontSize(7.5)
                .fillColor('#64748B')
                .text('[Gambar tidak dapat dirender]', p2X + 10, rowY + 60, { width: imgW, align: 'center' });
            }
          } else {
            doc
              .font('Helvetica')
              .fontSize(7.5)
              .fillColor('#64748B')
              .text('[Foto Terlampir]', p2X + 10, rowY + 60, { width: imgW, align: 'center' });
          }

          // Caption Foto 2
          doc.rect(p2X, rowY + 145, cardW, 30).fillColor('#F1F5F9').fill();
          doc.rect(p2X, rowY + 145, cardW, 30).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
          doc
            .font('Helvetica-Bold')
            .fontSize(7.2)
            .fillColor('#1E293B')
            .text(`Foto ${i + 2}: ${p2.caption || p2.originalName || 'Dokumentasi Riksa Uji'}`, p2X + 6, rowY + 150, {
              width: cardW - 12,
              height: 22,
              ellipsis: true
            });
        }

        doc.y = rowY + cardH + 14;
      }
    }

    // ==========================================
    // 3. FOOTER SETIAP HALAMAN ISI LAPORAN
    // ==========================================
    const pageRange = doc.bufferedPageRange();
    for (let pageIndex = 1; pageIndex < pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex);
      doc.page.margins.bottom = 20;
      const footerY = doc.page.height - 42;

      doc
        .moveTo(45, footerY)
        .lineTo(550, footerY)
        .lineWidth(0.6)
        .strokeColor('#CBD5E1')
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(7.2)
        .fillColor('#64748B')
        .text(
          'PT Upaya Riksa Daya | PJK3 Pemeriksaan & Pengujian K3 | urd@upayariksadaya.com',
          45,
          footerY + 4,
          { width: 350 }
        );

      doc
        .font('Helvetica')
        .fontSize(7.2)
        .fillColor('#64748B')
        .text(
          `Halaman ${pageIndex} dari ${pageRange.count - 1}`,
          395,
          footerY + 4,
          { width: 155, align: 'right' }
        );
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
