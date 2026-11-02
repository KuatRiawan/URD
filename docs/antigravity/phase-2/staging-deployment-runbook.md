# Petunjuk Teknis Deployment Staging (Staging Deployment Runbook) — URD Phase 2

Tanggal: 2 November 2026  
Status: **STAGING DEPLOYMENT RUNBOOK**  
Target Lingkungan: Staging Server (`staging.upayariksadaya.com`)  
Commit Acuan: `5aa46c8` (Branch `main` / `staging`)  
Pelaksana: DevOps Engineer & Release Manager  

---

## 1. Prasyarat Server Staging (Host Prerequisites)

Sebelum proses deployment dimulai, pastikan host server staging memenuhi spesifikasi berikut:

- **Sistem Operasi:** Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9.
- **Node.js Runtime:** Node.js v20.x LTS atau v22.x LTS (`node -v`).
- **Package Manager:** npm v10.x+ (`npm -v`).
- **Basis Data:** PostgreSQL 16+ aktif pada port 5432 (`psql --version`).
- **Web Server & Reverse Proxy:** Nginx 1.22+ dengan modul SSL/HTTP2 (`nginx -v`).
- **Process Manager:** PM2 global terinstal (`pm2 -v`).
- **Penyimpanan Persisten:** Direktori `/var/lib/urd/staging-uploads` siap dengan kepemilikan user `urd:urd`.
- **Sertifikat SSL:** Sertifikat TLS valid untuk domain `staging.upayariksadaya.com`.

---

## 2. Verifikasi Kualitas Pra-Deployment (Local Quality Gate)

Seluruh perintah berikut **wajib dieksekusi dan lolos 100%** di lingkungan lokal/CI sebelum berkas didorong ke server staging:

```bash
# 1. Jalankan pengujian backend lengkap (Target: 8 suites, 102 passed)
npm --prefix backend test

# 2. Jalankan pengujian frontend lengkap (Target: 4 suites, 11 passed)
npm --prefix frontend test -- --run

# 3. Jalankan audit kode statis (Linter) backend & frontend (Target: 0 error)
npm --prefix backend run lint
npm --prefix frontend run lint

# 4. Jalankan kompilasi produksi frontend (Target: Built sukses)
npm --prefix frontend run build
```

---

## 3. Langkah Demi Langkah Eksekusi Deployment di Server

### Langkah 1: Persiapan Repository & Branch
```bash
# Masuk ke direktori aplikasi
cd /var/www/urd

# Tarik commit terverifikasi dari repositori resmi
git fetch origin
git checkout staging
git pull origin staging

# Catat hash commit deployment
git rev-parse HEAD > /var/log/urd/last_deployed_commit.txt
```

### Langkah 2: Pemasangan Dependensi Produksi
```bash
# Pasang dependensi backend
npm --prefix backend install --omit=dev

# Pasang dependensi frontend untuk keperluan build
npm --prefix frontend install
```

### Langkah 3: Konfigurasi Berkas Lingkungan (.env)
Pastikan berkas `/var/www/urd/backend/.env` telah terisi sesuai panduan `environment-configuration.md`:
```bash
chmod 600 /var/www/urd/backend/.env
chown urd:urd /var/www/urd/backend/.env
```

### Langkah 4: Eksekusi Migrasi Database Staging
```bash
# Jalankan migrasi 19 berkas SQL secara terkendali
cd /var/www/urd/backend
NODE_ENV=staging npm run migrate
```
*Catatan:* Jika database staging baru diinisialisasi pertama kali, jalankan seed minimal:
```bash
NODE_ENV=staging npm run seed
```

### Langkah 5: Kompilasi Aset Frontend Produksi
```bash
cd /var/www/urd/frontend
npm run build
# Pastikan folder dist/ terisi aset terkini
ls -lh dist/index.html
```

### Langkah 6: Restart Layanan Backend (PM2 Zero-Downtime Reload)
```bash
cd /var/www/urd/backend
pm2 reload ecosystem.config.cjs --env staging || pm2 start ecosystem.config.cjs --env staging
pm2 save
```

### Langkah 7: Reload Konfigurasi Reverse Proxy Nginx
```bash
# Uji sintaks konfigurasi Nginx
sudo nginx -t

# Muat ulang Nginx tanpa memutus koneksi aktif
sudo systemctl reload nginx
```

---

## 4. Verifikasi Kesehatan Pasca-Deployment (Post-Deployment Health Check)

Segera setelah langkah di atas selesai, jalankan health check HTTP:

```bash
# 1. Uji endpoint kesehatan backend API
curl -i -s https://staging.upayariksadaya.com/api/v1/health

# Respon yang diharapkan:
# HTTP/1.1 200 OK
# Content-Type: application/json; charset=utf-8
# {"status":"ok","service":"PT Upaya Riksa Daya API"}

# 2. Uji ketersediaan antarmuka frontend SPA
curl -i -s https://staging.upayariksadaya.com/ | grep "<title>"

# 3. Uji pencegahan CSRF pada endpoint mutasi
curl -i -s -X POST https://staging.upayariksadaya.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"invalid"}'

# Respon yang diharapkan: HTTP 400 atau 401, BUKAN 500
```

---

## 5. Prosedur Rollback Cepat (Emergency Rollback Runbook)

Jika pasca-deployment terdeteksi isu kritis (misalnya API gagal booting atau tampilan blank):

```bash
# 1. Kembalikan branch ke commit stabil sebelumnya
cd /var/www/urd
git checkout <PREVIOUS_STABLE_COMMIT_HASH>

# 2. Re-build frontend ke versi stabil
npm --prefix frontend run build

# 3. Restart backend
pm2 restart urd-backend-staging

# 4. Jika migrasi database perlu dipulihkan, gunakan snapshot pre-migration:
pg_restore -d "$DATABASE_URL" --clean --no-owner --no-acl /var/backups/urd/pre_migration_backup.dump

# 5. Laporkan insiden ke tim lead rekayasa produk
```

