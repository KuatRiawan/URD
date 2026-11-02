import { describe, expect, it } from 'vitest';
import {
  buildLhppReportContent,
  generateBastPdfBuffer,
  generateLhppPdfBuffer,
  generateObjectQrStickerPdfBuffer,
  generateRecommendationLetterPdfBuffer
} from '../services/pdf-generator.js';
import { generateLhppDocxBuffer } from '../services/docx-generator.js';

const reportData = {
  category_code: 'PAA',
  category_name: 'Pesawat Angkat dan Pesawat Angkut',
  client_name: 'PT Contoh',
  client_address: 'Jl. Contoh No. 1',
  object_name: 'Overhead Crane',
  brand: 'Contoh',
  model: 'OC-10',
  manufacturer: 'Pabrik Contoh',
  serial_number: 'SN-123',
  manufacture_year: 2020,
  capacity: '10',
  capacity_unit: 'ton',
  install_location: 'Area Produksi',
  inspector_name: 'Ahli K3 Contoh',
  method_summary: 'Pemeriksaan visual dan uji fungsi.',
  technical_notes: 'Pengukuran dilakukan menggunakan alat terkalibrasi.',
  results: [
    {
      section: 'Pemeriksaan Visual',
      label: 'Kondisi nameplate',
      choice_value: 'SESUAI',
      note: 'Terbaca jelas'
    },
    {
      section: 'Pengujian',
      label: 'Beban uji',
      number_value: '10',
      unit: 'ton'
    }
  ],
  technical_data: { konstruksi_utama: 'Baik' },
  lhpp_schema: [{ key: 'konstruksi_utama', label: 'Kondisi konstruksi utama' }],
  findings: [],
  conclusion: 'MEMENUHI_SYARAT_DENGAN_CATATAN',
  conclusion_notes: 'Catatan hasil pemeriksaan aktual.',
  recommendations: 'Perbarui penandaan kapasitas.',
  version: 2,
  status: 'TERBIT',
  lhpp_no: '0001/INSP-PAA/PJK3-URD/V/2026',
  bap_no: 'BAP/URD/V/2026/0001',
  po_number: 'PO-001',
  verification_code: 'URD-123',
  published_at: '2026-05-25T00:00:00.000Z',
  reviewer_name: 'Reviewer Contoh',
  approver_name: 'Pimpinan Contoh'
};

describe('LHPP PDF template output', () => {
  it('maps only recorded inspection and technical values into the supplied report sections', () => {
    const report = buildLhppReportContent(reportData);

    expect(report.title).toBe(
      'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN (LHPP) - BIDANG PAA'
    );
    expect(report.sectionTitles).toEqual([
      'I. DATA UMUM',
      'II. DATA TEKNIS',
      'III. PEMERIKSAAN VISUAL',
      'IV. TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ]);
    expect(report.identityRows).toContainEqual(['Nomor Seri Unit', 'SN-123']);
    expect(report.resultRows).toContainEqual({
      label: 'Pemeriksaan Visual - Kondisi nameplate',
      value: 'SESUAI (Catatan: Terbaca jelas)'
    });
    expect(report.checklistRows).toContainEqual({
      section: 'Pemeriksaan Visual',
      label: 'Kondisi nameplate',
      choice: 'SESUAI',
      inputType: 'CHOICE',
      value: 'SESUAI',
      note: 'Terbaca jelas'
    });
    expect(report.resultRows).toContainEqual({ label: 'Pengujian - Beban uji', value: '10 ton' });
    expect(report.technicalRows).toContainEqual({
      label: 'Kondisi Konstruksi & Struktur Utama',
      value: 'Baik'
    });
    expect(report.conclusion).toBe('MEMENUHI SYARAT DENGAN CATATAN');
    expect(report.noFindings).toBe(true);
    expect(report.resultRows.map(({ value }) => value).join(' ')).not.toMatch(
      /defleksi girder|tekanan kerja|tahanan pembumian/i
    );
  });

  it('does not imply a passing conclusion or fabricate test data when fields are empty', () => {
    const report = buildLhppReportContent({
      category_code: 'PAA',
      results: [],
      findings: [],
      status: 'DRAF'
    });

    expect(report.conclusion).toBe('Belum ditetapkan');
    expect(report.methodSummary).toBe('Belum diisi.');
    expect(report.technicalNotes).toBe('Belum diisi.');
    expect(report.recommendations).toBe('Belum diisi.');
    expect(report.technicalRows.length).toBeGreaterThan(0);
    expect(report.technicalRows.every(({ value }) => value === 'Belum diisi')).toBe(true);
    expect(report.resultRows).toEqual([]);
    expect(report.noFindings).toBe(true);
  });

  it('keeps the PO number out of the template Item No field when the unit tag is missing', () => {
    const report = buildLhppReportContent({
      category_code: 'PAA',
      po_number: 'PO-URD-0091',
      technical_data: {},
      results: []
    });

    expect(report.coverInfoRows).toContainEqual(['Item No', '-']);
    expect(report.coverInfoRows).not.toContainEqual(['Item No', 'PO-URD-0091']);
    expect(report.metadata.join(' ')).toContain('PO-URD-0091');
  });

  it('treats legacy auto-filled boilerplate as missing inspection data', () => {
    const report = buildLhppReportContent({
      category_code: 'PAA',
      technical_data: {
        konstruksi_utama: 'Sesuai hasil pemeriksaan dan pengujian lapangan'
      },
      lhpp_schema: [{ key: 'konstruksi_utama', label: 'Kondisi Konstruksi' }],
      technical_notes: 'Hasil pemeriksaan teknis sesuai BAP.',
      recommendations: 'Pertahankan pemeliharaan berkala sesuai standar K3 yang berlaku.',
      results: [
        {
          section: 'Pemeriksaan',
          label: 'Kondisi umum',
          text_value: 'Sesuai hasil pemeriksaan dan pengujian lapangan'
        }
      ]
    });

    expect(report.technicalRows[0].value).toBe('Belum diisi');
    expect(report.resultRows[0].value).toBe('Belum diisi');
    expect(report.technicalNotes).toBe('Belum diisi.');
    expect(report.recommendations).toBe('Belum diisi.');
  });

  it('includes sample-based technical fields for every supplied equipment category', () => {
    const categories = {
      PAA: { section: 'III. PEMERIKSAAN VISUAL', fields: /defleksi|wire rope/i },
      PUBT: { section: 'VII. KESIMPULAN', fields: /ketebalan dinding|hydrotest/i },
      PTP: { section: 'A. SPESIFIKASI MESIN', fields: /kebisingan|pencahayaan/i },
      IPP: { section: 'III. HASIL INSPEKSI VISUAL & PENGUJIAN', fields: /air terminal|pembumian/i },
      LIS: { section: 'III. HASIL PEMERIKSAAN & PENGUKURAN', fields: /sumber tenaga listrik|daya penerangan/i },
      IPK: { section: 'PEMERIKSAAN DAN PENGUJIAN INSTALASI FIRE ALARM', fields: /MCFA|sprinkler/i },
      LE: { section: 'III. PEMERIKSAAN VISUAL DAN PENGUJIAN', fields: /kecepatan nominal|governor/i }
    };

    for (const [categoryCode, expected] of Object.entries(categories)) {
      const report = buildLhppReportContent({ category_code: categoryCode });

      expect(report.sectionTitles).toContain(expected.section);
      expect(report.technicalRows.map(({ label }) => label).join(' ')).toMatch(expected.fields);
      expect(report.technicalRows.every(({ value }) => value === 'Belum diisi')).toBe(true);
    }
  });

  it('renders the five-section report across F4 pages for a standard report', async () => {
    const pdf = await generateLhppPdfBuffer(reportData);
    const pdfText = pdf.toString('latin1');
    const pageCount = (pdfText.match(/\/Type \/Page\b/g) || []).length;

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdfText).toMatch(/\/MediaBox \[0 0 615\.24 921\.36\]/);
    expect(pageCount).toBeGreaterThan(1);
    expect(pageCount).toBeGreaterThanOrEqual(4);
    expect(pdfText.match(/\/Subtype \/Image/g)?.length || 0).toBeGreaterThanOrEqual(3);
    expect(pdfText).not.toContain('Tidak ditemukan ketidaksesuaian');
  });

  it('continues onto additional pages when recorded report content exceeds one page', async () => {
    const pdf = await generateLhppPdfBuffer({
      ...reportData,
      method_summary: 'Metode pemeriksaan. '.repeat(100),
      technical_notes: 'Catatan teknis. '.repeat(100),
      results: Array.from({ length: 40 }, (_, index) => ({
        section: `Bagian ${index + 1}`,
        label: 'Hasil pemeriksaan',
        text_value: 'Nilai aktual yang dicatat. '.repeat(20)
      }))
    });
    const pageCount = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length;

    expect(pageCount).toBeGreaterThan(1);
  });

  it('appends field-specific company and Ahli K3 SKP pages for every category with supplied SKP template', async () => {
    for (const categoryCode of ['PAA', 'PUBT', 'PTP', 'IPP', 'LIS', 'IPK']) {
      const pdf = await generateLhppPdfBuffer({
        category_code: categoryCode,
        results: [],
        findings: [],
        photos: []
      });
      const pdfText = pdf.toString('latin1');
      const pageCount = (pdfText.match(/\/Type \/Page\b/g) || []).length;
      const imageCount = (pdfText.match(/\/Subtype \/Image/g) || []).length;

      expect(pageCount, `${categoryCode} page count`).toBeGreaterThanOrEqual(4);
      expect(imageCount, `${categoryCode} image count`).toBeGreaterThanOrEqual(3);
    }
  });

  it('renders valid multi-page LHPP PDF for LE (Elevator & Eskalator) cleanly', async () => {
    const pdf = await generateLhppPdfBuffer({
      category_code: 'LE',
      results: [],
      findings: [],
      photos: []
    });
    const pdfText = pdf.toString('latin1');
    const pageCount = (pdfText.match(/\/Type \/Page\b/g) || []).length;

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount).toBeGreaterThanOrEqual(2);
  });

  describe('Official PRD Document Generators (BAST, QR Sticker, Recommendation Letter)', () => {
    it('generates a valid BAST PDF buffer matching PRD Document #7 specification', async () => {
      const bastPdf = await generateBastPdfBuffer({
        bast_no: 'BAST/URD/2026/001',
        date: new Date('2026-05-20'),
        po_number: 'PO-TEST-100',
        client_name: 'PT Mitra Sukses K3',
        client_address: 'Kawasan Industri MM2100, Cikarang',
        recipient_name: 'Bapak Direktur',
        dispatched_by_name: 'Admin Operasional PT Upaya Riksa Daya',
        items: [
          {
            name: 'Overhead Crane 5 Ton',
            serial_number: 'OC-5T-001',
            category_name: 'Pesawat Angkat & Angkut',
            bap_no: 'BAP/URD/2026/001',
            lhpp_no: '0001/INSP-PAA/2026',
            suket_no: '560/SUKET-001/DISNAKER/2026',
            status: 'TERBIT'
          }
        ]
      });

      expect(Buffer.isBuffer(bastPdf)).toBe(true);
      expect(bastPdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(bastPdf.length).toBeGreaterThan(1000);
    });

    it('generates a valid QR Sticker PDF buffer matching PRD Document #6 specification', async () => {
      const stickerPdf = await generateObjectQrStickerPdfBuffer({
        id: 'test-obj-id',
        name: 'Forklift Diesel 3T',
        serial_number: 'FL-3T-009',
        capacity: '3 Ton',
        client_name: 'PT Klien Logistik',
        category_name: 'Pesawat Angkat dan Angkut',
        suket_no: 'SUKET/560/DISNAKER/2026',
        valid_until: '2027-05-15',
        verification_code: 'VERIF-FL3T-2026'
      });

      expect(Buffer.isBuffer(stickerPdf)).toBe(true);
      expect(stickerPdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(stickerPdf.length).toBeGreaterThan(1000);
    });

    it('generates a valid Recommendation Letter PDF buffer matching PRD Document #3 specification', async () => {
      const recPdf = await generateRecommendationLetterPdfBuffer({
        inspection_id: 'test-insp-id',
        recommendation_no: 'REK-K3/URD/2026/0042',
        inspection_date: '2026-05-22',
        client_name: 'PT Pabrik Baja',
        company_address: 'Kawasan Industri Cilegon',
        object_name: 'Bejana Tekan Air Receiver',
        category_name: 'Pesawat Uap dan Bejana Tekan',
        serial_number: 'BT-AR-1002',
        capacity: '1000 Liter / 10 Bar',
        location: 'Ruang Kompresor',
        findings: [
          {
            finding: 'Safety valve belum dikalibrasi ulang',
            risk_level: 'KRITIS',
            recommendation: 'Lakukan kalibrasi ulang safety valve dan uji pop-up segera',
            deadline: '10 Juni 2026'
          }
        ],
        conclusion: 'TIDAK_MEMENUHI_SYARAT',
        conclusion_notes: 'Wajib melakukan perbaikan safety valve sebelum operasi.',
        inspector_name: 'Ir. Budi Santoso, Ahli K3 Spesialis',
        inspector_skp_no: 'SKP.560/PUBT/2024'
      });

      expect(Buffer.isBuffer(recPdf)).toBe(true);
      expect(recPdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(recPdf.length).toBeGreaterThan(1000);
    });

    it('generates a valid DOCX buffer for LHPP report', async () => {
      const docx = await generateLhppDocxBuffer(reportData);
      expect(Buffer.isBuffer(docx)).toBe(true);
      // Valid zip/docx header starts with PK\x03\x04 (0x50 0x4B 0x03 0x04)
      expect(docx.subarray(0, 2).toString()).toBe('PK');
      expect(docx.length).toBeGreaterThan(2000);
    });
  });
});
