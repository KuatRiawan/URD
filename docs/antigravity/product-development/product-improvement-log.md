# Product Improvement Log
**PT Upaya Riksa Daya (URD) — Catatan Perbaikan & Pengembangan Produk**

---

## Ringkasan Perubahan per Modul

### 1. Modul Lapangan & Pemeriksaan Ahli K3 (Inspector Experience)
- **Eliminasi Auto-Fill Checklist**: Menghapus fitur `handleAutoFillAllStandard` dari `useInspectionDetailForm.js` dan antarmuka `InspectionDetailModal.jsx`. Ahli K3 diwajibkan memeriksa satu per satu item checklist secara empiris di lapangan.
- **Verifikasi Nameplate Fisik Unit (Object Matching)**: Menambahkan blok antarmuka khusus di bagian teratas Langkah 1 Checklist (`StepChecklist.jsx`). Menampilkan data spesifikasi sistem (Nama Unit, No. Seri, Kapasitas SWL, Lokasi) berdampingan dengan foto nameplate fisik.
- **One-Tap Photo Upload & Offline Fallback**: Inspector dapat langsung mengunggah foto nameplate dari kamera ponsel atau galeri. Jika koneksi terputus, sistem secara otomatis memasukkannya ke dalam antrean offline (`offlineQueue`) dengan status tersinkronisasi lokal.
- **Shortcut Pelaporan Ketidaksesuaian Nameplate**: Apabila nomor seri fisik unit berbeda dengan data PO, tombol "Laporkan Ketidaksesuaian Fisik" langsung membuka formulir pelaporan kendala teknis tanpa harus meninggalkan alur inspeksi.

### 2. Modul Antrean Kerja & Administrasi Operasional (Admin Kantor Experience)
- **Ekspansi Work Queue Backend (`dashboard-files.js`)**:
  - `BAP_PROCESSING`: Mendeteksi unit yang memiliki draf BAP dan memerlukan penandatanganan serta verifikasi Admin Kantor.
  - `SUKET_RECORDING`: Mendeteksi unit dengan LHPP terbit yang belum memiliki nomor pencatatan Surat Keterangan (Suket) Disnaker.
  - `DOCUMENT_DISTRIBUTION`: Mendeteksi berkas dokumen resmi (BAP, LHPP, Suket) yang siap dikirimkan kepada klien atau masih dalam perjalanan ekspedisi.
  - `OPERATIONAL_ISSUE`: Mendeteksi kendala lapangan berstatus terbuka (*open*) atau berurgensi tinggi yang memerlukan intervensi tim operasional kantor.
- **Filter Tab Operasional Cerdas (`WorkQueueWidget.jsx`)**:
  - Menyediakan tab kategorisasi: `Semua`, `Tinggi`, `LHPP & BAP`, `Suket & Distribusi`, dan `Kendala`.
  - Tiap baris dilengkapi badge jenis tugas dan warna urgensi.

### 3. Modul Monitoring Eksekutif (Pimpinan Experience)
- **Read-Only Invariant Enforcement**: Memastikan peran `PIMPINAN` tidak memiliki tombol penambahan/mutasi data (tombol *Catat PO Baru* dinonaktifkan pada UI, dan mutasi backend dicegah via otorisasi middleware).
- **Banner Peringatan Kendala Lapangan**: Menampilkan bilah peringatan interaktif di bagian teratas dasbor apabila terdapat isu lapangan yang belum terselesaikan.
- **Executive Operational Pipeline Widget (`ManagementDashboardView.jsx`)**:
  - **Tahapan Siklus Unit Lapangan**: Visualisasi jumlah unit pada status Menunggu, Inspeksi Lapangan, Perlu Revisi, dan Unit Selesai.
  - **Dokumen Resmi & Distribusi**: Visualisasi progres dokumen resmi (BAP Final vs Draf, LHPP Terbit vs Menunggu QC, Suket Tercatat, dan Dokumen Terkirim vs Siap Kirim).

### 4. Modul Komersial & Registrasi PO (Marketing Experience)
- **Duplikasi Spesifikasi Unit Cepat (`StepPoUnits.jsx`)**:
  - Menambahkan tombol ikon duplikasi (*Copy*) pada setiap baris unit yang telah ditambahkan ke PO.
  - Membantu Marketing menyalin atribut (kategori K3, nama jenis alat, kapasitas SWL, lokasi kerja) saat mendaftarkan beberapa unit sejenis dalam satu PO klien.
- **Retensi Lokasi Pabrik (`useOrderManagement.js`)**:
  - Setelah unit ditambahkan ke form pembuatan PO, kolom lokasi pemasangan (*installLocation*) tetap dipertahankan sehingga pengguna tidak perlu mengetik ulang area pabrik untuk unit berikutnya.
- **Pelacakan Independen Progres Unit**:
  - Menampilkan status unit independen dalam PO (`OrderDetailModal.jsx`) dengan visualisasi progres penyelesaian unit yang jelas.

### 5. Dokumen & PDF Engine (7 Kategori K3)
- **Cakupan Kategori Elevator & Eskalator (`LE`)**:
  - Memperluas skenario uji `lhpp-pdf-generator.test.js` untuk mencakup bidang `LE` pada pemeriksaan skema data teknis (*kecepatan nominal*, *sistem traksi*, *governor*, dll.) dan rendering multi-halaman F4 tanpa galat.
  - Mempertahankan integritas 6 bidang K3 lainnya (`PAA`, `PUBT`, `PTP`, `IPP`, `LIS`, `IPK`) yang telah dilengkapi berkas lampiran SKP resmi.

### 6. Implementasi 7 Dokumen Output Resmi Sesuai PRD Section 4.2
- **Dokumen #1 Surat Tugas / SPK Inspector (PDF)**:
  - Tersedia dan terverifikasi di `/api/v1/orders/:id/assignment-letter.pdf`.
- **Dokumen #2 Berita Acara Pemeriksaan / BAP (PDF)**:
  - Tersedia di `/api/v1/bap/:id/pdf` dan batch PO di `/api/v1/bap/order/:orderId/batch-pdf`.
- **Dokumen #3 Lembar Temuan & Rekomendasi K3 (Corrective Action Notice PDF)**:
  - Dibuat fungsi `generateRecommendationLetterPdfBuffer(data)` di `pdf-generator.js` dengan format resmi PT Upaya Riksa Daya.
  - Ditambahkan endpoint `GET /api/v1/inspections/:id/recommendation-letter.pdf`.
  - Terintegrasi pada kartu dokumen di formulir kerja Ahli K3 (`InspectionHeaderSection.jsx`).
- **Dokumen #4 Buku / Dokumen LHPP Lengkap (PDF & Word)**:
  - Tersedia di `/api/v1/lhpp/:id/pdf` dan `/api/v1/lhpp/:id/docx` mencakup 7 bidang K3, lampiran SKP, dan sertifikat kalibrasi.
- **Dokumen #5 Surat Keterangan / Suket K3 Disnaker (Upload Scan PDF)**:
  - Tersedia pencatatan, upload pindaian scan, dan riwayat tindak lanjut masa berlaku di `/api/v1/suket`.
- **Dokumen #6 Stiker / Label QR Code Objek Alat K3 Siap Cetak (PDF)**:
  - Dibuat fungsi `generateObjectQrStickerPdfBuffer(data)` di `pdf-generator.js` dengan layout cetak standar stiker (100mm x 75mm / 283.46pt x 212.6pt), logo resmi, bingkai keselamatan merah K3, dan kode QR unik yang mengarah ke portal publik verifikasi `/verifikasi/:code`.
  - Ditambahkan endpoint `GET /api/v1/objects/:id/qr-sticker.pdf` dan `GET /api/v1/suket/:id/qr-sticker.pdf`.
  - Ditambahkan tombol cetak pada modal QR Objek (`ObjectQrModal.jsx`), modal Suket (`SuketDetailModal.jsx`), dan lembar inspeksi (`InspectionHeaderSection.jsx`).
- **Dokumen #7 Berita Acara Serah Terima / BAST (PDF)**:
  - Dibuat fungsi `generateBastPdfBuffer(data)` di `pdf-generator.js` lengkap dengan kop surat resmi URD, daftar serah terima dokumen final (LHPP, BAP, Suket), tabel unit terperiksa, dan kolom tanda tangan kedua pihak (Pengirim PT Upaya Riksa Daya & Penerima Klien).
  - Ditambahkan endpoint `GET /api/v1/distributions/orders/:orderId/bast/pdf` dan `GET /api/v1/orders/:id/bast.pdf`.
  - Ditambahkan tombol cetak BAST pada daftar distribusi (`DocumentDistributionPage.jsx` & `DistributionTable.jsx`), modal detail PO (`OrderDetailModal.jsx`), serta tabel ringkasan PO (`OrderTable.jsx`).

