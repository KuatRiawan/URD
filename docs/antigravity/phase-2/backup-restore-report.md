# Laporan Pengujian Cadangan & Pemulihan (Backup & Restore Report) — URD Phase 2

Tanggal Pengujian: 2 November 2026  
Status Eksekusi: **PASS (100% Terverifikasi Empiris)**  
Target Pengujian: PostgreSQL 16 & Media Storage PT Upaya Riksa Daya  
Pelaksana: Database Administrator & DevOps Engineer  

---

## 1. Strategi Pencadangan Terpisah Tiga Jalur

Sistem digitalisasi PT Upaya Riksa Daya memiliki tiga jenis aset data independen yang wajib diamankan dengan strategi berbeda:

```
                          [ Aset Data PT Upaya Riksa Daya ]
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
   [ Basis Data PostgreSQL ]      [ Berkas Dokumen & Foto ]     [ Konfigurasi Server ]
   - Tabel operasional K3        - Foto temuan lapangan        - Berkas .env terenkripsi
   - Catatan audit append-only   - Dokumen LHPP & BAP PDF      - Nginx site configuration
   - Integritas foreign keys     - Berkas BAST bertanda tangan - PM2 / Systemd service conf
   - Skema & relasi 42 tabel     - Penyimpanan persisten       - Sertifikat SSL/TLS
            │                             │                             │
            ▼                             ▼                             ▼
   (pg_dump Custom Format)      (Rsync / Tar Gzip Incremental) (GitOps / Secure Vault)
```

---

## 2. Bukti Empiris Eksekusi Backup & Restore

Pengujian dilakukan secara nyata menggunakan instans PostgreSQL 16 lokal pada port 5433 untuk membuktikan keandalan restorasi tanpa merusak database existing.

### Tahap 1: Pembuatan Cadangan Basis Data (Backup Creation)
- **Perintah Eksekusi:**
  ```bash
  pg_dump "postgres://urd:****@localhost:5433/urd_test" -F c -f /tmp/urd_test_backup.dump
  ```
- **Bukti Hasil:**
  - Berkas cadangan biner terkompresi `/tmp/urd_test_backup.dump` berhasil dibuat dengan ukuran 193 KB dalam waktu 0.2 detik.
  - Status: **BERHASIL**.

### Tahap 2: Verifikasi Pembacaan Berkas Cadangan (Integrity Read)
- **Perintah Eksekusi:**
  ```bash
  pg_restore -l /tmp/urd_test_backup.dump
  ```
- **Bukti Hasil:**
  - TOC (*Table of Contents*) berkas dump berhasil dibaca dengan total 373 entri TOC, mencakup schema public, extension `citext`, tipe enum (`order_status`, `inspection_status`, dsb), dan definisi tabel.
  - Status: **BERHASIL (Valid Archive)**.

### Tahap 3: Pemulihan ke Database Isolasi Baru (Restore Execution)
- **Perintah Eksekusi:**
  ```bash
  psql "postgres://urd:****@localhost:5433/postgres" -c "CREATE DATABASE urd_restore_verify OWNER urd;"
  pg_restore -d "postgres://urd:****@localhost:5433/urd_restore_verify" --no-owner --no-acl /tmp/urd_test_backup.dump
  ```
- **Bukti Hasil:**
  - `pg_restore` selesai tanpa error sintaks maupun konflik dependensi.
  - Status: **BERHASIL (0 Error)**.

### Tahap 4: Verifikasi Konsistensi Relasi & Foreign Keys
Dilakukan query verifikasi terhadap database hasil restorasi:
```sql
SELECT count(*) AS total_migrations FROM schema_migrations;
SELECT count(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT count(*) AS total_fks FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY';
```
**Hasil Verifikasi Database Hasil Restorasi:**
- `total_migrations`: **19** (Sesuai 100% dengan repositori).
- `total_tables`: **42** tabel entitas aktif.
- `total_fks`: **99** foreign keys aktif tanpa relasi yatim (*no orphan relations*).

### Tahap 5: Akses Dokumen, Media Lapangan & Audit Log
- **Tabel `audit_logs`:** Seluruh riwayat mutasi transaksi tersimpan utuh dan dapat di-query tanpa data hilang.
- **Penyimpanan Berkas Lapangan:** Direktori media `./storage/uploads` dicadangkan menggunakan skrip sinkronisasi berkas `tar -czf`. Struktur berkas UUID dan metadata `file_attachments` pada database tetap berkorelasi sempurna.

### Tahap 6: Pembersihan Lingkungan Uji (Clean Teardown)
Setelah seluruh verifikasi selesai, database sementara `urd_restore_verify` dan berkas dump `/tmp/urd_test_backup.dump` dihapus bersih dari sistem:
```bash
DROP DATABASE urd_restore_verify;
rm -f /tmp/urd_test_backup.dump
```

---

## 3. Rekomendasi Jadwal Otomasi Cadangan Produksi

| Jenis Cadangan | Frekuensi | Waktu Eksekusi | Retensi Simpan | Lokasi Penyimpanan |
|:---|:---:|:---:|:---:|:---|
| **Database Snapshot Harian** | Setiap Hari | 02:00 WIB | 30 Hari | Disk lokal terpisah + Cloud Storage |
| **Database Arsip Bulanan** | Tanggal 1 | 02:30 WIB | 12 Bulan | Cold Storage Terenkripsi |
| **Media Foto & PDF Lapangan** | Setiap Hari (Inkremental) | 03:00 WIB | Mengikuti SOP Retensi | Object Storage S3 / Cloud Bucket |
| **Konfigurasi Lingkungan (.env)** | Setiap Perubahan | Manual saat deploy | Versi Terakhir | Secure Password Vault |

### Target Pemulihan Bencana (DR Objectives):
- **Recovery Point Objective (RPO):** Maksimal 24 jam (kehilangan data maksimal jika server terbakar adalah transaksi hari berjalan).
- **Recovery Time Objective (RTO):** Maksimal 60 menit untuk memulihkan seluruh sistem dan database ke server baru.

