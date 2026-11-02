import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateAssignmentLetterPdfBuffer,
  generateBapPdfBuffer,
  generateBastPdfBuffer,
  generateLhppPdfBuffer,
  generateObjectQrStickerPdfBuffer,
  generateRecommendationLetterPdfBuffer
} from '../src/services/pdf-generator.js';
import { generateLhppDocxBuffer } from '../src/services/docx-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../../docs/antigravity/final-product-validation/samples');

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`Generating all 7 official PRD documents into: ${outputDir}`);

  // 1. Surat Tugas / SPK (PDF)
  console.log('1. Generating Surat Tugas / SPK PDF...');
  const spkBuffer = await generateAssignmentLetterPdfBuffer({
    order_no: 'PO/2026/XI/0001',
    po_number: 'PO-CLIENT-URD-9988',
    service_type: 'PEMERIKSAAN_BERKALA',
    client_name: 'PT Tri Mitra Manufaktur Indonesia',
    client_address: 'Kawasan Industri KIIC Lot C-4, Karawang Barat',
    scheduled_start: '2026-11-10T08:00:00.000Z',
    scheduled_end: '2026-11-10T17:00:00.000Z',
    assignments: [
      {
        inspector_name: 'Ir. Budi Santoso, ST',
        inspector_role: 'Ahli K3 Spesialis PAA',
        inspector_skp_no: 'SKP.560/PAA/DISNAKER/2024',
        object_name: 'Overhead Travelling Crane 15T',
        category_name: 'Pesawat Angkat dan Pesawat Angkut (PAA)'
      }
    ],
    objects: [
      {
        name: 'Overhead Travelling Crane 15T',
        serial_number: 'OTC-15T-2021',
        capacity: '15 Ton',
        install_location: 'Workshop Bay 2'
      }
    ]
  });
  await fs.writeFile(path.join(outputDir, '01-surat-tugas-spk.pdf'), spkBuffer);

  // 2. Berita Acara Pemeriksaan (BAP) (PDF)
  console.log('2. Generating Berita Acara Pemeriksaan (BAP) PDF...');
  const bapBuffer = await generateBapPdfBuffer({
    bap_no: 'BAP/URD/XI/2026/0012',
    inspection_date: '2026-11-10',
    client_name: 'PT Tri Mitra Manufaktur Indonesia',
    client_address: 'Kawasan Industri KIIC Lot C-4, Karawang Barat',
    contact_name: 'Hendra Wijaya (HSE Manager)',
    object_name: 'Overhead Travelling Crane',
    category_code: 'PAA',
    category_name: 'Pesawat Angkat dan Pesawat Angkut',
    brand: 'Nippon Crane Works',
    model: 'NC-150',
    manufacturer: 'Nippon Crane Co., Ltd.',
    manufacture_year: 2021,
    serial_number: 'OTC-15T-2021',
    capacity: '15',
    capacity_unit: 'Ton',
    install_location: 'Workshop Bay 2, Plant Karawang',
    po_number: 'PO-CLIENT-URD-9988',
    scope_items: [
      'Pemeriksaan Dokumen & Gambar Teknik',
      'Pemeriksaan Visual Konstruksi & Las',
      'Pemeriksaan Komponen Mekanikal & Kelistrikan',
      'Uji Fungsi & Uji Beban Dinamis / Statis'
    ],
    technical_data: {
      kecepatan_angkat: '6 m/min',
      bentang_girder: '18.5 Meter',
      tinggi_angkat: '9 Meter'
    },
    findings: [
      {
        finding: 'Baut pengikat stopper rail kiri longgar 2 buah',
        risk_level: 'SEDANG',
        recommendation: 'Kencangkan baut pengikat stopper sesuai torsi standar pabrikan',
        deadline: '2026-11-17'
      }
    ],
    conclusion: 'MEMENUHI_SYARAT_DENGAN_CATATAN',
    conclusion_notes: 'Peralatan memenuhi syarat keselamatan kerja setelah rekomendasi perbaikan baut dilaksanakan.',
    recommendations: 'Lakukan pengencangan torsi baut stopper sebelum crane difungsikan kembali pada beban maksimal.',
    inspector_signer_name: 'Ir. Budi Santoso, ST',
    inspector_signer_title: 'Ahli K3 Spesialis Pesawat Angkat & Angkut',
    inspector_signed_at: '2026-11-10T16:30:00.000Z',
    client_signer_name: 'Hendra Wijaya',
    client_signer_title: 'HSE Manager PT Tri Mitra Manufaktur',
    client_signed_at: '2026-11-10T16:45:00.000Z',
    verification_code: 'BAP-URD-882190'
  });
  await fs.writeFile(path.join(outputDir, '02-berita-acara-pemeriksaan-bap.pdf'), bapBuffer);

  // 3. Lembar Rekomendasi K3 (PDF)
  console.log('3. Generating Lembar Rekomendasi K3 PDF...');
  const recBuffer = await generateRecommendationLetterPdfBuffer({
    inspection_id: 'insp-sample-01',
    recommendation_no: 'REK-K3/URD/XI/2026/0012',
    inspection_date: '2026-11-10',
    client_name: 'PT Tri Mitra Manufaktur Indonesia',
    company_address: 'Kawasan Industri KIIC Lot C-4, Karawang Barat',
    object_name: 'Overhead Travelling Crane 15T',
    category_name: 'Pesawat Angkat dan Pesawat Angkut',
    serial_number: 'OTC-15T-2021',
    capacity: '15 Ton',
    location: 'Workshop Bay 2',
    findings: [
      {
        finding: 'Baut pengikat stopper rail kiri longgar 2 buah',
        risk_level: 'SEDANG',
        recommendation: 'Kencangkan baut pengikat stopper dengan torsi terkalibrasi',
        deadline: '2026-11-17'
      },
      {
        finding: 'Indikator batas beban (Load Limiter) perlu re-kalibrasi',
        risk_level: 'RENDAH',
        recommendation: 'Lakukan kalibrasi tahunan sensor indikator beban',
        deadline: '2026-12-01'
      }
    ],
    conclusion: 'MEMENUHI_SYARAT_DENGAN_CATATAN',
    conclusion_notes: 'Unit crane aman dioperasikan bersyarat, temuan wajib ditindaklanjuti sebelum batas waktu yang ditetapkan.',
    inspector_name: 'Ir. Budi Santoso, ST',
    inspector_skp_no: 'SKP.560/PAA/DISNAKER/2024'
  });
  await fs.writeFile(path.join(outputDir, '03-lembar-rekomendasi-k3.pdf'), recBuffer);

  // 4. Laporan Hasil Pemeriksaan dan Pengujian (LHPP) (PDF)
  console.log('4. Generating LHPP PDF...');
  const lhppData = {
    category_code: 'PAA',
    category_name: 'Pesawat Angkat dan Pesawat Angkut',
    client_name: 'PT Tri Mitra Manufaktur Indonesia',
    client_address: 'Kawasan Industri KIIC Lot C-4, Karawang Barat',
    object_name: 'Overhead Travelling Crane',
    brand: 'Nippon Crane Works',
    model: 'NC-150',
    manufacturer: 'Nippon Crane Co., Ltd.',
    serial_number: 'OTC-15T-2021',
    manufacture_year: 2021,
    capacity: '15',
    capacity_unit: 'Ton',
    install_location: 'Workshop Bay 2',
    inspector_name: 'Ir. Budi Santoso, ST',
    method_summary: 'Pemeriksaan visual, pengukuran dimensi, pengujian fungsi kendali, serta uji beban statis dan dinamis mengacu Permenaker No. 08 Tahun 2020.',
    technical_notes: 'Pengujian beban dilakukan dengan beban uji terkalibrasi 125% SWL (18.75 Ton). Defleksi girder berada di bawah batas maksimum izin L/800.',
    results: [
      { section: 'Pemeriksaan Visual', label: 'Struktur Girder & Sambungan Las', choice_value: 'SESUAI', note: 'Tidak ditemukan deformasi plastis atau retak lelah' },
      { section: 'Pemeriksaan Visual', label: 'Tali Kawat Baja (Wire Rope)', choice_value: 'SESUAI', note: 'Diameter nominal 18mm, keausan < 3%, tidak ada kawat putus' },
      { section: 'Pemeriksaan Visual', label: 'Rem Hoist & Rem Travel', choice_value: 'SESUAI', note: 'Kampas rem tebal 8mm, celah udara normal' },
      { section: 'Pengujian', label: 'Uji Beban Statis (125% SWL)', number_value: '18.75', unit: 'Ton' },
      { section: 'Pengujian', label: 'Uji Beban Dinamis (110% SWL)', number_value: '16.5', unit: 'Ton' },
      { section: 'Pengujian', label: 'Defleksi Girder Aktual', number_value: '14.2', unit: 'mm' }
    ],
    technical_data: {
      bentang_girder: '18.5 Meter',
      tinggi_angkat: '9.0 Meter',
      kecepatan_hoist: '6 m/min',
      daya_motor_hoist: '15 kW'
    },
    findings: [],
    conclusion: 'MEMENUHI_SYARAT',
    conclusion_notes: 'Peralatan memenuhi seluruh kriteria teknis keselamatan dan kesehatan kerja sesuai regulasi yang berlaku.',
    recommendations: 'Lakukan perawatan berkala secara disiplin sesuai SOP operasional pabrik pembuat.',
    version: 1,
    status: 'TERBIT',
    lhpp_no: '0012/INSP-PAA/PJK3-URD/XI/2026',
    bap_no: 'BAP/URD/XI/2026/0012',
    po_number: 'PO-CLIENT-URD-9988',
    verification_code: 'URD-778899AA',
    published_at: '2026-11-10T00:00:00.000Z',
    reviewer_name: 'Drs. Supriyanto, MT',
    approver_name: 'Direktur Operasional PT URD'
  };
  const lhppPdfBuffer = await generateLhppPdfBuffer(lhppData);
  await fs.writeFile(path.join(outputDir, '04-laporan-hasil-pemeriksaan-lhpp.pdf'), lhppPdfBuffer);

  // 5. Laporan Hasil Pemeriksaan dan Pengujian (LHPP) (DOCX)
  console.log('5. Generating LHPP DOCX...');
  const lhppDocxBuffer = await generateLhppDocxBuffer(lhppData);
  await fs.writeFile(path.join(outputDir, '05-laporan-hasil-pemeriksaan-lhpp.docx'), lhppDocxBuffer);

  // 6. Stiker Label QR Code (100mm x 75mm) (PDF)
  console.log('6. Generating QR Sticker Label (100x75mm) PDF...');
  const qrStickerBuffer = await generateObjectQrStickerPdfBuffer({
    name: 'Overhead Travelling Crane 15T',
    serial_number: 'OTC-15T-2021',
    category_name: 'Pesawat Angkat dan Pesawat Angkut',
    category_code: 'PAA',
    client_name: 'PT Tri Mitra Manufaktur Indonesia',
    install_location: 'Workshop Bay 2',
    capacity: '15 Ton',
    last_inspection_date: '2026-11-10',
    next_inspection_date: '2027-11-10',
    suket_no: '566/SKT-PAA/DISNAKER/XI/2026',
    qr_code_value: '566/SKT-PAA/DISNAKER/XI/2026'
  });
  await fs.writeFile(path.join(outputDir, '06-stiker-label-qr-code.pdf'), qrStickerBuffer);

  // 7. Berita Acara Serah Terima (BAST) (PDF)
  console.log('7. Generating BAST PDF...');
  const bastBuffer = await generateBastPdfBuffer({
    order_no: 'PO/2026/XI/0001',
    po_number: 'PO-CLIENT-URD-9988',
    bast_no: 'BAST/URD/XI/2026/0001',
    client_name: 'PT Tri Mitra Manufaktur Indonesia',
    client_address: 'Kawasan Industri KIIC Lot C-4, Karawang Barat',
    contact_name: 'Hendra Wijaya',
    contact_phone: '0812-3456-7890',
    created_at: '2026-11-12T00:00:00.000Z',
    delivered_at: '2026-11-12T10:00:00.000Z',
    channel: 'HAND_DELIVERY',
    recipient_name: 'Hendra Wijaya',
    notes: 'Penyerahan seluruh bundel dokumen fisik asli: LHPP, BAP, Lembar Rekomendasi, Suket Disnaker, dan Stiker QR Code.',
    items: [
      {
        object_name: 'Overhead Travelling Crane 15T',
        serial_number: 'OTC-15T-2021',
        category_name: 'Pesawat Angkat dan Pesawat Angkut',
        lhpp_no: '0012/INSP-PAA/PJK3-URD/XI/2026',
        bap_no: 'BAP/URD/XI/2026/0012',
        suket_no: '566/SKT-PAA/DISNAKER/XI/2026'
      }
    ]
  });
  await fs.writeFile(path.join(outputDir, '07-berita-acara-serah-terima-bast.pdf'), bastBuffer);

  console.log('All 7 documents successfully generated!');
}

main().catch((err) => {
  console.error('Document generation failed:', err);
  process.exit(1);
});

