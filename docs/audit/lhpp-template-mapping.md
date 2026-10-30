# Pemetaan Template Laporan LHPP & Generator PDF Resmi
## PT Upaya Riksa Daya

Dokumen ini memetakan standar struktur Laporan Hasil Pemeriksaan dan Pengujian (LHPP) resmi PT Upaya Riksa Daya sesuai berkas acuan PDF asli perusahaan yang tersimpan di direktori `docs/` serta spesifikasi format kertas F4 (Folio 215 x 330 mm).

---

## 1. Berkas Acuan PDF Resmi Perusahaan

Investigasi dilakukan terhadap berkas laporan inspeksi faktual yang diterbitkan oleh PT Upaya Riksa Daya:
- `docs/PT CCBI Cibitung_Manual Gantry Crane (K3 CRN TRVL 601)_C19080724_AH.pdf` (Pesawat Angkat & Angkut - PAA)
- `docs/PT CCBI, Cibitung_Air Pressure Tank (K3 BTU 001)_TMH-3013-21_MS.pdf` (Pesawat Uap & Bejana Tekan - PUBT)

Standar ini mengikat seluruh 7 kategori bidang riksa uji:
1. **PAA:** Pesawat Angkat dan Angkut (Crane, Hoist, Forklift, Excavator).
2. **PUBT:** Pesawat Uap dan Bejana Tekan (Boiler, Air Receiver Tank, Bejana Transport).
3. **PTP:** Pesawat Tenaga dan Produksi (Genset, Mesin Bubut, Press Machine).
4. **IPP:** Instalasi Penyalur Petir & Pembumian (Sistem Franklin, Elektrostatis, Grounding Rod).
5. **LIS:** Instalasi Listrik & Proteksi Kebakaran (Panel Listrik, Trafo, Heat/Smoke Detector).
6. **LE:** Lift dan Eskalator (Passenger Elevator, Freight Lift, Escalator).
7. **IPK:** Instalasi Proteksi Kebakaran (Hydrant, Springkler, APAR).

---

## 2. Struktur Anatomi Dokumen LHPP (Kertas F4)

Dokumen LHPP di-generate menggunakan library `pdfkit` dengan tata letak berstandar enterprise:

### Halaman 1: Sampul / Cover Resmi
- Logo resmi PT Upaya Riksa Daya (`logo-urd.png`) di bagian atas tanpa distorsi aspek rasio.
- Identitas PJK3 resmi: PT Upaya Riksa Daya dengan Keputusan Penunjukan Menteri Ketenagakerjaan R.I.
- Judul Laporan: `LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN - SERTIFIKASI KESELAMATAN DAN KESEHATAN KERJA`.
- Kotak Ringkasan Unit (Summary Card): Nama Perusahaan Klien, No Tag / Item, Jenis Objek K3, Nomor Seri, Merk / Model, Kapasitas Kerja Aman (SWL), Lokasi Pemasangan, Tanggal Pemeriksaan, dan Rekomendasi Jadwal Uji Ulang.
- Barcode / QR Code verifikasi dokumen digital publik.
- Footer kontak resmi kantor pusat PT Upaya Riksa Daya.

### Halaman 2 dst: Lembar Teknis & Pengujian Berkelanjutan
- **Kop Surat Konsisten:** Logo URD di kiri atas, nama perusahaan, alamat, kontak, dan garis aksen marun (`#C81E1E`).
- **Subheader Metadata:** Nomor LHPP, Nomor BAP, Nomor PO, dan Status Dokumen.

#### Bagian I: Data Umum Pemilik & Pemeriksaan
- Tabel 2 kolom terstruktur berisi nama perusahaan pemakai, alamat pabrik/proyek, lokasi instalasi unit, kontak PIC, dasar hukum regulasi K3 (Permenaker terkait), jenis pemeriksaan (Pertama / Berkala / Khusus), tanggal pelaksanaan, dan nama Ahli K3 pemeriksa.

#### Bagian II: Data Teknis & Spesifikasi Objek K3
- Kotak metode riksa uji & catatan analisis teknis.
- Tabel spesifikasi teknis spesifik per kategori (misalnya daya angkat & bentang span untuk Crane; tekanan desain, volume & ketebalan plat shell untuk Bejana Tekan; nilai tahanan pembumian untuk Penyalur Petir).

#### Bagian III: Hasil Pemeriksaan Visual & Pengujian Fungsi
- Matriks evaluasi berkolom: No., Butir Komponen / Bagian Diperiksa, Hasil Pengukuran Faktual Lapangan, dan Status Kesesuaian K3 (`SESUAI`, `TIDAK SESUAI / TEMUAN`, `TIDAK BERLAKU`).

#### Bagian IV: Temuan Ketidaksesuaian & Rekomendasi Teknis
- Tabel temuan lapangan diklasifikasikan berdasarkan tingkat risiko (Kritis, Mayor, Minor).
- Rekomendasi tindakan korektif K3 yang wajib dipenuhi oleh pihak pemakai alat sebelum batas waktu tertentu.
- Pernyataan baku jika tidak ditemukan ketidaksesuaian teknis.

#### Bagian V: Kesimpulan Teknis & Syarat Keselamatan Kerja
- Banner status kelayakan K3:
  - Hijau: `MEMENUHI PERSYARATAN KESELAMATAN DAN KESEHATAN KERJA (LAYAK OPERASI)`.
  - Amber: `MEMENUHI PERSYARATAN DENGAN CATATAN PERBAIKAN`.
  - Merah: `TIDAK MEMENUHI PERSYARATAN K3 (DILARANG OPERASI)`.
- Syarat-syarat operasional K3 (Operator wajib memiliki SIO resmi Kemnaker R.I., dilarang mengoperasikan alat melebihi kapasitas beban maksimum, dan kewajiban uji ulang berkala).

#### Bagian VI: Lampiran Dokumentasi Foto Riksa Uji
- Foto-foto fisik alat, nameplate pabrikan, dan saat pengujian beban/fungsi dirangkum dalam tata letak kartu grid 2 kolom.
- Setiap foto dilengkapi bingkai abu-abu halus, aspek rasio proporsional, dan teks keterangan foto (caption) di bagian bawahnya.
- Penanganan otomatis pemutusan halaman (*page break*) jika lampiran foto melebihi kapasitas halaman F4.

#### Lembar Pengesahan (Tanda Tangan 3 Pihak)
- Disajikan dalam format 3 kolom sejajar di bagian penutup:
  1. **Yang Memeriksa:** Ahli K3 Spesialis (Inspector) dilengkapi goresan tanda tangan digital dan QR Code verifikasi.
  2. **Diperiksa Oleh:** Reviewer Teknis K3.
  3. **Disetujui Oleh:** Direktur / Pimpinan PT Upaya Riksa Daya.
- Penomoran halaman otomatis (`Halaman X dari Y`) pada footer setiap lembar teknis.

---

## 3. Bukti Implementasi & Pengujian

- Modul generator: `backend/src/services/pdf-generator.js`.
- Pengujian otomatis: `npm --prefix backend test src/tests/lhpp-pdf-generator.test.js` (6 tes lulus 100%).
- Verifikasi visual berkas PDF: File ter-render rapi dan konsisten dengan standar dokumen cetak resmi K3.

