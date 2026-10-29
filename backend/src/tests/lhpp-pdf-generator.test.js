import { describe, expect, it } from 'vitest';
import {
  buildLhppReportContent,
  generateLhppPdfBuffer
} from '../services/pdf-generator.js';

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
      'III. PEMERIKSAAN VISUAL DAN PENGUJIAN',
      'IV. TEMUAN & REKOMENDASI',
      'VI. KESIMPULAN'
    ]);
    expect(report.identityRows).toContainEqual(['Nomor Seri', 'SN-123']);
    expect(report.resultRows).toContainEqual({
      label: 'Pemeriksaan Visual - Kondisi nameplate',
      value: 'SESUAI (Catatan: Terbaca jelas)'
    });
    expect(report.resultRows).toContainEqual({ label: 'Pengujian - Beban uji', value: '10 ton' });
    expect(report.technicalRows).toContainEqual({
      label: 'Kondisi konstruksi utama',
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
      PAA: { section: 'III. PEMERIKSAAN VISUAL DAN PENGUJIAN', fields: /defleksi|wire rope/i },
      PUBT: { section: 'VII. KESIMPULAN', fields: /ketebalan dinding|hydrotest/i },
      PTP: { section: 'A. SPESIFIKASI MESIN', fields: /kebisingan|pencahayaan/i },
      IPP: { section: 'III. HASIL INSPEKSI VISUAL & PENGUJIAN', fields: /air terminal|pembumian/i },
      LIS: { section: 'III. HASIL PEMERIKSAAN & PENGUKURAN', fields: /termografi|tahanan isolasi/i },
      IPK: { section: 'PEMERIKSAAN DAN PENGUJIAN INSTALASI FIRE ALARM', fields: /MCFA|sprinkler/i }
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
    expect(pdfText).toMatch(/\/MediaBox \[0 0 595\.28 935\.43\]/);
    expect(pageCount).toBeGreaterThan(1);
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
});
