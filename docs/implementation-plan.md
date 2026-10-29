# Rencana Implementasi (Implementation Plan): PT Upaya Riksa Daya

## Fase 1: Inventarisasi Referensi & Perancangan Arsitektur (Selesai)
- [x] Membaca dan mengekstrak seluruh 19 halaman `PRODUCT REQUIREMENTS DOCUMENT - PT UPAYA RIKSA DAYA V.0.1.pdf`.
- [x] Memeriksa berkas `logo-urd.png` (2117x1479 RGBA PNG) dan mengekstrak URL website resmi `https://upayariksadaya.com/` dari atribut metadata.
- [x] Memeriksa halaman utama dan stylesheet resmi `https://upayariksadaya.com/` untuk mengekstrak palet warna, tipografi, informasi kontak, dan 7 bidang layanan Riksa Uji K3.
- [x] Menyusun dokumentasi inventarisasi (`docs/reference-inventory.md`), ringkasan PRD (`docs/requirements/prd-summary.md`), dan ADR-001 (`docs/decisions/ADR-001-authentication.md`).

## Fase 2: Database PostgreSQL & Migrasi Skema (Selesai)
- [x] Menginisialisasi klaster PostgreSQL 18 lokal dan database `urd_dev` serta `urd_test`.
- [x] Menyusun 5 berkas migrasi SQL (`001_core.sql` s/d `005_lhpp_suket_reminders.sql`) yang mencakup 24 tabel operasional, indeks GiST untuk deteksi bentrok jadwal, constraint nomor seri unik per klien, constraint anti-duplikasi pengingat, dan trigger append-only pada `audit_logs`.
- [x] Menyusun skrip seed (`backend/seeds/seed.js`) dengan data operasional PT Upaya Riksa Daya yang realistis (4 peran pengguna, 3 personel Ahli K3 beserta matriks kompetensi, 3 perusahaan klien industri, 6 peralatan uji K3, 7 template checklist K3, order aktif, jadwal, hasil inspeksi, dokumen LHPP, dan registri Suket K3).

## Fase 3: Implementasi Backend REST API (`/api/v1`) (Selesai)
- [x] Membangun fondasi Express.js, middleware autentikasi JWT, rotasi sesi cookie `HttpOnly`, otorisasi RBAC (`ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN`), validasi Joi, dan error handler terpusat.
- [x] Mengimplementasikan 13 modul domain bisnis (`auth`, `users`, `clients`, `objects`, `inspectors`, `orders`, `scheduling`, `inspections`, `lhpp`, `suket`, `reminders`, `notifications`, `audit-log`) serta endpoint KPI dashboard dan unduhan berkas terproteksi.
- [x] Mengimplementasikan generator PDF resmi (`backend/src/services/pdf-generator.js`) untuk dokumen **LHPP** dan **Surat Tugas** lengkap dengan logo resmi PT Upaya Riksa Daya dan QR Code verifikasi.
- [x] Mengimplementasikan scheduler pengingat jatuh tempo (`H-90`, `H-60`, `H-30`, `H-14`, `H0`) tanpa duplikasi.

## Fase 4: Implementasi Frontend React + Vite + Tailwind CSS (Selesai)
- [x] Membangun sistem desain berbasis karakter resmi PT Upaya Riksa Daya (`#1D1414`, `#FE0000` / `#C81E1E`, `#324A6D`, `#F3F5F8`, font `Plus Jakarta Sans` & `JetBrains Mono`).
- [x] Membangun halaman `/login` dengan identitas resmi **PT Upaya Riksa Daya** dan logo `logo-urd.png`, tanpa menampilkan kredensial demo, serta redirect langsung dari `/` ke `/login` saat belum terautentikasi.
- [x] Membangun seluruh halaman operasional: Dashboard KPI, Order Riksa Uji, Kalender Penjadwalan & Matriks Kompetensi Ahli K3, Worksheet Inspeksi Digital Mobile-First (dengan penanda template belum tervalidasi, auto-save draft lokal, temuan + foto, tanda tangan digital, submit/lock & reopen), LHPP & Panel Review Pimpinan, Registri Suket K3, Pengingat Masa Berlaku & Order Perpanjangan 1-Klik, Klien, Objek Uji K3 (dengan impor CSV & cetak QR Code), Manajemen Pengguna, Notifikasi, dan Audit Trail.

## Fase 5: Pengujian Otomatis, Audit Kualitas & Dokumentasi Akhir (Selesai)
- [x] Menjalankan 17 pengujian integrasi backend (`backend/src/tests/api.test.js`) terhadap database PostgreSQL nyata (`urd_test`).
- [x] Menjalankan pengujian unit/komponen frontend (`frontend/src/app/App.test.jsx`) dan memverifikasi build produksi (`vite build`).
- [x] Melaksanakan audit kualitas Ponytail & pemeriksaan ketat Anti-Slop Delivery Gate.

