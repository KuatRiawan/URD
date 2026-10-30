# Laporan Hasil Pengujian Otomatis & Verifikasi Kualitas
## PT Upaya Riksa Daya

Dokumen ini memuat hasil eksekusi pengujian otomatis pada frontend dan backend serta verifikasi kualitas kode sistem PT Upaya Riksa Daya.

---

## 1. Ringkasan Eksekusi Pengujian

| Komponen Sistem | Test Runner | File Pengujian | Jumlah Tes | Status | Durasi |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Frontend Routing & Auth** | Vitest 3.2.7 | `src/app/App.test.jsx` | 4 | **100% LULUS** | 659 ms |
| **Frontend Production Build** | Vite 6.4.5 | Rollup Compiler | 4,684 modul | **100% LULUS** | 5.18 detik |
| **Backend PDF Engine** | Vitest 3.2.7 | `src/tests/lhpp-pdf-generator.test.js` | 6 | **100% LULUS** | 639 ms |
| **Backend Search & Queue** | Vitest 3.2.7 | `src/tests/search-and-workqueue.test.js` | 5 | **100% LULUS** | 57 ms |
| **Backend Full API & Security** | Vitest 3.2.7 | `src/tests/api.test.js` | 32 | **100% LULUS** | 5.50 detik |
| **Pemeriksaan Karakter Em-Dash** | GNU Grep | Seluruh codebase `frontend/` & `backend/` | 0 temuan | **100% PATUH** | - |

**Total Tes Lulus: 47 / 47 Pengujian Otomatis (100% Pass Rate).**

---

## 2. Rincian Kasus Uji Backend (`api.test.js` & Penunjang)

1. **Autentikasi & Keamanan Sesi:**
   - Login berhasil untuk seluruh peran (`ADMIN_SISTEM`, `ADMIN_KANTOR`/`MARKETING`, `AHLI_K3`/`INSPECTOR`, `PIMPINAN`).
   - Penolakan kata sandi salah dan pencatatan audit log kegagalan login.
   - Rotasi token refresh dengan penguncian baris (`FOR UPDATE`) dan deteksi penggunaan ulang token (reuse detection).
   - Pencabutan token sesi saat logout.
2. **Kontrol Akses Peran (RBAC):**
   - Ahli K3 / Inspector dilarang mengakses modul manajemen user (`403 FORBIDDEN`).
   - Pimpinan strictly read-only: percobaan operasi mutasi (POST, PUT, DELETE) langsung dibatalkan dengan status HTTP 403 `MANAGER_READ_ONLY`.
   - Admin Sistem dapat mengelola konfigurasi akun dan memvalidasi template.
3. **Purchase Order Multi-Unit & Siklus Riksa Uji:**
   - Input PO dengan multi-unit alat sekaligus.
   - Penjadwalan lapangan dan deteksi konflik jadwal antar-lokasi.
   - Ahli K3 menerima tugas dan dapat mengunduh Surat Tugas resmi.
   - Pengisian formulir riksa uji digital, penyimpanan draf berkala, dan penambahan temuan teknis.
   - Pelampiran foto dokumentasi fisik alat serta penghapusan foto draf.
   - Penandatanganan digital oleh Ahli K3 dan PIC Perwakilan Klien di lokasi proyek.
   - Finalisasi riksa uji: penguncian form, penerbitan BAP (Berita Acara), dan pembuatan draf LHPP otomatis.
   - Penerbitan dokumen LHPP F4 dengan lampiran foto grid 2 kolom berbingkai resmi.
   - Distribusi dokumen ke Klien dan Disnaker hingga PO berstatus selesai otomatis saat seluruh unit beres.
4. **Pencarian Global & Antrean Kerja:**
   - Endpoint `/search` mengembalikan hasil akurat untuk pencarian no PO, klien, no seri alat, BAP, dan LHPP.
   - Endpoint `/dashboard/work-queue` mengembalikan daftar antrean prioritas sesuai peran yang aktif.

---

## 3. Rincian Kasus Uji Frontend (`App.test.jsx`)

1. Pengalihan otomatis path root (`/`) langsung ke halaman `/login` tanpa menampilkan landing page publik.
2. Validasi form login: pencegahan pengiriman kosong dan fungsionalitas tombol intip kata sandi (toggle password visibility).
3. Proteksi route: memblokir akses peran tidak sah ke halaman `/app/users` dengan tampilan 403 Akses Ditolak.
4. Render seluruh halaman fitur internal (Dasbor, PO, Objek Uji, Jadwal, Form Riksa Uji, BAP, LHPP, Distribusi Dokumen, Pengaturan Akun, Audit Log) bebas dari blank screen atau error rendering.

---

## 4. Kepatuhan Standar Anti-Slop & UI/UX

- **Aturan R-02 (Anti Em-Dash):** Tidak ditemukan satu pun karakter em dash (`\u2014` atau `—`) pada seluruh teks antarmuka pengguna maupun komentar kode.
- **Konsistensi Ikonografi:** Menggunakan library tunggal `@phosphor-icons/react` pada seluruh komponen aplikasi.
- **Ketiadaan Tombol Mati:** Seluruh tombol dan link terhubung dengan handler data nyata serta menampilkan loading feedback saat proses asinkron berlangsung.

