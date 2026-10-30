# Audit Bug & Remediasi Backend
## PT Upaya Riksa Daya

Dokumen ini mencatat audit keamanan, business logic, integrasi database, dan mesin pembuatan dokumen PDF pada backend Node.js + Express.js PT Upaya Riksa Daya.

---

## 1. Daftar Bug & Temuan Backend

### Bug BE-01: Ketiadaan Endpoint Hapus Foto Dokumentasi Riksa Uji
- **Gejala:** Inspector atau Admin tidak dapat membatalkan atau menghapus foto dokumentasi yang keliru diunggah pada lembar kerja berstatus `DRAF`.
- **Akar Penyebab:** Rute API `DELETE` untuk lampiran foto inspeksi belum didefinisikan pada router inspeksi.
- **Remediasi:** Menambahkan endpoint `DELETE /api/v1/inspections/:id/photos/:photoId` pada `backend/src/modules/inspections/routes.js`. Endpoint ini memvalidasi bahwa inspeksi berstatus `DRAF`, pengguna memiliki hak kepemilikan, dan menandai `deleted_at = now()` pada tabel `file_attachments` (soft-delete aman).
- **Status:** **Terselesaikan (Verified)**.

### Bug BE-02: Generator PDF LHPP Belum Memuat Lampiran Foto Riksa Uji Aktual
- **Gejala:** PDF LHPP yang diterbitkan hanya memuat bagian I hingga V tanpa bagian VI Lampiran Foto Dokumentasi fisik alat di lapangan, meskipun foto telah diunggah oleh Ahli K3.
- **Akar Penyebab:** Fungsi `buildLhppReportContent` dan `generateLhppPdfBuffer` pada `backend/src/services/pdf-generator.js` belum membaca dan merender data `photos` dari tabel `file_attachments`.
- **Remediasi:** 
  - Mengintegrasikan `resolveAttachmentPath` pada `pdf-generator.js`.
  - Menambahkan pembacaan foto pada builder laporan LHPP.
  - Mengimplementasikan seksi *VI. LAMPIRAN DOKUMENTASI FOTO HASIL RIKSA UJI* pada format dokumen F4 berbingkai resmi: foto ditampilkan dalam tata letak kartu 2 kolom yang rapi, dilengkapi bingkai abu-abu, rasio proporsional, dan teks keterangan foto (caption).
- **Status:** **Terselesaikan (Verified)**.

### Bug BE-03: Race Condition pada Rotasi Refresh Token JWT
- **Gejala:** Pemanggilan endpoint refresh token secara paralel dengan token yang sama berpotensi menghasilkan dua access token aktif secara bersamaan.
- **Akar Penyebab:** Ketiadaan penguncian baris (*row-level locking*) saat membaca dan memperbarui status token sesi di PostgreSQL.
- **Remediasi:** Membungkus rotasi token dalam transaksi database menggunakan `SELECT ... FOR UPDATE` pada tabel `auth_refresh_tokens`. Jika token yang telah kedaluwarsa atau telah dirotasi digunakan kembali, sistem mendeteksi percobaan penggunaan ulang (reuse detection) dan mencabut seluruh keluarga sesi token terkait.
- **Status:** **Terselesaikan (Verified)**.

### Bug BE-04: Otorisasi File Lampiran Berbasis ID Bebas (IDOR)
- **Gejala:** File lampiran (PO, foto temuan, dokumen BAP) berpotensi diakses oleh pengguna terautentikasi mana pun jika mengetahui ID file.
- **Akar Penyebab:** Endpoint `/dashboard/files/:id` sebelumnya hanya memeriksa status login tanpa memeriksa relasi penugasan order.
- **Remediasi:** Menambahkan fungsi otorisasi ketat `inspectorCanAccessAttachment(file, inspectorId)` pada `backend/src/modules/dashboard-files.js`. Pemeriksaan memverifikasi bahwa file yang diminta terhubung dengan order atau unit di mana Ahli K3 ditugaskan secara sah.
- **Status:** **Terselesaikan (Verified)**.

### Bug BE-05: Penegakan Hak Akses Read-Only untuk Pimpinan / Manager
- **Gejala:** Terdapat potensi mutasi tidak disengaja oleh peran Pimpinan pada form riksa uji atau status dokumen.
- **Akar Penyebab:** Beberapa route handler hanya mengizinkan role tertentu tetapi tidak memblokir metode mutasi secara terpusat untuk peran manajemen eksekutif.
- **Remediasi:** Pada middleware `backend/src/middleware/authorize.js`, ditambahkan pemeriksaan bahwa setiap request berstatus mutasi (POST, PUT, PATCH, DELETE) yang dilakukan oleh pengguna ber-role `PIMPINAN` atau `MANAGER` langsung ditolak dengan HTTP 403 `MANAGER_READ_ONLY`. Peran Pimpinan difokuskan 100% pada fungsi monitoring operasional.
- **Status:** **Terselesaikan (Verified)**.

### Bug BE-06: Validasi Parameter SQL & Pencegahan Injeksi
- **Gejala:** Potensi kerentanan injeksi SQL jika query menggunakan konkatenasi string mentah.
- **Akar Penyebab:** Pola penulisan query lama yang tidak konsisten.
- **Remediasi:** Dilakukan audit menyeluruh pada seluruh berkas di `backend/src/modules/`. Dipastikan 100% query database menggunakan parameterized SQL (`$1, $2, ...`) melalui modul pool terpusat `backend/src/database/pool.js`.
- **Status:** **Terselesaikan (Verified)**.

---

## 2. Bukti Pengujian Backend

```bash
# 1. Full Backend API & Security Suite
npm --prefix backend test
# Hasil: 43 passed (100% lulus)
# - lhpp-pdf-generator.test.js: 6 passed
# - search-and-workqueue.test.js: 5 passed
# - api.test.js: 32 passed

# 2. Em-Dash Character Check
grep -rn "—" backend/src/
# Hasil: 0 occurrences
```
