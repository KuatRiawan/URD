# PT Upaya Riksa Daya (URD) — Project & Architecture Inventory

Dokumen ini memetakan arsitektur menyeluruh, komponen teknologi, struktur direktori, modul bisnis, dan dependensi sistem aplikasi operasional K3 PT Upaya Riksa Daya.

---

## 1. Identitas Sistem & Domain Bisnis

- **Nama Entitas**: PT Upaya Riksa Daya (URD)
- **Bidang Usaha**: Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3) Bidang Pemeriksaan dan Pengujian (Riksa Uji) Norma K3 Lingkungan Kerja, Pesawat Angkat Angkut (PAA/PAPA), Pesawat Uap & Bejana Tekan (PUBT), Pesawat Tenaga & Produksi (PTP), Instalasi Listrik & Penyalur Petir (ILPP), Instalasi Proteksi Kebakaran (IPK), serta Elevator & Eskalator.
- **Sistem Inti**: Sistem Operasional K3 Terpadu (ERP & Field Mobility System) berbasis multi-peran dengan alur kerja ujung-ke-ujung (*end-to-end*): Marketing → Penjadwalan → Inspector/Ahli K3 → Admin Kantor (QC & Dokumen) → Pimpinan (Pemantauan Read-Only) → Super Admin (Tata Kelola Sistem).

---

## 2. Tumpukan Teknologi (Technology Stack)

### A. Frontend
- **Framework**: React 18.2+ SPA
- **Build Tool & Dev Server**: Vite 5.x
- **Styling**: Tailwind CSS 3.4+ dengan tema korporat Apple macOS/iOS inspired, palet identitas resmi URD (Hitam `#121212`, Merah `#DC2626` / `#B91C1C`, Putih `#FFFFFF`, Slate neutral `#F8FAFC`).
- **Ikon**: `@phosphor-icons/react` dan `lucide-react`
- **HTTP Client**: Axios dengan interseptor autentikasi JWT token rotation, CSRF header (`X-Requested-With`), dan penanganan sesi otomatis.
- **State Management & Offline Storage**: React Context + Hooks, `idb` (IndexedDB) untuk caching formulir inspeksi lapangan offline, foto, dan sinkronisasi otomatis saat online kembali.
- **Testing**: Vitest + React Testing Library + jsdom.

### B. Backend
- **Runtime**: Node.js v20+ ESM (`"type": "module"`)
- **Web Framework**: Express.js 4.x
- **Validasi Skema**: Joi 17.x (validasi ketat masukan API, parameter, dan UUID)
- **Keamanan & Autentikasi**:
  - JWT (`jsonwebtoken`) dengan arsitektur dual-token (Access Token berumur pendek + Refresh Token berumur panjang dengan rotasi token dan deteksi pemakaian ulang / *token family revocation*).
  - Penyimpanan token aman via HTTP-only Cookies (`urd_access`, `urd_refresh`) dengan mitigasi CSRF wajib (`X-Requested-With` header validation).
  - `bcryptjs` untuk *hashing* kata sandi.
  - `helmet` untuk pengaturan HTTP security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).
  - `express-rate-limit` untuk perlindungan brute-force pada endpoint sensitif (login).
- **Generasi Dokumen**:
  - PDF: `pdfkit` + `pdfkit-table` (generasi berkas LHPP, BAP, Surat Tugas, Suket K3, BAST).
  - DOCX: `docx` (generasi berkas pratinjau dan dokumen resmi Word).
  - Verifikasi Integritas: Hashing SHA-256 otomatis pada saat dokumen difinalisasi + snapshot immutability JSON.
- **Testing**: Vitest + Supertest.

### C. Basis Data
- **Engine**: PostgreSQL 17
- **Koneksi**: `pg` Pool dengan transaksi terkelola (`withTransaction`).
- **Migrasi**: Skrip migrasi terurut numerik (`001_initial_schema.sql` hingga `026_three_level_equipment_and_checklist.sql`).
- **Integritas Data**: Check constraints, Foreign Keys `ON DELETE RESTRICT` pada relasi krusial, Unique constraints anti-duplikasi, audit trigger kekal (`audit_logs` anti-tamper).

---

## 3. Struktur Direktori Proyek

```
URD/
├── .opencode/skills/             # Custom reusable engineering skills (urd-product-engineering)
├── backend/                      # Layanan API Express.js
│   ├── seeds/                    # Seeder data awal (users, baseline client, 11 LHPP templates)
│   ├── src/
│   │   ├── config/               # Konfigurasi environment (env.js)
│   │   ├── database/             # PostgreSQL connection pool & migrator
│   │   │   └── migrations/       # Berkas migrasi SQL 001 - 026
│   │   ├── middleware/           # authenticate, authorize, validate, error-handler, not-found
│   │   ├── modules/              # Modul fitur Express berbasis domain
│   │   │   ├── audit-log/        # Log audit kekal anti-tamper
│   │   │   ├── auth/             # Autentikasi, login, refresh token, sesi
│   │   │   ├── bap/              # Berita Acara Pemeriksaan (BAP) engine & PDF/DOCX
│   │   │   ├── clients/          # Manajemen klien, lokasi, PIC multi-kontak
│   │   │   ├── distributions/    # BAST & pelacakan ekspedisi/distribusi dokumen
│   │   │   ├── equipment-types/  # Taksonomi 3-level (Domain -> Jenis -> Nama Alat)
│   │   │   ├── inspections/      # Dynamic checklist & hasil inspeksi lapangan
│   │   │   ├── inspectors/       # Profil Ahli K3, lisensi SKP, jadwal
│   │   │   ├── lhpp/             # Laporan Hasil Pemeriksaan & Pengujian (LHPP)
│   │   │   ├── lhpp-templates/   # Template LHPP dinamis & Copy-on-Write versioning
│   │   │   ├── notifications/    # Notifikasi internal sistem
│   │   │   ├── objects/          # Unit alat uji K3 & riwayat inspeksi
│   │   │   ├── operational-issues/# Pelaporan kendala lapangan oleh Inspector
│   │   │   ├── orders/           # Purchase Order (PO) multi-unit & siklus hidup order
│   │   │   ├── portal/           # Portal akses klien terproteksi token
│   │   │   ├── reminders/        # Pengingat kedaluwarsa Suket & rekuren K3
│   │   │   ├── scheduling/       # Penjadwalan riksa uji & deteksi bentrok Ahli K3
│   │   │   ├── search/           # Global search & antrean kerja terpadu (Work Queue)
│   │   │   ├── suket/            # Registri Surat Keterangan (Suket) K3 & QR sticker
│   │   │   ├── system-settings/  # Pengaturan kop perusahaan, format penomoran, backup
│   │   │   ├── users/            # Tata kelola akun pengguna oleh Super Admin
│   │   │   └── verify/           # Verifikasi publik keabsahan dokumen via QR/kode
│   │   ├── services/             # Logika bisnis lintas modul (PDF, DOCX, audit, template)
│   │   ├── tests/                # Test suite integrasi dan keamanan Vitest
│   │   ├── utils/                # HTTP helpers, AppError, logger
│   │   └── app.js                # Inisialisasi Express & pendaftaran rute
│   └── vitest.config.js          # Konfigurasi Vitest backend terisolasi
├── frontend/                     # Aplikasi React SPA
│   ├── public/                   # Aset publik statis
│   ├── src/
│   │   ├── assets/               # Logo resmi URD, ilustrasi
│   │   ├── components/           # UI Primitives Apple-macOS/iOS inspired (Card, Button, Modal, Table, etc.)
│   │   │   ├── feedback/         # Loading, Empty, Error, Skeleton states
│   │   │   ├── layout/           # AppLayout, Sidebar, Navbar, MobileBottomNav
│   │   │   └── ui/               # Badge, ActionMenu, Notice, Tabs, Dialogs
│   │   ├── context/              # AuthContext, NotificationContext, OfflineContext
│   │   ├── features/             # Modul antarmuka spesifik peran
│   │   │   ├── admin-kantor/     # QC Workspace V2, Dokumen LHPP/BAP, Suket, BAST
│   │   │   ├── executive/        # Executive Workspace (Pemantauan Read-Only Pimpinan)
│   │   │   ├── inspector/        # Inspector Workspace, Form Lapangan, Offline Sync
│   │   │   ├── marketing/        # Marketing Workspace, Client Management, PO Wizard
│   │   │   └── settings/         # Super Admin Workspace (Master Alat, Checklist Builder, dsb)
│   │   ├── lib/                  # Axios instance, formatting helpers, offline DB sync
│   │   ├── routes/               # Role-based route definitions & route guards
│   │   └── tests/                # Test suite Vitest React Testing Library
│   ├── index.html                # Entry point HTML
│   ├── tailwind.config.js        # Konfigurasi Tailwind & palet warna URD
│   └── vite.config.js            # Konfigurasi build Vite
└── docs/                         # Dokumentasi arsitektur, PRD, SOP, dan sistem
    └── system-improvement/       # Inventarisasi lengkap & laporan status perbaikan
```

---

## 4. Pembagian Peran Pengguna (Roles)

1. **MARKETING (`MARKETING`)**:
   - Pengelolaan data klien, lokasi, dan banyak PIC per klien.
   - Pembuatan Purchase Order (PO) multi-unit dengan kaskade taksonomi 3-level (*Domain → Jenis Alat → Nama Alat*).
   - Pemantauan status unit dan pengingat perpanjangan Suket K3 (*renewal reminder*).
   - Pencatatan tindak lanjut kendala lapangan (*follow-up* riwayat kontak klien).

2. **INSPECTOR / AHLI K3 (`AHLI_K3`)**:
   - Penerimaan Surat Tugas dan penugasan riksa uji.
   - Pengisian formulir inspeksi dinamis di lapangan secara daring maupun luring (*offline-first*).
   - Penginputan hasil pengujian visual, dimensi/pengukuran teknis, temuan ketidaksesuaian, dan rekomendasi K3.
   - Pengambilan foto dokumentasi lapangan dan tanda tangan digital (Ahli K3 & PIC Klien).
   - Pengajuan hasil inspeksi ke Admin Kantor untuk Quality Control (QC).
   - Pelaporan kendala operasional lapangan (*operational issue reporting*).

3. **ADMIN KANTOR (`ADMIN_KANTOR`)**:
   - Penerimaan antrean inspeksi yang telah dikirim oleh Inspector.
   - Pelaksanaan Quality Control (QC) teknis & administratif per seksi (*targeted revision request*).
   - Pratinjau (*preview*) dokumen LHPP (PDF & DOCX) sesuai dengan berkas cetak resmi.
   - Finalisasi LHPP (penerbitan nomor resmi, pembuatan SHA-256 hash, snapshot permanen).
   - Penerbitan otomatis draf Berita Acara Pemeriksaan (BAP) pasca-LHPP difinalisasi.
   - Finalisasi BAP setelah ditandatangani.
   - Pengelolaan Suket K3, pengunggahan scan resmi dari Disnaker, pencetakan stiker QR.
   - Pembuatan Berita Acara Serah Terima (BAST) dan pelacakan distribusi berkas ke Klien & Disnaker.

4. **PIMPINAN / MANAGER (`PIMPINAN`)**:
   - Pemantauan operasional menyeluruh secara ketat *read-only* (sesuai ADR 015).
   - Dasbor analitik: metrik PO aktif, progres unit alat, beban kerja dan lisensi SKP Ahli K3, antrean LHPP & BAP.
   - Ekspor laporan operasional format CSV dan cetak ringkasan eksekutif.
   - Tidak memiliki tombol persetujuan, revisi, atau mutasi data transaksi.

5. **SUPER ADMIN (`ADMIN_SISTEM`)**:
   - Tata kelola akun pengguna, peran, dan status keaktifan.
   - Manajemen Master Taksonomi Alat 3-Level (7 Bidang K3, Kelompok/Jenis Alat, Nama/Tipe Alat).
   - Perancang Template Checklist Dinamis (*Dynamic Checklist Builder*) dengan *Copy-on-Write Versioning*.
   - Perancang Template Dokumen LHPP (*Dynamic LHPP Engine*) dengan *Copy-on-Write Versioning*.
   - Konfigurasi profil resmi perusahaan (Kop Surat, Logo, Direktur, Alamat, Format Penomoran).
   - Cadangan data sistem (*Database Backup Snapshot* & verifikasi pengunduhan berkas).
   - Pemantauan Audit Trail kekal anti-manipulasi (*immutable audit logs*).

