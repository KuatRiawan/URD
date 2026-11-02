# Arsitektur Deployment Lingkungan Staging — URD Phase 2

Tanggal: 2 November 2026  
Status Dokumen: **APPROVED ARCHITECTURE FOR STAGING**  
Rujukan Standar: Enterprise Web Application Architecture & PJK3 Compliance  
Pelaksana: Software Architect & DevOps Engineer  

---

## 1. Ikhtisar Arsitektur Sistem Staging

Lingkungan staging PT Upaya Riksa Daya dirancang untuk mereplikasi karakteristik teknis, batas keamanan (*security boundaries*), dan alur data operasional produksi secara akurat, namun terisolasi total dari pihak eksternal, klien nyata, dan sistem produksi.

```
                           [ Klien / Perangkat Lapangan Ahli K3 ]
                                            │
                                     (HTTPS Port 443)
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │      Reverse Proxy (Nginx)      │
                           │  - TLS Termination / SSL        │
                           │  - Static Asset Caching         │
                           │  - Security Headers (HSTS, CSP) │
                           └───────────────┬─────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
             (Static Files)                               (Proxy /api/v1)
                    ▼                                             ▼
     ┌─────────────────────────────┐               ┌─────────────────────────────┐
     │   Frontend Build (Vite)     │               │    Backend API (Express 5)  │
     │   - React 18 SPA            │               │    - Node.js LTS (ESM)      │
     │   - Tailwind CSS v4         │               │    - Helmet & Strict CORS   │
     │   - Phosphor Icons          │               │    - Custom CSRF Guard      │
     │   - Offline IndexedDB Engine│               │    - JWT HttpOnly Cookies   │
     │   - Canvas Signature Pad    │               │    - Express Rate Limiting  │
     └─────────────────────────────┘               └──────────────┬──────────────┘
                                                                  │
                                           ┌──────────────────────┴──────────────────────┐
                                           │                                             │
                                    (pg.Pool Connection)                         (Local File I/O)
                                           ▼                                             ▼
                            ┌─────────────────────────────┐               ┌─────────────────────────────┐
                            │  PostgreSQL 16 (Staging)    │               │  Persistent File Storage    │
                            │  - Database: urd_staging    │               │  - Path: ./storage/uploads  │
                            │  - 19 Schema Migrations     │               │  - MIME Whitelist           │
                            │  - Foreign Keys & Indexes   │               │  - UUID Sanitized Filename  │
                            │  - Immutable Audit Logs     │               │  - Granular Access Guard    │
                            └─────────────────────────────┘               └─────────────────────────────┘
```

---

## 2. Rincian Komponen Arsitektur

### A. Frontend Layer (React 18 & Vite)
- **Framework & Build:** React 18, React Router v7, Vite v6.4.5.
- **Styling & Assets:** Tailwind CSS v4, Plus Jakarta Sans webfonts, Phosphor Icons (`@phosphor-icons/react`).
- **Input Lapangan:** Kanvas tanda tangan digital berbasis Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`) yang responsif terhadap stylus tablet maupun sentuhan jari mobile.
- **Mode Offline:** Modul `offline-sync.js` mengandalkan IndexedDB browser (`urd-offline-sync`) dengan fallback otomatis ke `localStorage` jika storage terblokir. Auto-sync memancarkan event `urd-offline-synced` saat jaringan pulih.
- **Serving:** Hasil `npm run build` (folder `dist/`) disajikan sebagai berkas statis terkompresi Gzip/Brotli melalui Nginx.

### B. Backend API Layer (Express 5 ESM)
- **Runtime:** Node.js 20+ LTS dengan mode module ECMAScript (`"type": "module"`).
- **Protokol REST:** Seluruh endpoint berada di bawah namespace `/api/v1/`.
- **Keamanan Transport:**
  - `helmet({ crossOriginResourcePolicy: { policy: 'same-site' } })`.
  - `cors` dengan validasi ketat whitelist `CORS_ORIGIN` dan dukungan `credentials: true`.
  - Proteksi CSRF ganda: verifikasi cookie HttpOnly, keharusan header `X-Requested-With: XMLHttpRequest` atau `Authorization: Bearer <token>`, serta verifikasi Origin.
  - Rate Limiter: maksimal 25 percobaan login per 15 menit per alamat IP pada `/api/v1/auth/login`.

### C. Database Layer (PostgreSQL 16 Staging)
- **Koneksi:** Pooled connection menggunakan pustaka native `pg` (`max: 15`, `idleTimeoutMillis: 30000`).
- **Integritas:** 19 berkas migrasi SQL konsisten (`schema_migrations`), 42 tabel entitas, dan 99 relasi foreign key.
- **Append-Only Auditing:** Tabel `audit_logs` merekam seluruh mutasi status, finalisasi dokumen, dan aktivitas administratif.

### D. File Storage & Media Lapangan
- **Direktori:** Jalur lokal persisten `./storage/uploads` yang dikonfigurasi via `STORAGE_DIR`.
- **MIME Whitelist:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- **Batas Ukuran:** Maksimal 10 MB per berkas (`MAX_UPLOAD_BYTES`).
- **Keamanan Penyimpanan:** Berkas disimpan dengan penamaan acak terenkripsi `Date.now() + UUID` tanpa mempertahankan nama asli dari klien guna mencegah *path traversal* (`../`) dan eksekusi skrip ilegal.
- **Otorisasi Unduh:** Endpoint `/api/v1/dashboard/files/:id` memverifikasi hak akses granular melalui helper `inspectorCanAccessAttachment` sebelum menyajikan binary berkas.

### E. Mesin Generator PDF & Stiker QR
- **PDFKit Engine:** Render server-side laporan LHPP 5 bab standar kertas F4 (Bab I s/d Bab V) lengkap dengan format tabel teknis, halaman suplemen SKP PJK3, lembar rekomendasi, dan stiker QR verifikasi.
- **QR Code Verification:** Modul `qrcode` menghasilkan matriks QR yang mengarah ke endpoint publik `/verifikasi/:code`.

### F. Scheduler & Background Tasks
- **Pustaka:** `node-cron` menjalankan pemindaian harian pada pukul 07:00 waktu server.
- **Staging Safety Guard:** Notifier mengevaluasi variabel `CLIENT_REMINDER_ENABLED`. Pada lingkungan staging, mode pengiriman otomatis berada pada status `SIMULASI` (tidak mengirim SMS, WA, atau email nyata).

---

## 3. Strategi Manajemen Proses (Process Manager)

Pada server staging, backend dijalankan menggunakan **PM2** atau **systemd** dengan konfigurasi eksekusi:

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'urd-backend-staging',
      script: './src/server.js',
      cwd: '/var/www/urd/backend',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'staging',
        PORT: 4000
      }
    }
  ]
};
```

---

## 4. Konfigurasi Reverse Proxy Nginx

Nginx bertindak sebagai front-facing gateway yang mengarahkan trafik:

```nginx
# /etc/nginx/sites-available/urd-staging.conf
server {
    listen 80;
    server_name staging.upayariksadaya.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.upayariksadaya.com;

    ssl_certificate /etc/ssl/certs/urd-staging.crt;
    ssl_certificate_key /etc/ssl/private/urd-staging.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root Frontend Build
    root /var/www/urd/frontend/dist;
    index index.html;

    client_max_body_size 15M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static Assets Caching
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API Proxy ke Node.js Backend
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 5. Kesimpulan Kesiapan Arsitektur

Arsitektur staging di atas mempertahankan seluruh fondasi teknologi existing URD tanpa perubahan breaking change:
- Mempertahankan keselarasan Express, PostgreSQL, dan React.
- Menerapkan isolasi penuh data staging dan mock integrator eksternal.
- Siap menampung pengujian beban nyata (*load testing*) dan simulasi multi-user secara bersamaan.

