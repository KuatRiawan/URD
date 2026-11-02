# Test Evidence & Verification Report
**PT Upaya Riksa Daya (URD) — Bukti Empiris Hasil Pengujian**  
*Tanggal Pengujian: 2 November 2026*

---

## 1. Rangkuman Eksekutif Hasil Uji

| Komponen Uji | Perintah Eksekusi | Target / Standar | Hasil Aktual | Status |
|---|---|---|---|---|
| **Backend Test Suite** | `cd backend && npm test` | 100% Pass, 0 Deadlock | **8 Berkas Uji, 109 Tests Passed** | **PASS** |
| **Frontend Test Suite** | `cd frontend && npm test` | 100% Pass, 0 Blank Screen | **4 Berkas Uji, 11 Tests Passed** | **PASS** |
| **Backend Code Quality** | `cd backend && npm run lint` | ESLint 0 Error, 0 Warning | **0 Error, 0 Warning** | **PASS** |
| **Frontend Code Quality** | `cd frontend && npm run lint` | ESLint 0 Error, 0 Warning | **0 Error, 0 Warning** | **PASS** |
| **Frontend Production Build** | `cd frontend && npm run build` | Vite 6 Bundle Success | **4,766 modules transformed, Exit 0** | **PASS** |
| **Database Schema & Relasi** | PostgreSQL port 5433 | 19 Migrations, 42 Tables | **42 Tables, 99 FKs, 19 Migrations Verified** | **PASS** |
| **7 Dokumen Output PRD** | Engine PDF & API Routes | SPK, BAP, Rekomendasi, LHPP, Suket, QR, BAST | **7/7 Dokumen Output Lengkap & Teruji** | **PASS** |

---

## 2. Bukti Rinci Pengujian Backend (Vitest)

```
> urd-backend@1.0.0 test
> vitest run --fileParallelism=false

 RUN  v3.2.7 /Users/mac/Project/URD/backend

 ✓ src/tests/api.test.js (35 tests) 5250ms
   ✓ 1. Autentikasi & Keamanan Sesi > berhasil login untuk keempat peran (ADMIN_SISTEM, ADMIN_KANTOR, AHLI_K3, PIMPINAN)
   ✓ 7. End-to-End Multi-Unit PO, BAP, Category-Specific LHPP, Riwayat Unit & PO Completion Gate
 ✓ src/tests/role-permission-negative.test.js (15 tests) 1717ms
 ✓ src/tests/uat-e2e.test.js (32 tests) 1370ms
   ✓ 5.3 Admin Kantor mencetak Berita Acara Serah Terima (BAST PDF - Dokumen #7 PRD)
   ✓ 5.4 Admin Kantor mencetak Stiker QR Code Objek & Suket (Dokumen #6 PRD)
   ✓ 5.5 Unduh Lembar Temuan & Rekomendasi K3 (Dokumen #3 PRD Corrective Action Notice)
 ✓ src/tests/frontend-api-contract.test.js (1 test) 956ms
   ✓ Kontrak API frontend dan backend > setiap panggilan api.* di frontend memiliki route backend yang cocok
 ✓ src/tests/lhpp-pdf-generator.test.js (12 tests) 818ms
   ✓ LHPP PDF template output > includes sample-based technical fields for every supplied equipment category (Termasuk LE)
   ✓ LHPP PDF template output > appends field-specific company and Ahli K3 SKP pages for every category with supplied SKP template
   ✓ LHPP PDF template output > renders valid multi-page LHPP PDF for LE (Elevator & Eskalator) cleanly
   ✓ Official PRD Document Generators > generates a valid BAST PDF buffer matching PRD Document #7 specification
   ✓ Official PRD Document Generators > generates a valid QR Sticker PDF buffer matching PRD Document #6 specification
   ✓ Official PRD Document Generators > generates a valid Recommendation Letter PDF buffer matching PRD Document #3 specification
 ✓ src/tests/config-env.test.js (2 tests) 196ms
 ✓ src/tests/search-and-workqueue.test.js (8 tests) 83ms
 ✓ src/tests/document-ownership.test.js (4 tests) 8ms

 Test Files  8 passed (8)
      Tests  109 passed (109)
   Duration  21.44s
```

---

## 3. Bukti Rinci Pengujian Frontend (Vitest)

```
> urd-frontend@1.0.0 test
> vitest run

 RUN  v3.2.7 /Users/mac/Project/URD/frontend

 ✓ src/lib/utils/offline-sync.test.js (4 tests) 21ms
 ✓ src/features/audit-log/AuditLogPage.test.jsx (1 test) 126ms
 ✓ src/components/layout/MobileBottomNav.test.jsx (2 tests) 304ms
 ✓ src/app/App.test.jsx (4 tests) 5198ms
   ✓ PT Upaya Riksa Daya Frontend Routing, Auth & Guard > blocks unauthorized role from ADMIN_SISTEM route (/app/users) with 403 Akses Ditolak
   ✓ PT Upaya Riksa Daya Frontend Routing, Auth & Guard > renders all internal feature pages without blank screens when authenticated as ADMIN_SISTEM

 Test Files  4 passed (4)
      Tests  11 passed (11)
   Duration  14.37s
```

---

## 4. Bukti Linting & Produksi Build

### Backend Lint:
```
> urd-backend@1.0.0 lint
> eslint src seeds
(Clean exit code 0)
```

### Frontend Lint:
```
> urd-frontend@1.0.0 lint
> eslint src
(Clean exit code 0)
```

### Production Build:
```
> urd-frontend@1.0.0 build
> vite build

vite v6.4.5 building for production...
✓ 4766 modules transformed.
dist/index.html                                                        1.36 kB │ gzip:  0.65 kB
dist/assets/index-bYYmhsKr.css                                       129.85 kB │ gzip: 21.23 kB
dist/assets/DashboardPage-DekPgTNR.js                                146.00 kB │ gzip: 39.13 kB
dist/assets/index-BjHf_asv.js                                        290.14 kB │ gzip: 85.63 kB
✓ built in 8.50s
(Clean exit code 0)
```

