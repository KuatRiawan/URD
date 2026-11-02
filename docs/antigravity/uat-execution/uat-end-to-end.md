# Laporan Pelaksanaan UAT Operasional End-to-End — URD Phase 1

Tanggal Pengujian: 2 November 2026  
Status Eksekusi: **PASS (100%)**  
File Uji Otomasi: `backend/src/tests/uat-e2e.test.js` (29 UAT Assertions)  
Skenario Simulasi: PT Demo UAT URD (PO-URD-UAT-001, 3 Unit Multi-Bidang K3)  
Pelaksana: Principal Product Engineer & QA Lead  

---

## 1. Konteks Simulasi Operasional

Pengujian End-to-End (UAT) dilakukan untuk membuktikan alur kerja nyata operasional PT Upaya Riksa Daya berjalan tanpa hambatan, aman secara data, dan mematuhi aturan bisnis pemisahan unit independen dalam satu Purchase Order (PO).

### Entitas UAT:
- **Klien:** PT Demo UAT URD
- **Alamat Pabrik:** Kawasan Industri MM2100, Cikarang Barat, Bekasi
- **Kontak PIC:** Hendra Wijaya (HSE Manager — 081298765432)
- **Nomor PO:** `PO-URD-UAT-001`
- **Daftar Unit dalam PO:**
  1. **Unit A:** Overhead Crane 15T — Bidang **PAA** (Pesawat Angkat dan Angkut)
  2. **Unit B:** Air Receiver Tank 2000L — Bidang **PUBT** (Pesawat Uap dan Bejana Tekan)
  3. **Unit C:** Genset 500 kVA — Bidang **PTP** (Pesawat Tenaga dan Produksi)

---

## 2. Rincian Eksekusi Per Tahap (Fase Alur Kerja)

### Tahap 1: Pengelolaan Komersial (Role: Marketing)
- **Aksi:**
  - Login dengan akun `marketing@upayariksadaya.com`.
  - Mendaftarkan entitas klien PT Demo UAT URD via `POST /api/v1/clients`.
  - Menambahkan kontak PIC Hendra Wijaya via `POST /api/v1/clients/:id/contacts`.
  - Membuat pesanan kerja PO-URD-UAT-001 memuat 3 unit sekaligus via `POST /api/v1/orders`.
- **Verifikasi Database PostgreSQL:**
  - Record tersimpan di tabel `clients`, `client_contacts`, `orders`, dan 3 baris di `order_objects`.
  - Status awal setiap unit adalah `TERJADWAL`.
- **Verifikasi Keamanan Akses:**
  - Marketing mencoba mengakses `POST /api/v1/lhpp/:id/finalize` -> Ditolak (**403 Forbidden**).
  - Marketing dilarang melakukan QC maupun proses distribusi.

### Tahap 2: Penjadwalan & Matriks Kompetensi (Role: Admin Kantor / Sistem)
- **Aksi:**
  - Sistem memeriksa matriks kompetensi Ahli K3 via `GET /api/v1/inspectors/competencies`.
  - Unit A (PAA) dijadwalkan kepada Inspector A (memiliki SKP Ahli K3 PAA yang masih berlaku).
  - Unit B (PUBT) dijadwalkan kepada Inspector B (memiliki SKP Ahli K3 PUBT yang masih berlaku).
  - Unit C (PTP) sengaja dibiarkan belum ditugaskan untuk menguji ketahanan unit independence.
- **Verifikasi Database:**
  - Kolom `inspector_id` dan `scheduled_date` terisi pada Unit A dan Unit B di `order_objects`.

### Tahap 3: Pelaksanaan Inspeksi Lapangan Unit A (Role: Inspector A)
- **Aksi:**
  - Login sebagai Inspector A (`inspector.a@upayariksadaya.com`).
  - Membuka daftar penugasan: Unit A tampil, sedangkan penugasan Unit B milik Inspector B tidak terlihat.
  - Mengisi formulir draf inspeksi Bab II LHPP (spesifikasi kapasitas 15 ton, bentang rel 18 m, pabrik pembuat).
  - Mengisi seluruh butir checklist teknis (kondisi konstruksi, tali kawat baja, hook, rem, limit switch).
  - Mengunggah foto dokumentasi nameplate dan visual crane via `POST /api/v1/inspections/:id/photos`.
  - Mengisi kesimpulan kelaikan teknis: `MEMENUHI_SYARAT_K3`.
  - Membubuhkan tanda tangan digital Ahli K3 dan tanda tangan digital PIC Klien (Hendra Wijaya).
  - Mengirimkan laporan inspeksi via `POST /api/v1/inspections/:id/submit`.
- **Verifikasi Database:**
  - Status inspeksi berubah menjadi `SUBMITTED`.
  - Status `order_objects.unit_status` untuk Unit A berubah menjadi `MENUNGGU_VERIFIKASI`.

### Tahap 4: QC, LHPP, BAP, Suket & Distribusi Unit A (Role: Admin Kantor)
- **Aksi:**
  - Login sebagai Admin Kantor (`admin.kantor@upayariksadaya.com`).
  - Melakukan review kelengkapan checklist dan foto hasil uji Unit A.
  - Memberikan verifikasi QC Lulus (`POST /api/v1/inspections/:id/review-qc` -> `status: ACC_QC`).
  - Status unit berubah menjadi `LHPP_SIAP_PREVIEW`.
  - Memfinalisasi LHPP via `POST /api/v1/lhpp/:id/finalize` -> Terbit Nomor LHPP: `001/LHPP-URD/XI/2026`.
  - Memfinalisasi BAP via `POST /api/v1/bap/:id/finalize` -> Terbit Nomor BAP: `001/BAP-URD/XI/2026`.
  - Mencatatkan Surat Keterangan (Suket) Disnaker via `POST /api/v1/suket` -> Nomor Suket: `566/123/DISNAKER-JBR/2026` dengan masa berlaku 1 tahun.
  - Memproses distribusi dokumen fisik via kurir ekspedisi (`POST /api/v1/distributions`) mencakup LHPP, BAP, Suket, dan stiker QR.
  - Mengunggah bukti terima (BAST bertanda tangan klien) dan nomor resi pengiriman, lalu mengupdate status distribusi menjadi `DITERIMA`.
- **Verifikasi Hasil Akhir Unit A:**
  - Status unit Unit A pada `order_objects` secara otomatis bertransisi menjadi **`SELESAI`**.

### Tahap 5: Penanganan Revisi Lapangan Unit B (Role: Inspector B & Admin Kantor)
- **Aksi:**
  - Inspector B login dan mengisi checklist Unit B (Air Receiver Tank 2000L).
  - Pada butir pemeriksaan manometer / pressure gauge, ditemukan masa berlaku sertifikat kalibrasi telah kedaluwarsa. Inspector B mencatat temuan tersebut dan mengirim laporan draf ke kantor.
  - Admin Kantor melakukan pemeriksaan QC dan menemukan perlunya bukti kalibrasi ulang sebelum LHPP dapat difinalisasi.
  - Admin Kantor mengembalikan laporan draf dengan menekan tombol Minta Revisi (`POST /api/v1/inspections/:id/reopen`) disertai catatan revisi spesifik:
    *"Mohon lampirkan sertifikat kalibrasi pressure gauge terbaru dari laboratorium terakreditasi."*
  - Status inspeksi Unit B kembali menjadi `DRAF` / `REVISI`.
  - Inspector B login kembali, membaca catatan revisi dari Admin Kantor, mengunggah sertifikat kalibrasi yang diperbarui, dan mengirim ulang via `POST /api/v1/inspections/:id/submit`.
  - Admin Kantor memeriksa ulang perbaikan dan menyatakan lolos QC.
- **Verifikasi Hasil Unit B:**
  - Status Unit B saat ini: `LHPP_SIAP_PREVIEW` (siap diproses finalisasi LHPP dan BAP).
  - Histori revisi dan catatan feedback tersimpan rapi pada `order_revisions`.

### Tahap 6: Bukti Independensi Unit dalam Satu PO
Kondisi akhir unit dalam PO-URD-UAT-001:
- **Unit A (Overhead Crane):** Status **`SELESAI`** (LHPP, BAP, Suket terbit, BAST diterima klien).
- **Unit B (Air Receiver Tank):** Status **`LHPP_SIAP_PREVIEW`** (Revisi selesai, menunggu antrean cetak LHPP).
- **Unit C (Genset 500 kVA):** Status **`TERJADWAL`** (Belum dimulai penugasan lapangan).
- **Status PO Induk:** **`DALAM_PROSES`**.

**Kesimpulan Pengujian Independensi:**
Unit A yang telah memenuhi kualifikasi teknis dan administratif berhasil diselesaikan serta didistribusikan kepada klien beserta Suket dan BAST tanpa terhambat oleh proses revisi kalibrasi pada Unit B maupun penundaan jadwal pada Unit C.

### Tahap 7: Pengawasan Monitoring Pimpinan (Role: Pimpinan)
- **Aksi:**
  - Login sebagai Pimpinan (`pimpinan@upayariksadaya.com`).
  - Membuka dashboard pemantauan operasional dan detail PO-URD-UAT-001.
  - Metrik kemajuan unit terpantau akurat secara real-time:
    - 1 Unit Selesai (33.3%)
    - 1 Unit Dalam Review Mutu (33.3%)
    - 1 Unit Menunggu Penjadwalan (33.3%)
- **Verifikasi:**
  - Seluruh data tersaji informatif dan jelas.
  - Pimpinan tidak memiliki tombol maupun wewenang untuk mengubah status atau mengesahkan dokumen secara sepihak.

---

## 3. Matriks Hasil UAT End-to-End

| Modul Operasional | Peran Terlibat | Target Hasil UAT | Status |
|:---|:---:|:---|:---:|
| Manajemen Klien & PO | Marketing | Klien, PIC, dan 3 unit PO tersimpan akurat di PostgreSQL | **PASS** |
| Matriks Kompetensi | Admin Kantor | Penugasan Ahli K3 sesuai bidang kompetensi (PAA, PUBT) | **PASS** |
| Checklist Lapangan Unit A | Inspector A | Spesifikasi teknis Bab II, checklist, foto, tanda tangan tersimpan | **PASS** |
| Verifikasi Mutu (QC) Unit A | Admin Kantor | Review checklist lengkap, status bertransisi ke LHPP Siap Preview | **PASS** |
| Finalisasi Dokumen Unit A | Admin Kantor | LHPP 5 bab F4 dan BAP resmi terbit dengan nomor unik | **PASS** |
| Registrasi Suket Unit A | Admin Kantor | Suket K3 Disnaker tercatat dengan masa berlaku 1 tahun | **PASS** |
| Distribusi & BAST Unit A | Admin Kantor | Resi ekspedisi dan BAST terverifikasi, unit status menjadi SELESAI | **PASS** |
| Alur Revisi Lapangan Unit B | Admin Kantor & Insp B | Catatan revisi terkirim, draf dibuka kembali, resubmit sukses | **PASS** |
| Independensi Unit | Lintas Peran | Unit A selesai dan terbit dokumen tanpa terhambat Unit B dan C | **PASS** |
| Monitoring Pimpinan | Pimpinan | Dasbor operasional akurat, status read-only terlindungi | **PASS** |

**Hasil Keseluruhan UAT:** **PASS (100% dari 29 Skenario Teruji)**

