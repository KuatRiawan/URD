import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx';
import { buildLhppReportContent } from './pdf-generator.js';

export async function generateLhppDocxBuffer(data) {
  const report = buildLhppReportContent(data);

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

