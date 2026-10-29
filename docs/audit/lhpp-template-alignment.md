# Keselarasan Template & Format Output LHPP: PT Upaya Riksa Daya

## 1. Analisis Referensi Dokumen Asli
Berdasarkan investigasi terhadap berkas laporan inspeksi riksa uji resmi PT Upaya Riksa Daya (antara lain `docs/PT CCBI Cibitung_Manual Gantry Crane (K3 CRN TRVL 601)_C19080724_AH.pdf` dan `docs/PT CCBI, Cibitung_Air Pressure Tank (K3 BTU 001)_TMH-3013-21_MS.pdf`), laporan LHPP resmi memiliki standar struktur enterprise:

1. **Halaman Sampul / Cover Resmi**:
   - Logo resmi PT Upaya Riksa Daya di bagian atas.
   - Nama instansi PJK3 resmi dengan SKP Penunjukan Kemenaker R.I.
   - Judul dokumen: `LAPORAN HASIL PEMERIKSAAN DAN PENGUJIAN - SERTIFIKASI KESELAMATAN DAN KESEHATAN KERJA`.
   - Kotak ringkasan identitas unit (Cover Summary Card): Nama Perusahaan, No Item/Tag, Jenis Peralatan, Nomor Seri, Merk/Model, Kapasitas, Lokasi, Tanggal Pemeriksaan, Rekomendasi Riksa Uji Ulang, Nomor LHPP.
   - Kode QR verifikasi publik dokumen resmi.
   - Kontak dan alamat kantor pusat PT Upaya Riksa Daya di bagian bawah sampul.

2. **Kop & Header Berkelanjutan**:
   - Kop resmi dengan logo URD di kiri atas, nama perusahaan, alamat, telepon, email, web, serta garis aksen marun.
   - Subheader judul laporan dan kotak ringkasan metadata (Nomor LHPP, BAP, PO, Versi, Status).

3. **Tabel Data Umum (Bagian I)**:
   - Disajikan dalam tabel 2-kolom terstruktur dengan garis kisi (grid borders) dan latar bergantian halus (`#FFFFFF` dan `#F8FAFC`).

4. **Data Teknis & Evaluasi Spesifik (Bagian II)**:
   - Box Metode Riksa Uji & Catatan Analisis Teknis.
   - Tabel parameter teknis lapangan per kategori alat (PAA, PUBT, PTP, IPP, LIS, IPK).

5. **Tabel Hasil Pemeriksaan & Pengujian (Bagian III)**:
   - Tabel matriks berkolom: No., Komponen / Parameter Diperiksa, Hasil Pemeriksaan & Pengukuran, serta Status K3 (SESUAI, TEMUAN, CATATAN, N/A).

6. **Temuan Lapangan & Rekomendasi (Bagian IV)**:
   - Tabel terstruktur temuan berdasar tingkat risiko (Kritis, Mayor, Minor) serta tindakan korektif K3.
   - Keterangan jelas dan rapi apabila tidak ada ketidaksesuaian.

7. **Kesimpulan & Syarat Operasional (Bagian V / VI)**:
   - Pernyataan kesimpulan resmi inspeksi.
   - Banner status K3 yang tegas (Hijau untuk Memenuhi Syarat, Amber untuk Memenuhi Syarat Dengan Catatan, Merah untuk Tidak Memenuhi Syarat).
   - Syarat-syarat keselamatan kerja & operasional K3 (Operator berlisensi SIO Kemnaker, larangan melebihi SWL, jadwal uji berkala).

8. **Pengesahan & Tanda Tangan 3 Pihak**:
   - Format 3 kolom sejajar: Yang Memeriksa/Menguji (Ahli K3 + Kode QR), Direview Oleh (Reviewer Teknis K3), dan Disetujui Oleh (Pimpinan PT Upaya Riksa Daya).
   - Penomoran halaman dinamis (`Halaman X dari Y`) pada footer setiap halaman teknis.

## 2. Validasi & Pengujian
- Unit test backend: `npm --prefix backend test src/tests/lhpp-pdf-generator.test.js` (6/6 lulus).
- Frontend test: `npm --prefix frontend test` (4/4 lulus).
- Production build: `npm --prefix frontend run build` (lulus tanpa error).
- Sampel dokumen dihasilkan di root: `Draf-LHPP.pdf`.
