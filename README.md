# PT Upaya Riksa Daya - Sistem Operasional Riksa Uji K3

Aplikasi web internal **PT Upaya Riksa Daya** (Perusahaan Jasa Keselamatan dan Kesehatan Kerja / PJK3 bidang Pemeriksaan dan Pengujian) untuk mendigitalisasi proses operasional dari penerimaan order, penjadwalan dan penugasan Ahli K3, pengisian lembar kerja inspeksi digital di lapangan, penyusunan dan persetujuan Laporan Hasil Pemeriksaan dan Pengujian (LHPP), hingga pemantauan masa berlaku Surat Keterangan (Suket) K3 dan pengingat perpanjangan otomatis.

## 1. Tech Stack

- **Frontend (`/frontend`)**: React 19, Vite 6, Tailwind CSS v4, Axios, React Router v7, Phosphor Icons, Vitest + React Testing Library.
- **Backend (`/backend`)**: Node.js, Express.js, PostgreSQL 18 (`pg` driver tanpa ORM, parameterized SQL), Joi, JWT (`jsonwebtoken`) + `HttpOnly` Refresh Session Rotation, `bcryptjs`, `pdfkit`, `qrcode`, `multer`, `node-cron`.

## 2. Struktur Direktori

```text
/Users/mac/Project/URD/
├── README.md
├── AGENTS.md
├── .env.example
├── package.json
├── frontend/          # Aplikasi SPA React + Vite + Tailwind CSS
├── backend/           # REST API Server Express.js + PostgreSQL + PDF Generator
├── docs/              # Dokumentasi PRD, Arsitektur, Database, API, Keamanan, Audit & Pengujian
└── scripts/           # Skrip otomatisasi dev-setup dan db-reset
```

## 3. Cara Menjalankan Aplikasi

### Prasyarat
- Node.js >= 20
- PostgreSQL >= 15 (Pada workspace ini klaster lokal PostgreSQL 18 berjalan di `localhost:5433` dengan database `urd_dev` dan `urd_test`).

### Langkah Persiapan Cepat
```bash
# 1. Jalankan skrip setup otomatis (salin .env, instal dependensi, migrasi & seed database)
./scripts/dev-setup

# 2. Jalankan server Backend API (Port 4000)
npm run dev:backend

# 3. Jalankan server pengembangan Frontend Vite (Port 5173)
npm run dev:frontend
```

Untuk mereset ulang database ke kondisi awal seed:
```bash
./scripts/db-reset
```

## 4. Akun Uji Pengembangan & QA (Seed Data)

Seed membuat akun pengembangan berikut. Tidak ada kata sandi bersama yang ditetapkan di repository. Di lingkungan non-produksi, seed memakai `SEED_DEFAULT_PASSWORD` bila disetel atau membuat kata sandi acak yang ditampilkan oleh CLI. Seed produksi memerlukan `SEED_DEFAULT_PASSWORD` yang eksplisit dan tidak mencetak kredensial. Jangan gunakan akun seed di produksi.

| Peran (`role`) | Nama Pengguna | Email Login |
|---|---|---|
| `ADMIN_SISTEM` | Administrator Sistem URD | `admin.sistem@upayariksadaya.com` |
| `ADMIN_KANTOR` | Siti Rahmawati (Admin Kantor) | `admin.kantor@upayariksadaya.com` |
| `AHLI_K3` | Ir. Budi Santoso (Ahli K3 PAA & PUBT) | `ahlik3.paa@upayariksadaya.com` |
| `AHLI_K3` | Rizky Pratama, S.T. (Ahli K3 Listrik & Petir) | `ahlik3.listrik@upayariksadaya.com` |
| `PIMPINAN` | Kuat Riawan (Pimpinan / Reviewer) | `pimpinan@upayariksadaya.com` |

## 5. Menjalankan Pengujian Otomatis

```bash
# Jalankan seluruh pengujian Backend & Frontend
npm test

# Atau jalankan secara terpisah:
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run build
```

**Peringatan:** suite backend memanggil `runMigrations({ reset: true })` dan menghapus schema `public` pada `TEST_DATABASE_URL`. Pastikan URL tersebut menunjuk ke database disposable sebelum menjalankan `npm test` atau `npm --prefix backend test`.

## 6. Dokumentasi Teknis Lengkap

- [Inventarisasi Berkas & Referensi](docs/reference-inventory.md)
- [Ringkasan Kebutuhan PRD](docs/requirements/prd-summary.md)
- [Arsitektur Sistem](docs/architecture/system-overview.md)
- [Desain Database PostgreSQL](docs/architecture/database-design.md)
- [Kontrak REST API (`/api/v1`)](docs/architecture/api-contract.md)
- [Desain Keamanan Aplikasi](docs/architecture/security-design.md)
- [ADR-001: Autentikasi & Sesi JWT](docs/decisions/ADR-001-authentication.md)
- [Rencana Implementasi](docs/implementation-plan.md)
- [Laporan Audit Kualitas (Ponytail & Anti-Slop)](docs/quality-audit.md)
- [Laporan Pengujian](docs/testing.md)
