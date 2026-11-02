# Rencana Eksekusi Migrasi Database (Database Migration Plan) — URD Phase 2

Tanggal: 2 November 2026  
Status: **STAGING EXECUTION PLAN**  
Target Database: PostgreSQL 16 Staging (`urd_staging`)  
Pelaksana: Database Engineer & DevOps Lead  

---

## 1. Ikhtisar & Prinsip Keamanan Migrasi

Migrasi database PT Upaya Riksa Daya dikelola oleh mesin migrasi internal `backend/src/database/migrate.js` yang memanfaatkan tabel pelacak `schema_migrations`. Setiap berkas migrasi SQL dieksekusi di dalam blok transaksi terisolasi (`BEGIN ... COMMIT / ROLLBACK`) sehingga apabila salah satu pernyataan SQL gagal, seluruh perubahan pada berkas tersebut dibatalkan secara atomik tanpa meninggalkan struktur tabel yang korup.

---

## 2. Urutan 19 Berkas Migrasi SQL

| No | Berkas Migrasi | Deskripsi & Objek yang Dipengaruhi | Tingkat Risiko | Prasyarat |
|:---:|:---|:---|:---:|:---|
| 01 | `001_core.sql` | Enum peran, tabel users, clients, objects, orders, order_objects, inspections, lhpp, audit_logs | **TINGGI** | Database baru bersih |
| 02 | `002_fix_bap_client_signature.sql` | Penyesuaian kolom tanda tangan klien pada BAP | RENDAH | 001_core |
| 03 | `003_notifications.sql` | Tabel notifikasi in-app untuk penugasan dan revisi | RENDAH | 001_core |
| 04 | `004_fix_client_documents.sql` | Manajemen berkas dokumen legalitas klien | RENDAH | 001_core |
| 05 | `005_company_settings.sql` | Profil PT Upaya Riksa Daya dan penomoran dokumen | SEDANG | 001_core |
| 06 | `006_offline_queue.sql` | Tabel antrean sinkronisasi offline per perangkat | RENDAH | 001_core |
| 07 | `007_missing_indexes.sql` | Pembuatan indeks pencarian multi-parameter | RENDAH | 001_core |
| 08 | `008_client_feedback.sql` | Tabel evaluasi kepuasan layanan pasca-distribusi | RENDAH | 001_core |
| 09 | `009_issue_reports.sql` | Pelaporan kendala operasional dan temuan lapangan | RENDAH | 001_core |
| 10 | `010_document_ownership_integrity.sql` | Penguatan relasi kepemilikan dokumen K3 terhadap order | SEDANG | 001, 002 |
| 11 | `011_business_workflow_v2.sql` | Tabel document_distributions, riwayat revisi, unit status | **TINGGI** | 001 s/d 010 |
| 12 | `012_client_renewal_reminders.sql` | Tabel renewal_followups dan trigger masa berlaku | SEDANG | 011 |
| 13 | `013_lhpp_f4_five_sections.sql` | Template LHPP 5 bab standar F4 dan suplemen SKP PJK3 | SEDANG | 011 |
| 14 | `014_object_categories_seed.sql` | Master 8 kategori K3 (PAA, PUBT, PTP, ELE, IPK, dsb) | RENDAH | 001 |
| 15 | `015_portal_tokens.sql` | Token akses portal klien terenkripsi | SEDANG | 001 |
| 16 | `016_bap_inspections.sql` | Relasi inspeksi lapangan terhadap BAP | RENDAH | 001, 002 |
| 17 | `017_fix_lhpp_order_object_id.sql` | Foreign key integritas LHPP ke unit objek spesifik | SEDANG | 011, 013 |
| 18 | `018_fix_draft_inspector_sig.sql` | Penanganan tanda tangan draf Ahli K3 | RENDAH | 001, 011 |
| 19 | `019_hashed_portal_tokens.sql` | Hashing SHA-256 untuk keamanan portal token | SEDANG | 015 |

---

## 3. Prosedur Pra-Migrasi: Backup Basis Data Wajib

Sebelum menjalankan migrasi pada database yang sudah memuat data, backup biner wajib diambil:

```bash
# Perintah Backup Pra-Migrasi Staging
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL" -F c -f "/var/backups/urd/pre_migration_${TIMESTAMP}.dump"

# Verifikasi integritas berkas backup
pg_restore -l "/var/backups/urd/pre_migration_${TIMESTAMP}.dump" > /dev/null
echo "Backup pra-migrasi berhasil dibuat dan diverifikasi valid."
```

---

## 4. Eksekusi Migrasi di Staging

Migrasi dijalankan menggunakan skrip resmi:

```bash
cd /var/www/urd/backend
NODE_ENV=staging npm run migrate
```

Output yang diharapkan:
```
Migrasi diterapkan: 001_core.sql, 002_fix_bap_client_signature.sql, ..., 019_hashed_portal_tokens.sql
Database sudah menggunakan migrasi terbaru.
```

---

## 5. Prosedur Pemulihan (Rollback / Recovery Plan)

Jika terjadi kegagalan eksekusi migrasi di lingkungan staging:

1. **Rollback Transaksional Otomatis:**
   Fungsi `withTransaction` pada `migrate.js` secara otomatis membatalkan (*ROLLBACK*) berkas SQL yang mengalami error, sehingga status skema tidak berada dalam kondisi setengah jadi.
2. **Restorasi Penuh dari Snapshot Pra-Migrasi:**
   Jika diperlukan pengembalian penuh ke titik sebelum migrasi dimulai:
   ```bash
   # Hentikan service backend sementara
   pm2 stop urd-backend-staging

   # Drop dan buat ulang database staging kosong
   psql "$ADMIN_DB_URL" -c "DROP DATABASE urd_staging;"
   psql "$ADMIN_DB_URL" -c "CREATE DATABASE urd_staging OWNER urd_staging_app;"

   # Restorasi data dari backup pra-migrasi
   pg_restore -d "$DATABASE_URL" --no-owner --no-acl "/var/backups/urd/pre_migration_${TIMESTAMP}.dump"

   # Nyalakan kembali service backend
   pm2 start urd-backend-staging
   ```

---

## 6. Strategi Seeding Data Awal Staging

Setelah seluruh migrasi sukses diaplikasikan:
1. Skrip `seeds/seed.js` hanya dijalankan untuk membuat akun administratif awal, master kategori K3, dan template checklist standar.
2. Data klien, penugasan, dan inspeksi pada staging wajib menggunakan data fiktif (contoh: PT Demo Staging URD) guna mencegah kebingungan dengan transaksi komersial nyata.

