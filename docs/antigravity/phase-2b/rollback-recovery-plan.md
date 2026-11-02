# Rencana Rollback & Pemulihan Sistem (Rollback & Recovery Plan)

Tanggal: 2 November 2026  
Status Dokumen: **APPROVED (PROSEDUR ROLLBACK RESMI STAGING URD)**  
Penyusun: Release Manager, PostgreSQL DBA & Senior Full-Stack Engineer  

---

## 1. Prinsip Pemisahan Rollback Aplikasi vs Rollback Database

Salah satu kesalahan paling fatal dalam rekayasa perangkat lunak adalah menganggap bahwa mengembalikan (*checkout*) commit git ke versi sebelumnya secara otomatis mengembalikan kondisi database.

Pada sistem PT Upaya Riksa Daya, rollback dipisahkan secara tegas:
1. **Rollback Aplikasi (Stateless):**
   - Menyangkut file JavaScript backend, bundle statis frontend Vite, konfigurasi PM2, dan konfigurasi Nginx. Dapat dikembalikan ke commit SHA sebelumnya dalam hitungan detik.
2. **Rollback Database (Stateful):**
   - Menyangkut skema tabel, tipe enum, constraint, dan data transaksional yang sudah terlanjur ditulis.
   - Migrasi yang bersifat *additive* (menambah kolom baru dengan nullable/default) umumnya aman bagi kode lama (*backward compatible*).
   - Migrasi yang bersifat *destructive* (menghapus kolom, mengubah tipe data, atau memecah tabel) tidak dapat dibalik hanya dengan git checkout, melainkan membutuhkan skrip migrasi *down* atau pemulihan snapshot database utuh.

---

## 2. Prasyarat Sebelum Eksekusi Deployment Rilis Baru

Sebelum melakukan deployment versi baru ke server staging:

1. **Catat Rilis Sebelumnya:**
   - Commit SHA rilis stabil terakhir (misal: `commit_sebelumnya_SHA`).
2. **Ambil Snapshot Database Sebelum Migrasi (*Pre-Migration Dump*):**
   ```bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   pg_dump -h 127.0.0.1 -p 5432 -U urd_staging_app -F c -b -d urd_staging -f "/var/urd/backups/pre_deploy_${TIMESTAMP}.dump"
   ```
3. **Arsipkan Bundle Frontend Sebelumnya:**
   ```bash
   cp -r /var/urd/frontend/dist /var/urd/frontend/dist_backup_${TIMESTAMP}
   ```

---

## 3. Prosedur Rollback Aplikasi (Jika Masalah Terbatas pada Kode)

Gunakan prosedur ini apabila setelah deployment terjadi bug frontend (tampilan rusak, routing gagal) atau bug backend (unhandled exception di controller Express) yang tidak merusak data database:

```bash
# 1. Pindah ke direktori repositori
cd /var/urd/repo

# 2. Kembalikan kode ke commit stabil sebelumnya
git checkout 5aa46c8

# 3. Rebuild frontend
cd frontend
npm ci --production=false
npm run build
cp -r dist/* /var/urd/frontend/dist/

# 4. Restart backend Express via PM2
cd ../backend
npm ci --production
pm2 reload urd-staging-backend

# 5. Verifikasi kesehatan
curl -s http://127.0.0.1:4000/api/v1/health
```

---

## 4. Prosedur Rollback Database (Jika Migrasi Skema Merusak Integritas)

Gunakan prosedur ini apabila migrasi skema gagal di tengah jalan (*partial failure*) atau menimbulkan error fatal pada aplikasi:

```bash
# 1. Hentikan aplikasi untuk mencegah penulisan data inkonsisten
pm2 stop urd-staging-backend

# 2. Pulihkan database dari snapshot pre-migration
PRE_DEPLOY_DUMP="/var/urd/backups/pre_deploy_[TIMESTAMP].dump"

sudo -u postgres psql -c "DROP DATABASE IF EXISTS urd_staging;"
sudo -u postgres psql -c "CREATE DATABASE urd_staging WITH OWNER urd_staging_app ENCODING 'UTF8';"
sudo -u postgres pg_restore -d urd_staging -v "${PRE_DEPLOY_DUMP}"

# 3. Kembalikan kode aplikasi ke versi yang kompatibel dengan skema tersebut
cd /var/urd/repo && git checkout 5aa46c8
pm2 start urd-staging-backend

# 4. Verifikasi konsistensi data
psql -h 127.0.0.1 -p 5432 -U urd_staging_app -d urd_staging -c "SELECT count(*) FROM schema_migrations;"
```

---

## 5. Checklist Verifikasi Pasca-Rollback

Setelah rollback selesai dijalankan, tim QA dan DevOps wajib memverifikasi:
- [ ] Endpoint `/api/v1/health` merespon HTTP 200 OK.
- [ ] Pengguna dapat login kembali menggunakan akun dan password yang sah.
- [ ] Daftar PO dan antrean QC Admin Kantor menampilkan data yang konsisten.
- [ ] Log error `/var/urd/logs/backend-error.log` bersih dari exception berulang.
- [ ] Notifikasi pasca-insiden dikirimkan kepada tim pengembang untuk analisa akar masalah (*Post-Mortem*).

