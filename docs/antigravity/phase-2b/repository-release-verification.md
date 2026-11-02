# Verifikasi Repositori & Rilis (Repository & Release Verification)

Tanggal: 2 November 2026  
Status: **PASSED (KONSISTEN & TERVERIFIKASI)**  
Pemeriksa: Release Manager, Software Architect & Senior Full-Stack Engineer  

---

## 1. Identitas Rilis & Integritas Git

Pemeriksaan integritas repositori dilakukan untuk memastikan bahwa seluruh kode sumber, konfigurasi dependensi, dan artefak rilis berada dalam kondisi terlacak, konsisten, serta tidak mengandung artefak rahasia.

| Parameter | Nilai Aktual | Keterangan |
|---|---|---|
| **Repositori** | `pt-upaya-riksa-daya` | Sistem Digitalisasi Riksa Uji K3 URD |
| **Branch Aktif** | `main` | Up to date dengan `origin/main` |
| **Commit SHA (Full)** | `5aa46c800c8a90c683697c0e018af11aa71fd642` | Commit acuan rilis staging |
| **Commit SHA (Short)** | `5aa46c8` | `feat: remove deprecated search script and associated tests` |
| **Release Identity** | `urd-release-20261102-5aa46c8` | Penanda unik build staging |
| **Waktu Audit** | 2026-11-02 11:00:00 WIB | Sinkron dengan waktu sistem lokal |
| **Status Working Tree** | Perubahan OpenCode/Phase 1/Phase 2 terjaga | Tidak ada data kerja yang hilang |

---

## 2. Audit Status Working Tree

Pemeriksaan `git status` memastikan tidak ada perubahan destruktif pada repositori:

1. **Perubahan Terencana (Staged Changes):**
   - `backend/src/tests/api.test.js`: Suite integrasi API komprehensif.
   - `backend/src/tests/config-env.test.js`: Validasi fail-fast environment.
   - `backend/src/tests/document-ownership.test.js`: Validasi isolasi kepemilikan dokumen.
   - `backend/src/tests/lhpp-pdf-generator.test.js`: Verifikasi template F4 PDF 7 kategori K3.
   - `backend/src/tests/search-and-workqueue.test.js`: Pengujian antrean terpadu dan pencarian.

2. **Perubahan Non-Staged & Untracked (Telah Diverifikasi Aman):**
   - Penambahan migrasi `backend/migrations/019_hashed_portal_tokens.sql` (hashing SHA-256 token portal klien).
   - Pengujian otorisasi negatif `backend/src/tests/role-permission-negative.test.js` (15 skenario).
   - Pengujian end-to-end multi-unit `backend/src/tests/uat-e2e.test.js` (29 skenario).
   - Utilitas dan test offline sync `frontend/src/lib/utils/offline-sync.js` dan `.test.js` (4 skenario).
   - Seluruh direktori dokumentasi `docs/antigravity/` (handover, UAT, Phase 2, dan Phase 2B).

Tidak ditemukan konflik merge, file korup, atau pembersihan kerja paksa.

---

## 3. Integritas Runtime & Dependensi

Pemeriksaan versi runtime dan dependensi menunjukkan:

- **Node.js**: v22.20.0 (kompatibel dengan target LTS server v20.x atau v22.x).
- **npm**: v10.9.3.
- **Backend Dependencies**:
  - `express`: ^4.21.1 (Web server)
  - `pg`: ^8.13.1 (PostgreSQL client)
  - `pdfkit`: ^0.15.0 (PDF rendering engine untuk F4)
  - `qrcode`: ^1.5.4 (QR verification generation)
  - `multer`: ^1.4.5-lts.1 (File upload handling)
  - `jsonwebtoken`: ^9.0.2 (JWT token handling)
  - `bcrypt`: ^5.1.1 (Password hashing)
  - `helmet`: ^8.0.0 (HTTP security headers)
  - `cors`: ^2.8.5 (Cross-Origin Resource Sharing)
  - `express-rate-limit`: ^7.4.1 (Brute-force protection)
- **Frontend Dependencies**:
  - `react`: ^18.3.1
  - `react-dom`: ^18.3.1
  - `react-router`: ^7.1.5
  - `vite`: ^6.4.5
  - `tailwindcss`: ^3.4.14
  - `axios`: ^1.7.7
  - `@phosphor-icons/react`: ^2.1.7

Lockfile (`package-lock.json`) tersedia dan sinkron pada root, backend, dan frontend. Tidak ada dependensi native yang memerlukan kompilasi C++ di server (`node-gyp`).

---

## 4. Pemindaian Keamanan Repositori (Secret & Sensitive Data Audit)

Audit keamanan kode sumber menghasilkan:

1. **File `.env`**: Terdaftar di `.gitignore` dan tidak ter-commit ke dalam repositori git.
2. **Kredensial Tertanam**: Tidak ditemukan private key, database password, ataupun token third-party yang di-hardcode dalam file kode sumber JavaScript/JSX.
3. **Database URL**: Nilai default pada `env.js` hanya mengarah ke instance lokal pengujian (`localhost:5433`) dengan kredensial pengujian dummy.
4. **JWT Secret**: Diatur wajib minimal 24 karakter pada environment non-development (terdapat fail-fast guard).
5. **File Backup & Dump**: Tidak ada file `.dump`, `.sql` sensitif, atau backup arsip produksi yang ter-commit ke repositori.

---

## 5. Ringkasan Verifikasi Rilis

| Pengujian | Total Skenario | Status | Bukti Eksekusi |
|---|:---:|:---:|---|
| Backend Integration Test | 102 | **PASSED** | 8 test files, 102 passed, durasi 6.57s |
| Frontend Component & Routing Test | 11 | **PASSED** | 4 test files, 11 passed, durasi 12.23s |
| Backend ESLint | 0 errors | **PASSED** | Lint bersih pada `src` dan `seeds` |
| Frontend ESLint | 0 errors | **PASSED** | Lint bersih pada `src` |
| Frontend Production Build | 4766 modules | **PASSED** | Vite build selesai dalam 6.45s (dist/ 290KB main) |

**Kesimpulan Rilis Repositori:**  
Repositori berada dalam status **READY FOR DEPLOYMENT** dari sisi integritas kode sumber, pengujian otomatis, dan keamanan artefak.

