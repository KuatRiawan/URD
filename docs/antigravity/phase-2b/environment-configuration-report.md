# Laporan Konfigurasi Lingkungan (Environment Configuration Report)

Tanggal: 2 November 2026  
Status Konfigurasi: **PASSED (STANDAR LINGKUNGAN STAGING TERVERIFIKASI)**  
Penyusun: Senior DevOps Engineer & Software Architect  

---

## 1. Taksonomi Variabel Lingkungan Staging

Seluruh parameter runtime Express backend dikelompokkan ke dalam enam kelompok fungsional yang terdefinisi jelas:

| Kelompok | Variabel | Nilai Staging yang Direkomendasikan | Sifat / Batasan |
|---|---|---|---|
| **Aplikasi** | `NODE_ENV` | `staging` | Mode produksi dengan isolasi staging |
| | `PORT` | `4000` | Port Express lokal (bind `127.0.0.1`) |
| | `CORS_ORIGIN` | `https://staging.upayariksadaya.com` | Strict origin whitelist, tolak origin lain |
| **Database** | `DATABASE_URL` | `postgres://urd_staging_app:SECURE_PW@localhost:5432/urd_staging` | User restricted non-superuser |
| **Autentikasi** | `JWT_SECRET` | 64-char random hex string | Wajib >= 24 char, gagal jika kosong |
| | `JWT_ACCESS_TTL` | `15m` | Masa aktif access token singkat |
| | `REFRESH_SESSION_DAYS`| `7` | Masa aktif refresh token keluarga sesi |
| **Penyimpanan** | `STORAGE_DIR` | `/var/urd/storage/uploads` | Path persisten di luar direktori kode |
| | `MAX_UPLOAD_BYTES` | `10485760` (10 MB) | Batas unggah file per lampiran |
| **Eksternal** | `CLIENT_REMINDER_ENABLED` | `false` (atau `dry-run`) | Mencegah pengiriman pesan ke klien nyata |
| | `SMTP_HOST` | `sandbox.smtp.mailtrap.io` | Sandbox email staging |
| | `SMTP_PORT` | `2525` | Port SMTP sandbox |
| | `SMTP_SECURE` | `false` | STARTTLS |
| | `SMTP_USER` | `<mailtrap_staging_user>` | Kredensial sandbox |
| | `SMTP_PASS` | `<mailtrap_staging_pass>` | Kredensial sandbox |
| | `SMTP_FROM` | `PT Upaya Riksa Daya <staging@upayariksadaya.com>` | Sender pengujian |
| | `WA_API_URL` | `https://api.fonnte.com/send` | Endpoint gateway WhatsApp |
| | `WA_API_TOKEN` | *Dikosongkan di staging* | Memicu mode fallback `SIMULASI` aman |
| **Operasional** | `SEED_DEFAULT_PASSWORD` | *Kosong / Tidak diatur* | Dilarang menjalankan dev seed di staging |

---

## 2. Template Konfigurasi `.env.staging.example`

Template resmi yang telah disiapkan untuk tim IT Ops:

```ini
# =============================================================================
# PT UPAYA RIKSA DAYA - STAGING ENVIRONMENT CONFIGURATION
# =============================================================================
# CATATAN: File ini adalah template. Salin ke /var/urd/.env dan ubah nilai rahasia.
# Berikan hak akses ketat: chmod 600 /var/urd/.env && chown urd:urd-app /var/urd/.env

# Application Core
NODE_ENV=staging
PORT=4000
CORS_ORIGIN=https://staging.upayariksadaya.com

# PostgreSQL Connection (Staging Database)
# Dilarang menggunakan user superuser 'postgres' untuk runtime aplikasi!
DATABASE_URL=postgres://urd_staging_app:GantiDenganPasswordKuatStagingDatabase123!@localhost:5432/urd_staging

# Security & Session Secrets
# Generate dengan perintah: openssl rand -hex 32
JWT_SECRET=b7e19a4e2d31c4f5890ab76e2d19f8a3c4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
JWT_ACCESS_TTL=15m
REFRESH_SESSION_DAYS=7

# Persistent Storage
STORAGE_DIR=/var/urd/storage/uploads
MAX_UPLOAD_BYTES=10485760

# Background & Scheduler Safety Controls
# Set false agar cron job tidak mengirim email/WA otomatis ke klien
CLIENT_REMINDER_ENABLED=false

# Sandbox Email Integration (Mailtrap Staging Sandbox)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=ganti_dengan_user_mailtrap_staging
SMTP_PASS=ganti_dengan_pass_mailtrap_staging
SMTP_FROM=PT Upaya Riksa Daya Staging <staging@upayariksadaya.com>

# WhatsApp Gateway Mock / Simulator
# Kosongkan token untuk mengaktifkan fallback aman internal (SIMULASI)
WA_API_URL=https://api.fonnte.com/send
WA_API_TOKEN=

# Dilarang mengisi SEED_DEFAULT_PASSWORD pada lingkungan staging operasional
```

---

## 3. Mekanisme Fail-Fast Saat Inisialisasi Aplikasi (`env.js`)

Aplikasi URD mengimplementasikan validasi *Fail-Fast* pada saat inisialisasi modul (`backend/src/config/env.js`). Jika salah satu kondisi berikut tidak terpenuhi, server akan segera mematikan proses (*exit with error code*) sebelum membuka port jaringan:

1. **Pemeriksaan Panjang JWT_SECRET:**
   ```javascript
   if (!env.jwtSecret || env.jwtSecret.length < 24) {
     if (env.isTest) {
       env.jwtSecret = 'test-only-jwt-secret-minimum-32-chars-long';
     } else if (env.nodeEnv === 'development') {
       env.jwtSecret = crypto.randomBytes(32).toString('hex');
     } else {
       throw new Error('JWT_SECRET wajib disetel minimal 24 karakter pada environment non-development');
     }
   }
   ```
2. **Pemeriksaan Direktori Penyimpanan Berkas:**
   - Inisialisasi memanggil `fs.mkdirSync(env.storageDir, { recursive: true })`. Jika direktori `/var/urd/storage/uploads` tidak dapat diakses atau permission tidak mengizinkan penulisan, proses Express langsung melempar exception `EACCES`.
3. **Pemeriksaan Konektivitas Pool Database:**
   - Saat proses `server.js` dimulai, kueri awal dijalankan untuk memverifikasi handshake database. Jika `DATABASE_URL` salah atau server database mati, proses berhenti dan mencatat pesan error terstruktur.

---

## 4. Kebijakan Pengelolaan Rahasia (Secret Management Policy)

1. **Penyimpanan:** File konfigurasi aktual disimpan hanya pada `/var/urd/.env`.
2. **Izin Berkas:** Diatur ke `0600` (`-rw-------`), hanya dapat dibaca oleh user `urd`.
3. **Pencegahan Kebocoran Log:** 
   - Modul logging Winston/Morgan dilarang mencatat parameter query atau body yang mengandung kata kunci: `password`, `token`, `secret`, `authorization`, `cookie`, `refresh_token`.
   - Error handler global (`backend/src/middleware/error-handler.js`) menyamarkan pesan error teknis database (seperti constraint name atau connection string) saat `isProd` atau `nodeEnv === 'staging'`.

