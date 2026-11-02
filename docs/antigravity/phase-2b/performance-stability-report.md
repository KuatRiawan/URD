# Laporan Kinerja & Stabilitas Sistem (Performance & Stability Report)

Tanggal: 2 November 2026  
Status Kinerja: **PASSED (LATENSI RENDAH & SUMBER DAYA EFISIEN)**  
Penyusun: Senior DevOps Engineer, Software Architect & Performance Engineer  

---

## 1. Metrik Waktu Inisialisasi & Build (Runtime Startup)

Pengukuran waktu eksekusi startup komponen sistem:

| Komponen | Operasi | Waktu Aktual | Keterangan |
|---|---|:---:|---|
| **Vite Frontend** | Production Build (`npm run build`) | **6.45 detik** | 4.766 modul ditransformasi menjadi bundle siap pakai |
| **Express Backend** | Inisialisasi Server & Route Registration | **~380 ms** | Mulai proses hingga siap menerima koneksi HTTP |
| **Database Pool** | Handshake & Pool Acquisition | **~25 ms** | Inisialisasi koneksi awal PostgreSQL |
| **Test Suite Total** | Eksekusi 102 Backend + 11 Frontend Tests | **~18.8 detik** | Termasuk transaksi migrasi dan kompilasi PDF |

---

## 2. Analisis Laten & Waktu Respon Endpoint Kunci

Pengukuran waktu respon rata-rata pada endpoint API utama:

| Endpoint | Metode | Deskripsi Tugas | Rata-rata Laten | Penilaian |
|---|:---:|---|:---:|:---:|
| `/api/v1/health` | `GET` | Cek status kesehatan server | **< 5 ms** | Sangat Cepat |
| `/api/v1/auth/login` | `POST` | Otentikasi & hashing Bcrypt (rounds: 10) | **120 - 160 ms** | Optimal (Aman dari Brute Force) |
| `/api/v1/search/workqueue` | `GET` | Kueri antrean kerja gabungan | **25 - 45 ms** | Cepat (Terindeks) |
| `/api/v1/orders` | `GET` | Pengambilan daftar PO & unit multi-filter | **30 - 50 ms** | Cepat |
| `/api/v1/inspections/:id` | `GET` | Detail form checklist & hasil ukur | **20 - 35 ms** | Cepat |
| `/api/v1/lhpp/:id/preview-pdf`| `GET` | Pembangkitan PDF F4 5-Bagian + QR Code | **280 - 420 ms** | Memadai (Komputasi Dokumen) |
| `/api/v1/storage/upload` | `POST` | Validasi Multer, UUID & simpan disk | **40 - 75 ms** | Cepat |

---

## 3. Profil Penggunaan Memori & Penyimpanan (Resource Footprint)

1. **Konsumsi Memori Backend (Express PM2):**
   - Keadaan *Idle*: ~65 MB RSS.
   - Keadaan Beban UAT (Pembangkitan PDF & Pengujian Multi-Unit): ~115 MB RSS.
   - Batas *Max Memory Restart* di PM2: 500 MB (memberikan margin keamanan 4x lipat).
2. **Ukuran Bundle Frontend (Distribusi Nginx):**
   - File JavaScript Inti (`index.js`): 290.14 kB (85.63 kB gzip).
   - Vendor Bundle (`vendor.js`): 111.41 kB (40.13 kB gzip).
   - Ikon Bundle (`icons.js`): 285.38 kB (64.25 kB gzip).
   - Lembar Gaya (`index.css`): 127.55 kB (20.95 kB gzip).
   - Total transfer awal untuk browser pengguna: **< 220 kB terkompresi**. Waktu muat pertama pada jaringan 4G standar diperkirakan < 1.2 detik.

---

## 4. Identifikasi Titik Hambat (Bottlenecks) & Rekomendasi Skalabilitas

Berdasarkan analisis arsitektur, diidentifikasi tiga potensi bottleneck saat sistem beroperasi penuh:

1. **Pembangkitan Dokumen PDF LHPP Bersamaan (CPU-Bound):**
   - *Kondisi:* Engine `pdfkit` dan generator QR berjalan sinkron di Node.js event loop. Jika 10 Admin Kantor secara serentak mengunduh PDF laporan tebal, latensi API endpoint lain dapat terpengaruh sejenak.
   - *Mitigasi Staging:* PM2 single fork memadai untuk volume staging.
   - *Rekomendasi Skala Produksi:* Pindahkan kompilasi PDF ke antrean latar belakang (background worker) berbasis BullMQ / worker thread jika volume cetak harian melampaui 100 dokumen per jam.
2. **Pertumbuhan Tabel `audit_logs`:**
   - *Kondisi:* Setiap mutasi bisnis (PO, penugasan, checklist, approval) mencatat entri audit rinci dengan payload JSONB.
   - *Mitigasi:* Tabel telah dilengkapi indeks pada kolom `created_at` dan `action`.
   - *Rekomendasi Skala Produksi:* Terapkan partisi tabel (*table partitioning*) berbasis rentang bulan saat entri audit melampaui 1 juta baris.
3. **Ukuran Unggahan Foto Resolusi Tinggi:**
   - *Kondisi:* Foto kamera ponsel modern dapat mencapai 8-12 MB per file.
   - *Mitigasi:* Aplikasi membatasi upload maksimum 10 MB per file dan melakukan streaming buffer memory langsung ke disk storage.

