# Laporan Deployment Database Staging (Database Deployment Report)

Tanggal: 2 November 2026  
Status Database: **PASSED (19 MIGRASI, 42 TABEL, 99 FOREIGN KEYS TERVERIFIKASI)**  
Penyusun: PostgreSQL Database Administrator & Senior Backend Engineer  

---

## 1. Identifikasi & Isolasi Lingkungan Database

Pada arsitektur URD, lingkungan database dipisahkan secara tegas untuk menghindari kontaminasi data:

| Lingkungan | Nama Database | Port | Pengguna DB | Tujuan |
|---|---|---|---|---|
| **Development** | `urd_dev` | 5433 | `urd` | Pengembangan fitur lokal harian |
| **Testing** | `urd_test` | 5433 | `urd` | Eksekusi test suite otomatis (Vitest) |
| **Staging (Target)** | `urd_staging` | 5432 | `urd_staging_app` | Simulasi operasional & UAT pra-rilis |
| **Production** | *Belum aktif* | 5432 | `urd_prod_app` | Menunggu sign-off pimpinan/owner |

Sesuai aturan keamanan: **Dilarang keras menjalankan skrip pengujian atau migrasi otomatis terhadap database produksi**.

---

## 2. Riwayat & Urutan Migrasi Skema (19 Migrations)

Database URD dikelola menggunakan migrasi berurutan (`backend/src/database/migrate.js`) yang mencatat setiap eksekusi ke tabel `schema_migrations`:

```sql
SELECT filename, applied_at FROM schema_migrations ORDER BY filename ASC;
```

Daftar 19 file migrasi yang telah diuji dan terpasang lengkap:

1. `001_core.sql`: Ekstensi `citext`, tabel pengguna `users`, role enum (`ADMIN_SISTEM`, `ADMIN_KANTOR`, `AHLI_K3`, `PIMPINAN`, `MARKETING`), refresh session tokens, audit log.
2. `002_clients_objects.sql`: Master data klien (`clients`), PIC klien (`client_contacts`), master kategori alat K3 (`object_categories`), inventaris unit alat (`objects`).
3. `003_orders_scheduling.sql`: Purchase Order (`orders`), relasi unit PO (`order_objects`), penjadwalan & penugasan inspeksi (`assignments`), kualifikasi inspector (`inspector_competencies`).
4. `004_inspections.sql`: Pelaksanaan inspeksi (`inspections`), item checklist (`inspection_results`), temuan & rekomendasi (`inspection_findings`), foto lapangan (`inspection_photos`), tanda tangan digital (`inspection_signatures`).
5. `005_lhpp_suket_reminders.sql`: Dokumen LHPP (`lhpp`), BAP (`bap`), registrasi Suket Disnaker (`suket_registrations`), pengingat berkala (`client_reminders`).
6. `006_po_bap_unit_workflow.sql`: Pemisahan alur BAP multi-unit, nomor berita acara per unit, status progres independen unit dalam satu PO.
7. `007_client_reminders.sql`: Kanal reminder multi-channel (WhatsApp, Email) dan log pengiriman (`client_reminder_log`).
8. `008_document_integrity_verification.sql`: Verifikasi keaslian dokumen via hash SHA-256 dan kode unik QR.
9. `009_client_portal.sql`: Akses portal publik klien untuk verifikasi mandiri dokumen legalitas K3.
10. `010_lhpp_photos.sql`: Integrasi foto dokumentasi alat dan nameplate ke dalam lampiran LHPP.
11. `011_business_workflow_v2.sql`: Penyempurnaan alur bisnis (transisi status, pembatasan QC, approval rules).
12. `012_consolidate_inspector_accounts.sql`: Konsolidasi akun Ahli K3 dan relasi profil kompetensi teknis.
13. `013_paa_inspection_and_marketing_spec.sql`: Spesifikasi teknis pesawat angkat & angkut serta field komersial Marketing.
14. `014_comprehensive_checklist_all_categories.sql`: Template checklist komprehensif untuk 7 kategori objek K3.
15. `015_remove_lhpp_manager_approval.sql`: Penyesuaian SOP: Manager/Pimpinan bersifat read-only monitoring; finalisasi LHPP di tangan Admin Kantor setelah QC.
16. `016_operational_issues_and_order_revisions.sql`: Manajemen isu operasional lapangan dan revisi penugasan PO.
17. `017_paa_template_checklist.sql`: Template pengukuran dan checklist standar PAA.
18. `018_prd_client_reminder_stages.sql`: Tahapan reminder berkala H-30, H-14, H-7 sesuai PRD resmi.
19. `019_hashed_portal_tokens.sql`: Peningkatan keamanan: hashing SHA-256 token portal klien di database.

---

## 3. Verifikasi Integritas Skema, Tabel, & Relasi

Berdasarkan kueri verifikasi langsung pada database:

```sql
SELECT count(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Hasil: 42 tabel

SELECT count(*) as fk_count FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
-- Hasil: 99 foreign keys
```

### Karakteristik Integritas Data Kunci:
1. **Foreign Key Restraints (99 FKs):**
   - Menjamin integritas referensial antar entitas. Penghapusan unit alat yang sedang memiliki riwayat inspeksi dicegah (`ON DELETE RESTRICT`).
2. **Kategori K3 Master Data (7 Kategori Terverifikasi):**
   - `PAA`: Pesawat Angkat dan Pesawat Angkut
   - `PTP`: Pesawat Tenaga dan Produksi
   - `PUBT`: Pesawat Uap dan Bejana Tekan
   - `ELEVATOR`: Elevator dan Eskalator
   - `INSTALASI_LISTRIK`: Instalasi Listrik dan Penyalur Petir
   - `PROTEKSI_PETIR`: Sistem Proteksi Petir
   - `DAMKAR`: Sistem Proteksi Kebakaran
3. **Pemberian Indeks Performa:**
   - Indeks unik pada nomor PO (`orders.po_number`), nomor surat tugas, nomor suket, dan serial number objek per klien.
   - Indeks b-tree pada foreign keys dan kolom filter pencarian (`client_id`, `status`, `valid_until`, `created_at`).

---

## 4. Kebijakan Hak Akses Database (Least Privilege)

Pada database staging `urd_staging`, akun runtime aplikasi dibatasi secara ketat:

```sql
-- Dijalankan oleh superuser postgres saat setup awal server
CREATE DATABASE urd_staging WITH OWNER postgres ENCODING 'UTF8';

CREATE USER urd_staging_app WITH PASSWORD 'SECURE_APP_PASSWORD';
GRANT CONNECT ON DATABASE urd_staging TO urd_staging_app;

-- Hak akses hanya pada skema public
\c urd_staging
GRANT USAGE ON SCHEMA public TO urd_staging_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO urd_staging_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO urd_staging_app;

-- Default privileges untuk tabel baru
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO urd_staging_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO urd_staging_app;

-- REVOKE operasi destruktif
REVOKE DROP, TRUNCATE, ALTER ON ALL TABLES IN SCHEMA public FROM urd_staging_app;
```

**Kesimpulan Database:**  
Skema database 100% konsisten, migrasi idempoten, integritas foreign key terlindungi, dan kebijakan hak akses non-destruktif siap diterapkan di staging.

