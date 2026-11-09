import fs from 'node:fs';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx';
import { buildLhppReportContent, getOfficialLogoPath } from './pdf-generator.js';
import { getCompanyProfile } from './system-settings-service.js';

export async function generateLhppDocxBuffer(data) {
  const [report, _companyProfile] = await Promise.all([
    Promise.resolve(buildLhppReportContent(data)),
    getCompanyProfile().catch(() => null)
  ]);

  const logoPath = getOfficialLogoPath();
  const logoParagraph = logoPath && fs.existsSync(logoPath)
    ? new Paragraph({
        children: [
          new ImageRun({
            data: fs.readFileSync(logoPath),
            transformation: { width: 104, height: 73 }
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 }
      })
    : null;

  const titleParagraph = new Paragraph({
    text: report.title || 'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN (LHPP)',
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  });

  const subtitleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: `Nomor: ${report.lhppNo || '-'}   |   No. BAP: ${report.bapNo || '-'}`,
        bold: true,
        size: 20
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 300 }
  });

  // Table Data Umum
  const section1Title = new Paragraph({
    children: [new TextRun({ text: 'I. DATA UMUM & IDENTITAS UNIT', bold: true, size: 22 })],
    spacing: { before: 200, after: 100 }
  });

  const identityRows = (report.identityRows || []).map(
    ([label, val]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })]
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(val || '-'), size: 18 })] })]
          })
        ]
      })
  );

  const identityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: identityRows
  });

  // Section Data Teknis
  const section2Title = new Paragraph({
    children: [new TextRun({ text: 'II. DATA TEKNIS', bold: true, size: 22 })],
    spacing: { before: 300, after: 100 }
  });

  const technicalRows = (report.technicalRows || []).map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: row.label, bold: true, size: 18 })] })]
          }),
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(row.value || '-'), size: 18 })] })]
          })
        ]
      })
  );

  const technicalTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows:
      technicalRows.length > 0
        ? technicalRows
        : [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: 'Data teknis terverifikasi sesuai spesifikasi nameplate pabrikan.' })]
                })
              ]
            })
          ]
  });

  // Section Pemeriksaan Visual & Hasil Uji
  const section3Title = new Paragraph({
    children: [new TextRun({ text: 'III. PEMERIKSAAN VISUAL & PENGUJIAN', bold: true, size: 22 })],
    spacing: { before: 300, after: 100 }
  });

  const resultRows = (report.resultRows || []).map(
    (row) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: row.label, size: 18 })] })]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(row.value || '-'), size: 18 })] })]
          })
        ]
      })
  );

  const resultTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows:
      resultRows.length > 0
        ? resultRows
        : [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ text: 'Hasil checklist riksa uji tercatat lengkap pada formulir.' })]
                })
              ]
            })
          ]
  });

  // Section Kesimpulan & Rekomendasi
  const section4Title = new Paragraph({
    children: [new TextRun({ text: 'IV. KESIMPULAN & REKOMENDASI K3', bold: true, size: 22 })],
    spacing: { before: 300, after: 100 }
  });

  const conclusionParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Kesimpulan Teknis: ', bold: true, size: 20 }),
      new TextRun({ text: report.conclusion || 'MEMENUHI PERSYARATAN K3', bold: true, size: 20, color: '107038' })
    ],
    spacing: { after: 100 }
  });

  const notesParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Catatan Riksa Uji: ', bold: true, size: 18 }),
      new TextRun({ text: report.conclusionNotes || 'Peralatan diuji dalam batas aman operasional.', size: 18 })
    ],
    spacing: { after: 200 }
  });

  const recommendationsParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Rekomendasi K3: ', bold: true, size: 18 }),
      new TextRun({
        text: report.recommendations || 'Lakukan pemeliharaan berkala sesuai petunjuk pabrikan pembuat.',
        size: 18
      })
    ],
    spacing: { after: 300 }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...(logoParagraph ? [logoParagraph] : []),
          titleParagraph,
          subtitleParagraph,
          section1Title,
          identityTable,
          section2Title,
          technicalTable,
          section3Title,
          resultTable,
          section4Title,
          conclusionParagraph,
          notesParagraph,
          recommendationsParagraph
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

export async function generateBapDocxBuffer(bap) {
  const companyProfile = await getCompanyProfile().catch(() => null);
  const companyName = companyProfile?.company_name || 'PT UPAYA RIKSA DAYA';
  const tagline = companyProfile?.tagline || 'JASA PEMERIKSAAN & PENGUJIAN KESELAMATAN DAN KESEHATAN KERJA (PJK3)';

  const logoPath = getOfficialLogoPath();
  const logoParagraph = logoPath && fs.existsSync(logoPath)
    ? new Paragraph({
        children: [
          new ImageRun({
            data: fs.readFileSync(logoPath),
            transformation: { width: 92, height: 64 }
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      })
    : null;

  const isNotCompliant = bap.conclusion === 'TIDAK_MEMENUHI_SYARAT';
  const statusColor = isNotCompliant ? '991B1B' : '107038';
  const statusText = isNotCompliant
    ? 'TIDAK MEMENUHI PERSYARATAN K3'
    : 'MEMENUHI PERSYARATAN KESELAMATAN DAN KESEHATAN KERJA';

  const companyHeader = new Paragraph({
    children: [
      new TextRun({
        text: companyName,
        bold: true,
        size: 26,
        color: 'C81E1E'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 }
  });

  const subHeader = new Paragraph({
    children: [
      new TextRun({
        text: tagline.toUpperCase(),
        bold: true,
        size: 18,
        color: '334155'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 }
  });

  const titleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: 'BERITA ACARA PEMERIKSAAN DAN PENGUJIAN (BAP)',
        bold: true,
        size: 24
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  });

  const docNoParagraph = new Paragraph({
    children: [
      new TextRun({
        text: `Nomor: ${bap.bap_no || 'DRAF'}`,
        bold: true,
        size: 20
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 260 }
  });

  const introParagraph = new Paragraph({
    children: [
      new TextRun({
        text: 'Pada hari ini telah dilaksanakan pemeriksaan dan pengujian Keselamatan dan Kesehatan Kerja (K3) oleh PT Upaya Riksa Daya terhadap peralatan sebagai berikut:',
        size: 20
      })
    ],
    spacing: { after: 180 }
  });

  const inspectionDateFormatted = bap.inspection_date || bap.inspected_at
    ? new Date(bap.inspection_date || bap.inspected_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '-';

  const identityData = [
    ['Nama Perusahaan / Pemilik', bap.client_name || '-'],
    ['Alamat Perusahaan', bap.client_address || bap.location_address || '-'],
    ['Lokasi Pemeriksaan', bap.location_name || bap.install_location || '-'],
    ['Jenis Pesawat / Objek Uji', `${bap.category_name || bap.category_code || ''} - ${bap.object_name || '-'}`],
    ['Pabrik Pembuat / Model / Tahun', `${bap.manufacturer || bap.brand || '-'} / ${bap.model || '-'} / ${bap.manufacture_year || '-'}`],
    ['Nomor Seri / Tag', bap.serial_number || '-'],
    ['Kapasitas / Spesifikasi', `${bap.capacity || '-'}${bap.capacity_unit ? ` ${bap.capacity_unit}` : ''}`],
    ['Nomor PO / SPK', bap.po_number || bap.order_no || '-'],
    ['Tanggal Pemeriksaan', inspectionDateFormatted]
  ];

  const identityRows = identityData.map(
    ([label, val]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 19 })] })]
          }),
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: String(val || '-'), size: 19 })] })]
          })
        ]
      })
  );

  const identityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: identityRows
  });

  const scopeTitle = new Paragraph({
    children: [new TextRun({ text: 'LINGKUP RIKSA UJI', bold: true, size: 20 })],
    spacing: { before: 260, after: 100 }
  });

  const rawScopes = Array.isArray(bap.scope_items) && bap.scope_items.length > 0
    ? bap.scope_items
    : [
        'Pemeriksaan Dokumen & Gambar Teknik',
        'Pemeriksaan Visual Konstruksi & Komponen',
        'Pengukuran Dimensi & Pengujian Fungsi / Safety Device'
      ];

  const scopeParagraphs = rawScopes.map(
    (item) =>
      new Paragraph({
        children: [new TextRun({ text: `[ v ]  ${item}`, size: 19 })],
        spacing: { after: 60 }
      })
  );

  const resultTitle = new Paragraph({
    children: [new TextRun({ text: 'HASIL PEMERIKSAAN & KESIMPULAN', bold: true, size: 20 })],
    spacing: { before: 260, after: 100 }
  });

  const conclusionParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Kesimpulan Teknis: ', bold: true, size: 20 }),
      new TextRun({
        text: statusText,
        bold: true,
        size: 20,
        color: statusColor
      })
    ],
    spacing: { after: 120 }
  });

  const notesParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Catatan Riksa Uji: ', bold: true, size: 19 }),
      new TextRun({
        text:
          bap.notes ||
          bap.conclusion_notes ||
          'Pemeriksaan dan pengujian telah dilaksanakan sesuai standar K3 yang berlaku.',
        size: 19
      })
    ],
    spacing: { after: 260 }
  });

  const inspName = bap.inspector_signer_name || bap.inspector_name || 'Ahli K3 / Inspector';
  const clientName = bap.client_signer_name || 'Perwakilan Klien';

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Yang Melakukan Pemeriksaan,\nInspector / Ahli K3',
                    bold: true,
                    size: 18
                  })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({ text: '', spacing: { after: 600 } }),
              new Paragraph({
                children: [new TextRun({ text: `( ${inspName} )`, bold: true, size: 18 })],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [new TextRun({ text: companyName, size: 16 })],
                alignment: AlignmentType.CENTER
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Mengetahui / Menyetujui,\nPerwakilan Perusahaan / Klien',
                    bold: true,
                    size: 18
                  })
                ],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({ text: '', spacing: { after: 600 } }),
              new Paragraph({
                children: [new TextRun({ text: `( ${clientName} )`, bold: true, size: 18 })],
                alignment: AlignmentType.CENTER
              }),
              new Paragraph({
                children: [new TextRun({ text: bap.client_name || 'Perusahaan Klien', size: 16 })],
                alignment: AlignmentType.CENTER
              })
            ]
          })
        ]
      })
    ]
  });

  const closingText = new Paragraph({
    children: [
      new TextRun({
        text: 'Demikian Berita Acara Pemeriksaan dan Pengujian ini dibuat dengan sebenarnya sesuai kondisi teknis di lapangan untuk dipergunakan sebagaimana mestinya.',
        italics: true,
        size: 16,
        color: '64748B'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...(logoParagraph ? [logoParagraph] : []),
          companyHeader,
          subHeader,
          titleParagraph,
          docNoParagraph,
          introParagraph,
          identityTable,
          scopeTitle,
          ...scopeParagraphs,
          resultTitle,
          conclusionParagraph,
          notesParagraph,
          sigTable,
          closingText
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}

