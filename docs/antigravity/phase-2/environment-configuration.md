# Panduan Konfigurasi Variabel Lingkungan (Environment Configuration) — URD Phase 2

Tanggal: 2 November 2026  
Status: **STAGING & PRODUCTION SPECIFICATION**  
Rujukan Kode: `backend/src/config/env.js`  
Pelaksana: DevOps Engineer & Application Security Engineer  

---

## 1. Prinsip Pengelolaan Kredensial & Secrets

1. **Zero Secret in Git:** Tidak ada secret, password database, private key JWT, atau token API yang boleh disimpan ke dalam repositori Git. Berkas `.env` telah dimasukkan ke dalam `.gitignore`.
2. **Fail-Fast Startup:** Aplikasi backend secara eksplisit memverifikasi ketersediaan variabel lingkungan kritis saat proses booting. Jika variabel wajib tidak memenuhi standar (contoh: `JWT_SECRET` kurang dari 24 karakter pada environment non-development), proses inisialisasi server akan langsung berhenti (*crash/exit 1*) dengan pesan error yang jelas.
3. **Izin Berkas Ketat:** Pada server staging dan produksi, berkas konfigurasi `.env` wajib dilindungi dengan izin akses `chmod 600` dan dimiliki oleh user service non-root (`chown urd:urd .env`).

---

## 2. Matriks Variabel Lingkungan Lengkap

| Nama Variabel | Status | Nilai Default | Contoh Format Staging (Aman) | Deskripsi & Tujuan |
|:---|:---:|:---:|:---|:---|
| `NODE_ENV` | **Wajib** | `development` | `staging` atau `production` | Menentukan mode runtime Node.js dan mengaktifkan proteksi keamanan ketat. |
| `PORT` | Opsional | `4000` | `4000` | Port HTTP internal tempat Express mendengarkan koneksi dari reverse proxy. |
| `DATABASE_URL` | **Wajib** | - | `postgresql://urd_stg_usr:****@127.0.0.1:5432/urd_staging` | URL koneksi PostgreSQL mencakup username, password, host, port, dan nama database. |
| `TEST_DATABASE_URL` | Khusus Test | - | `postgresql://urd_test_usr:****@127.0.0.1:5433/urd_test` | Digunakan secara eksklusif oleh Vitest untuk eksekusi test integrasi backend. |
| `JWT_SECRET` | **Wajib** | - | `[64_HEX_CHARACTERS_CRYPTOGRAPHIC_SECRET]` | Kunci rahasia untuk menandatangani dan memverifikasi token JWT (wajib >= 32 karakter). |
| `JWT_ACCESS_TTL` | Opsional | `15m` | `15m` | Masa berlaku access token sebelum klien wajib melakukan refresh token. |
| `REFRESH_SESSION_DAYS` | Opsional | `7` | `7` | Durasi masa berlaku sesi refresh token (hari) yang disimpan di cookie HttpOnly. |
| `CORS_ORIGIN` | **Wajib** | `http://localhost:5173` | `https://staging.upayariksadaya.com` | Whitelist domain frontend yang diizinkan melakukan panggilan API (dipisah koma jika banyak). |
| `STORAGE_DIR` | Opsional | `./storage/uploads` | `/var/lib/urd/storage/uploads` | Direktori persisten penyimpanan foto temuan inspeksi, dokumen BAP, dan berkas PDF. |
| `MAX_UPLOAD_BYTES` | Opsional | `10485760` (10MB) | `10485760` | Batas maksimum ukuran berkas unggahan per request (bytes). |
| `CLIENT_REMINDER_ENABLED` | **Wajib di Staging** | `true` | `false` | Menentukan apakah cron scheduler diizinkan mengirim notifikasi eksternal. Di staging wajib `false`. |
| `SMTP_HOST` | Kondisional | `""` | `smtp.mailtrap.io` | Alamat server SMTP untuk pengiriman email (sandbox di staging). |
| `SMTP_PORT` | Kondisional | `587` | `587` | Port koneksi server SMTP. |
| `SMTP_SECURE` | Kondisional | `false` | `false` | `true` untuk port 465 (TLS langsung), `false` untuk port 587 (STARTTLS). |
| `SMTP_USER` | Kondisional | `""` | `[STAGING_SANDBOX_USER]` | Username otentikasi SMTP sandbox. |
| `SMTP_PASS` | Kondisional | `""` | `[STAGING_SANDBOX_PASSWORD]` | Password otentikasi SMTP sandbox. |
| `SMTP_FROM` | Opsional | `PT Upaya Riksa Daya...` | `PT Upaya Riksa Daya (Staging) <no-reply@staging.upayariksadaya.com>` | Alamat email dan nama pengirim resmi pada header pesan keluar. |
| `WA_API_URL` | Kondisional | `https://api.fonnte.com/send` | `https://api.fonnte.com/send` | Endpoint gateway WhatsApp resmi yang digunakan sistem. |
| `WA_API_TOKEN` | Kondisional | `""` | `""` (Kosongkan di Staging) | Token otorisasi gateway WhatsApp. Di staging dikosongkan agar beralih ke mode SIMULASI. |
| `SEED_DEFAULT_PASSWORD` | Khusus Seed | `null` | `[TEMPORARY_INITIAL_SETUP_PW]` | Digunakan oleh skrip seed untuk inisialisasi akun administrator awal. |

---

## 3. Template Berkas Konfigurasi Staging (`.env.staging.example`)

Gunakan template berikut sebagai acuan pembuatan berkas `.env` pada server staging:

```bash
# ==============================================================================
# KONFIGURASI ENVIRONMENT STAGING PT UPAYA RIKSA DAYA
# Berkas ini adalah template. Isi nilai rahasia di server dan jangan commit ke Git.
# ==============================================================================

# Runtime
NODE_ENV=staging
PORT=4000

# Database PostgreSQL Staging (Terisolasi dari Dev & Prod)
DATABASE_URL=postgresql://urd_staging_app:GantiDenganPasswordKuatStaging123!@localhost:5432/urd_staging

# Keamanan JWT (Minimal 32 karakter acak: openssl rand -hex 32)
JWT_SECRET=a8f9c1e2d3b4567890abcdef1234567890abcdef1234567890abcdef12345678
JWT_ACCESS_TTL=15m
REFRESH_SESSION_DAYS=7

# Jaringan & CORS (Domain Resmi Staging)
CORS_ORIGIN=https://staging.upayariksadaya.com

# Media & Storage Persisten
STORAGE_DIR=/var/lib/urd/staging-uploads
MAX_UPLOAD_BYTES=10485760

# Pengamanan Integrasi Eksternal (WAJIB DINONAKTIFKAN / SANDBOX DI STAGING)
CLIENT_REMINDER_ENABLED=false
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=mock_mailtrap_user
SMTP_PASS=mock_mailtrap_pass
SMTP_FROM=PT Upaya Riksa Daya Staging <staging@upayariksadaya.com>
WA_API_URL=https://api.fonnte.com/send
WA_API_TOKEN=
```

---

## 4. Mekanisme Verifikasi Booting Backend

Pada berkas `backend/src/config/env.js`:
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
Ketika dijalankan pada environment `staging` atau `production`, server akan melempar fatal exception dan menolak aktif jika `JWT_SECRET` tidak dideklarasikan secara eksplisit dengan panjang minimal 24 karakter. Hal ini mencegah terjadinya *insecure default key* pada lingkungan publik.

