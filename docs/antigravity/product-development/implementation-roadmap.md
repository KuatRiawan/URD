# Roadmap Implementasi & Engineering Delivery
**PT Upaya Riksa Daya (URD) — Autonomous Product Engineering**  
*Dokumen Rujukan Arsitektur & Rilis Berkelanjutan*

---

## 1. Visi & Standar Kualitas Produk

Aplikasi PT Upaya Riksa Daya dirancang untuk mendigitalkan seluruh siklus riksa uji Keselamatan dan Kesehatan Kerja (K3) dengan integritas data tertinggi, alur kerja tanpa cacat, dan pengalaman mobile di lapangan yang tangguh.

Prinsip Utama:
1. **Pemisahan Peran Tegas**: Marketing (komersial) dan Admin Kantor (operasional/QC) terpisah. Pimpinan bersifat pemantauan (*read-only* murni).
2. **Kemandirian Unit**: Tiap unit objek uji dalam satu PO memiliki *lifecycle* independen dari penjadwalan, inspeksi lapangan, draf BAP, review LHPP, pencatatan Suket Disnaker, hingga distribusi.
3. **Standar Riksa Uji Murni**: Tidak ada otomatisasi pengisian checklist menjadi "SESUAI". Verifikasi fisik nameplate wajib diperiksa di lapangan.
4. **Resiliensi Lapangan**: Mendukung pencatatan offline, antrean foto, retry otomatis, dan kompresi visual sebelum sinkronisasi.

---

## 2. Matriks Prioritas Delivery (P0 – P3)

| Prioritas | Area Fokus | Status | Komponen Terlibat |
|---|---|---|---|
| **P0 — Critical** | Integritas Checklist Lapangan (Anti-Autofill "SESUAI") | **SELESAI** | `useInspectionDetailForm.js`, `InspectionDetailModal.jsx` |
| **P0 — Critical** | Pencegahan Deadlock Konkurensi Database Test | **SELESAI** | `backend/package.json` (`--fileParallelism=false`) |
| **P0 — Critical** | Verifikasi Nameplate Fisik Unit (Object Matching) | **SELESAI** | `StepChecklist.jsx`, One-tap Photo Capture & Offline Queue |
| **P1 — High** | Admin Kantor Actionable Work Queue | **SELESAI** | `backend/src/modules/dashboard-files.js`, `WorkQueueWidget.jsx` |
| **P1 — High** | Marketing Multi-Unit PO Duplication | **SELESAI** | `StepPoUnits.jsx`, `useOrderManagement.js` |
| **P1 — High** | LHPP PDF Engine & Test Coverage 7 K3 | **SELESAI** | `lhpp-pdf-generator.test.js`, `pdf-generator.js` |
| **P2 — Medium** | Executive Operational Pipeline (Pimpinan & Admin) | **SELESAI** | `ManagementDashboardView.jsx` (Progres Unit, BAP, Suket, Distribusi, Kendala) |
| **P2 — Medium** | Operational Issues Alert Strip & Filtering | **SELESAI** | `ManagementDashboardView.jsx`, `WorkQueueWidget.jsx` |
| **P3 — Improvement** | Audit Trail Unalterability & Visual Hierarchy | **SELESAI** | Tailwind UI, Phosphor Icons, Consistent Light/Dark Mode |

---

## 3. Rincian Fase Implementasi

### Fase 1: Enforcing Field Integrity & Concurrency Fixes (P0)
- **Tujuan**: Menghilangkan celah kecurangan lapangan (pengisian otomatis checklist) dan memastikan kestabilan konkurensi database pada automated testing.
- **Hasil**: 
  - Fungsi `handleAutoFillAllStandard` dihapus permanen.
  - Sesi uji vitest backend dikonfigurasi sequential (`--fileParallelism=false`) sehingga 100% bebas deadlock PostgreSQL.
  - Ditambahkan modul verifikasi fisik nameplate unit di awal checklist dengan shortcut pelaporan ketidaksesuaian nameplate ke modul kendala lapangan (*issues*).

### Fase 2: Operational Cockpit & Work Queue Completion (P1 & P2)
- **Tujuan**: Mengubah dashboard dari sekadar kartu statistik pasif menjadi *actionable cockpit* yang memandu alur kerja harian Admin Kantor dan monitoring eksekutif Pimpinan.
- **Hasil**:
  - Endpoint `/dashboard/work-queue` diperluas dengan 4 jenis aksi operasional: `BAP_PROCESSING`, `SUKET_RECORDING`, `DOCUMENT_DISTRIBUTION`, dan `OPERATIONAL_ISSUE`.
  - Frontend `WorkQueueWidget.jsx` dilengkapi filter tab operasional: *Semua*, *Urgensi Tinggi*, *LHPP & BAP*, *Suket & Distribusi*, dan *Kendala*.
  - Frontend `ManagementDashboardView.jsx` dilengkapi *Executive Operational Pipeline* yang merinci tahapan per unit (Menunggu, Inspeksi, Perlu Revisi, Selesai) serta pipeline dokumen resmi (BAP, LHPP, Suket Disnaker, Distribusi Dokumen).

### Fase 3: Commercial & Document Generation Hardening (P1 & P3)
- **Tujuan**: Mempercepat entri multi-unit oleh Marketing dan memvalidasi output PDF LHPP untuk 7 kategori K3.
- **Hasil**:
  - Fitur duplikasi spesifikasi unit pada `StepPoUnits.jsx` dengan retensi otomatis lokasi pabrik pada `useOrderManagement.js`.
  - Uji generator LHPP pada `lhpp-pdf-generator.test.js` diperluas mencakup kategori `LE` (Elevator dan Eskalator), membuktikan kelulusan seluruh 7 bidang riksa uji K3.

---

## 4. Milestone Selanjutnya (Pasca-Penyediaan VPS/DNS)
1. **Phase Staging**: Pengujian end-to-end pada server staging setelah VPS Ubuntu dan DNS domain aktif.
2. **Owner Decision Sign-Off**: Penerapan keputusan bisnis tertunda (kebijakan reminder H-30 vs H-60, mekanisme formal reissue BAP/LHPP, retensi arsip legal).

