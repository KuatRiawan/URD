# Dokumentasi Pengujian (Testing Report): PT Upaya Riksa Daya

Seluruh pengujian otomatis dijalankan terhadap implementasi nyata (termasuk database PostgreSQL 18 `urd_test` untuk pengujian integrasi backend dan Vitest + React Testing Library untuk pengujian frontend).

## 1. Cara Menjalankan Pengujian

```bash
# 1. Jalankan seluruh pengujian integrasi Backend (17 skenario end-to-end)
npm --prefix backend test

# 2. Jalankan pengujian unit/komponen Frontend
npm --prefix frontend test

# 3. Verifikasi build produksi Frontend
npm --prefix frontend run build
```

## 2. Cakupan & Hasil Pengujian Backend (`backend/src/tests/api.test.js`)

Pengujian menggunakan `node --test` dan `supertest` terhadap database `urd_test` yang di-reset, dimigrasi, dan di-seed secara otomatis sebelum pengujian berjalan:

| No | Skenario Pengujian | Status |
|---|---|---|
| 1 | `GET /api/v1/health` mengembalikan status sehat & nama layanan `PT Upaya Riksa Daya API` | LULUS (`PASS`) |
| 2 | Penolakan akses tanpa token (`401 UNAUTHORIZED`) pada endpoint terproteksi | LULUS (`PASS`) |
| 3 | Penolakan kredensial salah (`401 INVALID_CREDENTIALS`) tanpa membocorkan eksistensi email | LULUS (`PASS`) |
| 4 | Login untuk keempat peran (`ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN`) beserta rotasi cookie `HttpOnly` refresh token | LULUS (`PASS`) |
| 5 | Penegakan RBAC: `AHLI_K3` ditolak (`403 FORBIDDEN`) saat mengakses `/api/v1/users`, sedangkan `ADMIN_SISTEM` diizinkan (`200 OK`) | LULUS (`PASS`) |
| 6 | CRUD Klien, Lokasi Kerja, Kontak PIC, dan Objek Uji K3 + penolakan nomor seri duplikat pada klien yang sama (`409 DUPLICATE_SERIAL_NUMBER`) | LULUS (`PASS`) |
| 7 | Impor CSV Objek Uji K3 dan pembuatan label QR Code peralatan (`data:image/png;base64`) | LULUS (`PASS`) |
| 8 | Pembuatan Order Riksa Uji, penolakan penugasan Ahli K3 yang tidak memiliki kompetensi bidang terkait (`422 COMPETENCY_MISMATCH`), dan penugasan Ahli K3 yang kompeten (`200 OK`) | LULUS (`PASS`) |
| 9 | Deteksi bentrok jadwal otomatis (`409 SCHEDULE_CONFLICT`) saat Ahli K3 yang sama dijadwalkan pada rentang waktu yang beririsan | LULUS (`PASS`) |
| 10 | Konfirmasi penerimaan penugasan oleh Ahli K3 (`DITERIMA`) dan unduhan dokumen **Surat Tugas PDF** (`%PDF-1.4`) | LULUS (`PASS`) |
| 11 | Pembukaan lembar kerja inspeksi digital, pengisian parameter & deteksi nilai di luar ambang batas (`is_within_threshold = false`), pencatatan temuan, pembubuhan tanda tangan digital (`AHLI_K3` & `PERWAKILAN_KLIEN`), serta penguncian pasca-submit (`SUBMITTED` & pembuatan draf LHPP otomatis) | LULUS (`PASS`) |
| 12 | Penolakan perubahan pada lembar kerja inspeksi yang sudah terkunci (`409 INSPECTION_LOCKED`) dan pembukaan kunci dengan alasan revisi wajib (`reopen`) | LULUS (`PASS`) |
| 13 | Alur review LHPP oleh Pimpinan: pengembalian revisi (`RETURN` dengan catatan wajib), pengiriman ulang, persetujuan final (`APPROVE_FINAL`), penerbitan nomor unik `LHPP/PAA/...`, unduhan **LHPP PDF** resmi ber-QR Code, dan pencatatan log serah terima ke klien | LULUS (`PASS`) |
| 14 | Registrasi Suket K3 Disnaker dan pencatatan log tindak lanjut (follow-up) perpanjangan | LULUS (`PASS`) |
| 15 | Evaluasi pengingat masa berlaku (`H-90`, `H-60`, `H-30`, `H-14`, `H0`) tanpa duplikasi pengiriman pada eksekusi berulang (`dispatched_count = 0` pada eksekusi kedua) | LULUS (`PASS`) |
| 16 | Pembuatan Order Riksa Uji Perpanjangan 1-klik dari Suket K3 yang akan jatuh tempo (`201 Created`) dan pencegahan duplikasi order perpanjangan (`409 RENEWAL_ORDER_EXISTS`) | LULUS (`PASS`) |
| 17 | Verifikasi sifat append-only pada tabel `audit_logs` (trigger PostgreSQL menolak `DELETE` dan `UPDATE`) serta pencabutan sesi pada `POST /api/v1/auth/logout` | LULUS (`PASS`) |

**Total Backend**: `17 tests | 17 passed | 0 failed`

## 3. Cakupan & Hasil Pengujian Frontend (`frontend/src/app/App.test.jsx`)

| No | Skenario Pengujian | Status |
|---|---|---|
| 1 | Akses root path (`/`) saat belum login langsung diarahkan ke `/login` tanpa landing page publik, menampilkan identitas & logo resmi **PT Upaya Riksa Daya**, tanpa teks `SIRUK3`, dan tanpa kredensial demo | LULUS (`PASS`) |
| 2 | Validasi form login saat kosong menampilkan pesan kesalahan yang jelas dan tombol tampil/sembunyikan kata sandi bekerja dengan benar | LULUS (`PASS`) |
| 3 | Guard otorisasi peran (`RequireRole`) memblokir peran `AHLI_K3` dari halaman `/app/users` dengan halaman `403 Akses Ditolak` | LULUS (`PASS`) |

**Total Frontend**: `3 tests | 3 passed | 0 failed`

