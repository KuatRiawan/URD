# Bug reproduction dan verifikasi

## SEC-01: aktivitas Inspector lintas akun

1. Login sebagai AHLI_K3/INSPECTOR.
2. GET `/api/v1/dashboard/summary`.
3. Query lama tidak membatasi `audit_logs.user_id`.
4. Query kini `WHERE a.user_id = $1`; test regresi memeriksa ID pada parameter.

Status: FIXED & TESTED.

## BUS-01: work queue Pimpinan memberi aksi review

1. Login sebagai PIMPINAN dan GET `/api/v1/dashboard/work-queue` ketika ada LHPP berstatus legacy `PERSETUJUAN_PIMPINAN`.
2. Sebelumnya label item dapat menawarkan “Review & Terbitkan”.
3. Kini labelnya “Pantau Status”, judul menyebut “Menunggu Finalisasi LHPP”, dan notifikasi submission dikirim ke Admin Kantor.
4. Regression test memeriksa label/title item untuk Pimpinan.

Status: FIXED & TESTED. Status database historis tidak diubah.

## SEC-02: submit ulang inspeksi asing

1. Gunakan token Inspector B dan ID inspeksi terkirim Inspector A.
2. POST `/api/v1/inspections/:id/submit`.
3. Sebelumnya cabang idempotent mengembalikan inspection/LHPP/BAP sebelum owner check.
4. Kini owner atau assignment aktif dicek lebih dulu; API suite memastikan 403 untuk Inspector tanpa assignment.

Status: FIXED & TESTED.

## SEC-03: kepemilikan berdasar kemiripan identitas

Inspector dengan nama, telepon, atau prefiks email serupa dapat lolos fallback dan memindahkan owner. Fallback dihapus; hanya pemilik atau assignment eksplisit yang diterima.

Status: FIXED & TESTED melalui test API ownership.

## SEC-04: secret staging statis

Dengan `NODE_ENV=staging` dan `JWT_SECRET` kosong, konfigurasi lama memakai nilai yang dapat ditebak. Kini proses gagal start. Test subprocess juga memeriksa secret acak di development.

Status: FIXED & TESTED.

## UX-01: tagline login

Pada desktop, headline Inggris/typewriter diubah menjadi ringkasan Bahasa Indonesia statis. Browser sempat menangkap halaman blank setelah impor `useState` ikut terhapus; impor dikembalikan dan login diverifikasi ulang.

Status: FIXED & TESTED.
