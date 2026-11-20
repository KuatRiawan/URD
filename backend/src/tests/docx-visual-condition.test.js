import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { generateLhppDocxBuffer } from '../services/docx-generator.js';

// ---------------------------------------------------------------------------
// Helper minimal untuk membaca isi word/document.xml dari buffer DOCX tanpa
// menambah dependensi (DOCX = arsip ZIP; entri disimpan deflate/raw).
// ---------------------------------------------------------------------------
function extractXmlEntry(buffer, entryName) {
  const findEocd = () => {
    for (let i = buffer.length - 22; i >= 0; i -= 1) {
      if (buffer.readUInt32LE(i) === 0x06054b50) return i;
    }
    throw new Error('EOCD ZIP tidak ditemukan.');
  };

  const eocd = findEocd();
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let pointer = buffer.readUInt32LE(eocd + 16);

  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) {
      throw new Error('Central directory ZIP tidak valid.');
    }
    const compressionMethod = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.toString('utf8', pointer + 46, pointer + 46 + nameLength);

    if (name === entryName) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const raw = buffer.subarray(dataStart, dataStart + compressedSize);
      return compressionMethod === 0 ? raw.toString('utf8') : zlib.inflateRawSync(raw).toString('utf8');
    }

    pointer += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`Entri ${entryName} tidak ditemukan di DOCX.`);
}

/** Mengambil teks per baris tabel yang memuat label tertentu. */
function tableRowTexts(xml, needle) {
  return xml
    .split('<w:tr')
    .filter((row) => row.includes(needle))
    .map((row) =>
      [...row.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((match) => match[1]).join('|')
    );
}

const BASE_DATA = {
  object_name: 'Forklift Toyota 5FD50',
  category_name: 'PTP',
  client_name: 'PT Klien Uji',
  company_name: 'PT Klien Uji',
  inspector_name: 'Ir. Budi Santoso, ST'
};

async function renderForkliftRows(results) {
  const buffer = await generateLhppDocxBuffer({ ...BASE_DATA, results });
  const xml = extractXmlEntry(buffer, 'word/document.xml');
  return { xml, rows: tableRowTexts(xml, 'Korosi') };
}

describe('DOCX forklift — kondisi pemeriksaan visual mengikuti hasil inspeksi', () => {
  it('menandai kolom Tidak Memenuhi (NOK) hanya saat hasil inspeksi TIDAK_SESUAI', async () => {
    const { rows } = await renderForkliftRows([
      { label: 'Korosi rangka penguat', choice_value: 'TIDAK_SESUAI', notes: 'Karat berat' }
    ]);

    expect(rows.length).toBeGreaterThan(0);
    // Urutan sel: komponen | pemeriksaan | Memenuhi | Tidak Memenuhi | Keterangan
    expect(rows[0]).toContain('Korosi');
    const cells = rows[0].split('|');
    expect(cells.at(-2)).toBe('√');
    expect(cells.at(-3)).toBe('-');
    expect(cells.at(-1)).toBe('Karat berat');
  });

  it('menandai kolom Memenuhi saja saat hasil inspeksi SESUAI, tanpa menandai NOK', async () => {
    const { rows } = await renderForkliftRows([
      { label: 'Korosi rangka penguat', choice_value: 'SESUAI' }
    ]);

    const cells = rows[0].split('|');
    expect(cells.at(-3)).toBe('√');
    expect(cells.at(-2)).toBe('-');
  });

  it('tidak memfabrikasi NOK untuk baris yang tidak memiliki hasil inspeksi', async () => {
    const { rows } = await renderForkliftRows([
      { label: 'Kebocoran oli mesin', choice_value: 'TIDAK_SESUAI' }
    ]);

    const cells = rows[0].split('|');
    expect(cells.at(-3)).toBe('☐');
    expect(cells.at(-2)).toBe('☐');
  });

  it('menghasilkan blanko kosong (☐ di kedua kolom) saat dokumen belum berisi data', async () => {
    const buffer = await generateLhppDocxBuffer({ object_name: 'Forklift Toyota 5FD50', category_name: 'PTP' });
    const xml = extractXmlEntry(buffer, 'word/document.xml');
    const rows = tableRowTexts(xml, 'Korosi');

    const cells = rows[0].split('|');
    expect(cells.at(-3)).toBe('☐');
    expect(cells.at(-2)).toBe('☐');
  });
});
