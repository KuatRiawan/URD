# Laporan Deployment Aplikasi (Application Deployment Report)

Tanggal: 2 November 2026  
Status Deployment: **PASSED (KONFIGURASI PM2, VITE BUILD & NGINX INTEGRATION TERVERIFIKASI)**  
Penyusun: Senior DevOps Engineer, Release Manager & Senior Full-Stack Engineer  

---

## 1. Arsitektur Deployment Aplikasi Staging

Aplikasi PT Upaya Riksa Daya menggunakan pola arsitektur *Decoupled Monolith with Unified Reverse Proxy*:

```
[ Klien / Browser / Mobile ]
            │ (HTTPS :443)
            ▼
     [ Nginx Gateway ]
     ├── /api/*   ──────► [ PM2 Express Backend (Port 4000) ] ──► [ PostgreSQL 16/18 ]
     ├── /storage/ ─────► [ Local Storage /var/urd/storage ]
     └── /*       ──────► [ Static Frontend Bundle (/var/urd/frontend/dist) ]
```

Keuntungan arsitektur ini:
- Port internal backend (4000) dan database (5432) tidak terekspos ke internet publik.
- TLS terminasi dilakukan di Nginx secara terpusat dengan kompresi Gzip dan proteksi HTTP Security Headers.
- Static assets (JS/CSS/Fonts/Images) di-cache secara efisien oleh Nginx tanpa membebani event loop Node.js.

---

## 2. Spesifikasi Deployment Backend (Express Runtime)

1. **Titik Masuk (Entry Point):** `backend/src/server.js`
2. **Runtime Command:** `node src/server.js` (dijalankan oleh PM2 di bawah user `urd`).
3. **Pemuatan Konfigurasi:** Menggunakan `backend/src/config/env.js` dengan validasi fail-fast.
4. **Koneksi Database:** Pool connection (`pg.Pool`) dengan batas maksimum 15 koneksi simultan, idle timeout 30 detik.
5. **Graceful Shutdown:** 
   - Backend menangani sinyal `SIGTERM` dan `SIGINT`.
   - Menutup koneksi server HTTP untuk menolak request baru.
   - Menunggu request yang sedang berjalan selesai (drain timeout 10 detik).
   - Menutup koneksi database pool (`await pool.end()`) secara rapi sebelum proses keluar.

---

## 3. Spesifikasi Deployment Frontend (Vite Production Bundle)

Frontend dibangun menggunakan Vite 6.4.5 dengan optimasi produksi penuh:

```bash
cd frontend && npm run build
```

Hasil verifikasi build:
- **Status:** Berhasil (`✓ built in 6.45s`).
- **Modul Ditransformasi:** 4.766 modul.
- **Artefak Utama (`dist/`):**
  - `dist/index.html`: 1.36 kB (gzip: 0.65 kB)
  - `dist/assets/index-ZSiHrtQX.js`: 290.14 kB (gzip: 85.63 kB)
  - `dist/assets/vendor-C4-vZ_jP.js`: 111.41 kB (gzip: 40.13 kB)
  - `dist/assets/icons-ksAsZugE.js`: 285.38 kB (gzip: 64.25 kB)
  - `dist/assets/index-CnmZKJl1.css`: 127.55 kB (gzip: 20.95 kB)
- **Verifikasi Keamanan Bundle:**
  - Dilakukan pemindaian terhadap string pada folder `dist/assets/`.
  - **Hasil:** Zero secrets leaked. Tidak ada `DATABASE_URL`, `JWT_SECRET`, password admin, atau kredensial internal yang bocor ke dalam bundle JavaScript publik.

---

## 4. Konfigurasi Pengelola Proses (PM2 Ecosystem)

File konfigurasi PM2 disiapkan pada `/var/urd/ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'urd-staging-backend',
      script: './src/server.js',
      cwd: '/var/urd/backend',
      instances: 1, // Wajib 1 instance: mencegah eksekusi duplikat scheduler reminder
      exec_mode: 'fork', // Bukan cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 5000,
      listen_timeout: 8000,
      env: {
        NODE_ENV: 'staging',
        PORT: 4000
      },
      error_file: '/var/urd/logs/backend-error.log',
      out_file: '/var/urd/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

**Alasan Arsitektur Pemilihan Fork Mode (Instances: 1):**  
Aplikasi URD memuat modul `reminder-scheduler.js` yang berjalan di latar belakang untuk mengecek jatuh tempo Suket K3. Menjalankan PM2 dalam cluster mode (misalnya 4 instances) tanpa distributed lock (Redis) akan memicu eksekusi pengingat 4 kali untuk setiap unit. Oleh karena itu, backend staging secara ketat diatur sebagai **single fork instance**.

---

## 5. Pemeriksaan Kesehatan Layanan (Health Check Endpoint)

Aplikasi menyediakan endpoint kesehatan standar pada:

```http
GET /api/v1/health
```

**Respon Sukses (HTTP 200 OK):**
```json
{
  "status": "ok",
  "service": "PT Upaya Riksa Daya API"
}
```

Endpoint ini digunakan oleh Nginx upstream monitor dan script watchdog PM2 untuk memastikan backend responsif dan siap melayani lalu lintas request.

