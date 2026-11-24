import fs from 'node:fs';
import path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} from 'docx';
import { buildLhppReportContent, getOfficialLogoPath } from './pdf-generator.js';
import { getCompanyProfile } from './system-settings-service.js';
import { resolveAttachmentPath } from '../storage/file-storage.js';

export function resolveAttachmentBuffer(attachment) {
  if (!attachment) return null;
  if (Buffer.isBuffer(attachment)) return attachment;
  if (typeof attachment === 'string') {
    if (attachment.startsWith('data:image/')) {
      const match = attachment.match(/^data:image\/[a-z]+;base64,(.+)$/);
      if (match) {
        try {
          return Buffer.from(match[1], 'base64');
        } catch { /* berkas tidak dapat dibaca, lanjutkan tanpa gambar */ }
      }
    }
    try {
      const p = resolveAttachmentPath(attachment);
      if (p && fs.existsSync(p)) return fs.readFileSync(p);
    } catch { /* berkas tidak dapat dibaca, lanjutkan tanpa gambar */ }
    if (fs.existsSync(attachment)) return fs.readFileSync(attachment);
  }
  if (typeof attachment === 'object') {
    if (attachment.buffer && Buffer.isBuffer(attachment.buffer)) return attachment.buffer;
    if (attachment.path && fs.existsSync(attachment.path)) return fs.readFileSync(attachment.path);
    const sk = attachment.storage_key || attachment.storageKey || attachment.file_id || attachment.fileId;
    if (sk) {
      try {
        const fp = resolveAttachmentPath(sk);
        if (fp && fs.existsSync(fp)) return fs.readFileSync(fp);
      } catch { /* berkas tidak dapat dibaca, lanjutkan tanpa gambar */ }
    }
    if (attachment.data_url || attachment.dataUrl) {
      const match = (attachment.data_url || attachment.dataUrl).match(/^data:image\/[a-z]+;base64,(.+)$/);
      if (match) {
        try {
          return Buffer.from(match[1], 'base64');
        } catch { /* berkas tidak dapat dibaca, lanjutkan tanpa gambar */ }
      }
    }
  }
  return null;
}

// Ukuran Halaman Resmi F4 / Folio Indonesia (215.9 mm x 330.2 mm / 8.5 x 13.0 inch)
// Satuan dalam DXA (1/20 of a point, 1 inch = 1440 DXA)
export const F4_PAGE_PROPERTIES = {
  page: {
    size: {
      width: 12240, // 8.5 in (215.9 mm)
      height: 18720 // 13.0 in (330.2 mm) - Standar F4 / Folio Kemnaker RI
    },
    margin: {
      top: 1080,    // ~19 mm
      right: 1080,  // ~19 mm
      bottom: 1080, // ~19 mm
      left: 1080    // ~19 mm
    }
  }
};

const BORDER_BLACK_SOLID = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000'
};

const TABLE_BORDERS_BLACK = {
  top: BORDER_BLACK_SOLID,
  bottom: BORDER_BLACK_SOLID,
  left: BORDER_BLACK_SOLID,
  right: BORDER_BLACK_SOLID,
  insideHorizontal: BORDER_BLACK_SOLID,
  insideVertical: BORDER_BLACK_SOLID
};

const TABLE_BORDERS_NONE = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
  insideHorizontal: { style: BorderStyle.NONE },
  insideVertical: { style: BorderStyle.NONE }
};

function createCell(children, options = {}) {
  const {
    widthDxa = null,
    widthPercent = null,
    isHeader = false,
    shadingColor = null,
    bold = false,
    italics = false,
    align = AlignmentType.LEFT,
    size = 20, // 10 pt
    font = 'Times New Roman',
    color = '000000',
    columnSpan = 1,
    rowSpan = 1,
    borders = null,
    margins = { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign = VerticalAlign.CENTER
  } = options;

  let widthObj = undefined;
  if (widthDxa !== null && widthDxa !== undefined) {
    widthObj = { size: widthDxa, type: WidthType.DXA };
  } else if (widthPercent !== null && widthPercent !== undefined) {
    widthObj = { size: widthPercent, type: WidthType.PERCENTAGE };
  }

  const paras = Array.isArray(children)
    ? children.map((c) =>
        c instanceof Paragraph
          ? c
          : new Paragraph({
              alignment: align,
              children: [
                new TextRun({
                  text: String(c ?? ''),
                  bold: bold || isHeader,
                  italics,
                  size,
                  font,
                  color
                })
              ]
            })
      )
    : [
        children instanceof Paragraph
          ? children
          : new Paragraph({
              alignment: align,
              children: [
                new TextRun({
                  text: String(children ?? ''),
                  bold: bold || isHeader,
                  italics,
                  size,
                  font,
                  color
                })
              ]
            })
      ];

  return new TableCell({
    width: widthObj,
    columnSpan,
    rowSpan,
    verticalAlign,
    borders: borders || undefined,
    margins: margins || undefined,
    shading: shadingColor
      ? { fill: shadingColor, type: ShadingType.CLEAR }
      : isHeader
      ? { fill: 'F8FAFC', type: ShadingType.CLEAR }
      : undefined,
    children: paras
  });
}

function formatDateIndo(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return String(dateStr);
  }
}

function addYear(dateStr, yearsToAdd = 1) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    d.setFullYear(d.getFullYear() + yearsToAdd);
    return formatDateIndo(d);
  } catch {
    return null;
  }
}

function getTemplateAsset(filename) {
  const p = path.resolve(process.cwd(), 'src/assets/forklift-template', filename);
  if (fs.existsSync(p)) return p;
  const p2 = path.resolve(process.cwd(), 'backend/src/assets/forklift-template', filename);
  if (fs.existsSync(p2)) return p2;
  return null;
}

function createRunningFooter() {
  return new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'PT. UPAYA RIKSA DAYA\n',
            bold: true,
            size: 18,
            font: 'Times New Roman',
            color: 'FF0000'
          }),
          new TextRun({
            text: 'Jl. Pondasi No. 50B Kampung Ambon, Jakarta Timur. 13210',
            size: 18,
            font: 'Times New Roman',
            color: '000000'
          })
        ],
        spacing: { before: 120 }
      })
    ]
  });
}


// =============================================================================
// FORKLIFT OFFICIAL TEMPLATE (Persis 100% Sesuai PDF Resmi Kemnaker / URD)
// =============================================================================
function buildForkliftDocxDocument(data, report, _companyProfile) {
  const results = Array.isArray(data.results) ? data.results : [];
  const photos = Array.isArray(data.photos) ? data.photos : [];
  const hasResults = results.length > 0;
  const isBlank = !hasResults && !data.client_name;

  const td = data.technical_data && typeof data.technical_data === 'object' ? data.technical_data : {};
  const objAttrs = data.object_attributes && typeof data.object_attributes === 'object' ? data.object_attributes : {};

  // 1. Result resolver helpers:
  const findResult = (patterns) => {
    const list = Array.isArray(patterns) ? patterns : [patterns];
    return results.find((r) => {
      const lbl = String(r.label || '').trim().toLowerCase();
      return list.some((pat) => (typeof pat === 'string' ? lbl.includes(pat.toLowerCase()) : pat.test(lbl)));
    });
  };

  const getResultVal = (patterns, fallback = '') => {
    const match = findResult(patterns);
    if (match) {
      if (match.text_value !== undefined && match.text_value !== null && String(match.text_value).trim() !== '') {
        return String(match.text_value).trim();
      }
      if (match.number_value !== undefined && match.number_value !== null && String(match.number_value).trim() !== '') {
        return `${match.number_value} ${match.unit || ''}`.trim();
      }
      if (match.choice_value) return match.choice_value;
      if (match.date_value) return formatDateIndo(match.date_value);
    }
    const list = Array.isArray(patterns) ? patterns : [patterns];
    for (const src of [td, objAttrs]) {
      for (const [k, v] of Object.entries(src)) {
        if (
          v !== undefined &&
          v !== null &&
          String(v).trim() !== '' &&
          list.some((pat) => (typeof pat === 'string' ? k.toLowerCase().includes(pat.toLowerCase()) : pat.test(k)))
        ) {
          return String(v).trim();
        }
      }
    }
    return fallback;
  };

  // Nilai opsi checklist disimpan dengan garis bawah (SESUAI / TIDAK_SESUAI),
  // sedangkan sebagian sumber memakai spasi. Normalisasi pemisah agar keduanya
  // dikenali; tanpa ini baris "Tidak Memenuhi" tercetak sebagai kotak kosong.
  const normalizeCondition = (raw) =>
    String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, ' ');

  const getConditionChoice = (patterns, forceBlank = false) => {
    if (isBlank || forceBlank) {
      return { ok: '☐', nok: '☐', ket: '' };
    }
    const match = findResult(patterns);
    if (!match || !match.choice_value) {
      return { ok: '☐', nok: '☐', ket: '' };
    }
    const val = normalizeCondition(match.choice_value);
    const ket = match.notes || match.keterangan || '';
    if (val === 'MEMENUHI' || val === 'SESUAI' || val === 'BAIK' || val === 'PASS' || val === 'OK') {
      return { ok: '√', nok: '-', ket };
    }
    if (
      val === 'TIDAK MEMENUHI' ||
      val === 'TIDAK SESUAI' ||
      val === 'TIDAK MEMENUHI SYARAT' ||
      val === 'BURUK' ||
      val === 'FAIL' ||
      val === 'NOK'
    ) {
      return { ok: '-', nok: '√', ket };
    }
    if (val === 'N/A' || val === 'NA' || val === 'TIDAK ADA') {
      return { ok: '-', nok: '-', ket: 'N/A' };
    }
    return { ok: '☐', nok: '☐', ket };
  };

  // 2. Photo resolver helpers:
  const findPhotoBuffer = (captionPatterns, indexFallback) => {
    const list = Array.isArray(captionPatterns) ? captionPatterns : [captionPatterns];
    const match = photos.find((p) => {
      const cap = String(p.caption || p.doc_category || p.category || p.originalName || '').toLowerCase();
      return list.some((pat) => (typeof pat === 'string' ? cap.includes(pat.toLowerCase()) : pat.test(cap)));
    });
    if (match) {
      if (match.buffer && Buffer.isBuffer(match.buffer)) return match.buffer;
      if (match.path && fs.existsSync(match.path)) return fs.readFileSync(match.path);
      const sk = match.storage_key || match.storageKey;
      if (sk) {
        try {
          const p = resolveAttachmentPath(sk);
          if (p && fs.existsSync(p)) return fs.readFileSync(p);
        } catch { /* berkas tidak dapat dibaca, lanjutkan tanpa gambar */ }
      }
    }
    if (indexFallback !== undefined && photos[indexFallback]) {
      const p = photos[indexFallback];
      if (p.buffer && Buffer.isBuffer(p.buffer)) return p.buffer;
      if (p.path && fs.existsSync(p.path)) return fs.readFileSync(p.path);
      const sk = p.storage_key || p.storageKey;
      if (sk) {
        try {
          const fp = resolveAttachmentPath(sk);
          if (fp && fs.existsSync(fp)) return fs.readFileSync(fp);
        } catch { /* berkas tidak dapat dibaca, lanjutkan tanpa gambar */ }
      }
    }
    return null;
  };

  const createPhotoPlaceholderCell = (caption, widthDxa = 5040, _heightDxa = 2400) => {
    return new TableCell({
      width: { size: widthDxa, type: WidthType.DXA },
      borders: TABLE_BORDERS_BLACK,
      shading: { fill: 'FFFFFF', type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: caption,
              bold: true,
              size: 20,
              font: 'Times New Roman'
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: '\n\n\n\n\n',
              size: 20
            })
          ],
          spacing: { after: 60 }
        })
      ]
    });
  };

  const createPhotoCell = (imgBuf, caption, widthDxa = 5040) => {
    return new TableCell({
      width: { size: widthDxa, type: WidthType.DXA },
      borders: TABLE_BORDERS_BLACK,
      margins: { top: 100, bottom: 100, left: 100, right: 100 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: caption,
              bold: true,
              size: 20,
              font: 'Times New Roman'
            })
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imgBuf,
              transformation: { width: 235, height: 165 }
            })
          ],
          spacing: { after: 60 }
        })
      ]
    });
  };

  // General field values
  // Nilai berisi spasi saja harus dianggap kosong agar placeholder/klausa tidak
  // mencetak teks kosong yang terlihat seperti data terisi.
  const clientName = String(data.client_name || data.customer_name || data.company_name || '').trim();
  const clientAddress = data.client_address || data.company_address || '';
  const picName = data.pic_name || data.user_name || data.pic || '';
  const location = String(data.install_location || data.location || '').trim();
  const serialNo = data.serial_number || data.no_seri || '';
  const brandModel = data.brand_model || (data.brand && data.model ? `${data.brand} / ${data.model}` : (data.brand || data.model || ''));
  const yearStr = data.manufacture_year || data.manufacturing_year || data.year || '';
  const rawCapacity = String(data.capacity || '').trim();
  const capacityStr = rawCapacity
    ? /[a-zA-Z]/.test(rawCapacity)
      ? rawCapacity
      : `${rawCapacity} ${data.capacity_unit || 'kg'}`
    : '';
  const inspDateStr = formatDateIndo(data.inspected_at || data.inspection_date) || '';
  const reInspDateStr = addYear(data.inspected_at || data.inspection_date, 1) || '';
  const permitNo = data.previous_permit_no || data.permit_number || data.license_no || '';
  const lhppNo = report.lhppNo || data.lhpp_no || '';
  const inspectorName = data.inspector_name || '';
  const inspectorSkpNo = data.inspector_skp_no || '';
  const reportDateStr = formatDateIndo(data.report_date || data.submitted_at) || formatDateIndo(new Date());

  // ---------------------------------------------------------------------------
  // SECTION 1: COVER PAGE
  // ---------------------------------------------------------------------------
  const redBannerTop = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    borders: TABLE_BORDERS_NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { fill: 'CC0000', type: ShadingType.CLEAR },
            children: [new Paragraph({ text: '', spacing: { before: 200, after: 200 } })]
          })
        ]
      })
    ]
  });

  const yearParagraph = new Paragraph({
    children: [
      new TextRun({
        text: String(yearStr || new Date().getFullYear()),
        bold: true,
        underline: {},
        size: 48,
        font: 'Times New Roman'
      })
    ],
    spacing: { before: 240, after: 180 }
  });

  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN\n',
        bold: true,
        size: 30,
        font: 'Times New Roman'
      }),
      new TextRun({
        text: 'SERTIFIKASI\n',
        bold: true,
        size: 28,
        font: 'Times New Roman'
      }),
      new TextRun({
        text: 'PESAWAT ANGKAT DAN PESAWAT ANGKUT',
        bold: true,
        size: 30,
        font: 'Times New Roman'
      })
    ],
    spacing: { before: 180, after: 240 }
  });

  const coverInfoTable = new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [3000, 6000],
    borders: TABLE_BORDERS_NONE,
    rows: [
      new TableRow({
        children: [
          createCell('Perusahaan', { widthDxa: 3000, bold: true, size: 24, font: 'Times New Roman' }),
          createCell(`: ${clientName || '............................................................'}`, { widthDxa: 6000, bold: true, size: 24, font: 'Times New Roman' })
        ]
      }),
      new TableRow({
        children: [
          createCell('Jenis', { widthDxa: 3000, bold: true, size: 24, font: 'Times New Roman' }),
          createCell(': PAA / Forklift', { widthDxa: 6000, bold: true, size: 24, font: 'Times New Roman' })
        ]
      }),
      new TableRow({
        children: [
          createCell('SN', { widthDxa: 3000, bold: true, size: 24, font: 'Times New Roman' }),
          createCell(`: ${[serialNo, capacityStr, yearStr].filter(Boolean).join(' / ') || '............................................................'}`, { widthDxa: 6000, bold: true, size: 24, font: 'Times New Roman' })
        ]
      }),
      new TableRow({
        children: [
          createCell('Lokasi', { widthDxa: 3000, bold: true, size: 24, font: 'Times New Roman' }),
          createCell(`: ${location || '............................................................'}`, { widthDxa: 6000, bold: true, size: 24, font: 'Times New Roman' })
        ]
      }),
      new TableRow({
        children: [
          createCell('Inspected', { widthDxa: 3000, bold: true, size: 24, font: 'Times New Roman' }),
          createCell(`: ${inspDateStr || '............................................................'}`, { widthDxa: 6000, bold: true, size: 24, font: 'Times New Roman' })
        ]
      }),
      new TableRow({
        children: [
          createCell('Re – Inspection', { widthDxa: 3000, bold: true, size: 24, font: 'Times New Roman' }),
          createCell(`: ${reInspDateStr || '............................................................'}`, { widthDxa: 6000, bold: true, size: 24, font: 'Times New Roman' })
        ]
      })
    ]
  });

  // Cover photo slot: only use if uploaded by user; otherwise render clean bordered box!
  const coverPhotoBuf = findPhotoBuffer(['cover', 'unit', 'depan'], 0);
  const coverHeroElement = coverPhotoBuf
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: coverPhotoBuf,
            transformation: { width: 330, height: 248 }
          })
        ],
        spacing: { before: 200, after: 180 }
      })
    : new Table({
        width: { size: 6000, type: WidthType.DXA },
        columnWidths: [6000],
        borders: TABLE_BORDERS_BLACK,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 6000, type: WidthType.DXA },
                shading: { fill: 'FAFAFA', type: ShadingType.CLEAR },
                margins: { top: 200, bottom: 200, left: 200, right: 200 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: '\n\n\n[ Tempelkan Foto Unit Forklift di Sini ]\n\n\n',
                        size: 20,
                        italics: true,
                        font: 'Times New Roman',
                        color: '888888'
                      })
                    ],
                    spacing: { before: 200, after: 200 }
                  })
                ]
              })
            ]
          })
        ]
      });

  const coverFooterParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: 'PT. UPAYA RIKSA DAYA\n',
        bold: true,
        size: 22,
        font: 'Times New Roman',
        color: 'FF0000'
      }),
      new TextRun({
        text: 'Jl. Pondasi No. 50B Kampung Ambon, Jakarta Timur. 13210\n',
        size: 20,
        font: 'Times New Roman'
      }),
      new TextRun({
        text: 'Ph. 021 4891409, 021 4715699, 021 47861912\n',
        size: 20,
        font: 'Times New Roman'
      }),
      new TextRun({
        text: 'Email: urd@upayariksadaya.com   Web. upayariksa.com',
        size: 20,
        font: 'Times New Roman',
        color: '0000EE',
        underline: {}
      })
    ],
    spacing: { before: 180, after: 220 }
  });

  const redBannerBottom = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [10080],
    borders: TABLE_BORDERS_NONE,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 10080, type: WidthType.DXA },
            shading: { fill: 'CC0000', type: ShadingType.CLEAR },
            children: [new Paragraph({ text: '', spacing: { before: 200, after: 200 } })]
          })
        ]
      })
    ]
  });

  // ---------------------------------------------------------------------------
  // SECTION 2: CONTENT PAGES (BAB I s/d LAMPIRAN)
  // ---------------------------------------------------------------------------
  const contentChildren = [];

  // ===========================================================================
  // PAGE 2: BAB I. DATA UMUM (Single Table with Title inside Header)
  // ===========================================================================
  const bab1Rows = [
    new TableRow({
      children: [
        createCell(
          [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN\nPESAWAT ANGKAT DAN PESAWAT ANGKUT\n',
                  bold: true,
                  size: 22,
                  font: 'Times New Roman'
                }),
                new TextRun({
                  text: `NO. ${lhppNo || '........................................'}`,
                  bold: true,
                  size: 22,
                  font: 'Times New Roman'
                })
              ]
            })
          ],
          { widthDxa: 10080, columnSpan: 2 }
        )
      ]
    }),
    new TableRow({
      children: [
        createCell('I. DATA UMUM', { widthDxa: 10080, columnSpan: 2, bold: true, size: 22, font: 'Times New Roman' })
      ]
    }),
    ...[
      ['Pemilik', clientName],
      ['Alamat', clientAddress],
      ['Pemakai', getResultVal([/pemakai/i], clientName)],
      ['Alamat', getResultVal([/alamat.*pemakai/i], clientAddress)],
      ['Pengurus / Penanggung jawab', picName || getResultVal([/pengurus|penanggung/i], '')],
      ['Lokasi Unit', location],
      ['Jenis Pesawat', 'Forklift'],
      ['Nomor Seri Unit', serialNo],
      ['Merk / Model', brandModel],
      ['Tahun', yearStr],
      ['Kapasitas Angkat', capacityStr],
      ['Standard yang dipakai', 'Permenaker No. 8 Tahun 2020'],
      ['Digunakan untuk', getResultVal([/digunakan untuk/i], 'Mengangkat dan Memindahkan Material')],
      ['Tanggal diperiksa', inspDateStr],
      ['Jenis Pemeriksaan', data.inspection_type_code || data.inspection_type || 'Berkala'],
      ['Nomor Ijin Pemakai', permitNo],
      ['Diperiksa Oleh', 'PT UPAYA RIKSA DAYA']
    ].map(
      ([lbl, val]) =>
        new TableRow({
          children: [
            createCell(lbl, { widthDxa: 3600, size: 20, font: 'Times New Roman' }),
            createCell(`: ${val || '............................................................'}`, { widthDxa: 6480, size: 20, font: 'Times New Roman' })
          ]
        })
    )
  ];

  contentChildren.push(
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      columnWidths: [3600, 6480],
      borders: TABLE_BORDERS_BLACK,
      rows: bab1Rows
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===========================================================================
  // PAGE 3: BAB II. DATA TEKNIS (Single Master Table with Merged Cells)
  // Grid: [2400, 1800, 1800, 4080] = 10080 DXA
  // ===========================================================================
  const bab2Rows = [
    // Header Row
    new TableRow({
      children: [
        createCell('II. DATA TEKNIS', { widthDxa: 10080, columnSpan: 4, bold: true, size: 22, font: 'Times New Roman' })
      ]
    }),
    // 1. SPESIFIKASI PESAWAT (4 rows)
    new TableRow({
      children: [
        createCell('SPESIFIKASI\nPESAWAT', { widthDxa: 2400, rowSpan: 4, bold: true, align: AlignmentType.CENTER }),
        createCell('Perlengkapan / Attachment', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/perlengkapan|attachment/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Kecepatan\n/Speed', { widthDxa: 1800, rowSpan: 3 }),
        createCell('Lifting', { widthDxa: 1800 }),
        createCell(getResultVal([/kecepatan angkat|lifting speed/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Lowering', { widthDxa: 1800 }),
        createCell(getResultVal([/kecepatan turun|lowering speed/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Travelling', { widthDxa: 1800 }),
        createCell(getResultVal([/kecepatan jalan|travelling speed/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),

    // 2. PENGGERAK UTAMA (12 rows)
    new TableRow({
      children: [
        createCell('PENGGERAK\nUTAMA', { widthDxa: 2400, rowSpan: 12, bold: true, align: AlignmentType.CENTER }),
        createCell('Jenis penggerak motor bakar', { widthDxa: 7680, columnSpan: 3, bold: true })
      ]
    }),
    new TableRow({
      children: [
        createCell('Putaran (rpm)', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/putaran.*rpm|rpm/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Merk / Tipe', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/merk.*mesin|tipe.*mesin|penggerak utama/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Nomor Seri', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/nomor seri.*mesin/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Tahun Pembuatan', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/tahun.*mesin/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Daya', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/daya.*mesin|daya/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Jumlah Silinder', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/jumlah silinder/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Jenis penggerak DC Motor', { widthDxa: 7680, columnSpan: 3, bold: true })
      ]
    }),
    new TableRow({
      children: [
        createCell('Type', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/type dc motor/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Power of hydraulic motor', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/power.*hydraulic/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Power of drive motor', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/power.*drive/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Battery Capacity', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/battery/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),

    // 3. DIMENSI (4 rows)
    new TableRow({
      children: [
        createCell('DIMENSI', { widthDxa: 2400, rowSpan: 4, bold: true, align: AlignmentType.CENTER }),
        createCell('Panjang', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/dimensi panjang|panjang unit/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Lebar', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/dimensi lebar|lebar unit/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Tinggi', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/dimensi tinggi|tinggi unit/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Tinggi angkat garpu / attachment', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/tinggi angkat/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),

    // 4. TEKANAN RODA (2 rows)
    new TableRow({
      children: [
        createCell('TEKANAN RODA', { widthDxa: 2400, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Roda depan', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/tekanan roda depan/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Roda belakang', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/tekanan roda belakang/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),

    // 5. RODA DEPAN (2 rows)
    new TableRow({
      children: [
        createCell('RODA DEPAN', { widthDxa: 2400, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Ukuran', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/ukuran roda depan/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Type', { widthDxa: 3600, columnSpan: 2, italics: true }),
        createCell(getResultVal([/tipe roda depan/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),

    // 6. RODA BELAKANG (2 rows)
    new TableRow({
      children: [
        createCell('RODA BELAKANG', { widthDxa: 2400, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Ukuran', { widthDxa: 3600, columnSpan: 2 }),
        createCell(getResultVal([/ukuran roda belakang/i], ': ....................'), { widthDxa: 4080 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Type', { widthDxa: 3600, columnSpan: 2, italics: true }),
        createCell(getResultVal([/tipe roda belakang/i], ': ....................'), { widthDxa: 4080 })
      ]
    })
  ];

  contentChildren.push(
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      columnWidths: [2400, 1800, 1800, 4080],
      borders: TABLE_BORDERS_BLACK,
      rows: bab2Rows
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===========================================================================
  // PAGES 4 TO 7: BAB III. PEMERIKSAAN VISUAL & FUNGSI (5 KOLOM LENGKAP)
  // Grid: [1800, 2000, 3480, 950, 950, 900] = 10080 DXA
  // ===========================================================================
  // Kondisi Memenuhi/Tidak Memenuhi selalu diturunkan dari hasil inspeksi nyata
  // (choice_value), atau ☐ pada blanko kosong. Tidak ada jalur yang memaksa NOK,
  // karena menandai temuan gagal tanpa data akan memfabrikasi hasil dokumen resmi.
  const makeVisualRow = (col1, col2, col3, searchRegex) => {
    const cond = getConditionChoice([searchRegex, col3]);
    const cells = [];
    if (col1) cells.push(col1);
    if (col2) cells.push(col2);
    cells.push(
      createCell(col3, { widthDxa: 3480 }),
      createCell(cond.ok, { widthDxa: 950, align: AlignmentType.CENTER }),
      createCell(cond.nok, { widthDxa: 950, align: AlignmentType.CENTER }),
      createCell(cond.ket || (isBlank ? '' : '-'), { widthDxa: 900, align: AlignmentType.CENTER })
    );
    return new TableRow({ children: cells });
  };

  const bab3Rows = [
    // Header 1: Title
    new TableRow({
      children: [
        createCell('III. PEMERIKSAAN VISUAL & FUNGSI', { widthDxa: 10080, columnSpan: 6, bold: true, size: 22 })
      ]
    }),
    // Header 2: Main Column Titles
    new TableRow({
      children: [
        createCell('Lokasi', { widthDxa: 1800, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Komponen', { widthDxa: 2000, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Pemeriksaan\nKomponen', { widthDxa: 3480, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Kondisi', { widthDxa: 1900, columnSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Keterangan', { widthDxa: 900, rowSpan: 2, bold: true, align: AlignmentType.CENTER })
      ]
    }),
    // Header 3: Sub-Kondisi
    new TableRow({
      children: [
        createCell('Memenuhi', { widthDxa: 950, bold: true, align: AlignmentType.CENTER, size: 18 }),
        createCell('Tidak\nMemenuhi', { widthDxa: 950, bold: true, align: AlignmentType.CENTER, size: 18 })
      ]
    }),

    // --- PAGE 4: Kerangka Utama / Chasis & Penggerak Utama ---
    makeVisualRow(createCell('Kerangka\nUtama /\nChasis', { widthDxa: 1800, rowSpan: 9, bold: true }), createCell('Rangka\nPenguat', { widthDxa: 2000, rowSpan: 3 }), 'Korosi', /korosi.*rangka/i),
    makeVisualRow(null, null, 'Keretakan', /keretakan.*rangka/i),
    makeVisualRow(null, null, 'Perubahan Bentuk', /perubahan bentuk.*rangka/i),
    makeVisualRow(null, createCell('Pemberat\n(C/W)', { widthDxa: 2000, rowSpan: 2 }), 'Korosi', /korosi.*pemberat/i),
    makeVisualRow(null, null, 'Kondisi', /kondisi.*pemberat/i),
    makeVisualRow(null, createCell('Perlengkapan\nLain', { widthDxa: 2000, rowSpan: 4 }), 'Lantai/Dek', /lantai|dek/i),
    makeVisualRow(null, null, 'Tangga / pijakan', /tangga|pijakan/i),
    makeVisualRow(null, null, 'Baut-baut Pengikat', /baut pengikat/i),
    makeVisualRow(null, null, 'Dudukan Operator\n(Jok)', /jok|operator seat/i),

    makeVisualRow(createCell('Penggerak\nUtama', { widthDxa: 1800, rowSpan: 17, bold: true }), createCell('Sistem', { widthDxa: 2000, rowSpan: 7 }), 'Pendinginan', /pendingin/i),
    makeVisualRow(null, null, 'Pelumas', /pelumas.*mesin/i),
    makeVisualRow(null, null, 'Bahan bakar', /bahan bakar/i),
    makeVisualRow(null, null, 'Pemasukan udara', /pemasukan udara|air intake/i),
    makeVisualRow(null, null, 'Gas buang', /gas buang|exhaust/i),
    makeVisualRow(null, null, 'Starter', /starter/i),
    makeVisualRow(null, null, 'Motor elektrik', /motor elektrik/i),
    makeVisualRow(null, createCell('Kelistrikan', { widthDxa: 2000, rowSpan: 10 }), 'Accu / Battery', /accu|battery/i),
    makeVisualRow(null, null, 'Dinamo starting', /dinamo start/i),
    makeVisualRow(null, null, 'Alternator', /alternator/i),
    makeVisualRow(null, null, 'Kabel Accu', /kabel accu/i),
    makeVisualRow(null, null, 'Kabel instalasi', /kabel instalasi/i),
    makeVisualRow(null, null, 'Lampu penerangan', /lampu penerangan/i),
    makeVisualRow(null, null, 'Lampu pengaman\n/Sign', /lampu sign|lampu pengaman/i),
    makeVisualRow(null, null, 'Klakson', /klakson/i),
    makeVisualRow(null, null, 'Penghapus kaca\n/Wiper', /wiper/i),
    makeVisualRow(null, null, 'Pengaman lebur /\nSekring', /sekring|fuse/i),

    // --- PAGE 5: Dash Board & Komponen Bagian Bawah ---
    makeVisualRow(createCell('Penggerak\nUtama', { widthDxa: 1800, rowSpan: 9, bold: true }), createCell('Dash Board', { widthDxa: 2000, rowSpan: 9, italics: true }), 'Indikator\ntemperature', /indikator temperature/i),
    makeVisualRow(null, null, 'Tekanan oli mesin', /tekanan oli/i),
    makeVisualRow(null, null, 'Tekanan hidrolik', /tekanan hidrolik/i),
    makeVisualRow(null, null, 'Hour Meter', /hour meter/i),
    makeVisualRow(null, null, 'Pemanas awal /\nGlow Plug', /glow plug|pemanas awal/i),
    makeVisualRow(null, null, 'Indikator bahan\nbakar', /indikator bahan bakar/i),
    makeVisualRow(null, null, 'Indikator beban', /indikator beban/i),
    makeVisualRow(null, null, 'Load\nChart/NamePlate', /load chart|nameplate/i),
    makeVisualRow(null, null, 'Pengisian accu /\nAmpere', /pengisian accu|ampere/i),

    makeVisualRow(createCell('Komponen\nBagian\nBawah', { widthDxa: 1800, rowSpan: 13, bold: true }), createCell('Sistem\nKemudi', { widthDxa: 2000, rowSpan: 7 }), 'Kemudi roda', /kemudi roda/i),
    makeVisualRow(null, null, 'Batang kemudi', /batang kemudi/i),
    makeVisualRow(null, null, 'Kotak gigi / Gear\nBox', /gear box|kotak gigi/i),
    makeVisualRow(null, null, 'Pengubah gerak /\nPitman', /pitman/i),
    makeVisualRow(null, null, 'Batang tarik /Drag\nlink', /drag link/i),
    makeVisualRow(null, null, 'Tie rod', /tie rod/i),
    makeVisualRow(null, null, 'Pelumasan', /pelumasan kemudi/i),
    makeVisualRow(null, createCell('Roda', { widthDxa: 2000, rowSpan: 6 }), 'Front', /roda front|roda depan/i),
    makeVisualRow(null, null, 'Rear', /roda rear|roda belakang/i),
    makeVisualRow(null, null, 'Baut pengikat', /baut pengikat roda/i),
    makeVisualRow(null, null, 'Tromol / Hub', /tromol|hub/i),
    makeVisualRow(null, null, 'Pelumasan', /pelumasan roda/i),
    makeVisualRow(null, null, 'Perlengkapan\nmekanis', /perlengkapan mekanis roda/i),

    // --- PAGE 6: Kopling, Gardan, Rem, Transmisi ---
    makeVisualRow(createCell('Komponen\nBagian\nBawah', { widthDxa: 1800, rowSpan: 11, bold: true }), createCell('Kopling', { widthDxa: 2000, rowSpan: 6 }), 'Rumah kopling', /rumah kopling/i),
    makeVisualRow(null, null, 'Kondisi Kopling', /kondisi kopling/i),
    makeVisualRow(null, null, 'Pelumas/oli\ntransmisi', /oli transmisi/i),
    makeVisualRow(null, null, 'Kebocoran\ntransmisi', /kebocoran transmisi/i),
    makeVisualRow(null, null, 'Poros penghubung', /poros penghubung/i),
    makeVisualRow(null, null, 'Perlengkapan\nmekanis', /mekanis kopling/i),
    makeVisualRow(null, createCell('Gardan\n(Differential)', { widthDxa: 2000, rowSpan: 5 }), 'Rumah gardan', /rumah gardan/i),
    makeVisualRow(null, null, 'Kondisi gardan', /kondisi gardan/i),
    makeVisualRow(null, null, 'Pelumasan/oli\ngardan', /oli gardan/i),
    makeVisualRow(null, null, 'Kebocoran gardan', /kebocoran gardan/i),
    makeVisualRow(null, null, 'Poros penghubung', /poros gardan/i),

    makeVisualRow(createCell('Komponen\nBagian\nBawah', { widthDxa: 1800, rowSpan: 9, bold: true }), createCell('Rem (Brake)', { widthDxa: 2000, rowSpan: 5 }), 'Kondisi rem utama', /rem utama/i),
    makeVisualRow(null, null, 'Kondisi rem tangan', /rem tangan|rem parkir/i),
    makeVisualRow(null, null, 'Kondisi rem darurat', /rem darurat/i),
    makeVisualRow(null, null, 'Kebocoran', /kebocoran rem/i),
    makeVisualRow(null, null, 'Komponen mekanis', /komponen mekanis rem/i),
    makeVisualRow(null, createCell('Transmisi', { widthDxa: 2000, rowSpan: 4 }), 'Rumah transmisi', /rumah transmisi/i),
    makeVisualRow(null, null, 'Pelumas/oli\ntransmisi', /oli transmisi/i),
    makeVisualRow(null, null, 'Kebocoran transmisi', /kebocoran transmisi/i),
    makeVisualRow(null, null, 'Perlengkapan\nmekanis', /mekanis transmisi/i),

    // --- PAGE 7: Attachment, Hidrolik, Charging ---
    makeVisualRow(createCell('Attachment /\nPerlengkapan', { widthDxa: 1800, rowSpan: 8, bold: true, italics: true }), createCell('Tiang\nPenyangga\n(Mast)', { widthDxa: 2000, rowSpan: 5 }), 'Keausan', /keausan mast/i),
    makeVisualRow(null, null, 'Keretakan', /keretakan mast/i),
    makeVisualRow(null, null, 'Perubahan bentuk', /perubahan bentuk mast/i),
    makeVisualRow(null, null, 'Pelumasan', /pelumasan mast/i),
    makeVisualRow(null, null, 'Poros dan bantalan', /poros.*bantalan/i),
    makeVisualRow(null, createCell('Rantai\nPengangkat\n(Lift Chain)', { widthDxa: 2000, rowSpan: 3 }), 'Kondisi rantai', /kondisi rantai/i),
    makeVisualRow(null, null, 'Perubahan bentuk', /perubahan bentuk rantai/i),
    makeVisualRow(null, null, 'Pelumasan rantai', /pelumasan rantai/i),

    makeVisualRow(createCell('Komponen\nHidrolik', { widthDxa: 1800, rowSpan: 18, bold: true }), createCell('Tangki', { widthDxa: 2000, rowSpan: 5 }), 'Kebocoran', /kebocoran tangki hidrolik/i),
    makeVisualRow(null, null, 'Level oli hidrolik', /level oli hidrolik/i),
    makeVisualRow(null, null, 'Kondisi oli hidrolik', /kondisi oli hidrolik/i),
    makeVisualRow(null, null, 'Kondisi saluran isap', /saluran isap hidrolik/i),
    makeVisualRow(null, null, 'Kondisi saluran\nbalik', /saluran balik hidrolik/i),
    makeVisualRow(null, createCell('Pompa', { widthDxa: 2000, rowSpan: 5 }), 'Kebocoran', /kebocoran pompa/i),
    makeVisualRow(null, null, 'Kondisi saluran isap', /saluran isap pompa/i),
    makeVisualRow(null, null, 'Kondisi saluran\ntekan', /saluran tekan pompa/i),
    makeVisualRow(null, null, 'Fungsi', /fungsi pompa/i),
    makeVisualRow(null, null, 'Kelainan suara', /kelainan suara pompa/i),
    makeVisualRow(null, createCell('Katup\nPengontrol /\nControl\nValve', { widthDxa: 2000, rowSpan: 6 }), 'Kebocoran', /kebocoran valve/i),
    makeVisualRow(null, null, 'Kondisi saluran', /saluran valve/i),
    makeVisualRow(null, null, 'Fungsi relief valve', /relief valve/i),
    makeVisualRow(null, null, 'Fungsi Katup\nSilinder Angkat', /katup silinder angkat/i),
    makeVisualRow(null, null, 'Fungsi katup\nsilinder ungkit', /katup silinder ungkit/i),
    makeVisualRow(null, null, 'Fungsi katup\nsilinder kemudi', /katup silinder kemudi/i),
    makeVisualRow(null, createCell('Aktuator', { widthDxa: 2000, rowSpan: 2 }), 'Kebocoran', /kebocoran aktuator/i),
    makeVisualRow(null, null, 'Kondisi saluran', /saluran aktuator/i),

    makeVisualRow(createCell('Charging', { widthDxa: 1800, rowSpan: 3, bold: true }), createCell('Sistem\nPengisian\nBattery', { widthDxa: 2000, rowSpan: 3 }), 'Socket / Fitting', /socket|fitting/i),
    makeVisualRow(null, null, 'Kabel', /kabel charging/i),
    makeVisualRow(null, null, 'Ruangan', /ruangan charging/i)
  ];

  contentChildren.push(
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      columnWidths: [1800, 2000, 3480, 950, 950, 900],
      borders: TABLE_BORDERS_BLACK,
      rows: bab3Rows
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===========================================================================
  // PAGE 8: BAB IV. PEMERIKSAAN DENGAN MESIN HIDUP (4 KOLOM)
  // Grid: [4880, 1800, 1800, 1600] = 10080 DXA
  // ===========================================================================
  const makeEngineRow = (param, searchRegex) => {
    const cond = getConditionChoice([searchRegex, param]);
    return new TableRow({
      children: [
        createCell(param, { widthDxa: 4880 }),
        createCell(cond.ok, { widthDxa: 1800, align: AlignmentType.CENTER }),
        createCell(cond.nok, { widthDxa: 1800, align: AlignmentType.CENTER }),
        createCell(cond.ket || (isBlank ? '' : '-'), { widthDxa: 1600, align: AlignmentType.CENTER })
      ]
    });
  };

  const bab4Rows = [
    new TableRow({
      children: [
        createCell('IV. PEMERIKSAAN DENGAN MESIN HIDUP', { widthDxa: 10080, columnSpan: 4, bold: true, size: 22 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Pemeriksaan\nKomponen', { widthDxa: 4880, rowSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Kondisi', { widthDxa: 3600, columnSpan: 2, bold: true, align: AlignmentType.CENTER }),
        createCell('Keterangan', { widthDxa: 1600, rowSpan: 2, bold: true, align: AlignmentType.CENTER })
      ]
    }),
    new TableRow({
      children: [
        createCell('Memenuhi\nSyarat K3', { widthDxa: 1800, bold: true, align: AlignmentType.CENTER, size: 18 }),
        createCell('Tidak\nMemenuhi\nSyarat K3', { widthDxa: 1800, bold: true, align: AlignmentType.CENTER, size: 18 })
      ]
    }),
    makeEngineRow('Dinamo starter', /dinamo starter/i),
    makeEngineRow('Kerja instrument/ Indikator', /kerja instrument|indikator/i),
    makeEngineRow('Kerja perlengkapan listrik (busi, rotor, dll.\nPada bensin)', /perlengkapan listrik/i),
    makeEngineRow('Kebocoran-kebocoran :', /kebocoran/i),
    makeEngineRow('- oli engine', /kebocoran.*oli engine/i),
    makeEngineRow('- Bahan bakar', /kebocoran.*bahan bakar/i),
    makeEngineRow('- air pendingin', /kebocoran.*air pendingin/i),
    makeEngineRow('- oli hidrolik', /kebocoran.*oli hidrolik/i),
    makeEngineRow('- oli transmisi', /kebocoran.*oli transmisi/i),
    makeEngineRow('- oli final drive', /kebocoran.*oli final drive/i),
    makeEngineRow('Kondisi gas buang', /gas buang/i),
    makeEngineRow('Kondisi getaran dan suara', /getaran.*suara/i),
    makeEngineRow('Kondisi kelengkapan lainnya :', /kelengkapan lainnya/i),
    makeEngineRow('- Lampu-lampu', /lampu/i),
    makeEngineRow('- Klakson', /klakson/i),
    makeEngineRow('- Spion', /spion/i),
    makeEngineRow('- Alarm mundur', /alarm mundur/i),
    makeEngineRow('- Rotary lamp', /rotary/i),
    makeEngineRow('- Safety belt', /safety belt/i),
    makeEngineRow('- APAR', /apar/i),
    makeEngineRow('- Rem parkir / tangan', /rem parkir|rem tangan/i),
    makeEngineRow('- Rem pelayanan / kaki', /rem kaki|rem pelayanan/i),
    makeEngineRow('- Kemudi', /kemudi/i),
    makeEngineRow('- Mast silinder angkat (angkat & turun)', /mast.*angkat/i),
    makeEngineRow('- Mast silinder ungkit (maju & mundur)', /mast.*ungkit/i),
    makeEngineRow('- Attachment kerja silinder', /attachment.*silinder/i),
    makeEngineRow('- Kelainan suara hidrolik', /suara hidrolik/i),
    makeEngineRow('- Tuas-tuas kendali', /tuas kendali/i)
  ];

  contentChildren.push(
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      columnWidths: [4880, 1800, 1800, 1600],
      borders: TABLE_BORDERS_BLACK,
      rows: bab4Rows
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===========================================================================
  // PAGE 9: LAPORAN HASIL PENGUJIAN NON DESTRUCTIVE TEST (NDT) - MPI
  // Grid: [2000, 900, 900, 2500, 1500, 2280] = 10080 DXA
  // ===========================================================================
  const ndtForkKananBuf = findPhotoBuffer(['ndt fork kanan', 'fork kanan', 'ndt kanan']);
  const ndtForkKiriBuf = findPhotoBuffer(['ndt fork kiri', 'fork kiri', 'ndt kiri']);

  const ndtRows = [
    new TableRow({
      children: [
        createCell('PT UPAYA RIKSA DAYA', { widthDxa: 10080, columnSpan: 6, bold: true, size: 24, align: AlignmentType.CENTER })
      ]
    }),
    new TableRow({
      children: [
        createCell('LAPORAN HASIL PENGUJIAN NON DESTRUCTIVE TEST ( NDT )\nMAGNETIC PARTICLES INSPECTION ( MPI )', {
          widthDxa: 10080,
          columnSpan: 6,
          bold: true,
          size: 20,
          align: AlignmentType.CENTER
        })
      ]
    }),
    new TableRow({
      children: [
        createCell('Customer', { widthDxa: 2000 }),
        createCell(`: ${clientName || '............................................................'}`, { widthDxa: 4300, columnSpan: 3 }),
        createCell('Date of Inspection', { widthDxa: 1500 }),
        createCell(`: ${inspDateStr || '....................'}`, { widthDxa: 2280 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Location', { widthDxa: 2000 }),
        createCell(`: ${location || '............................................................'}`, { widthDxa: 4300, columnSpan: 3 }),
        createCell('Report No.', { widthDxa: 1500 }),
        createCell(`: ${lhppNo || '....................'}`, { widthDxa: 2280 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Item Inspected', { widthDxa: 2000 }),
        createCell(': Fork / Garpu', { widthDxa: 4300, columnSpan: 3 }),
        createCell('Reference Standard', { widthDxa: 1500 }),
        createCell(': ASME BPVC Sec. V Art. 7', { widthDxa: 2280 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Unit / Serial No.', { widthDxa: 2000 }),
        createCell(`: ${serialNo || '............................................................'}`, { widthDxa: 4300, columnSpan: 3 }),
        createCell('Acceptance Criteria', { widthDxa: 1500 }),
        createCell(': ASME BPVC Sec. VIII Div 1', { widthDxa: 2280 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Equipment / Material Data', { widthDxa: 10080, columnSpan: 6, bold: true, size: 20 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Equipment', { widthDxa: 2000, rowSpan: 2 }),
        createCell('Merk', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Magnaflux', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Type', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Y-7 AC Yoke', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Cleaner', { widthDxa: 2000, rowSpan: 2 }),
        createCell('Merk', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Magnaflux SKC-S', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Application', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Spraying', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Contrast', { widthDxa: 2000, rowSpan: 2 }),
        createCell('Merk', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Magnaflux WCP-2', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Application', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Spraying', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Magnetic Particle', { widthDxa: 2000, rowSpan: 2 }),
        createCell('Merk', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Magnaflux 7HF', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    new TableRow({
      children: [
        createCell('Application', { widthDxa: 1800, columnSpan: 2 }),
        createCell(': Spraying', { widthDxa: 6280, columnSpan: 3 })
      ]
    }),
    // Results Table Subheaders
    new TableRow({
      children: [
        createCell('No', { widthDxa: 800, bold: true, align: AlignmentType.CENTER }),
        createCell('Description', { widthDxa: 3000, columnSpan: 2, bold: true }),
        createCell('Indication', { widthDxa: 2500, bold: true, align: AlignmentType.CENTER }),
        createCell('Result', { widthDxa: 1500, bold: true, align: AlignmentType.CENTER }),
        createCell('Remark', { widthDxa: 2280, bold: true, align: AlignmentType.CENTER })
      ]
    }),
    new TableRow({
      children: [
        createCell('1', { widthDxa: 800, align: AlignmentType.CENTER }),
        createCell('Fork kanan', { widthDxa: 3000, columnSpan: 2 }),
        createCell(isBlank ? '....................' : 'No Indication', { widthDxa: 2500, align: AlignmentType.CENTER }),
        createCell(isBlank ? '......' : 'ACC', { widthDxa: 1500, align: AlignmentType.CENTER }),
        createCell('-', { widthDxa: 2280, align: AlignmentType.CENTER })
      ]
    }),
    new TableRow({
      children: [
        createCell('2', { widthDxa: 800, align: AlignmentType.CENTER }),
        createCell('Fork kiri', { widthDxa: 3000, columnSpan: 2 }),
        createCell(isBlank ? '....................' : 'No Indication', { widthDxa: 2500, align: AlignmentType.CENTER }),
        createCell(isBlank ? '......' : 'ACC', { widthDxa: 1500, align: AlignmentType.CENTER }),
        createCell('-', { widthDxa: 2280, align: AlignmentType.CENTER })
      ]
    }),
    // Photos of Forks: clean placeholders if no photo uploaded!
    new TableRow({
      children: [
        ndtForkKananBuf
          ? createPhotoCell(ndtForkKananBuf, 'Fork kanan', 5040)
          : createPhotoPlaceholderCell('Foto NDT MPI Fork Kanan', 5040),
        ndtForkKiriBuf
          ? createPhotoCell(ndtForkKiriBuf, 'Fork kiri', 5040)
          : createPhotoPlaceholderCell('Foto NDT MPI Fork Kiri', 5040)
      ]
    })
  ];

  contentChildren.push(
    new Table({
      width: { size: 10080, type: WidthType.DXA },
      columnWidths: [2000, 900, 900, 2500, 1500, 2280],
      borders: TABLE_BORDERS_BLACK,
      rows: ndtRows
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===========================================================================
  // PAGE 10: BAB V. PENGUJIAN & DEFLEKSI GARPU (PERMENAKER 8/2020)
  // ===========================================================================
  const diagramPath = getTemplateAsset('diagram_defleksi.png');

  contentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'V.   PENGUJIAN',
          bold: true,
          size: 26,
          font: 'Times New Roman'
        })
      ],
      spacing: { before: 180, after: 140 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Pengujian Tanpa Beban   :   ', bold: true, size: 22, font: 'Times New Roman' }),
        new TextRun({
          text: 'Forklift dilakukan pengujian Tanpa Beban dengan menyalakan mesin, berbelok kanan dan kiri, mengangkat fork dengan ketinggian maksimal dengan keadaan Normal dan Baik.',
          size: 22,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 180 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Pengujian dengan Beban   :   ', bold: true, size: 22, font: 'Times New Roman' }),
        new TextRun({
          text: `Forklift dilakukan pengujian beban kerja aman (SWL) ${capacityStr || '....................'} dengan mengangkat beban pada ketinggian efektif, menahan beban selama pengujian, dan melakukan pengukuran defleksi kelenturan garpu.`,
          size: 22,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 180 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PENGUKURAN DEFLEKSI KELENTURAN GARPU (FORK)\n(SESUAI DENGAN STANDAR PERMENAKER NO. 8 TAHUN 2020 PASAL 77)',
          bold: true,
          size: 20,
          font: 'Times New Roman'
        })
      ],
      spacing: { before: 100, after: 140 }
    })
  );

  if (diagramPath && fs.existsSync(diagramPath)) {
    contentChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: fs.readFileSync(diagramPath),
            transformation: { width: 440, height: 160 }
          })
        ],
        spacing: { after: 140 }
      })
    );
  }

  const deflL = getResultVal([/panjang garpu|L garpu|fork_length/i], '');
  const deflH = getResultVal([/tinggi garpu|H garpu|fork_height/i], '');
  const deflX = getResultVal([/defleksi aktual|X aktual|actual_deflection/i], '');
  const parsedL = parseFloat(String(deflL || '').replace(/[^0-9.,]/g, '').replace(',', '.'));
  const parsedDefl = parseFloat(String(deflX || '').replace(/[^0-9.,]/g, '').replace(',', '.'));
  const maxPermittedDefl = !Number.isNaN(parsedL) && parsedL > 0 ? (parsedL / 33).toFixed(1) : null;
  const loadTestChoice = getResultVal([/uji beban|defleksi garpu/i], '');

  const deflVerdictText = isBlank
    ? '    [   ] MEMENUHI PERSYARATAN K3 (X aktual ≤ X ijin)\n    [   ] TIDAK MEMENUHI PERSYARATAN K3'
    : !Number.isNaN(parsedDefl) && maxPermittedDefl
    ? parsedDefl <= Number(maxPermittedDefl)
      ? `    Berdasarkan hasil pengukuran, defleksi garpu (${parsedDefl} mm) ≤ batas izin (${maxPermittedDefl} mm) dinyatakan MEMENUHI PERSYARATAN K3.`
      : `    Berdasarkan hasil pengukuran, defleksi garpu (${parsedDefl} mm) > batas izin (${maxPermittedDefl} mm) dinyatakan TIDAK MEMENUHI PERSYARATAN K3.`
    : loadTestChoice
    ? `    Status Pengujian Beban & Defleksi Garpu: ${loadTestChoice}.`
    : '    Pengukuran defleksi garpu belum tercatat.';

  const verdictPhrase =
    data.conclusion === 'TIDAK_MEMENUHI_SYARAT'
      ? 'TIDAK MEMENUHI PERSYARATAN K3'
      : data.conclusion === 'MEMENUHI_SYARAT_DENGAN_CATATAN'
      ? 'MEMENUHI PERSYARATAN K3 DENGAN CATATAN'
      : data.conclusion === 'MEMENUHI_SYARAT'
      ? 'MEMENUHI PERSYARATAN K3'
      : 'BELUM DITETAPKAN (MENUNGGU EVALUASI AKHIR)';

  const recText =
    report.recommendations && report.recommendations !== '-' && report.recommendations !== 'Belum diisi.'
      ? `\n4.   ${report.recommendations}`
      : '';

  contentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Rumus Perhitungan Defleksi Garpu Forklift Permenaker No. 8 Tahun 2020:\n',
          bold: true,
          size: 22,
          font: 'Times New Roman'
        }),
        new TextRun({
          text: '    • Panjang Garpu (L)           : ' + (deflL ? `${deflL}` : '.................... mm') + '\n' +
                '    • Tinggi Garpu (H)            : ' + (deflH ? `${deflH}` : '.................... mm') + '\n' +
                '    • Defleksi Maksimum Ijin (X)  : 1/33 × L = ' + (maxPermittedDefl ? `${maxPermittedDefl} mm` : '.................... mm') + '\n' +
                '    • Defleksi Aktual Hasil Uji   : ' + (deflX ? `${deflX}` : '.................... mm') + '\n\n' +
                'Kesimpulan Pengujian Beban & Defleksi:\n' +
                deflVerdictText,
          size: 21,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // Lokasi pemasangan berasal dari data objek. Bila kosong, jangan cetak
  // "lokasi -, -": tanda hubung itu terbaca sebagai nama lokasi sungguhan.
  // Klausa lokasi disembunyikan, bukan diganti alamat karangan.
  const locationClause =
    location && clientName
      ? `. Unit berada pada lokasi ${location} ${clientName}`
      : location
      ? `. Unit berada pada lokasi ${location}`
      : clientName
      ? `. Unit berada pada ${clientName}`
      : '';

  // ===========================================================================
  // PAGE 11: BAB VI. KESIMPULAN & BAB VII. SYARAT-SYARAT & TTD
  // ===========================================================================
  contentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'VI.   KESIMPULAN',
          bold: true,
          size: 24,
          font: 'Times New Roman'
        })
      ],
      spacing: { before: 180, after: 120 }
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: isBlank
            ? '        Atas dasar hasil pemeriksaan dan pengujian tersebut di atas, maka dapat disimpulkan bahwa Forklift, dengan Nomor Seri : ...................., Tahun : ...................., Kapasitas : ...................., dinyatakan ......................................... Unit dapat digunakan dengan mengikuti rekomendasi dan syarat-syarat keselamatan kerja yang berlaku.'
            : `        Atas dasar hasil pemeriksaan dan pengujian tersebut di atas, maka dapat disimpulkan bahwa ${data.object_name || 'Forklift'}, dengan Nomor Seri : ${serialNo || '-'}, Tahun : ${yearStr || '-'}, Kapasitas : ${capacityStr || '-'}, dinyatakan ${verdictPhrase}${locationClause} dengan wajib mengikuti rekomendasi dan syarat-syarat keselamatan kerja berikut:`,
          size: 22,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 220 }
    }),
    ...(report.findings && report.findings.length > 0
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: 'TEMUAN LAPANGAN:\n',
                bold: true,
                size: 22,
                font: 'Times New Roman'
              }),
              ...report.findings.map(
                (fd, idx) =>
                  new TextRun({
                    text: `${idx + 1}. [${fd.severity || 'TEMUAN'}] ${fd.description || '-'} — Rekomendasi: ${fd.recommendation || '-'}\n`,
                    size: 20,
                    font: 'Times New Roman'
                  })
              )
            ],
            spacing: { after: 180 }
          })
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({
          text: 'VII.   SYARAT - SYARAT',
          bold: true,
          size: 24,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 120 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: '1.   Operator yang mengoperasikan unit harus memiliki Lisensi Operator dari Kemnaker RI\n2.   Lakukan perawatan dan pembersihan rutin secara berkala pada unit.\n3.   Lakukan pemeriksaan dan pengujian berkala pada unit paling lambat tanggal ' +
            (reInspDateStr || '........................................') +
            ' sesuai dengan PER.08/MEN/2020 Tentang Keselamatan Dan Kesehatan Kerja Pesawat Angkat dan Pesawat Angkut' +
            recText,
          size: 22,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 400 }
    }),
    // Signature block right aligned
    (() => {
      const inspectorSigBuf = resolveAttachmentBuffer(
        data.inspector_signature_path || data.inspector_signature || data.signature_data_url || data.signature_file_id || data.inspector_signature_file_id || data.inspector_sig_file_id
      );
      const inspectorSigParagraphs = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Jakarta, ${reportDateStr}\nYang Memeriksa/ Menguji\nAhli K3 Pesawat Angkat dan Angkut\n`,
              size: 22,
              font: 'Times New Roman',
              bold: true
            })
          ],
          spacing: { after: 60 }
        }),
        inspectorSigBuf
          ? new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: inspectorSigBuf,
                  transformation: { width: 130, height: 65 }
                })
              ],
              spacing: { before: 60, after: 60 }
            })
          : new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '\n\n\n\n\n',
                  size: 22
                })
              ]
            }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: (inspectorName || '............................................................') + '\n',
              bold: true,
              underline: {},
              size: 22,
              font: 'Times New Roman'
            }),
            new TextRun({
              text: inspectorSkpNo ? `No. Reg: ${inspectorSkpNo}` : 'No. Reg: ............................................................',
              bold: true,
              size: 22,
              font: 'Times New Roman'
            })
          ]
        })
      ];

      return new Table({
        width: { size: 10080, type: WidthType.DXA },
        columnWidths: [5040, 5040],
        borders: TABLE_BORDERS_NONE,
        rows: [
          new TableRow({
            children: [
              createCell('', { widthDxa: 5040 }),
              createCell(inspectorSigParagraphs, { widthDxa: 5040 })
            ]
          })
        ]
      });
    })(),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===========================================================================
  // PAGES 12 TO 15: BAB VIII. DOKUMENTASI (FOTO RESMI 2 KOLOM)
  // Grid: [5040, 5040] = 10080 DXA
  // NO SAMPLE PHOTOS FROM SUKABUMI! Real photos or clean fillable placeholders!
  // ===========================================================================
  contentChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'VIII.   DOKUMENTASI',
          bold: true,
          size: 24,
          font: 'Times New Roman'
        })
      ],
      spacing: { before: 180, after: 140 }
    })
  );


  const CATEGORY_DOC_TITLES = {
    TAMPAK_DEPAN: 'Tampak depan unit forklift',
    TAMPAK_SAMPING: 'Tampak samping unit forklift',
    TAMPAK_BELAKANG: 'Tampak belakang unit forklift',
    NAMEPLATE: 'Kondisi nameplate unit',
    FORK_MAST: 'Kondisi fork dan rantai pengangkat',
    BAN_RODA: 'Kondisi ban dan roda',
    HIDROLIK_MESIN: 'Sistem hidrolik dan mesin',
    UJI_FUNGSI: 'Pemeriksaan uji fungsi peralatan',
    UJI_BEBAN: 'Pengujian beban kerja aman',
    STIKER_K3: 'Stiker hasil riksa uji K3',
    NDT: 'Pemeriksaan NDT MPI',
    LAINNYA: 'Dokumentasi teknis'
  };

  const categorizeDocPhoto = (p) => {
    const rawCat = String(p.doc_category || p.docCategory || p.category || '').toUpperCase();
    const cap = String(p.caption || '').toLowerCase();
    if (rawCat === 'FOTO_UNIT' || rawCat.includes('UNIT') || /8\.1|foto unit|tampak depan|tampak samping|tampak belakang|keseluruhan/i.test(cap)) {
      return '8.1 Foto Unit';
    }
    if (rawCat === 'FOTO_VISUAL' || rawCat.includes('VISUAL') || /8\.2|visual|komponen|chasis|mast|garpu|fork|rangka|ban|mesin/i.test(cap)) {
      return '8.2 Foto Pemeriksaan Visual';
    }
    if (rawCat === 'FOTO_FUNGSI' || rawCat.includes('FUNGSI') || /8\.3|uji fungsi|fungsi|operasional|indikator|lampu|klakson/i.test(cap)) {
      return '8.3 Foto Uji Fungsi';
    }
    if (rawCat === 'FOTO_BEBAN' || rawCat.includes('BEBAN') || /8\.4|uji beban|beban|defleksi|load test/i.test(cap)) {
      return '8.4 Foto Uji Beban';
    }
    if (rawCat === 'FOTO_STIKER' || rawCat.includes('STIKER') || /8\.5|stiker|sticker|nameplate|plat nama/i.test(cap)) {
      return '8.5 Foto Stiker';
    }
    return '8.1 Foto Unit';
  };

  const validInspectionPhotos = [];
  for (const p of photos) {
    const buf = resolveAttachmentBuffer(p);
    if (buf) {
      const rawCat = String(p.doc_category || p.docCategory || p.category || '').toUpperCase();
      const catLabel = CATEGORY_DOC_TITLES[rawCat] || '';
      let caption = p.caption;
      if (!caption || !caption.trim()) {
        const matchedItem = results.find(
          (r) => r.item_id === (p.item_id || p.itemId) || r.itemId === (p.item_id || p.itemId)
        );
        caption = matchedItem?.label ? `[${matchedItem.section || 'Pemeriksaan'}] ${matchedItem.label}` : (catLabel || 'Dokumentasi Riksa Uji Lapangan');
      }
      validInspectionPhotos.push({ ...p, buffer: buf, caption });
    }
  }

  const existingCertPaths = ['cert_skp_pjk3_1.jpg', 'cert_skp_pjk3_2.jpg']
    .map((cf) => getTemplateAsset(cf))
    .filter((cp) => cp && fs.existsSync(cp));

  const DOC_CATEGORY_GROUPS = [
    { key: '8.1 Foto Unit', label: '8.1 Foto Unit (Tampak Depan / Samping / Keseluruhan)', defaultSlots: ['Tampak depan unit', 'Tampak samping unit'] },
    { key: '8.2 Foto Pemeriksaan Visual', label: '8.2 Foto Pemeriksaan Visual (Komponen Fisik & Mast)', defaultSlots: ['Kondisi garpu & mast', 'Kondisi sasis & roda'] },
    { key: '8.3 Foto Uji Fungsi', label: '8.3 Foto Uji Fungsi (Pengujian Operasional & Indikator)', defaultSlots: ['Uji fungsi kemudi & tuas', 'Uji fungsi instrumen & lampu'] },
    { key: '8.4 Foto Uji Beban', label: '8.4 Foto Uji Beban (Beban Kerja Aman & Defleksi)', defaultSlots: ['Uji beban efektif', 'Pengukuran defleksi garpu'] },
    { key: '8.5 Foto Stiker', label: '8.5 Foto Stiker (Nameplate & Stiker Riksa Uji K3)', defaultSlots: ['Nameplate spesifikasi', 'Stiker riksa uji K3'] }
  ];

  if (validInspectionPhotos.length > 0) {
    let globalPhotoIndex = 1;
    DOC_CATEGORY_GROUPS.forEach((group, groupIdx) => {
      const groupPhotos = validInspectionPhotos.filter((p) => categorizeDocPhoto(p) === group.key);

      contentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: group.label,
              bold: true,
              size: 21,
              font: 'Times New Roman'
            })
          ],
          spacing: { before: 160, after: 100 }
        })
      );

      if (groupPhotos.length > 0) {
        for (let i = 0; i < groupPhotos.length; i += 2) {
          const leftP = groupPhotos[i];
          const rightP = groupPhotos[i + 1] || null;

          const leftCell = createPhotoCell(leftP.buffer, `Foto ${globalPhotoIndex++}. ${leftP.caption}`, 5040);
          const rightCell = rightP
            ? createPhotoCell(rightP.buffer, `Foto ${globalPhotoIndex++}. ${rightP.caption}`, 5040)
            : new TableCell({
                width: { size: 5040, type: WidthType.DXA },
                borders: TABLE_BORDERS_BLACK,
                children: [new Paragraph({ text: '' })]
              });

          contentChildren.push(
            new Table({
              width: { size: 10080, type: WidthType.DXA },
              columnWidths: [5040, 5040],
              borders: TABLE_BORDERS_BLACK,
              rows: [
                new TableRow({
                  cantSplit: true,
                  children: [leftCell, rightCell]
                })
              ]
            })
          );
        }
      } else {
        const leftCell = createPhotoPlaceholderCell(group.defaultSlots[0] || 'Foto Lapangan', 5040);
        const rightCell = createPhotoPlaceholderCell(group.defaultSlots[1] || 'Foto Lapangan', 5040);

        contentChildren.push(
          new Table({
            width: { size: 10080, type: WidthType.DXA },
            columnWidths: [5040, 5040],
            borders: TABLE_BORDERS_BLACK,
            rows: [
              new TableRow({
                cantSplit: true,
                children: [leftCell, rightCell]
              })
            ]
          })
        );
      }

      if (groupIdx < DOC_CATEGORY_GROUPS.length - 1 && (groupIdx === 1 || groupIdx === 3)) {
        contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });

    if (existingCertPaths.length > 0) {
      contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  } else {
    // Mode Blangko Kosong: sediakan slot kotak rapi untuk penempelan foto manual per kategori
    DOC_CATEGORY_GROUPS.forEach((group, groupIdx) => {
      contentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: group.label,
              bold: true,
              size: 21,
              font: 'Times New Roman'
            })
          ],
          spacing: { before: 160, after: 100 }
        })
      );

      const leftCell = createPhotoPlaceholderCell(group.defaultSlots[0] || 'Foto Lapangan 1', 5040);
      const rightCell = createPhotoPlaceholderCell(group.defaultSlots[1] || 'Foto Lapangan 2', 5040);

      contentChildren.push(
        new Table({
          width: { size: 10080, type: WidthType.DXA },
          columnWidths: [5040, 5040],
          borders: TABLE_BORDERS_BLACK,
          rows: [
            new TableRow({
              cantSplit: true,
              children: [leftCell, rightCell]
            })
          ]
        })
      );

      if (groupIdx < DOC_CATEGORY_GROUPS.length - 1 && (groupIdx === 1 || groupIdx === 3)) {
        contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });
    if (existingCertPaths.length > 0) {
      contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // ===========================================================================
  // PAGES 16 TO 18: LAMPIRAN SKP KEMNAKER RI (FULL PAGE CERTIFICATE SCANS)
  // ===========================================================================
  existingCertPaths.forEach((cp, idx) => {
    contentChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: fs.readFileSync(cp),
            transformation: { width: 500, height: 750 }
          })
        ]
      })
    );
    if (idx < existingCertPaths.length - 1) {
      contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 20,
            color: '000000'
          }
        }
      }
    },
    sections: [
      // Cover Section (no running footer)
      {
        properties: F4_PAGE_PROPERTIES,
        children: [
          redBannerTop,
          yearParagraph,
          titleParagraph,
          coverInfoTable,
          coverHeroElement,
          coverFooterParagraph,
          redBannerBottom
        ]
      },
      // Content Section with Running Footer at bottom left
      {
        properties: F4_PAGE_PROPERTIES,
        footers: {
          default: createRunningFooter()
        },
        children: contentChildren
      }
    ]
  });
}

function buildGenericDocxDocument(data, report, companyProfile) {
  const companyName = companyProfile?.company_name || 'PT UPAYA RIKSA DAYA';
  const tagline = companyProfile?.tagline || 'JASA PEMERIKSAAN & PENGUJIAN KESELAMATAN DAN KESEHATAN KERJA (PJK3)';
  const address = companyProfile?.address || 'Jl. Raya Cakung Cilincing Kav. 33, Jakarta Timur';
  const email = companyProfile?.email || 'urd@upayariksadaya.com';
  const phone = companyProfile?.phone || '(021) 489 1409';

  const logoPath = getOfficialLogoPath();
  const logoParagraph =
    logoPath && fs.existsSync(logoPath)
      ? new Paragraph({
          children: [
            new ImageRun({
              data: fs.readFileSync(logoPath),
              transformation: { width: 92, height: 65 }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        })
      : null;

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
    spacing: { after: 40 }
  });

  const subHeader = new Paragraph({
    children: [
      new TextRun({
        text: `${tagline}\nSKP KEMNAKER RI: No. 5/121/AS.02.04/I/2021 | Bidang: ${report.categoryName || 'PAA'}\n${address} | Telp: ${phone} | Email: ${email}`,
        size: 15,
        color: '64748B'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 }
  });

  const divider = new Paragraph({
    children: [
      new TextRun({
        text: '_________________________________________________________________________________',
        bold: true,
        size: 14,
        color: 'C81E1E'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  });

  const titleParagraph = new Paragraph({
    text: report.title || `LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN (LHPP) - ${report.categoryName || 'PAA'}`,
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 }
  });

  const subtitleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: `Nomor: ${report.lhppNo || data.lhpp_no || 'DRAF'}   |   No. BAP: ${report.bapNo || data.bap_no || '-'}   |   No. PO: ${data.po_number || data.order_no || '-'}`,
        bold: true,
        size: 19,
        color: '1E293B'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 260 }
  });

  const section1Title = new Paragraph({
    children: [new TextRun({ text: 'I. DATA UMUM & IDENTITAS UNIT', bold: true, size: 22, color: 'C81E1E' })],
    spacing: { before: 240, after: 120 }
  });

  const identityRows = (report.identityRows || []).map(
    ([label, val], idx) =>
      new TableRow({
        children: [
          createCell(`${idx + 1}. ${label}`, { widthPercent: 40, bold: true, size: 17 }),
          createCell(val || '-', { widthPercent: 60, size: 17 })
        ]
      })
  );

  const identityTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [4032, 6048],
    borders: TABLE_BORDERS_BLACK,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Parameter Identitas', { widthDxa: 4032, isHeader: true, size: 17 }),
          createCell('Keterangan', { widthDxa: 6048, isHeader: true, size: 17 })
        ]
      }),
      ...identityRows
    ]
  });

  const section2Title = new Paragraph({
    children: [new TextRun({ text: 'II. DATA TEKNIS PERALATAN', bold: true, size: 22, color: 'C81E1E' })],
    spacing: { before: 300, after: 120 }
  });

  const technicalRows = (report.technicalRows || []).map(
    (row) =>
      new TableRow({
        children: [
          createCell(row.label, { widthPercent: 40, bold: true, size: 17 }),
          createCell(row.value || '-', { widthPercent: 60, size: 17 })
        ]
      })
  );

  const technicalTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [4032, 6048],
    borders: TABLE_BORDERS_BLACK,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Spesifikasi Teknis', { widthDxa: 4032, isHeader: true, size: 17 }),
          createCell('Nilai / Keterangan', { widthDxa: 6048, isHeader: true, size: 17 })
        ]
      }),
      ...(technicalRows.length > 0
        ? technicalRows
        : [
            new TableRow({
              children: [
                createCell('Data teknis terverifikasi sesuai spesifikasi nameplate pabrikan.', {
                  widthDxa: 10080,
                  columnSpan: 2,
                  size: 17
                })
              ]
            })
          ])
    ]
  });

  const section3Title = new Paragraph({
    children: [new TextRun({ text: 'III. PEMERIKSAAN VISUAL & PENGUJIAN', bold: true, size: 22, color: 'C81E1E' })],
    spacing: { before: 300, after: 120 }
  });

  const resultRows = (report.resultRows || []).map(
    (row) =>
      new TableRow({
        children: [
          createCell(row.label, { widthPercent: 50, size: 17 }),
          createCell(row.value || '-', { widthPercent: 50, size: 17 })
        ]
      })
  );

  const resultTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [5040, 5040],
    borders: TABLE_BORDERS_BLACK,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          createCell('Butir Pemeriksaan & Pengujian', { widthDxa: 5040, isHeader: true, size: 17 }),
          createCell('Hasil & Catatan', { widthDxa: 5040, isHeader: true, size: 17 })
        ]
      }),
      ...(resultRows.length > 0
        ? resultRows
        : [
            new TableRow({
              children: [
                createCell('Hasil checklist riksa uji tercatat lengkap pada formulir pengujian.', {
                  widthDxa: 10080,
                  columnSpan: 2,
                  size: 17
                })
              ]
            })
          ])
    ]
  });

  const section4Title = new Paragraph({
    children: [new TextRun({ text: 'IV. KESIMPULAN & SYARAT-SYARAT K3', bold: true, size: 22, color: 'C81E1E' })],
    spacing: { before: 300, after: 120 }
  });

  const isPassing = !/tidak/i.test(report.conclusion || '');
  const conclusionColor = isPassing ? '15803D' : 'B91C1C';
  const hasConclusion =
    report.conclusion &&
    report.conclusion !== '-' &&
    report.conclusion !== 'Belum ditetapkan' &&
    report.conclusion !== 'BELUM DIISI';

  const conclusionParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Kesimpulan Teknis: ', bold: true, size: 20 }),
      new TextRun({
        text: hasConclusion
          ? (report.conclusion || 'MEMENUHI PERSYARATAN KESELAMATAN DAN KESEHATAN KERJA').toUpperCase()
          : '[   ] MEMENUHI PERSYARATAN K3      [   ] MEMENUHI DENGAN CATATAN      [   ] TIDAK MEMENUHI SYARAT K3',
        bold: true,
        size: 20,
        color: hasConclusion ? conclusionColor : '0F172A'
      })
    ],
    spacing: { after: 120 }
  });

  const notesParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Catatan Pengujian: ', bold: true, size: 18 }),
      new TextRun({
        text:
          report.conclusionNotes && report.conclusionNotes !== '-' && report.conclusionNotes !== 'Belum diisi.'
            ? report.conclusionNotes
            : 'Belum diisi oleh inspector.',
        size: 18
      })
    ],
    spacing: { after: 160 }
  });

  const recommendationsParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Syarat-Syarat K3 & Rekomendasi: ', bold: true, size: 18 }),
      new TextRun({
        text:
          report.recommendations && report.recommendations !== '-' && report.recommendations !== 'Belum diisi.'
            ? report.recommendations
            : 'Belum diisi oleh inspector.',
        size: 18
      })
    ],
    spacing: { after: 260 }
  });

  const section5Title = new Paragraph({
    children: [new TextRun({ text: 'V. DOKUMENTASI FOTO RIKSA UJI', bold: true, size: 22, color: 'C81E1E' })],
    spacing: { before: 300, after: 120 }
  });

  // Slot dokumentasi mengikuti persyaratan foto template bila tersedia; jika tidak,
  // gunakan slot generik (tanpa istilah teknis khusus satu jenis alat) agar dokumen
  // tidak memuat butir dokumentasi yang tidak relevan dengan unit yang diperiksa.
  const photoLabels =
    Array.isArray(data.photoRequirements) && data.photoRequirements.length > 0
      ? data.photoRequirements.map((req, idx) =>
          typeof req === 'string' ? req : req?.label || req?.name || `Foto ${idx + 1}`
        )
      : [
          'Foto Tampak Unit Keseluruhan',
          'Foto Nameplate / Identitas Alat',
          'Foto Pelaksanaan Pemeriksaan Visual',
          'Foto Pengujian / Pengukuran',
          'Foto Stiker Uji Riksa K3'
        ];

  const photoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS_BLACK,
    rows: [
      new TableRow({
        children: [
          createCell('No', { widthPercent: 8, isHeader: true, align: AlignmentType.CENTER, size: 17 }),
          createCell('Posisi / Butir Dokumentasi', { widthPercent: 47, isHeader: true, size: 17 }),
          createCell('Status Foto Terlampir', { widthPercent: 45, isHeader: true, size: 17 })
        ]
      }),
      ...photoLabels.map(
        (label, idx) =>
          new TableRow({
            children: [
              createCell(String(idx + 1), { widthPercent: 8, align: AlignmentType.CENTER, size: 16 }),
              createCell(label, { widthPercent: 47, bold: true, size: 16 }),
              createCell('[ Tempelkan Foto / Lampiran Dokumentasi di Sini ]', {
                widthPercent: 45,
                size: 16,
                shadingColor: 'F8FAFC'
              })
            ]
          })
      )
    ]
  });

  const validGenericPhotos = [];
  const genericPhotos = Array.isArray(data.photos) ? data.photos : [];
  const genericResults = Array.isArray(data.results) ? data.results : [];
  for (const p of genericPhotos) {
    const buf = resolveAttachmentBuffer(p);
    if (buf) {
      let caption = p.caption;
      if (!caption || !caption.trim()) {
        const matchedItem = genericResults.find(
          (r) => r.item_id === (p.item_id || p.itemId) || r.itemId === (p.item_id || p.itemId)
        );
        caption = matchedItem?.label ? `[${matchedItem.section || 'Pemeriksaan'}] ${matchedItem.label}` : (p.doc_category || 'Dokumentasi Riksa Uji');
      }
      validGenericPhotos.push({
        ...p,
        buffer: buf,
        caption
      });
    }
  }

  const photoTablesList = [];
  if (validGenericPhotos.length > 0) {
    for (let i = 0; i < validGenericPhotos.length; i += 2) {
      const p1 = validGenericPhotos[i];
      const p2 = validGenericPhotos[i + 1] || null;

      const c1 = new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        borders: TABLE_BORDERS_BLACK,
        margins: { top: 80, bottom: 80, left: 80, right: 80 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Foto ${i + 1}. ${p1.caption}`, bold: true, size: 16, font: 'Times New Roman' })],
            spacing: { after: 60 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new ImageRun({ data: p1.buffer, transformation: { width: 220, height: 150 } })]
          })
        ]
      });

      const c2 = p2
        ? new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDERS_BLACK,
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `Foto ${i + 2}. ${p2.caption}`, bold: true, size: 16, font: 'Times New Roman' })],
                spacing: { after: 60 }
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new ImageRun({ data: p2.buffer, transformation: { width: 220, height: 150 } })]
              })
            ]
          })
        : new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDERS_BLACK,
            children: [new Paragraph({ text: '' })]
          });

      photoTablesList.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_BLACK,
          rows: [new TableRow({ children: [c1, c2] })]
        })
      );
    }
  } else {
    photoTablesList.push(photoTable);
  }

  const signTitle = new Paragraph({
    children: [new TextRun({ text: 'LEMBAR PENGESAHAN DOKUMEN LHPP', bold: true, size: 20, color: '1E293B' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 340, after: 140 }
  });

  const inspectorSigBuf = resolveAttachmentBuffer(
    data.inspector_signature_path || data.inspector_signature || data.signature_data_url || data.signature_file_id || data.inspector_signature_file_id || data.inspector_sig_file_id
  );

  const inspectorSigParas = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Diperiksa Oleh,\nAhli K3 Spesialis / Inspector',
          bold: true,
          size: 16,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 60 }
    }),
    inspectorSigBuf
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: inspectorSigBuf,
              transformation: { width: 110, height: 55 }
            })
          ],
          spacing: { before: 40, after: 40 }
        })
      : new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '\n\n\n\n', size: 16 })]
        }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `( ${data.inspector_name || 'Ahli K3 Spesialis'} )\n`,
          bold: true,
          size: 16,
          font: 'Times New Roman'
        }),
        new TextRun({
          text: data.inspector_skp_no || data.skp_no ? `No. Reg: ${data.inspector_skp_no || data.skp_no}` : 'Ahli K3 Spesialis Kemnaker RI',
          size: 14,
          font: 'Times New Roman',
          color: '555555'
        })
      ]
    })
  ];

  const signatureTable = new Table({
    width: { size: 10080, type: WidthType.DXA },
    columnWidths: [3360, 3360, 3360],
    borders: TABLE_BORDERS_BLACK,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 3360, type: WidthType.DXA },
            borders: TABLE_BORDERS_BLACK,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: inspectorSigParas
          }),
          new TableCell({
            width: { size: 3360, type: WidthType.DXA },
            borders: TABLE_BORDERS_BLACK,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Diverifikasi Oleh,\nReviewer Teknis QC\n\n\n\n\n',
                    bold: true,
                    size: 16,
                    font: 'Times New Roman'
                  }),
                  new TextRun({
                    text: `( ${data.reviewer_name || 'Tim Kendali Mutu QC'} )\n`,
                    bold: true,
                    size: 16,
                    font: 'Times New Roman'
                  }),
                  new TextRun({
                    text: 'Quality Control URD',
                    size: 14,
                    font: 'Times New Roman',
                    color: '555555'
                  })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 3360, type: WidthType.DXA },
            borders: TABLE_BORDERS_BLACK,
            margins: { top: 100, bottom: 100, left: 80, right: 80 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Disahkan Oleh,\nPenanggung Jawab PJK3\n\n\n\n\n',
                    bold: true,
                    size: 16,
                    font: 'Times New Roman'
                  }),
                  new TextRun({
                    text: `( ${data.approver_name || 'Direktur / Pimpinan URD'} )\n`,
                    bold: true,
                    size: 16,
                    font: 'Times New Roman'
                  }),
                  new TextRun({
                    text: 'Penanggung Jawab PJK3',
                    size: 14,
                    font: 'Times New Roman',
                    color: '555555'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  return new Document({
    sections: [
      {
        properties: F4_PAGE_PROPERTIES,
        children: [
          ...(logoParagraph ? [logoParagraph] : []),
          companyHeader,
          subHeader,
          divider,
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
          recommendationsParagraph,
          section5Title,
          ...photoTablesList,
          signTitle,
          signatureTable
        ]
      }
    ]
  });
}

/**
 * Nilai teks pertama yang benar-benar terisi (spasi saja dianggap kosong),
 * atau '-' bila semuanya kosong.
 */
function dashText(...values) {
  for (const value of values) {
    const text = value === null || value === undefined ? '' : String(value).trim();
    if (text) return text;
  }
  return '-';
}

/**
 * Entrypoint: Generate Laporan Hasil Pemeriksaan dan Pengujian (LHPP) DOCX Buffer
 */
export async function generateLhppDocxBuffer(data) {
  const [report, companyProfile] = await Promise.all([
    Promise.resolve(buildLhppReportContent(data)),
    getCompanyProfile().catch(() => null)
  ]);

  const isForklift = /forklift/i.test(
    `${data.object_name || ''} ${data.equipment_type_name || ''} ${data.category_name || ''} ${report.categoryName || ''}`
  );

  const doc = isForklift
    ? buildForkliftDocxDocument(data, report, companyProfile)
    : buildGenericDocxDocument(data, report, companyProfile);

  return await Packer.toBuffer(doc);
}

// =============================================================================
// BERITA ACARA PEMERIKSAAN (BAP) DOCX GENERATOR
// =============================================================================
export async function generateBapDocxBuffer(bap) {
  const companyProfile = await getCompanyProfile().catch(() => null);
  const companyName = companyProfile?.company_name || 'PT UPAYA RIKSA DAYA';
  const tagline = companyProfile?.tagline || 'JASA PEMERIKSAAN & PENGUJIAN KESELAMATAN DAN KESEHATAN KERJA (PJK3)';
  const equipmentTitle = String(
    bap.equipment_subtype_name ||
      bap.equipment_type_name ||
      bap.object_name ||
      bap.equipment_name ||
      bap.equipment_type ||
      bap.category_name ||
      'ALAT K3'
  )
    .trim()
    .toUpperCase();

  const logoPath = getOfficialLogoPath();
  const logoParagraph =
    logoPath && fs.existsSync(logoPath)
      ? new Paragraph({
          children: [
            new ImageRun({
              data: fs.readFileSync(logoPath),
              transformation: { width: 92, height: 64 }
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        })
      : null;

  const hasConclusion = Boolean(bap.conclusion);
  const isNotCompliant = bap.conclusion === 'TIDAK_MEMENUHI_SYARAT';
  const statusColor = !hasConclusion ? '334155' : isNotCompliant ? '991B1B' : '107038';
  const statusText = !hasConclusion
    ? 'MEMENUHI / TIDAK MEMENUHI *) (Kesimpulan teknis menunggu penyelesaian checklist & LHPP)'
    : isNotCompliant
    ? 'TIDAK MEMENUHI PERSYARATAN K3'
    : bap.conclusion === 'MEMENUHI_SYARAT_DENGAN_CATATAN'
    ? 'MEMENUHI PERSYARATAN K3 DENGAN CATATAN'
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
    spacing: { after: 40 }
  });

  const subHeader = new Paragraph({
    children: [
      new TextRun({
        text: tagline,
        size: 16,
        color: '64748B'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 160 }
  });

  const titleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: 'BERITA ACARA RIKSA UJI',
        bold: true,
        size: 28,
        color: '0F172A'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 }
  });

  const equipmentTitleParagraph = new Paragraph({
    children: [
      new TextRun({
        text: equipmentTitle,
        bold: true,
        size: 24,
        color: 'C81E1E'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 }
  });

  const docNoParagraph = new Paragraph({
    children: [
      new TextRun({
        text: `No: ${bap.bap_no || 'DRAF'}`,
        bold: true,
        size: 20
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  });

  const dateFormatted = formatDateIndo(bap.inspection_date) || bap.date_formatted || formatDateIndo(new Date());
  const openingVerb = hasConclusion
    ? 'telah dilaksanakan pekerjaan pemeriksaan dan pengujian (riksa uji)'
    : 'dilaksanakan pekerjaan / berita acara pemeriksaan dan pengujian (riksa uji)';

  const introParagraph = new Paragraph({
    children: [
      new TextRun({
        text: `Pada hari ini, tanggal ${dateFormatted}, ${openingVerb} Keselamatan dan Kesehatan Kerja (K3) oleh ${companyName} terhadap peralatan kerja dengan rincian sebagai berikut:`,
        size: 18
      })
    ],
    spacing: { after: 140 }
  });

  const capText = [bap.capacity || '-', bap.capacity_unit || ''].filter(Boolean).join(' ').trim();
  const identityRows = [
    ['Objek Periksa', `${bap.object_name || equipmentTitle} (${bap.category_code || '-'})`],
    ['Nama Perusahaan / Klien', bap.client_name || '-'],
    ['Alamat Perusahaan', bap.client_address || bap.location_address || '-'],
    ['Pabrik Pembuat / Tahun', `${bap.manufacturer || bap.brand || '-'} / ${bap.manufacture_year || '-'}`],
    ['Nomor Seri / Kapasitas', `${bap.serial_number || '-'} / ${capText}`],
    ['Lokasi Pemeriksaan', `${dashText(bap.install_location, bap.location_name)}${bap.po_number ? ` (PO: ${bap.po_number})` : ''}`],
    ['Jenis Riksa Uji', bap.inspection_type || bap.service_type || 'Berkala'],
    ['Ahli K3 / Inspector', bap.inspector_signer_name || bap.inspector_name || '-']
  ].map(
    ([label, val]) =>
      new TableRow({
        children: [
          createCell(label, { widthPercent: 38, bold: true, size: 17 }),
          createCell(String(val || '-'), { widthPercent: 62, size: 17 })
        ]
      })
  );

  const identityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS_BLACK,
    rows: identityRows
  });

  const scopeTitle = new Paragraph({
    children: [new TextRun({ text: 'RUANG LINGKUP RIKSA UJI YANG DILAKSANAKAN', bold: true, size: 20 })],
    spacing: { before: 200, after: 80 }
  });

  const rawScopes = Array.isArray(bap.scope_items) && bap.scope_items.length > 0
    ? bap.scope_items
    : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

  const scopeParagraphs = rawScopes.map(
    (s, idx) =>
      new Paragraph({
        children: [new TextRun({ text: `${idx + 1}. [✓] ${s}`, size: 17 })],
        spacing: { after: 35 }
      })
  );

  const resultTitle = new Paragraph({
    children: [new TextRun({ text: 'HASIL RIKSA UJI', bold: true, size: 20 })],
    spacing: { before: 180, after: 80 }
  });

  const conclusionParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Berdasarkan hasil riksa uji, dapat disimpulkan unit tersebut dinyatakan: ', size: 18 }),
      new TextRun({ text: statusText, bold: true, size: 18, color: statusColor })
    ],
    spacing: { after: 100 }
  });

  const defaultHonestNote = hasConclusion
    ? 'Pemeriksaan dan pengujian telah dilaksanakan sesuai standar K3.'
    : 'Berita acara disiapkan/ditandatangani di lapangan. Rincian teknis dan kesimpulan definitif dituangkan pada dokumen LHPP setelah checklist selesai dievaluasi.';

  const notesParagraph = new Paragraph({
    children: [
      new TextRun({ text: 'Catatan: ', bold: true, size: 17 }),
      new TextRun({
        text: bap.notes || bap.conclusion_notes || defaultHonestNote,
        size: 17
      })
    ],
    spacing: { after: 220 }
  });

  const inspectorSigBuf = resolveAttachmentBuffer(
    bap.inspector_signature_path || bap.inspector_sig_storage_key || bap.inspector_signature || bap.inspector_signature_file_id || bap.inspector_sig_file_id
  );
  const clientSigBuf = resolveAttachmentBuffer(
    bap.client_signature_path || bap.client_sig_storage_key || bap.client_signature || bap.client_signature_file_id || bap.client_sig_file_id
  );

  const fmtSigTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return '';
      return `Ditandatangani: ${d.toLocaleDateString('id-ID')} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };
  const inspSignedTime = fmtSigTimestamp(bap.inspector_signed_at);
  const clientSignedTime = fmtSigTimestamp(bap.client_signed_at);

  const inspectorSigCellParas = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Inspector / Penguji\nPT UPAYA RIKSA DAYA',
          bold: true,
          size: 17,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 60 }
    }),
    inspectorSigBuf
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: inspectorSigBuf,
              transformation: { width: 120, height: 60 }
            })
          ],
          spacing: { before: 40, after: 40 }
        })
      : new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '\n\n\n\n', size: 16 })]
        }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `( ${bap.inspector_signer_name || bap.inspector_name || 'Ahli K3 Spesialis'} )\n`,
          bold: true,
          size: 17,
          font: 'Times New Roman'
        }),
        new TextRun({
          text: bap.inspector_signer_title || 'Ahli K3 Pemeriksa',
          size: 15,
          font: 'Times New Roman',
          color: '555555'
        }),
        ...(inspSignedTime
          ? [
              new TextRun({
                text: `\n${inspSignedTime}`,
                size: 13,
                font: 'Times New Roman',
                color: '64748B'
              })
            ]
          : [])
      ]
    })
  ];

  const clientSigCellParas = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Pemilik Alat / Unit\n${bap.client_name || 'Perusahaan Klien'}`,
          bold: true,
          size: 17,
          font: 'Times New Roman'
        })
      ],
      spacing: { after: 60 }
    }),
    clientSigBuf
      ? new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: clientSigBuf,
              transformation: { width: 120, height: 60 }
            })
          ],
          spacing: { before: 40, after: 40 }
        })
      : new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: '\n\n\n\n', size: 16 })]
        }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `( ${bap.client_signer_name || '........................................'} )\n`,
          bold: true,
          size: 17,
          font: 'Times New Roman'
        }),
        new TextRun({
          text: bap.client_signer_title || 'Pemilik Alat / Perwakilan Klien',
          size: 15,
          font: 'Times New Roman',
          color: '555555'
        }),
        ...(clientSignedTime
          ? [
              new TextRun({
                text: `\n${clientSignedTime}`,
                size: 13,
                font: 'Times New Roman',
                color: '64748B'
              })
            ]
          : [])
      ]
    })
  ];

  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS_BLACK,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDERS_BLACK,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: inspectorSigCellParas
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDERS_BLACK,
            margins: { top: 120, bottom: 120, left: 120, right: 120 },
            children: clientSigCellParas
          })
        ]
      })
    ]
  });

  const isBothSigned = Boolean(inspectorSigBuf && clientSigBuf);
  const signatureStatusParagraph = isBothSigned
    ? new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: '✓ DITANDATANGANI SECARA ELEKTRONIK OLEH KEDUA BELAH PIHAK',
            bold: true,
            size: 15,
            color: '107038',
            font: 'Times New Roman'
          })
        ],
        spacing: { before: 100, after: 80 }
      })
    : null;

  const closingText = new Paragraph({
    children: [
      new TextRun({
        text: 'Hasil pemeriksaan ini dilakukan sesuai dengan kenyataan yang ada pada saat pemeriksaan dan pengujian unit di lapangan tanpa ada pengaruh dari pihak manapun. Demikian berita acara pemeriksaan ini dibuat dan ditandatangani oleh kedua belah pihak untuk dipergunakan sebagaimana mestinya.',
        italics: true,
        size: 15,
        color: '64748B'
      })
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 180, after: 80 }
  });

  const doc = new Document({
    sections: [
      {
        properties: F4_PAGE_PROPERTIES,
        children: [
          ...(logoParagraph ? [logoParagraph] : []),
          companyHeader,
          subHeader,
          titleParagraph,
          equipmentTitleParagraph,
          docNoParagraph,
          introParagraph,
          identityTable,
          scopeTitle,
          ...scopeParagraphs,
          resultTitle,
          conclusionParagraph,
          notesParagraph,
          sigTable,
          ...(signatureStatusParagraph ? [signatureStatusParagraph] : []),
          closingText
        ]
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
