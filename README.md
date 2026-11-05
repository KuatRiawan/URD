# PT Upaya Riksa Daya (URD) — ERP Sistem Operasional Terpadu Riksa Uji K3

> Sistem ERP operasional terpadu berbasis web untuk Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3) PT Upaya Riksa Daya yang mengotomatisasi seluruh siklus bisnis riksa uji teknik: mulai dari Purchase Order (PO) multi-unit, penjadwalan inspektur, checklist lapangan offline-first, kendali mutu teknis, penerbitan dokumen resmi ber-QR verifikasi (LHPP, BAP, Suket K3, BAST), hingga pengingat masa berlaku alat.

---

## 📌 Daftar Isi
1. [Tentang Proyek & Modul](#-tentang-proyek--modul)
2. [Teknologi & Arsitektur](#-teknologi--arsitektur)
3. [Persyaratan Sistem (Prerequisites)](#-persyaratan-sistem-prerequisites)
4. [Langkah Instalasi & Pengaturan](#-langkah-instalasi--pengaturan)
5. [Struktur Folder](#-struktur-folder)
6. [Manajemen Database & Migrasi](#-manajemen-database--migrasi)
7. [Panduan Pengujian (Testing)](#-panduan-pengujian-testing)
8. [Deployment & DevOps](#-deployment--devops)
9. [Keamanan & Audit Trail](#-keamanan--audit-trail)
10. [Panduan Kontribusi (Git Workflow)](#-panduan-kontribusi-git-workflow)
11. [Lisensi & Kontak](#-lisensi--kontak)

---

## 🏢 Tentang Proyek & Modul

*   **Status Proyek:** `Produksi / Staging Siap Rilis (Production Ready)`
*   **Versi Saat Ini:** `v1.0.0`
*   **Daftar Modul Inti:**
    *   *Modul Komersial & Klien (Marketing):* Pengelolaan database klien, multi-PIC per lokasi cabang, registrasi Purchase Order (PO) dengan multi-unit alat K3 mandiri, unggah berkas kontrak, dan pelacakan riwayat pemeriksaan.
    *   *Modul Penjadwalan & Penugasan (Admin Kantor):* Alokasi tanggal riksa uji, pemilihan Ahli K3/Inspector berbasis kesesuaian lisensi SKP Disnaker, deteksi otomatis bentrok jam kerja (*schedule conflict detection*), serta penerbitan PDF Surat Tugas.
    *   *Modul Inspeksi Digital Lapangan (Inspector / Ahli K3):* Verifikasi fisik pelat pabrik (*nameplate*), pengisian *dynamic checklist* per parameter teknis tanpa auto-centang, input pengukuran numerik bersyarat standar, unggah foto bukti lapangan, pencatatan temuan kelaikan K3 (Minor/Mayor/Kritis), pembubuhan tanda tangan digital ganda (Inspector & PIC Klien), serta dukungan penuh *offline-first* via IndexedDB.
    *   *Modul Kendali Mutu & Dokumen Resmi (Admin Kantor):* Verifikasi QC teknis, revisi/pengembalian formulir (*return*), finalisasi LHPP (Laporan Hasil Pemeriksaan dan Pengujian) yang otomatis menerbitkan draf BAP (Berita Acara Pemeriksaan), registri Suket K3 Disnaker, pembuatan stiker QR kelaikan alat, dan penerbitan BAST (Berita Acara Serah Terima).
    *   *Modul Pelacakan Distribusi Dokumen:* Monitoring pengiriman dokumen fisik maupun digital ke Klien dan Disnaker beserta kurir, nomor resi, tanda terima, dan riwayat ekspedisi.
    *   *Modul Pengingat Siklus Perpanjangan (Renewal & Reminders):* Notifikasi otomatis kedaluwarsa Suket K3 (H-30, H-14, H-7), log simulasi pengiriman pesan (WhatsApp/Email), dan konversi instan menjadi order baru (*repeat order*).
    *   *Modul Pemantauan Eksekutif (Pimpinan / Manager):* Monitoring metrik performa operasional, utilisasi inspektur, progres PO per unit, antrean dokumen, dan unduh berkas resmi ber-QR secara *read-only* tanpa memblokir proses QC.
    *   *Modul Administrasi Sistem & Keamanan (Super Admin):* Manajemen pengguna (RBAC), pengaturan lisensi SKP Ahli K3, master data kategori alat (PAA, PTP, PUBT, Listrik, Elevator, dll.), kalibrasi alat ukur, *dynamic checklist builder* berbasis *Copy-on-Write*, format penomoran dokumen otomatis, konfigurasi gateway notifikasi, dan pemantauan telemetri database.
    *   *Modul Verifikasi Publik & Portal Klien:* Endpoint publik `/verify/:code` untuk validasi hash SHA-256 dokumen tanpa login, serta `/portal/access/:token` bagi klien untuk memantau status order mereka menggunakan token berbatas waktu.

---

## 🛠️ Teknologi & Arsitektur

*   **Backend:** Node.js (v20+ / v22+ LTS) dengan Express.js 5.1 (ES Modules), Joi 17 untuk validasi skema request, JWT + HttpOnly Cookie untuk manajemen sesi aman, PDFKit & Docx untuk generator dokumen formal.
*   **Frontend:** React 19.1 SPA didukung Vite 6.3, Tailwind CSS v4.1, Phosphor Icons, Axios, dan React Router v7. Tipografi menggunakan Plus Jakarta Sans.
*   **Database & Caching:** PostgreSQL 16 dengan connection pool (`pg`), skema relasional 45 tabel, dan trigger PostgreSQL *append-only* untuk audit trail. Client-side caching & offline store menggunakan browser IndexedDB + LocalStorage.
*   **Message Broker / Gateway:** Integrasi WhatsApp Gateway & SMTP Email Service (dengan mode simulasi bawaan untuk pengujian aman tanpa kredensial pihak ketiga), serta Node-Cron untuk background job pengingat berkala.
*   **Pola Arsitektur:** **Modular Monolith** dengan pemisahan tegas antara layer presentasi frontend (`frontend/src/features/`), service layer backend (`backend/src/modules/` & `backend/src/services/`), dan layer persistensi data PostgreSQL.

---

## 💻 Persyaratan Sistem (Prerequisites)

*   **Spesifikasi Perangkat Lunak:**
    *   Node.js versi `>= 20.0.0` (Direkomendasikan Node.js v22.x LTS)
    *   NPM versi `>= 10.0.0`
    *   PostgreSQL versi `16.x`
    *   Google Chrome / Chromium (Opsional, untuk otomatisasi visual testing berbasis Puppeteer)
    *   Git versi `>= 2.30.0`
*   **Spesifikasi Perangkat Keras Minimum:**
    *   CPU: 2 Core (Rekomendasi 4 Core untuk build & runner pengujian paralel)
    *   RAM: 4 GB (Rekomendasi 8 GB)
    *   Penyimpanan Bebas: 5 GB SSD (untuk dependensi node_modules, data upload PDF/foto, dan basis data lokal)

---

## 🚀 Langkah Instalasi & Pengaturan

### 1. Kloning Repositori
```bash
git clone <URL_REPOSITORI_URD>
cd URD
```

### 2. Konfigurasi Environment Variables (.env)

#### A. Backend Environment (`backend/.env`):
```ini
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://urd:urd_local_dev_pw@localhost:5433/urd_dev
JWT_SECRET=super_secret_jwt_key_urd_production_change_in_real_env_2026
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=super_secret_refresh_key_urd_production_2026
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./uploads
MAX_UPLOAD_SIZE_MB=25
```

#### B. Frontend Environment (`frontend/.env`):
```ini
VITE_API_URL=http://localhost:4000/api/v1
```

### 3. Instalasi Berbasis Docker (Containerized)
Jika menggunakan container Docker untuk infrastruktur basis data:
```bash
# Menjalankan PostgreSQL 16 di container Docker port 5433
docker run -d \
  --name urd-postgres \
  -e POSTGRES_USER=urd \
  -e POSTGRES_PASSWORD=urd_local_dev_pw \
  -e POSTGRES_DB=urd_dev \
  -p 5433:5432 \
  -v urd_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 4. Instalasi Manual (Lokal)
```bash
# 1. Instalasi seluruh dependensi workspace (root, backend, dan frontend)
npm run setup

# 2. Start PostgreSQL cluster lokal (jika memakai cluster portabel di .local/pgdata)
npm run db:start

# 3. Jalankan migrasi tabel basis data
npm run migrate

# 4. Masukkan data awal (seeding)
npm run seed

# 5. Jalankan server pengembangan (Backend :4000 & Frontend :5173)
npm run dev
```

Aplikasi dapat diakses melalui peramban di: **`http://localhost:5173`**

---

## 📁 Struktur Folder

```text
URD/
├── backend/                        # Layanan Backend Express.js & Database
│   ├── seeds/                      # Script seed basis data realistis (pengguna, klien, PO, template)
│   ├── src/
│   │   ├── database/               # Koneksi pg pool & runner migrasi SQL (001_initial.sql s/d 022_user_avatar.sql)
│   │   ├── middleware/             # Authenticate JWT, Authorize RBAC, Joi Validate, Error Handler
│   │   ├── modules/                # Domain controller & routes (auth, orders, inspections, lhpp, bap, suket, dll.)
│   │   ├── services/               # Generator PDF (LHPP, BAP, Surat Tugas, QR Sticker), audit, reminders
│   │   ├── storage/                # Handler penyimpanan berkas & upload foto riksa uji
│   │   ├── tests/                  # Test suites Vitest (API E2E, Contract, RBAC, PDF Generator, Work Queue)
│   │   ├── app.js                  # Konfigurasi Express app, middleware, & routes
│   │   └── server.js               # Entrypoint HTTP server backend port 4000
│   ├── uploads/                    # Folder penyimpanan berkas lokal
│   └── package.json
│
├── frontend/                       # Aplikasi Web Frontend React 19 + Vite 6
│   ├── src/
│   │   ├── app/                    # Entrypoint aplikasi (App.jsx, router.jsx, navConfig.js)
│   │   ├── components/             # Reusable UI primitives (Button, Badge, Card, Modal, PageHeader, Tables)
│   │   ├── features/               # Modul fitur per peran (dashboard, orders, inspections, lhpp, bap, users, dll.)
│   │   └── lib/                    # HTTP client Axios, utilitas formatting bahasa Indonesia, offline-sync
│   ├── dist/                       # Output build produksi web
│   └── package.json
│
├── docs/                           # Dokumentasi Bisnis & Rekayasa Sistem
│   ├── PRD v0.1/                   # PRD standar operasional PJK3
│   └── system-improvement/         # Hasil audit, inventarisasi route, glossary istilah, dan screenshot visual QA
│       ├── 01-inventory-and-baseline.md
│       ├── 02-design-system-and-glossary.md
│       ├── 03-workflow-and-data-integrity.md
│       ├── 04-testing-and-visual-verification.md
│       └── screenshots/            # 30+ bukti screenshot browser headless lintas 5 peran & 5 viewports
│
├── scripts/                        # Skrip shell utilitas operasional
│   ├── dev                         # Skrip runner backend & frontend bersamaan
│   ├── db-reset                    # Skrip reset database & re-seed otomatis
│   └── tunnel                      # Utilitas ekspos lokal via ngrok
│
├── package.json                    # Konfigurasi npm workspace root
└── README.md                       # Dokumentasi teknis & operasional utama proyek
```

---

## 🗄️ Manajemen Database & Migrasi

*   **Menjalankan Migrasi:**
    ```bash
    npm run migrate
    # atau langsung di backend:
    npm --prefix backend run migrate
    ```
    *Menjalankan seluruh file SQL di `backend/src/database/migrations/` yang belum tercatat pada tabel `schema_migrations`.*
*   **Membuat Migrasi Baru:**
    Buat file SQL baru di folder `backend/src/database/migrations/` dengan format penamaan berurutan:
    `023_nama_fitur_atau_perubahan.sql`
*   **Rollback / Revert / Reset:**
    ```bash
    ./scripts/db-reset
    # Menjalankan reset database urd_dev, migrasi ulang dari 001, dan re-seeding otomatis
    ```
*   **Menjalankan Seeders (Data Awal):**
    ```bash
    npm run seed
    # Mengisi akun default kelima peran, kategori alat K3, template ceklis, data klien simulasi, dan nomor urut dokumen
    ```

---

## 🧪 Panduan Pengujian (Testing)

Sistem mengadopsi standar pengujian komprehensif tanpa kompromi (*100% passing rate*):

*   **Menjalankan Seluruh Pengujian (Backend & Frontend):**
    ```bash
    npm test
    ```
*   **Backend API & Integration Testing (188 Tests):**
    ```bash
    npm run test:backend
    # Menjalankan 15 file test suite: otentikasi JWT, rotasi refresh token, RBAC, PO multi-unit,
    # alur penugasan, submit form, revisi & finalisasi LHPP, penerbitan BAP, verifikasi SHA-256 publik,
    # impor massal CSV, deteksi konflik jadwal, dan portal token klien.
    ```
*   **Frontend Component & Guard Testing (44 Tests):**
    ```bash
    npm run test:frontend
    # Menguji rendering halaman, proteksi routing role, validasi input form, navigasi responsif, dan offline sync.
    ```
*   **Verifikasi Visual Browser Otomatis (Visual QA):**
    ```bash
    node docs/system-improvement/capture-visual-qa.mjs
    # Menguji rendering 5 peran pengguna pada 5 resolusi layar (1920×1080, 1366×768, 768×1024, 390×844, 360×800)
    # Memverifikasi zero horizontal overflow dan konsol bersih, bukti screenshot disimpan di docs/system-improvement/screenshots/
    ```
*   **Pemeriksaan Linting (Static Analysis):**
    ```bash
    npm run lint
    ```
*   **Uji Build Produksi Frontend:**
    ```bash
    npm run build
    ```

---

## 🌐 Deployment & DevOps

*   **Alur CI/CD:**
    Pipeline pengujian otomatis terintegrasi menjalankan langkah berikut pada setiap push atau pull request:
    1. `npm run lint` (Memastikan kode bersih dari pelanggaran ESLint)
    2. `npm --prefix backend test` (Verifikasi integritas API dan RBAC backend)
    3. `npm --prefix frontend test` (Verifikasi integritas komponen dan routing frontend)
    4. `npm --prefix frontend run build` (Memastikan tidak ada error saat bundling aset produksi)
*   **Lingkungan Staging:**
    - Aplikasi dikonfigurasi untuk berjalan di staging environment dengan database PostgreSQL staging khusus.
    - Notifikasi WhatsApp dan Email berjalan dalam mode `SIMULASI` (aman tanpa resiko terkirim ke klien nyata).
*   **Lingkungan Produksi:**
    - Frontend di-bundle menjadi berkas statis via `npm run build` dan disajikan melalui Nginx / CDN dengan kompresi Gzip/Brotli.
    - Backend dijalankan menggunakan process manager (misal: PM2 atau Docker) dengan environment `NODE_ENV=production`.
    - Mengaktifkan sertifikat SSL/TLS, reverse proxy HTTPS, dan pembatasan rate limit ketat pada endpoint autentikasi (`express-rate-limit`).

---

## 🔒 Keamanan & Audit Trail

*   **Metode Autentikasi:**
    - **Dual Token Architecture**: Menggunakan Access Token JWT berumur pendek (15 menit) dan Refresh Token berumur panjang (7 hari).
    - **HttpOnly Cookies**: Refresh token disimpan dalam cookie `HttpOnly, SameSite=Strict` yang kebal terhadap serangan pembacaan skrip XSS.
    - **Token Rotation & Session Revocation**: Setiap pertukaran token melakukan rotasi token lama. Jika token yang sudah kedaluwarsa dicoba digunakan kembali, seluruh keluarga sesi dicabut secara otomatis (*anti-token replay attack*).
*   **Sistem Otorisasi (Akses):**
    - **Strict Server-Side RBAC**: Pengecekan izin otorisasi dilakukan di level middleware Express (`authorize('ADMIN_SISTEM', ...)`), bukan hanya menyembunyikan tombol di frontend.
    - **Prinsip Least Privilege**: Pimpinan / Manager dibatasi pada hak pantau eksekutif (*read-only monitoring*) dan dicegah memutasi dokumen QC. Inspector hanya memiliki hak akses baca-tulis pada order dan unit yang ditugaskan resmi kepadanya.
*   **Pencatatan Log Aktivitas (Audit Trail):**
    - **Trigger PostgreSQL Append-Only**: Tabel `audit_logs` dilindungi trigger basis data `trg_audit_logs_append_only` yang secara mutlak menolak instruksi `UPDATE` maupun `DELETE`.
    - Setiap transaksi penting (Login, Perubahan Status PO, Penugasan, Submit Hasil Lapangan, Finalisasi LHPP/BAP, Pengiriman Dokumen, dan Konfigurasi Sistem) secara otomatis merekam timestamp presisi, user ID, nama pengguna, peran, aksi, alamat IP, dan ringkasan payload perubahan.
*   **Integritas Dokumen Kriptografis:**
    - Dokumen resmi LHPP dan BAP dihitung nilai hash SHA-256 pada buffer PDF resminya saat finalisasi. Hash disimpan di database dan dicetak pada dokumen fisik/digital dalam bentuk QR Code untuk verifikasi anti-pemalsuan.

---

## 🤝 Panduan Kontribusi (Git Workflow)

*   **Standar Branching:**
    - `main` : Kode produksi yang stabil dan siap rilis.
    - `staging` : Lingkungan integrasi untuk pengujian bersama sebelum naik ke produksi.
    - `feat/<nama-fitur>` : Branch pengembangan fitur baru (contoh: `feat/multiunit-csv-import`).
    - `fix/<nama-bug>` : Branch perbaikan bug atau regresi (contoh: `fix/bap-signature-layout`).
*   **Standar Commit Message (Conventional Commits):**
    Gunakan format deskriptif dalam Bahasa Indonesia atau Bahasa Inggris baku:
    - `feat: tambah validasi deteksi konflik jadwal inspektur`
    - `fix: selaraskan rute suket dengan backend RBAC`
    - `refactor: standardisasi istilah tombol ubah dan status badge`
    - `test: tambahkan pengujian e2e alur po multi-unit`
    - `docs: perbarui panduan instalasi dan dokumentasi erp`
*   **Prosedur Code Review / Pull Request:**
    1. Pastikan seluruh pengujian lokal lulus (`npm test`) dan build berhasil (`npm run build`).
    2. Buka Pull Request ke branch target (`staging`).
    3. Pastikan minimal 1 reviewer dari tim arsitektur/senior engineer menyetujui perubahan.
    4. Dilarang melakukan force push (`git push --force`) pada branch bersama (`main` atau `staging`).

---

## 📄 Lisensi & Kontak

*   **Jenis Lisensi:** Hak Cipta Perusahaan Tertutup (*Proprietary License*) © 2026 **PT Upaya Riksa Daya (URD)**. Seluruh hak cipta dilindungi undang-undang. Dilarang menggandakan, mendistribusikan, atau memodifikasi kode sumber ini tanpa izin tertulis dari manajemen PT Upaya Riksa Daya.
*   **Kontak Tim Pengembang:** Tim Engineering PT Upaya Riksa Daya (URD) — `dev@upayariksadaya.com`
*   **Saluran Bantuan Internal:** Helpdesk IT Operasional URD / Slack `#urd-engineering`
