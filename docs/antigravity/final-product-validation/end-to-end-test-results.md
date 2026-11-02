# PT Upaya Riksa Daya (URD) — End-to-End Test Execution Results

> **Ringkasan:** 144 Pengujian Otomatis Berhasil (133 Backend, 11 Frontend), 0 Gagal, 0 Terlewat.  
> **Engine Pengujian:** Vitest v3.2.7 (Node.js v22.20.0 / ESM native)  
> **Waktu Eksekusi Total:** ~32.5 detik  
> **Status:** PASS (100% Lulus)

---

## 1. Ringkasan Eksekusi Backend (133 Tests / 9 Files)

Semua rangkaian pengujian backend dijalankan dengan isolasi serial (`--fileParallelism=false`) untuk menjamin konsistensi data transaksi database PostgreSQL.

| Berkas Pengujian | Jumlah Tes | Status | Durasi | Cakupan Pengujian |
|---|:---:|:---:|:---:|---|
| `src/tests/api.test.js` | 35 | **PASS** | 4.02s | Autentikasi sesi, manajemen klien & objek, PO multi-unit, alur inspeksi, sinkronisasi status PO. |
| `src/tests/security-hardening.test.js` | 23 | **PASS** | 1.35s | Penolakan akses tanpa token (401), proteksi IDOR/BOLA, penguncian *read-only* peran Pimpinan, penanganan injeksi SQL, privasi verifikasi publik, validasi format unggahan berkas. |
| `src/tests/uat-e2e.test.js` | 32 | **PASS** | 1.31s | Alur lengkap operasional: Order $\rightarrow$ Jadwal $\rightarrow$ Surat Tugas $\rightarrow$ Lembar Kerja Inspeksi $\rightarrow$ Review QC $\rightarrow$ BAP $\rightarrow$ Suket $\rightarrow$ BAST. |
| `src/tests/role-permission-negative.test.js` | 15 | **PASS** | 1.26s | Uji batasan wewenang antarperan (Marketing finalisasi LHPP dilarang, Inspector mengubah penugasan rekan dilarang, akun non-aktif ditolak). |
| `src/tests/lhpp-pdf-generator.test.js` | 13 | **PASS** | 0.55s | Pemetaan data riksa uji ke dokumen F4, tidak ada fabrikasi data kosong, generator BAST, Stiker QR, Lembar Rekomendasi, dan LHPP DOCX. |
| `src/tests/search-and-workqueue.test.js` | 8 | **PASS** | 0.08s | Antrean prioritas Admin Kantor (5 tab), paginasi data, filter pencarian multi-kriteria. |
| `src/tests/document-ownership.test.js` | 4 | **PASS** | 0.01s | Kepemilikan berkas lampiran, proteksi pengunduhan dokumen lintas organisasi klien. |
| `src/tests/config-env.test.js` | 2 | **PASS** | 0.18s | Validasi skema konfigurasi lingkungan (.env), penolakan konfigurasi tidak aman. |
| `src/tests/frontend-api-contract.test.js` | 1 | **PASS** | 0.98s | Verifikasi kontrak integrasi: memastikan seluruh pemanggilan `api.*` di frontend memiliki rute penanganan yang valid di backend. |
| **TOTAL BACKEND** | **133** | **PASS** | **9.72s** | **9 Berkas Pengujian Lulus Sempurna** |

---

## 2. Rincian Skenario Kritis Backend

### A. Alur Multi-Unit PO & Status Progression
- **Tes:** `api.test.js` (Langkah 1 s.d. Langkah 9)
- **Verifikasi:**
  - Pembuatan PO dengan 3 unit berbeda bidang (Overhead Crane / PAA, Forklift / PTP, Air Receiver / PUBT).
  - Setiap unit memiliki siklus hidup independen (`DITUGASKAN` $\rightarrow$ `SEDANG_DIPERIKSA` $\rightarrow$ `LHPP_DRAF` $\rightarrow$ `BAP_DIPROSES` $\rightarrow$ `MENUNGGU_DOKUMEN` $\rightarrow$ `SELESAI`).
  - Status PO di tingkat induk secara otomatis bergerak dinamis dan hanya mencapai status `SELESAI` saat seluruh unit di dalamnya telah tuntas didistribusikan.

### B. Validasi Output Dokumen Resmi PRD v0.1
- **Tes:** `lhpp-pdf-generator.test.js`
- **Verifikasi:**
  - Header `%PDF-` valid dan struktur dokumen F4 / A4 sesuai ketentuan.
  - Lembar Rekomendasi K3 mencantumkan daftar temuan aktual, tingkat risiko, dan tanda tangan Ahli K3 tersertifikasi.
  - Stiker QR Code (100mm $\times$ 75mm) memuat data alat, tanggal berlaku, dan barcode QR beresolusi tinggi.
  - LHPP DOCX menghasilkan format OpenXML yang valid (`PK\x03\x04`) dan dapat diedit langsung menggunakan Microsoft Word.

---

## 3. Ringkasan Eksekusi Frontend (11 Tests / 4 Files)

| Berkas Pengujian | Jumlah Tes | Status | Durasi | Cakupan Pengujian |
|---|:---:|:---:|:---:|---|
| `src/app/App.test.jsx` | 4 | **PASS** | 5.60s | Routing antarmuka: redirect pengunjung tanpa login ke `/login`, proteksi halaman terlarang (403 Akses Ditolak), verifikasi seluruh halaman internal render tanpa layar putih (*blank screen*). |
| `src/lib/utils/offline-sync.test.js` | 4 | **PASS** | 0.03s | Mekanisme *offline-first*: antrean penyimpanan lokal saat jaringan terputus, deteksi status offline, sinkronisasi bertahap saat koneksi pulih. |
| `src/components/layout/MobileBottomNav.test.jsx` | 2 | **PASS** | 0.47s | Aksesibilitas navigasi bawah pada perangkat mobile, pengelolaan fokus keyboard (*focus trap*), drawer menu navigasi. |
| `src/features/audit-log/AuditLogPage.test.jsx` | 1 | **PASS** | 0.27s | Rendering tabel jejak audit Super Admin, pemformatan tanggal Indonesia, filter aktivitas. |
| **TOTAL FRONTEND** | **11** | **PASS** | **6.37s** | **4 Berkas Pengujian Lulus Sempurna** |

---

## 4. Hasil Pemeriksaan Linting & Static Analysis

```bash
# Backend Lint Execution
$ npm run lint
> urd-backend@1.0.0 lint
> eslint src seeds
# Output: 0 errors, 0 warnings

# Frontend Lint Execution
$ npm run lint
> urd-frontend@1.0.0 lint
> eslint src
# Output: 0 errors, 0 warnings
```

---

## 5. Hasil Build Aset Produksi Frontend

```bash
$ npm run build
> vite build
✓ 4766 modules transformed.
dist/index.html                                                        1.36 kB │ gzip:  0.65 kB
dist/assets/index-bYYmhsKr.css                                       129.85 kB │ gzip: 21.23 kB
dist/assets/vendor-C4-vZ_jP.js                                       111.41 kB │ gzip: 40.13 kB
dist/assets/icons-DuUvZfRo.js                                        288.49 kB │ gzip: 64.86 kB
dist/assets/index-wy6DY0-0.js                                        290.14 kB │ gzip: 85.62 kB
✓ built in 6.97s
```
Komponen dipecah secara modular (*code splitting*) sehingga waktu muat awal (*initial load time*) pada koneksi seluler lapangan tetap cepat dan responsif.

