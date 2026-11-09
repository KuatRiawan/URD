# PT Upaya Riksa Daya (URD) — PostgreSQL Database Schema & Migration Inventory

Dokumen ini memetakan arsitektur basis data PostgreSQL 17 pada sistem PT Upaya Riksa Daya, mencakup seluruh berkas migrasi dari `001` hingga `026`, tabel-tabel utama, relasi kunci (*Foreign Keys*), batasan keunikan (*Unique Constraints*), indeks performa, serta mekanisme jaminan integritas data (*Data Integrity & Immutability*).

---

## 1. Daftar Riwayat Migrasi SQL (Migrations 001 - 026)

| No. Migrasi | Nama Berkas | Ruang Lingkup & Perubahan Skema |
| :--- | :--- | :--- |
| `001` | `001_core.sql` | Skema inti: ekstensi `pgcrypto` (`gen_random_uuid`), tabel `users`, tabel `inspectors`, dan tabel `audit_logs` anti-manipulasi. |
| `002` | `002_clients_objects.sql` | Master 7 kategori alat K3 (`object_categories`), data perusahaan klien (`clients`), cabang lokasi (`client_locations`), kontak PIC (`client_contacts`), dan registri alat uji (`test_objects`). |
| `003` | `003_orders_scheduling.sql` | Siklus hidup order (`orders`), relasi item order (`order_items`), penugasan jadwal (`order_schedules`, `inspector_assignments`), dan sequence penomoran order (`order_no_seq`). |
| `004` | `004_inspections.sql` | Formulir inspeksi digital (`inspections`), template ceklis K3 (`inspection_templates`), butir pertanyaan (`inspection_template_items`), hasil isian lapangan (`inspection_responses`), temuan ketidaksesuaian (`inspection_findings`), dan tanda tangan digital (`inspection_signatures`). |
| `005` | `005_lhpp_suket_reminders.sql` | Dokumen LHPP (`lhpp_documents`), registri Surat Keterangan K3 Disnaker (`suket_documents`), riwayat revisi LHPP (`lhpp_revisions`), dan log pengingat sertifikasi (`renewal_reminders`). |
| `006` | `006_po_bap_unit_workflow.sql` | Penegakan alur kerja multi-unit independen, Berita Acara Pemeriksaan (`bap_documents`), revisi BAP (`bap_revisions`), dan sequence penomoran BAP (`bap_no_seq`). |
| `007` | `007_client_reminders.sql` | Sistem pengingat terstruktur anti-duplikasi per unit alat (`client_reminder_log`). |
| `008` | `008_document_integrity_verification.sql` | Integritas dokumen resmi: kolom `sha256_hash`, kode verifikasi publik 12-karakter unik, dan snapshot kekal (*immutability snapshot*). |
| `009` | `009_client_portal.sql` | Akses portal klien mandiri terproteksi token (`client_portal_access`). |
| `010` | `010_lhpp_photos.sql` | Penyimpanan metadata foto dokumentasi inspeksi berkategori (`inspection_photos`). |
| `011` | `011_business_workflow_v2.sql` | Peningkatan alur serah terima berkas (`document_distributions`) dan riwayat pengiriman dokumen. |
| `012` | `012_consolidate_inspector_accounts.sql` | Penyatuan akun teknis: kanonisasi peran `AHLI_K3` dan pemetaan profil lisensi SKP. |
| `013` | `013_paa_inspection_and_marketing_spec.sql` | Spesifikasi khusus Pesawat Angkat dan Angkut (PAA) dan atribut komersial marketing. |
| `014` | `014_comprehensive_checklist_all_categories.sql` | Standarisasi butir checklist pemeriksaan menyeluruh untuk seluruh 7 bidang K3. |
| `015` | `015_remove_lhpp_manager_approval.sql` | Penegakan ADR 015: Pencabutan wewenang persetujuan teknis dari Pimpinan/Manager; Pimpinan menjadi *Strict Read-Only*; kendali QC dan finalisasi dokumen dipegang penuh oleh Admin Kantor. |
| `016` | `016_operational_issues_and_order_revisions.sql` | Pelaporan kendala lapangan (`operational_issues`) dan catatan perbaikan order (`order_revisions`). |
| `017` | `017_paa_template_checklist.sql` | Standarisasi template butir ceklis PAA/PAPA tingkat lanjut. |
| `018` | `018_prd_client_reminder_stages.sql` | Tahapan pengingat masa berlaku sertifikat K3 bertingkat (H-90, H-60, H-30). |
| `019` | `019_hashed_portal_tokens.sql` | Peningkatan keamanan token portal klien dengan *cryptographic hashing* (SHA-256). |
| `020` | `020_system_settings_and_backups.sql` | Konfigurasi sistem dinamis (`system_settings`), kop perusahaan, format penomoran, dan metadata backup database (`database_backups`). |
| `021` | `021_marketing_enhancements.sql` | Pelacakan tindak lanjut perpanjangan Suket (`renewal_followups`) dan multi-kontak PIC. |
| `022` | `022_user_avatar.sql` | Kolom `avatar_url` dan `employee_no` pada profil akun pengguna. |
| `023` | `023_dynamic_equipment_master_and_checklist_engine.sql` | Master dinamis jenis alat (`equipment_types`), jenis inspeksi (`inspection_types`), dan *Copy-on-Write Versioning* checklist (`inspection_template_versions`). |
| `024` | `024_dynamic_lhpp_engine.sql` | Mesin template LHPP dinamis (`lhpp_templates`, `lhpp_template_versions`) berbasis JSON schema seksi teknis. |
| `025` | `025_papa_equipment_taxonomy_and_groups.sql` | Restrukturisasi taksonomi PAPA dan kelompok alat per bidang K3 (`equipment_groups`). |
| `026` | `026_three_level_equipment_and_checklist_hierarchy.sql` | Pemisahan tegas taksonomi 3-level (*Bidang Riksa Uji → Kelompok/Jenis Alat → Nama/Tipe Alat*) dan isolasi checklist per nama alat. |

---

## 2. Struktur Tabel Utama & Relasi Basis Data

### A. Entitas Akun & Otorisasi
- **`users`**:
  - `id` (UUID PK), `email` (UNIQUE), `password_hash`, `full_name`, `role` (`ADMIN_SISTEM`, `ADMIN_KANTOR`, `MARKETING`, `AHLI_K3`, `PIMPINAN`), `phone`, `employee_no`, `avatar_url`, `is_active`, `token_version`.
- **`inspectors`**:
  - `id` (UUID PK), `user_id` (FK `users.id` UNIQUE), `skp_number`, `skp_expiry_date`, `competencies` (Array kategori K3 yang diizinkan), `is_active`.
- **`audit_logs`**:
  - `id` (UUID PK), `user_id` (FK `users.id`), `action`, `entity`, `entity_id`, `details` (JSONB), `ip_address`, `created_at`.
  - **Aturan Immutability**: Dilindungi trigger database yang menolak secara mutlak perintah `UPDATE` dan `DELETE`.

### B. Entitas Komersial, Klien & Unit Alat
- **`clients`**:
  - `id` (UUID PK), `name`, `npwp` (UNIQUE nullable), `address`, `industry`, `email`, `phone`, `is_active`, `created_by` (FK `users.id`).
- **`client_locations`**:
  - `id` (UUID PK), `client_id` (FK `clients.id` ON DELETE CASCADE), `name`, `address`, `city`.
- **`client_contacts`**:
  - `id` (UUID PK), `client_id` (FK `clients.id` ON DELETE CASCADE), `name`, `position`, `phone`, `email`, `is_primary`, `is_reminder_recipient`.
- **`test_objects`**:
  - `id` (UUID PK), `client_id` (FK `clients.id`), `location_id` (FK `client_locations.id`), `domain_code` (FK `inspection_domains.code`), `equipment_group_id` (FK `equipment_groups.id`), `equipment_type_id` (FK `equipment_types.id`), `name`, `serial_number`, `brand`, `model`, `capacity`, `manufacture_year`, `attributes` (JSONB).
  - **Constraint Keunikan**: `UNIQUE (client_id, lower(trim(serial_number)))` (mencegah nomor seri ganda dalam 1 klien).

### C. Entitas Taksonomi 3-Level & Checklist
- **`inspection_domains`** (Level 1):
  - `code` (VARCHAR PK, misal: `'PAPA'`, `'PUBT'`), `name`, `description`, `is_active`, `display_order`.
- **`equipment_groups`** (Level 2 - Jenis Alat):
  - `id` (UUID PK), `domain_code` (FK `inspection_domains.code`), `code` (UNIQUE), `name`, `is_active`, `display_order`.
- **`equipment_types`** (Level 3 - Nama Alat):
  - `id` (UUID PK), `group_id` (FK `equipment_groups.id`), `domain_code` (FK `inspection_domains.code`), `code` (UNIQUE), `name`, `attribute_schema` (JSONB), `is_active`, `display_order`.
- **`inspection_templates`** & **`inspection_template_versions`**:
  - Menampung definisi checklist dinamis per nama alat.
  - Mengadopsi prinsip *Copy-on-Write*: jika template diedit, sistem menerbitkan versi baru (`status = 'AKTIF'`) dan mengarsipkan versi lama (`status = 'ARSIP'`), sehingga data inspeksi lama tetap merujuk ke versi aslinya tanpa perubahan data retrospektif.

### D. Entitas Order & Riksa Uji Lapangan
- **`orders`**:
  - `id` (UUID PK), `po_number` (UNIQUE), `client_id` (FK `clients.id`), `order_date`, `status` (`TERDAFTAR`, `DIJADWALKAN`, `SELESAI`, `DIBATALKAN`), `created_by` (FK `users.id`).
- **`order_items`**:
  - `id` (UUID PK), `order_id` (FK `orders.id` ON DELETE CASCADE), `object_id` (FK `test_objects.id`), `proposed_date`, `notes`, `unit_status` (`BELUM_DIJADWALKAN`, `TERJADWAL`, `DITUGASKAN`, `SEDANG_DIINSPEKSI`, `FORM_TERKIRIM`, `PERLU_REVISI`, `LHPP_SIAP_QC`, `LHPP_FINAL`, `BAP_DRAF`, `BAP_FINAL`, `SELESAI`).
- **`inspections`**:
  - `id` (UUID PK), `order_id` (FK `orders.id`), `object_id` (FK `test_objects.id`), `inspector_id` (FK `users.id`), `template_version_id`, `inspection_date`, `status`, `summary_conclusion`.

### E. Entitas Dokumen Resmi (LHPP, BAP, Suket, BAST)
- **`lhpp_documents`**:
  - `id` (UUID PK), `inspection_id` (FK `inspections.id` UNIQUE), `template_version_id`, `lhpp_number`, `status` (`DRAF`, `MENUNGGU_QC`, `REVISI`, `FINAL`), `qc_notes`, `target_section`, `sha256_hash`, `public_verification_code` (UNIQUE), `snapshot_data` (JSONB), `finalized_by`, `finalized_at`.
- **`bap_documents`**:
  - `id` (UUID PK), `inspection_id` (FK `inspections.id` UNIQUE), `bap_number`, `status` (`DRAF`, `FINAL`), `conclusion`, `sha256_hash`, `public_verification_code` (UNIQUE), `finalized_by`, `finalized_at`.
- **`suket_documents`**:
  - `id` (UUID PK), `object_id` (FK `test_objects.id`), `suket_number`, `issued_date`, `expiry_date`, `disnaker_region`, `scan_file_url`.
- **`document_distributions`**:
  - `id` (UUID PK), `order_id` (FK `orders.id`), `recipient_type` (`KLIEN`, `DISNAKER`), `distribution_channel` (`EMAIL`, `KURIR_FISIK`), `status` (`DIPROSES`, `DIKIRIM`, `DITERIMA`), `tracking_number`, `receipt_proof_url`, `bast_file_url`.

---

## 3. Penegakan Integritas & Urutan Rilis Dokumen

1. **Urutan Penerbitan Dokumen Resmi**:
   - Draf LHPP diterbitkan dari hasil inspeksi lapangan.
   - Admin Kantor mereview QC LHPP.
   - LHPP wajib berstatus `FINAL` terlebih dahulu sebelum BAP dapat difinalisasi (`URUTAN_DOKUMEN_LHPP_BAP`).
2. **Kekekalan Snapshot Dokumen**:
   - Saat LHPP atau BAP difinalisasi, seluruh data teknis, isian checklist, pengukuran, foto, dan tanda tangan dibekukan ke kolom `snapshot_data` (JSONB) dan dihitung hash SHA-256 berkasnya. Perubahan di masa depan pada data master atau unit tidak akan mengubah isi dokumen yang telah diterbitkan.
3. **Penyelesaian PO Multi-Unit**:
   - Status PO baru berubah otomatis menjadi `SELESAI` apabila dan hanya apabila **seluruh** unit alat di dalam PO tersebut telah berstatus `SELESAI`. Adanya kendala atau revisi pada satu unit tidak menghalangi unit lain untuk diselesaikan dan didistribusikan.

