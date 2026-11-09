# PT Upaya Riksa Daya (URD) — Comprehensive System Improvement & Implementation Plan

Dokumen ini menguraikan peta jalan eksekusi bertahap (*phase-by-phase execution plan*) untuk mematangkan, menstabilkan, dan memverifikasi kesiapan produksi (*production readiness*) seluruh lapisan aplikasi operasional K3 PT Upaya Riksa Daya.

---

## 1. Fase-Fase Pelaksanaan

### Fase 1: Penataan Baseline, Isolasi Pengujian & Perbaikan Bug Kritis Basis Data
- [x] **1.1 Isolasi Runner Pengujian**: Pembuatan berkas konfigurasi `backend/vitest.config.js` untuk mengisolasi test suite backend (`src/tests/**/*.test.js`) dari frontend React/jsdom.
- [x] **1.2 Sanitasi & Validasi UUID**: Penambahan validasi format UUID (`UUID_REGEX`) pada modul `bap/routes.js` dan `lhpp/routes.js` untuk mencegah error fatal PostgreSQL syntax saat ID undefined atau malformed.
- [x] **1.3 Perbaikan Seeder Basis Data Idempoten**: Pembaruan `backend/seeds/seed.js` agar secara konsisten menginisialisasi perusahaan klien baseline (`PT Berkah Manufaktur Indonesia`, lokasi, dan kontak PIC primer) serta meregenerasi seluruh 11 template LHPP resmi beserta versi V1 aktifnya.
- [x] **1.4 Penyelarasan Taksonomi 3-Level**: Penyesuaian nama unit alat pada pengujian taksonomi agar mendukung nama Level 3 (`equipment_name || equipment_type_name`).
- [x] **1.5 Koreksi Siklus Hidup Koneksi Pool Pengujian**: Menghilangkan pemanggilan prematur `pool.end()` pada `afterAll` test file individu yang sebelumnya memutuskan pool singleton bersama.
- [x] **1.6 Sinkronisasi Kontrak Rute Frontend-Backend**: Penyesuaian parser `frontend-api-contract.test.js` untuk menangani rute array Express.js (`['/groups', '/types']`, `['/', '/names']`).
- [x] **Hasil Verifikasi**: Seluruh 228 pengujian backend di 19 test suite dan 45 pengujian frontend di 9 test suite lulus 100% tanpa kegagalan.

### Fase 2: Dokumentasi Inventaris Sistem & Matriks Akses
- [x] **2.1 Penyusunan `PROJECT-INVENTORY.md`**: Memetakan identitas sistem, domain bisnis PJK3, tumpukan teknologi frontend/backend/database, struktur folder direktori, dan peran pengguna.
- [x] **2.2 Penyusunan `ROUTE-INVENTORY.md`**: Mendokumentasikan seluruh rute publik dan 17+ rute terproteksi aplikasi beserta komponen dan guard peran.
- [x] **2.3 Penyusunan `API-INVENTORY.md`**: Menginventarisasi seluruh endpoint REST backend Express (`/api/v1/*`), parameter, otorisasi peran, dan fungsi bisnis.
- [x] **2.4 Penyusunan `DATABASE-INVENTORY.md`**: Merangkum 26 berkas migrasi SQL, arsitektur skema PostgreSQL, integritas relasi, batasan keunikan, indeks, dan aturan kekekalan (*immutability*).
- [x] **2.5 Penyusunan `ROLE-PERMISSION-MATRIX.md`**: Matriks hak akses 5 peran pengguna dan penegakan otorisasi negatif teruji.
- [x] **2.6 Penyusunan `BUSINESS-WORKFLOW-MAP.md`**: Diagram alur kerja operasional lengkap (Marketing → Penjadwalan → Inspector → Admin Kantor → Pimpinan → Super Admin) dengan prinsip multi-unit independen.
- [x] **2.7 Penyusunan `IMPLEMENTATION-PLAN.md`**: Rencana kerja dan panduan verifikasi produksi.

### Fase 3: Penyelarasan Antarmuka & Kualitas UI/UX Apple-Grade (macOS / iOS)
- [x] **3.1 Identitas Visual Korporat URD**: Penegakan palet resmi URD (Hitam pekat korporat `#121212`, Merah aksen `#DC2626` / `#B91C1C`, Putih murni `#FFFFFF`, Slate neutral `#F8FAFC`).
- [x] **3.2 Tipografi & Terminologi Resmi Bahasa Indonesia**: Penggunaan font Plus Jakarta Sans dan istilah baku K3 (`PO`, `LHPP`, `BAP`, `SKP`, `Suket K3`, `BAST`, `Surat Tugas`, `Disnaker`). Bebas dari istilah asing campur aduk atau terjemahan mesin kikuk.
- [x] **3.3 Disiplin Tombol & Hirarki Aksi (Anti-Slop UI)**: Mengelompokkan tombol berdasarkan frekuensi, risiko, dan status. Mencegah penumpukan tombol merah atau deretan aksi ganda dalam satu baris tabel dengan penggunaan `ActionMenu` kontekstual.
- [x] **3.4 Responsivitas Adaptif**: Tampilan desktop terstruktur rapi dengan sidebar navigasi collapsible macOS-style; tampilan mobile menggunakan bottom navigation bar iOS-style dengan target sentuh ramah jempol (minimal 44×44px).
- [x] **3.5 Penanganan State Menyeluruh**: Setiap modul dilengkapi Loading Skeleton, Empty State informatif dengan tombol ajakan bertindak (*CTA*), Error Recovery dengan tombol coba lagi, dan notifikasi Toast transparan.

### Fase 4: Pengujian & Verifikasi Visual Antarmuka Lintas Viewport
- [ ] **4.1 Verifikasi 5 Resolusi Baku**: Menjalankan skrip verifikasi peramban otomatis (`scripts/visual-verify.mjs` atau Puppeteer) untuk memotret antarmuka kelima peran pada:
  - `360 × 800` (Mobile Compact / Android)
  - `390 × 844` (Mobile Modern / iPhone)
  - `768 × 1024` (Tablet Portrait / iPad)
  - `1366 × 768` (Laptop Standar)
  - `1920 × 1080` (Desktop Full HD)
- [ ] **4.2 Audit Visual Anti-Slop**: Memastikan tidak ada teks terpotong (*text truncation* yang merusak makna), overflow horizontal, pergeseran tata letak (*layout shift*), atau warna kontras di bawah standar WCAG AA.

### Fase 5: Pelaporan Status & Catatan Keputusan Bisnis
- [ ] **5.1 Pembuatan Berkas Status Pelaksanaan (Section 20)**:
  - `IMPLEMENTATION-STATUS.md`
  - `ROUTE-COMPLETION-MATRIX.md`
  - `BUSINESS-WORKFLOW-STATUS.md`
  - `API-AND-DATABASE-CHANGES.md`
  - `SECURITY-FINDINGS.md`
  - `UI-UX-VERIFICATION.md`
  - `TEST-RESULTS.md`
  - `OPEN-BUSINESS-DECISIONS.md`
- [ ] **5.2 Laporan Akhir Berbasis Bukti (Section 22)**: Ringkasan menyeluruh dengan status PASS/FAIL/BLOCKED/NOT RUN yang jujur dan dapat diaudit.

