# Buku Panduan Operasional Staging (Operations Runbook)

Tanggal: 2 November 2026  
Status Dokumen: **APPROVED FOR OPERATIONS (STANDAR OPERASIONAL SISTEM URD)**  
Sasaran Pembaca: IT Administrator, DevOps Engineer, Site Reliability Engineer & On-Call Engineer  

---

## 1. Perintah Pengendalian Layanan (Service Management)

Aplikasi URD diatur menggunakan kombinasi systemd (untuk PostgreSQL & Nginx) dan PM2 (untuk backend Express).

### A. Memeriksa Status Layanan
```bash
# 1. Periksa status PM2 backend
sudo -u urd pm2 status

# 2. Periksa status Nginx web server
sudo systemctl status nginx

# 3. Periksa status PostgreSQL database
sudo systemctl status postgresql
```

### B. Menjalankan Layanan (Start)
```bash
# Start PostgreSQL
sudo systemctl start postgresql

# Start Nginx
sudo systemctl start nginx

# Start Backend Express via PM2
sudo -u urd pm2 start /var/urd/ecosystem.config.cjs
```

### C. Menghentikan Layanan (Stop)
```bash
# Stop Backend Express
sudo -u urd pm2 stop urd-staging-backend

# Stop Nginx
sudo systemctl stop nginx

# Stop PostgreSQL
sudo systemctl stop postgresql
```

### D. Memulai Ulang Layanan (Restart / Zero-Downtime Reload)
```bash
# Reload Nginx tanpa memutus koneksi aktif
sudo nginx -t && sudo systemctl reload nginx

# Reload Backend Express secara teratur (Graceful Reload)
sudo -u urd pm2 reload urd-staging-backend
```

---

## 2. Pemantauan & Pemeriksaan Log Sistem (Log Inspection)

Semua log tersimpan secara terpusat pada `/var/urd/logs` dan `/var/log/nginx`.

### A. Melihat Log Aplikasi Real-time (Stream)
```bash
# Menampilkan log backend secara live (output + error)
sudo -u urd pm2 logs urd-staging-backend --lines 100

# Menampilkan hanya log error backend
tail -f /var/urd/logs/backend-error.log
```

### B. Melihat Log Web Server Nginx
```bash
# Log akses (mendeteksi lalu lintas dan status code HTTP)
sudo tail -f /var/log/nginx/access.log

# Log error (mendeteksi koneksi gateway yang ditolak atau masalah upstream)
sudo tail -f /var/log/nginx/error.log
```

---

## 3. Pemeriksaan Kesehatan Berkala (Health Checks)

Jalankan perintah ini untuk memvalidasi ketersediaan sistem:

```bash
# 1. Cek kesehatan gateway HTTPS publik
curl -I https://staging.upayariksadaya.com/

# 2. Cek endpoint kesehatan API Express
curl -s https://staging.upayariksadaya.com/api/v1/health | jq .
# Respon yang benar: { "status": "ok", "service": "PT Upaya Riksa Daya API" }

# 3. Cek penggunaan memori dan CPU server
free -m
uptime
df -h /
```

---

## 4. Prosedur Pencadangan Mandiri (Manual Backup)

Jika ingin melakukan pencadangan segera (misalnya sebelum rilis fitur baru atau perbaikan data):

```bash
# Buat snapshot database instan
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
sudo -u urd pg_dump -h 127.0.0.1 -p 5432 -U urd_staging_app -F c -b -d urd_staging -f "/var/urd/backups/manual_urd_db_${TIMESTAMP}.dump"

# Buat snapshot file dokumen instan
sudo tar -czf "/var/urd/backups/manual_storage_${TIMESTAMP}.tar.gz" -C /var/urd/storage uploads

echo "Snapshot tersimpan di /var/urd/backups/"
```

---

## 5. Prosedur Pemulihan Sistem (Disaster Recovery Execution)

Jika terjadi insiden korupsi data atau kegagalan fatal pada server:

### Langkah 1: Hentikan Backend untuk Mencegah Akses Masuk
```bash
sudo -u urd pm2 stop urd-staging-backend
```

### Langkah 2: Pulihkan Database dari Backup Terakhir
```bash
# Peringatan: Pastikan file dump valid sebelum restore!
LATEST_BACKUP=$(ls -t /var/urd/backups/db/urd_db_*.dump | head -1)

# Drop dan Create ulang database bersih (oleh user postgres)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS urd_staging;"
sudo -u postgres psql -c "CREATE DATABASE urd_staging WITH OWNER urd_staging_app ENCODING 'UTF8';"

# Pulihkan skema dan data
sudo -u postgres pg_restore -d urd_staging -v "${LATEST_BACKUP}"
```

### Langkah 3: Pulihkan File Penyimpanan Dokumen
```bash
LATEST_STORAGE=$(ls -t /var/urd/backups/storage/urd_files_*.tar.gz | head -1)
sudo tar -xzf "${LATEST_STORAGE}" -C /var/urd/storage/
sudo chown -R urd:urd-app /var/urd/storage
```

### Langkah 4: Hidupkan Kembali Backend & Verifikasi
```bash
sudo -u urd pm2 start urd-staging-backend
curl -s http://127.0.0.1:4000/api/v1/health
```

---

## 6. Matriks Eskalasi Insiden Operasional

| Kategori Insiden | Gejala | Tindakan Pertama | Pihak yang Dihubungi |
|---|---|---|---|
| **Server Down (P1)** | Port 443 tidak merespon, 502 Bad Gateway | Cek Nginx dan `pm2 status`, restart backend | DevOps On-Call |
| **Database Lock (P2)** | API timeout > 30 detik pada kueri mutasi | Cek `pg_stat_activity`, kill blocking query | DBA / Backend Lead |
| **Disk Space Warning (P2)** | Partisi disk `/` mencapai > 85% | Bersihkan log usang, rotasi dump backup | IT Support / SRE |
| **PDF Generation Error (P3)**| Admin gagal cetak LHPP F4 | Cek memori proses dan font template | Software Engineer |

